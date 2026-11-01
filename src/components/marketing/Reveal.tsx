"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Lightweight, safe scroll reveal.
 *
 * Content is never hidden from assistive tech or no-JS clients: only a small
 * translate offset is animated, and a timer guarantees the element settles even
 * if IntersectionObserver never fires (e.g. inside a resized preview iframe).
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article";
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        }
      },
      { rootMargin: "120px 0px 120px 0px", threshold: 0 },
    );
    io.observe(el);

    // Safety net: never leave content visually offset indefinitely.
    const fallback = window.setTimeout(() => setShown(true), 2600);

    return () => {
      io.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  const Comp = Tag as any;
  return (
    <Comp
      ref={ref as any}
      className={className}
      style={{
        transform: shown ? "none" : "translateY(14px)",
        transition: `transform .65s cubic-bezier(.22,1,.36,1) ${delay}ms, opacity .5s ease ${delay}ms`,
      }}
    >
      {children}
    </Comp>
  );
}
