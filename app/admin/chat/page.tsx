"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/shared";
import {
  MessageCircle, Send, Loader2, CheckCircle, Clock, X, User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase";
import {
  collection, query, where, onSnapshot, orderBy,
  addDoc, updateDoc, doc, serverTimestamp,
} from "firebase/firestore";
import type { ChatSession, ChatMessage } from "@/lib/types/chat-session.types";

// ─── SESSION LIST ITEM ─────────────────────────────────────────────────────────
function SessionItem({
  session,
  isSelected,
  onSelect,
}: {
  session: ChatSession;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const timeAgo = session.createdAt
    ? new Date(session.createdAt.toDate?.() ?? session.createdAt).toLocaleTimeString("es-MX", {
        hour: "2-digit", minute: "2-digit",
      })
    : "—";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full px-4 py-3.5 flex items-start gap-3 text-left transition-all border-b border-white/5 hover:bg-white/3",
        isSelected && "bg-white/5"
      )}
    >
      <div className={cn(
        "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
        session.status === "waiting" ? "bg-amber-400/15" : "bg-green-400/15"
      )}>
        <User className={cn("w-4 h-4", session.status === "waiting" ? "text-amber-400" : "text-green-400")} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white truncate">{session.clientName}</span>
          {session.status === "waiting" && (
            <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-amber-400/15 text-amber-400 border border-amber-400/20 flex-shrink-0">
              Nuevo
            </span>
          )}
        </div>
        <p className="text-[11px] text-white/35 mt-0.5 flex items-center gap-1">
          <Clock className="w-3 h-3" /> {timeAgo}
        </p>
      </div>
    </button>
  );
}

