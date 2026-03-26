"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  MessageCircle, X, Send, Loader2, User, CheckCircle, AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase";
import {
  collection, addDoc, onSnapshot, query, orderBy,
  serverTimestamp, doc, updateDoc, Timestamp,
} from "firebase/firestore";
import type { ChatSession, ChatMessage } from "@/lib/types/chat-session.types";

type WidgetState = "closed" | "intro" | "waiting" | "active" | "ended" | "no_agents";

interface LiveChatWidgetProps {
  shopId: string;
  shopName: string;
}

const WAIT_TIMEOUT_MS = 3 * 60 * 1000; // 3 min sin asesor → sugerir contacto

export function LiveChatWidget({ shopId, shopName }: LiveChatWidgetProps) {
  const [mounted, setMounted] = useState(false);
  const [widgetState, setWidgetState] = useState<WidgetState>("closed");
  const [clientName, setClientName] = useState("");
  const [nameError, setNameError] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const waitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setMounted(true); }, []);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Listen to session changes
  useEffect(() => {
    if (!sessionId) return;
    const sessionRef = doc(db, "shops", shopId, "chatSessions", sessionId);
    const unsubscribe = onSnapshot(sessionRef, (snap) => {
      if (!snap.exists()) return;
      const data = snap.data() as ChatSession;
      setSession({ ...data, id: snap.id });

      if (data.status === "active" && widgetState === "waiting") {
        setWidgetState("active");
        if (waitTimerRef.current) clearTimeout(waitTimerRef.current);
      }
      if (data.status === "ended" && widgetState !== "ended") {
        setWidgetState("ended");
        if (waitTimerRef.current) clearTimeout(waitTimerRef.current);
      }
    });
    return () => unsubscribe();
  }, [sessionId, shopId, widgetState]);

  // Listen to messages
  useEffect(() => {
    if (!sessionId || (widgetState !== "active" && widgetState !== "waiting")) return;
    const q = query(
      collection(db, "shops", shopId, "chatSessions", sessionId, "messages"),
      orderBy("createdAt", "asc")
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      const msgs: ChatMessage[] = snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage));
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, [sessionId, shopId, widgetState]);

  // Mark session ended on unmount if still waiting/active
  useEffect(() => {
    return () => {
      if (sessionId && (widgetState === "waiting" || widgetState === "active")) {
        updateDoc(doc(db, "shops", shopId, "chatSessions", sessionId), {
          status: "ended",
        }).catch(() => {});
      }
      if (waitTimerRef.current) clearTimeout(waitTimerRef.current);
    };
  }, [sessionId, shopId, widgetState]);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) { setNameError("Ingresa tu nombre"); return; }
    setNameError("");
    setIsStarting(true);
    try {
      const sessRef = await addDoc(
        collection(db, "shops", shopId, "chatSessions"),
        {
          shopId,
          clientName: clientName.trim(),
          status: "waiting",
          createdAt: serverTimestamp(),
        }
      );
      setSessionId(sessRef.id);
      setWidgetState("waiting");

      // Timeout: if no agent joins in 3min
      waitTimerRef.current = setTimeout(() => {
        setWidgetState("no_agents");
      }, WAIT_TIMEOUT_MS);
    } catch {
      setNameError("No se pudo iniciar el chat. Intenta de nuevo.");
    } finally {
      setIsStarting(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !sessionId || isSending) return;
    const text = inputText.trim();
    setInputText("");
    setIsSending(true);
    try {
      await addDoc(
        collection(db, "shops", shopId, "chatSessions", sessionId, "messages"),
        {
          text,
          sender: "client",
          senderName: clientName,
          createdAt: serverTimestamp(),
        }
      );
      // Update lastMessageAt
      await updateDoc(doc(db, "shops", shopId, "chatSessions", sessionId), {
        lastMessageAt: serverTimestamp(),
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = async () => {
    if (sessionId && (widgetState === "waiting" || widgetState === "active")) {
      await updateDoc(doc(db, "shops", shopId, "chatSessions", sessionId), {
        status: "ended",
      }).catch(() => {});
    }
    if (waitTimerRef.current) clearTimeout(waitTimerRef.current);
    setWidgetState("closed");
    setSessionId(null);
    setSession(null);
    setMessages([]);
    setClientName("");
    setInputText("");
  };

  if (!mounted) return null;

  const isOpen = widgetState !== "closed";

  return createPortal(
    <div className="fixed bottom-6 right-4 z-[9000] flex flex-col items-end gap-3">

      {/* Chat window */}
      {isOpen && (
        <div className="w-[320px] sm:w-[360px] bg-[#0d0d0d] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          style={{ maxHeight: "520px" }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-white/3 border-b border-white/8">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <div>
                <p className="text-xs font-black text-white uppercase tracking-wide">{shopName}</p>
                <p className="text-[10px] text-white/35">
                  {widgetState === "waiting" ? "Buscando asesor..." :
                   widgetState === "active" ? `Asesor: ${session?.employeeName || "Asesor"}` :
                   widgetState === "ended" ? "Chat finalizado" :
                   widgetState === "no_agents" ? "Sin asesores disponibles" :
                   "Chat en vivo"}
                </p>
              </div>
            </div>
            <button onClick={handleClose} className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/8 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-hidden flex flex-col">

            {/* Intro — enter name */}
            {widgetState === "intro" && (
              <form onSubmit={handleStart} className="p-5 space-y-4 flex-1 flex flex-col justify-center">
                <div className="text-center space-y-2 mb-2">
                  <MessageCircle className="w-10 h-10 text-white/20 mx-auto" />
                  <p className="text-sm font-bold text-white">¿Con quién hablamos?</p>
                  <p className="text-xs text-white/35">Un asesor te atenderá en breve</p>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/8 rounded-xl focus-within:border-white/20">
                    <User className="w-3.5 h-3.5 text-white/25 flex-shrink-0" />
                    <input
                      type="text"
                      value={clientName}
                      onChange={e => { setClientName(e.target.value); setNameError(""); }}
                      placeholder="Tu nombre"
                      autoFocus
                      className="bg-transparent text-sm text-white placeholder-white/25 outline-none flex-1"
                    />
                  </div>
                  {nameError && <p className="text-xs text-red-400">{nameError}</p>}
                </div>
                <button
                  type="submit"
                  disabled={isStarting}
                  className="w-full py-3 bg-white text-black rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isStarting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Iniciar Chat"}
                </button>
              </form>
            )}

            {/* Waiting */}
            {widgetState === "waiting" && (
              <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-4">
                <Loader2 className="w-8 h-8 text-white/20 animate-spin" />
                <div className="text-center space-y-1">
                  <p className="text-sm font-bold text-white">Esperando asesor</p>
                  <p className="text-xs text-white/35">Estamos conectándote con alguien del equipo</p>
                </div>
                {messages.length > 0 && (
                  <div className="w-full space-y-2 mt-2">
                    {messages.map(m => <MessageBubble key={m.id} message={m} isClient={m.sender === "client"} />)}
                  </div>
                )}
              </div>
            )}

            {/* Active — messages */}
            {widgetState === "active" && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-2" style={{ maxHeight: "300px" }}>
                  <div className="text-center mb-3">
                    <span className="text-[10px] text-white/25 bg-white/5 px-3 py-1 rounded-full">
                      {session?.employeeName || "Asesor"} se unió al chat
                    </span>
                  </div>
                  {messages.map(m => (
                    <MessageBubble key={m.id} message={m} isClient={m.sender === "client"} />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                <form onSubmit={handleSend} className="flex items-center gap-2 px-3 py-3 border-t border-white/8">
                  <input
                    type="text"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 bg-white/5 border border-white/8 rounded-xl px-3 py-2 text-xs text-white placeholder-white/25 focus:outline-none focus:border-white/20"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim() || isSending}
                    className="p-2 bg-white text-black rounded-xl hover:bg-white/90 disabled:opacity-40 transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </>
            )}

            {/* Ended */}
            {(widgetState === "ended") && (
              <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-3 text-center">
                <CheckCircle className="w-10 h-10 text-white/20" />
                <p className="text-sm font-bold text-white">Chat Finalizado</p>
                <p className="text-xs text-white/35">Gracias por comunicarte con nosotros</p>
                <button
                  onClick={handleClose}
                  className="mt-2 px-6 py-2.5 bg-white text-black rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white/90 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            )}

            {/* No agents */}
            {widgetState === "no_agents" && (
              <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-3 text-center">
                <AlertCircle className="w-10 h-10 text-white/20" />
                <p className="text-sm font-bold text-white">Sin asesores disponibles</p>
                <p className="text-xs text-white/35 leading-relaxed">
                  Por el momento no hay asesores disponibles. Déjanos tu cotización y te contactamos pronto.
                </p>
                <button
                  onClick={handleClose}
                  className="mt-2 px-6 py-2.5 bg-white/10 border border-white/15 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white/15 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        type="button"
        onClick={() => widgetState === "closed" ? setWidgetState("intro") : handleClose()}
        className={cn(
          "w-12 h-12 rounded-full shadow-xl flex items-center justify-center transition-all active:scale-95",
          isOpen
            ? "bg-white/10 border border-white/20 text-white"
            : "bg-white text-black hover:bg-white/90"
        )}
        aria-label="Chat en vivo"
      >
        {isOpen ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
      </button>
    </div>,
    document.body
  );
}

function MessageBubble({ message, isClient }: { message: ChatMessage; isClient: boolean }) {
  return (
    <div className={cn("flex", isClient ? "justify-end" : "justify-start")}>
      <div className={cn(
        "max-w-[75%] px-3 py-2 rounded-2xl text-xs leading-relaxed",
        isClient
          ? "bg-white text-black rounded-br-sm"
          : "bg-white/10 text-white rounded-bl-sm"
      )}>
        {message.text}
      </div>
    </div>
  );
}
