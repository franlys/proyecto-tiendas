"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2, MessageCircle, X } from "lucide-react";
import { ThemeProvider, AuthProvider, useAuth, ShopsProvider, useShops, AgencyProvider, NotificationsProvider } from "@/components/shared";
import { SupportWidget } from "@/components/admin/support-widget";
import { PushSetup } from "@/components/admin/push-setup";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import Link from "next/link";

function playNewChatSound() {
  try {
    const ctx = new AudioContext();
    const play = (freq: number, start: number, dur: number) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.25, ctx.currentTime + start);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      o.start(ctx.currentTime + start); o.stop(ctx.currentTime + start + dur);
    };
    play(880, 0, 0.15); play(1100, 0.18, 0.15);
  } catch {}
}

function GlobalChatNotifier({ shopId }: { shopId: string }) {
  const pathname = usePathname();
  const [toast, setToast] = useState<{ name: string; id: string } | null>(null);
  const prevCountRef = useRef(0);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, "shops", shopId, "chatSessions"),
      where("status", "==", "waiting")
    );
    const unsub = onSnapshot(q, snap => {
      const waiting = snap.docs;
      if (waiting.length > prevCountRef.current && prevCountRef.current !== -1) {
        playNewChatSound();
        // Only show toast if not already on the chat page
        if (!pathname.startsWith("/admin/chat")) {
          const newest = waiting[waiting.length - 1]?.data();
          if (newest) {
            setToast({ name: newest.clientName, id: snap.docs[snap.docs.length - 1].id });
            if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
            toastTimerRef.current = setTimeout(() => setToast(null), 8000);
          }
        }
      }
      prevCountRef.current = waiting.length;
    });
    return () => { unsub(); if (toastTimerRef.current) clearTimeout(toastTimerRef.current); };
  }, [shopId, pathname]);

  if (!toast) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] animate-in slide-in-from-top-2 fade-in duration-300">
      <div className="flex items-center gap-3 bg-zinc-900 border border-white/15 rounded-2xl shadow-2xl px-4 py-3 min-w-[280px]">
        <div className="w-9 h-9 rounded-full bg-amber-400/15 flex items-center justify-center flex-shrink-0">
          <MessageCircle className="w-4 h-4 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-black text-white">Nuevo chat</p>
          <p className="text-[11px] text-white/50 truncate">{toast.name} está esperando</p>
        </div>
        <div className="flex items-center gap-1.5">
          <Link
            href="/admin/chat"
            onClick={() => setToast(null)}
            className="px-3 py-1.5 bg-white text-black rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-white/90 transition-colors"
          >
            Ir
          </Link>
          <button onClick={() => setToast(null)} className="p-1.5 text-white/30 hover:text-white transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, user, isSuperAdmin } = useAuth();
  const { getShop } = useShops();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
        return;
      }

      // Phase 11: Subscription Guard
      // If not super admin, check shop subscription status
      if (!isSuperAdmin && user?.shopId) {
        const shop = getShop(user.shopId);
        // If shop exists and has bad status
        if (shop && (shop.subscriptionStatus === "past_due" || shop.subscriptionStatus === "canceled")) {
          // Allow only billing page
          if (pathname !== "/admin/billing") {
            router.push("/admin/billing");
          }
        }
      }
    }
  }, [isAuthenticated, isLoading, router, isSuperAdmin, user, getShop, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  // Get shopId for notifications
  const shopId = user?.shopId || null;
  const shop = shopId ? (getShop(shopId) || null) : null;

  return (
    <ThemeProvider shop={shop as any}>
      <NotificationsProvider shopId={shopId}>
        {shopId && <PushSetup shopId={shopId} />}
        {shopId && <GlobalChatNotifier shopId={shopId} />}
        {children}
      </NotificationsProvider>
    </ThemeProvider>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ShopsProvider>
        <AgencyProvider>
          <AdminLayoutContent>{children}</AdminLayoutContent>
          <SupportWidget />
        </AgencyProvider>
      </ShopsProvider>
    </AuthProvider>
  );
}