// ─── CHAT PANEL ────────────────────────────────────────────────────────────────
function ChatPanel({
  session,
  shopId,
  employeeName,
  employeeId,
  onEnd,
}: {
  session: ChatSession;
  shopId: string;
  employeeName: string;
  employeeId: string;
  onEnd: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Listen messages
  useEffect(() => {
    const q = query(
      collection(db, "shops", shopId, "chatSessions", session.id, "messages"),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage)));
    });
    return () => unsub();
  }, [shopId, session.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleJoin = async () => {
    setIsJoining(true);
    try {
      await updateDoc(doc(db, "shops", shopId, "chatSessions", session.id), {
        status: "active",
        employeeId,
        employeeName,
      });
    } finally {
      setIsJoining(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;
    const text = inputText.trim();
    setInputText("");
    setIsSending(true);
    try {
      await addDoc(
        collection(db, "shops", shopId, "chatSessions", session.id, "messages"),
        {
          text,
          sender: "employee",
          senderName: employeeName,
          createdAt: serverTimestamp(),
        }
      );
      await updateDoc(doc(db, "shops", shopId, "chatSessions", session.id), {
        lastMessageAt: serverTimestamp(),
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleEnd = async () => {
    await updateDoc(doc(db, "shops", shopId, "chatSessions", session.id), {
      status: "ended",
    });
    onEnd();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center">
            <User className="w-4 h-4 text-white/40" />
          </div>
          <div>
            <p className="text-sm font-black text-white">{session.clientName}</p>
            <p className="text-[10px] text-white/35 uppercase tracking-widest">
              {session.status === "waiting" ? "Esperando asesor" :
               session.status === "active" ? "En conversación" : "Finalizado"}
            </p>
          </div>
        </div>
        <button
          onClick={handleEnd}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs font-bold hover:bg-red-500/20 transition-colors"
        >
          <X className="w-3.5 h-3.5" /> Finalizar
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {session.status === "waiting" && (
          <div className="py-8 text-center space-y-4">
            <Clock className="w-8 h-8 text-amber-400/40 mx-auto" />
            <p className="text-sm text-white/40">{session.clientName} está esperando</p>
            <button
              onClick={handleJoin}
              disabled={isJoining}
              className="px-6 py-3 bg-white text-black rounded-xl font-black text-sm hover:bg-white/90 transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
            >
              {isJoining ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
              Unirse al Chat
            </button>
          </div>
        )}

        {session.status === "active" && messages.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-xs text-white/25">Di hola a {session.clientName} 👋</p>
          </div>
        )}

        {messages.map(m => (
          <div key={m.id} className={cn("flex", m.sender === "employee" ? "justify-end" : "justify-start")}>
            <div className={cn(
              "max-w-[70%] px-3 py-2 rounded-2xl text-sm leading-relaxed",
              m.sender === "employee"
                ? "bg-white text-black rounded-br-sm"
                : "bg-white/10 text-white rounded-bl-sm"
            )}>
              {m.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {session.status === "active" && (
        <form onSubmit={handleSend} className="flex items-center gap-2 px-4 py-3 border-t border-white/8 flex-shrink-0">
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Escribe una respuesta..."
            className="flex-1 bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/20 transition-colors"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="p-2.5 bg-white text-black rounded-xl hover:bg-white/90 disabled:opacity-40 transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      )}
    </div>
  );
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────

// Play a simple two-tone notification using Web Audio API
function playNewChatSound() {
  try {
    const ctx = new AudioContext();
    const play = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.25, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    };
    play(880, 0, 0.15);
    play(1100, 0.18, 0.15);
  } catch {}
}

export default function AdminChatPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Persist the last known session to prevent ChatPanel from closing during Firestore snapshot gaps
  const lastSelectedRef = useRef<ChatSession | null>(null);
  const prevWaitingCountRef = useRef(0);

  const shopId = user?.shopId;
  const employeeName = user?.name || user?.email || "Asesor";
  const employeeId = user?.id || "unknown";

  // Real-time listener for waiting + active sessions
  useEffect(() => {
    if (!shopId) return;
    const q = query(
      collection(db, "shops", shopId, "chatSessions"),
      where("status", "in", ["waiting", "active"]),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, snap => {
      const updated = snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatSession));
      setSessions(updated);

      // Play sound when a new "waiting" session arrives
      const newWaiting = updated.filter(s => s.status === "waiting").length;
      if (newWaiting > prevWaitingCountRef.current) {
        playNewChatSound();
      }
      prevWaitingCountRef.current = newWaiting;
    });
    return () => unsub();
  }, [shopId]);

  // Derive selected — persist last known so ChatPanel doesn't unmount during Firestore gaps
  const foundSelected = sessions.find(s => s.id === selectedId) ?? null;
  if (foundSelected) lastSelectedRef.current = foundSelected;
  const selected = selectedId ? (foundSelected ?? lastSelectedRef.current) : null;

  const waitingCount = sessions.filter(s => s.status === "waiting").length;

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      {/* Header */}
      <div className="px-6 py-5 border-b border-white/8 flex items-center gap-3 flex-shrink-0">
        <MessageCircle className="w-5 h-5 text-white/40" />
        <h1 className="text-lg font-black tracking-tight">Chat en Vivo</h1>
        {waitingCount > 0 && (
          <span className="px-2 py-0.5 bg-amber-400/15 border border-amber-400/25 text-amber-400 text-xs font-black rounded-full">
            {waitingCount} esperando
          </span>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — sessions list */}
        <div className="w-72 border-r border-white/8 flex flex-col overflow-hidden flex-shrink-0">
          <p className="px-4 py-3 text-[10px] font-black text-white/25 uppercase tracking-widest border-b border-white/5">
            Conversaciones activas ({sessions.length})
          </p>

          <div className="flex-1 overflow-y-auto">
            {sessions.length === 0 ? (
              <div className="py-16 text-center space-y-2 px-4">
                <CheckCircle className="w-8 h-8 text-white/10 mx-auto" />
                <p className="text-xs text-white/25">Sin chats activos</p>
                <p className="text-[10px] text-white/15">
                  Cuando un cliente inicie un chat aparecerá aquí
                </p>
              </div>
            ) : (
              sessions.map(s => (
                <SessionItem
                  key={s.id}
                  session={s}
                  isSelected={selectedId === s.id}
                  onSelect={() => setSelectedId(s.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Main — chat panel */}
        <div className="flex-1 overflow-hidden">
          {selected ? (
            <ChatPanel
              key={selected.id}
              session={selected}
              shopId={shopId!}
              employeeName={employeeName}
              employeeId={employeeId}
              onEnd={() => setSelectedId(null)}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center space-y-3 text-center px-8">
              <MessageCircle className="w-12 h-12 text-white/8" />
              <p className="text-white/25 text-sm">Selecciona una conversación</p>
              <p className="text-white/15 text-xs">
                Los chats aparecen en tiempo real. Únete a uno para responder al cliente.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
