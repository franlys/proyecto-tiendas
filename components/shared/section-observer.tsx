"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useUI, type SectionId } from "./ui-context";

interface SectionObserverProps {
  id: SectionId;
  children: ReactNode;
  className?: string;
  threshold?: number;
  rootMargin?: string;
}

export function SectionObserver({
  id,
  children,
  className,
  threshold = 0.5,
  rootMargin = "-10% 0px -10% 0px",
}: SectionObserverProps) {
  const ref = useRef<HTMLElement>(null);
  const { setActiveSection } = useUI();

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(id);
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [id, setActiveSection, threshold, rootMargin]);

  return (
    <section ref={ref} id={id} className={className}>
      {children}
    </section>
  );
}
