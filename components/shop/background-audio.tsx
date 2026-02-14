"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

interface BackgroundAudioProps {
    audioUrl: string;
    volume?: number;  // 0-1, default 0.3
    loop?: boolean;   // default true
    className?: string;
}

/**
 * Background Audio Player Component
 *
 * Plays ambient music/audio for shops that have it configured.
 * Handles browser autoplay restrictions by:
 * 1. Starting muted initially
 * 2. Showing a visual indicator that audio is available
 * 3. Remembering user preference in localStorage
 */
export function BackgroundAudio({
    audioUrl,
    volume = 0.3,
    loop = true,
    className
}: BackgroundAudioProps) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isMuted, setIsMuted] = useState(true);
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasInteracted, setHasInteracted] = useState(false);
    const [showPulse, setShowPulse] = useState(true);

    // Initialize audio on mount
    useEffect(() => {
        const audio = new Audio(audioUrl);
        audio.loop = loop;
        audio.volume = volume;
        audio.muted = true; // Start muted due to autoplay restrictions

        audio.addEventListener("canplaythrough", () => {
            setIsLoaded(true);
        });

        audio.addEventListener("error", (e) => {
            console.error("Audio load error:", e);
        });

        audioRef.current = audio;

        // Check localStorage for user preference
        const savedPref = localStorage.getItem("shop-audio-muted");
        if (savedPref === "false") {
            // User previously enabled audio
            setShowPulse(true);
        }

        // Try to play (will be muted initially)
        audio.play().catch(() => {
            // Autoplay blocked, that's fine - user needs to interact
        });

        return () => {
            audio.pause();
            audio.src = "";
        };
    }, [audioUrl, loop, volume]);

    // Handle first user interaction on page
    useEffect(() => {
        const handleFirstInteraction = () => {
            if (!hasInteracted) {
                setHasInteracted(true);
                // Check local storage. Default to ON (unmuted) if not set.
                const savedPref = localStorage.getItem("shop-audio-muted");
                const shouldPlay = savedPref !== "true"; // Play if "false" or null (default)

                if (shouldPlay && audioRef.current) {
                    audioRef.current.muted = false;
                    audioRef.current.play().catch(e => console.log("Audio play failed even after interaction:", e));
                    setIsMuted(false);
                    setShowPulse(false);
                }
            }
        };

        // Listen for any user interaction
        const events = ["click", "touchstart", "keydown", "scroll"];
        events.forEach(event => document.addEventListener(event, handleFirstInteraction, { once: true }));

        return () => {
            events.forEach(event => document.removeEventListener(event, handleFirstInteraction));
        };
    }, [hasInteracted]);

    // Toggle audio
    const toggleMute = useCallback(() => {
        if (!audioRef.current) return;

        const newMuted = !isMuted;
        audioRef.current.muted = newMuted;
        setIsMuted(newMuted);
        setShowPulse(false);

        // Save preference
        localStorage.setItem("shop-audio-muted", String(newMuted));

        // If unmuting, ensure audio is playing
        if (!newMuted) {
            audioRef.current.play().catch(() => { });
        }
    }, [isMuted]);

    if (!isLoaded) return null;

    return (
        <button
            onClick={toggleMute}
            className={cn(
                "fixed bottom-20 right-4 z-40",
                "w-10 h-10 rounded-full",
                "bg-black/50 backdrop-blur-sm border border-white/20",
                "flex items-center justify-center",
                "transition-all duration-300",
                "hover:bg-black/70 hover:scale-110",
                showPulse && "animate-pulse",
                className
            )}
            aria-label={isMuted ? "Activar audio" : "Silenciar audio"}
            title={isMuted ? "Activar musica" : "Silenciar"}
        >
            {isMuted ? (
                <VolumeX className="w-5 h-5 text-white/70" />
            ) : (
                <Volume2 className="w-5 h-5 text-primary" />
            )}
        </button>
    );
}
