"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import gsap from "gsap";

type CursorType = "default" | "pointer" | "product" | "button" | "crosshair" | "text";

interface CursorContextValue {
    type: CursorType;
    setType: (type: CursorType) => void;
    isHovering: boolean;
    setIsHovering: (isHovering: boolean) => void;
}

const CursorContext = createContext<CursorContextValue | undefined>(undefined);

export function CursorProvider({ children }: { children: React.ReactNode }) {
    const [type, setType] = useState<CursorType>("default");
    const [isHovering, setIsHovering] = useState(false);

    return (
        <CursorContext.Provider value={{ type, setType, isHovering, setIsHovering }}>
            {children}
            <ReactiveCursor type={type} />
        </CursorContext.Provider>
    );
}

export const useCursor = () => {
    const context = useContext(CursorContext);
    if (!context) {
        throw new Error("useCursor must be used within a CursorProvider");
    }
    return context;
};

function ReactiveCursor({ type }: { type: CursorType }) {
    const cursorRef = useRef<HTMLDivElement>(null);
    const dotRef = useRef<HTMLDivElement>(null);
    const mousePos = useRef({ x: 0, y: 0 });
    const delayedMousePos = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            mousePos.current = { x: e.clientX, y: e.clientY };
        };

        window.addEventListener("mousemove", handleMouseMove);

        const animate = () => {
            // Lerp for smooth trailing
            delayedMousePos.current.x += (mousePos.current.x - delayedMousePos.current.x) * 0.15;
            delayedMousePos.current.y += (mousePos.current.y - delayedMousePos.current.y) * 0.15;

            if (cursorRef.current) {
                gsap.set(cursorRef.current, {
                    x: delayedMousePos.current.x,
                    y: delayedMousePos.current.y,
                });
            }

            if (dotRef.current) {
                gsap.set(dotRef.current, {
                    x: mousePos.current.x,
                    y: mousePos.current.y,
                });
            }

            requestAnimationFrame(animate);
        };

        const animId = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            cancelAnimationFrame(animId);
        };
    }, []);

    // Handle cursor state changes
    useEffect(() => {
        if (!cursorRef.current) return;

        const tl = gsap.timeline({ defaults: { duration: 0.3, ease: "power2.out" } });

        switch (type) {
            case "product":
                tl.to(cursorRef.current, { width: 80, height: 80, borderColor: "rgba(6, 182, 212, 0.5)", backgroundColor: "rgba(6, 182, 212, 0.1)", borderWidth: 2 });
                break;
            case "button":
                tl.to(cursorRef.current, { width: 40, height: 40, borderColor: "rgba(6, 182, 212, 0.8)", backgroundColor: "rgba(6, 182, 212, 0.2)", borderWidth: 2 });
                break;
            case "crosshair":
                tl.to(cursorRef.current, { width: 30, height: 30, borderRadius: "0%", rotate: 45, borderColor: "rgba(255, 255, 255, 0.8)", borderWidth: 1 });
                break;
            case "text":
                tl.to(cursorRef.current, { width: 4, height: 30, borderRadius: "2px", backgroundColor: "white", borderWidth: 0 });
                break;
            default:
                tl.to(cursorRef.current, { width: 24, height: 24, borderColor: "rgba(255, 255, 255, 0.3)", backgroundColor: "transparent", borderWidth: 1, borderRadius: "50%", rotate: 0 });
        }
    }, [type]);

    return (
        <>
            <div
                ref={cursorRef}
                className="fixed top-0 left-0 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[9999] rounded-full border border-white/30 hidden md:block mix-blend-difference"
                style={{ width: 24, height: 24 }}
            />
            <div
                ref={dotRef}
                className="fixed top-0 left-0 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[9999] w-1 h-1 bg-cyan-400 rounded-full hidden md:block"
            />
        </>
    );
}
