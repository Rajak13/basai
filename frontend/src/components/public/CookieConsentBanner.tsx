"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function CookieConsentBanner() {
  const [hasDecided, setHasDecided] = useState(true); // default true to avoid flash on mount

  useEffect(() => {
    try {
      const consent = localStorage.getItem("basai_cookie_consent");
      if (!consent) {
        // Show after small graceful delay
        const timer = setTimeout(() => {
          setHasDecided(false);
        }, 1200);
        return () => clearTimeout(timer);
      }
    } catch {
      // LocalStorage blocked
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem("basai_cookie_consent", "accepted");
    } catch {}
    setHasDecided(true);
  };

  const handleDecline = () => {
    try {
      localStorage.setItem("basai_cookie_consent", "essential_only");
    } catch {}
    setHasDecided(true);
  };

  if (hasDecided) return null;

  return (
    <div
      role="region"
      aria-label="Cookie consent banner"
      className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-6 duration-700 select-none"
    >
      <div className="bg-[#1E1B19]/95 backdrop-blur-xl border border-white/15 text-[#E5DCD3] p-5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-2xl space-y-4">
        {/* TOP BRAND ICON & TITLE */}
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-[#E4AA8B] animate-pulse" />
          <span className="font-stedelijk uppercase text-sm tracking-[0.18em] text-white">
            PRIVACY & COOKIES
          </span>
        </div>

        {/* EXPLANATION */}
        <p className="text-xs text-[#A8988B] leading-relaxed font-normal">
          Basai uses essential cookies and anonymized telemetry to curate your sanctuary booking experience, ensure seamless checkout, and preserve your stay preferences.
        </p>

        {/* BUTTON ACTIONS */}
        <div className="flex items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleAccept}
            className="flex-1 px-4 py-2 rounded-xl bg-[#E8A88A] hover:bg-[#DE9977] active:bg-[#D58C6B] text-[#2C231E] font-medium text-xs tracking-wide transition shadow-sm cursor-pointer text-center"
          >
            Accept All
          </button>

          <button
            type="button"
            onClick={handleDecline}
            className="px-4 py-2 rounded-xl border border-white/20 hover:border-white/40 hover:bg-white/5 text-white/80 hover:text-white font-medium text-xs tracking-wide transition cursor-pointer text-center"
          >
            Essential Only
          </button>
        </div>
      </div>
    </div>
  );
}
