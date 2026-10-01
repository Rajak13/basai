"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface DiningSpotlightProps {
  lang?: "en" | "np";
  videoSrc?: string;
  posterSrc?: string;
}

export default function DiningSpotlightSection({
  lang = "en",
  videoSrc,
  posterSrc,
}: DiningSpotlightProps) {
  const containerRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [capturedPoster, setCapturedPoster] = useState<string | null>(null);

  // 1. EXTRACT FIRST FRAME OF VIDEO AS THUMBNAIL VIA CLIENT CANVAS (exact match)
  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video || capturedPoster) return;
    
    // Seek to first frame (0.05s) to guarantee valid decoded video buffer
    video.currentTime = 0.05;
  };

  const handleSeeked = () => {
    const video = videoRef.current;
    if (!video || capturedPoster) return;

    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 1920;
      canvas.height = video.videoHeight || 1080;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        setCapturedPoster(dataUrl);
      }
    } catch {
      // cross-origin or buffer not ready
    }
  };

  // 2. SCROLL TRIGGER: AUTOPLAY WHEN SCROLLED IN, PAUSE WHEN SCROLLED AWAY
  useEffect(() => {
    const section = containerRef.current;
    const video = videoRef.current;
    if (!section || !video) return;

    video.playbackRate = 0.9;
    video.muted = true;
    video.defaultMuted = true;

    // Use IntersectionObserver with 25% threshold
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // User reached this section -> Auto play
            const playPromise = video.play();
            if (playPromise !== undefined) {
              playPromise
                .then(() => setIsPlaying(true))
                .catch(() => {
                  // User has not interacted yet, retry on any click/touch/scroll
                  const startOnFirstGesture = () => {
                    video.play().then(() => setIsPlaying(true)).catch(() => {});
                    window.removeEventListener("scroll", startOnFirstGesture);
                    window.removeEventListener("touchstart", startOnFirstGesture);
                  };
                  window.addEventListener("scroll", startOnFirstGesture, { passive: true, once: true });
                  window.addEventListener("touchstart", startOnFirstGesture, { passive: true, once: true });
                });
            }
          } else {
            // User scrolled away -> Pause to save CPU/GPU and battery
            video.pause();
            setIsPlaying(false);
          }
        });
      },
      {
        threshold: 0.25, // Trigger when 25% of section enters viewport
      }
    );

    observer.observe(section);

    return () => {
      observer.disconnect();
    };
  }, [videoSrc]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  return (
    <section
      ref={containerRef}
      id="dining"
      className="relative w-full bg-[#1A1816] py-16 sm:py-24 px-4 sm:px-8 lg:px-12 overflow-hidden select-none"
    >
      <div className="max-w-7xl mx-auto">
        {/* TOP BRAND VENUE SUBTITLE */}
        <div className="text-center mb-6 sm:mb-8">
          <span className="text-xs sm:text-sm uppercase tracking-[0.25em] text-[#C4B2A3] font-medium">
            CHULI RESTAURANT & HEARTH
          </span>
        </div>

        {/* CINEMATIC WINDOW CONTAINER */}
        <div className="relative w-full aspect-4/3 sm:aspect-16/10 lg:aspect-16/9 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-white/10 group">
          {/* 1. BACKGROUND VIDEO OR FALLBACK POSTER */}
          {videoSrc ? (
            <video
              ref={videoRef}
              src={videoSrc}
              poster={capturedPoster || posterSrc}
              onLoadedMetadata={handleLoadedMetadata}
              onSeeked={handleSeeked}
              muted
              loop
              playsInline
              preload="auto"
              className="absolute inset-0 w-full h-full object-cover scale-[1.01] transition-transform duration-1000 group-hover:scale-105"
            />
          ) : (
            /* PLACEHOLDER CINEMATIC AMBIENCE IMAGE WHILE USER PREPARES VIDEO */
            <div
              className="absolute inset-0 w-full h-full bg-cover bg-center transition-transform duration-1000 group-hover:scale-105"
              style={{
                backgroundImage: posterSrc ? `url('${posterSrc}')` : undefined,
              }}
            />
          )}

          {/* 2. DUSK & WARM CANDLELIGHT VIGNETTE OVERLAYS */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/60 pointer-events-none" />
          <div className="absolute inset-0 bg-radial-[at_center] from-transparent via-black/30 to-black/80 pointer-events-none" />

          {/* 3. SUBTLE WINDOW FRAME ARCHITECTURAL MULLIONS (WINDOW REFLECTION LOOK) */}
          <div className="absolute inset-0 pointer-events-none opacity-20 hidden md:grid grid-cols-2 grid-rows-1 border border-white/15">
            <div className="border-r border-white/20 h-full w-full" />
            <div className="h-full w-full" />
          </div>

          {/* 4. CONTENT OVERLAY */}
          <div className="relative z-10 w-full h-full flex flex-col items-center justify-center text-center px-4 sm:px-8 py-8 sm:py-12">
            
            {/* HEADLINE IN ARCHITYPE STEDELIJK */}
            <h2
              className="font-stedelijk uppercase text-3xl sm:text-5xl md:text-6xl lg:text-[68px] text-white tracking-wider max-w-4xl leading-[1.06] drop-shadow-lg"
              style={{ textTransform: "uppercase" }}
            >
              TASTE TRADITION AT CHULI
            </h2>

            {/* OPENING TIMINGS THREE-COLUMN GRID */}
            <div className="mt-8 sm:mt-10 grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-8 lg:gap-14 max-w-2xl w-full text-white/90">
              {/* COL 1: MON - WED */}
              <div className="flex flex-col items-center">
                <span className="text-xs sm:text-sm font-medium tracking-wider text-[#DDC8B6]">
                  Monday–Wednesday
                </span>
                <span className="text-xs sm:text-sm font-light text-white/80 mt-1">
                  11:00–18:00
                </span>
                <span className="text-[11px] sm:text-xs text-white/50">
                  Kitchen: 11:30–17:30
                </span>
              </div>

              {/* COL 2: THU - SAT */}
              <div className="flex flex-col items-center">
                <span className="text-xs sm:text-sm font-medium tracking-wider text-[#DDC8B6]">
                  Thursday–Saturday
                </span>
                <span className="text-xs sm:text-sm font-light text-white/80 mt-1">
                  11:00–23:00
                </span>
                <span className="text-[11px] sm:text-xs text-white/50">
                  Kitchen: 11:00–21:45
                </span>
              </div>

              {/* COL 3: SUNDAY */}
              <div className="flex flex-col items-center">
                <span className="text-xs sm:text-sm font-medium tracking-wider text-[#DDC8B6]">
                  Sunday
                </span>
                <span className="text-xs sm:text-sm font-light text-white/80 mt-1">
                  11:00–18:00
                </span>
                <span className="text-[11px] sm:text-xs text-white/50">
                  Kitchen: 11:30–17:30
                </span>
              </div>
            </div>

            {/* THREE OUTLINED ACTION PILL BUTTONS */}
            <div className="mt-8 sm:mt-12 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              {/* 1. EXPLORE */}
              <Link
                href="/rooms"
                className="px-5 sm:px-7 py-2 sm:py-2.5 rounded-full border border-white/40 bg-black/25 hover:bg-white/20 hover:border-white text-white text-xs sm:text-sm font-medium tracking-wide backdrop-blur-xs transition-all duration-300 shadow-sm"
              >
                Explore
              </Link>

              {/* 2. MENUS */}
              <a
                href="#dining-menu"
                className="px-5 sm:px-7 py-2 sm:py-2.5 rounded-full border border-white/40 bg-black/25 hover:bg-white/20 hover:border-white text-white text-xs sm:text-sm font-medium tracking-wide backdrop-blur-xs transition-all duration-300 shadow-sm"
              >
                Menus
              </a>

              {/* 3. BOOK TABLE */}
              <a
                href="#book-table"
                className="px-5 sm:px-7 py-2 sm:py-2.5 rounded-full border border-white/40 bg-black/25 hover:bg-white/20 hover:border-white text-white text-xs sm:text-sm font-medium tracking-wide backdrop-blur-xs transition-all duration-300 shadow-sm"
              >
                Book table
              </a>
            </div>
          </div>

          {/* 5. MINIMAL PLAY / PAUSE BUTTON ONLY (SOUND ICON REMOVED) */}
          {videoSrc && (
            <div className="absolute bottom-4 right-4 z-20 flex items-center">
              <button
                type="button"
                onClick={togglePlay}
                aria-label={isPlaying ? "Pause background video" : "Play background video"}
                className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/75 backdrop-blur-md text-white/80 hover:text-white border border-white/20 flex items-center justify-center transition-all text-xs"
              >
                {isPlaying ? (
                  <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3 fill-current ml-0.5" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
