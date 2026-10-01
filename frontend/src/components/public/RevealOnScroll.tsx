"use client";

import { useEffect, useRef, useState, ReactNode } from "react";

interface RevealOnScrollProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "left" | "right" | "none";
}

/**
 * Editorial Architectural Reveal
 * Uses cubic-bezier(0.16, 1, 0.3, 1) ease with micro-scale & directional drift
 * for an elevated luxury presentation rather than generic fade-in.
 */
export default function RevealOnScroll({
  children,
  className = "",
  delay = 0,
  direction = "up",
}: RevealOnScrollProps) {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      {
        threshold: 0.15,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const getTransform = () => {
    if (isVisible) return "translate3d(0, 0, 0) scale(1)";
    switch (direction) {
      case "up":
        return "translate3d(0, 36px, 0) scale(0.985)";
      case "left":
        return "translate3d(-36px, 0, 0) scale(0.985)";
      case "right":
        return "translate3d(36px, 0, 0) scale(0.985)";
      default:
        return "scale(0.985)";
    }
  };

  return (
    <div
      ref={elementRef}
      className={`transform-gpu transition-all duration-1000 will-change-transform ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: getTransform(),
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
