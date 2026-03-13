"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Lenis from "@studio-freight/lenis";

interface SmoothScrollProps {
    children: ReactNode;
}

export function SmoothScroll({ children }: SmoothScrollProps) {
    const lenisRef = useRef<Lenis | null>(null);
    const pathname = usePathname();

    // Skip Lenis for admin panel and auth pages — they have complex UIs
    // that don't need smooth scroll and can conflict with dropdowns/tables
    const isAdminRoute = pathname?.startsWith("/admin") || pathname?.startsWith("/login");

    useEffect(() => {
        if (isAdminRoute) return;

        const lenis = new Lenis({
            // lerp (linear interpolation) feels more natural on touchpads
            // than duration+easing which can make small trackpad deltas feel stuck
            lerp: 0.08,
            smoothWheel: true,
            // Higher multiplier so touchpad small deltas produce visible movement
            wheelMultiplier: 1.2,
            touchMultiplier: 2.5,
            orientation: "vertical",
            gestureOrientation: "vertical",
            infinite: false,
        });

        lenisRef.current = lenis;

        function raf(time: number) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }

        const rafId = requestAnimationFrame(raf);

        return () => {
            cancelAnimationFrame(rafId);
            lenis.destroy();
            lenisRef.current = null;
        };
    }, [isAdminRoute]);

    return <>{children}</>;
}
