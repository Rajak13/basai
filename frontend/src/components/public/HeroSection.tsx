"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import BasaiLogo from "./BasaiLogo";
import BookingWidgetCard from "./BookingWidgetCard";
import BottomFloatingNav from "./BottomFloatingNav";
import FullScreenMenu from "./FullScreenMenu";

interface HeroSectionProps {
  lang?: "en" | "np";
  onToggleLang?: (lang: "en" | "np") => void;
  onOpenMenu?: () => void;
  hideFloatingNav?: boolean;
}

export default function HeroSection({
  lang: controlledLang,
  onToggleLang,
  onOpenMenu: controlledOpenMenu,
  hideFloatingNav = false,
}: HeroSectionProps) {
  const [internalLang, setInternalLang] = useState<"en" | "np">("en");
  const [internalMenuOpen, setInternalMenuOpen] = useState(false);

  const lang = controlledLang ?? internalLang;
  const setLang = onToggleLang ?? setInternalLang;
  const openMenu = controlledOpenMenu ?? (() => setInternalMenuOpen(true));

  return (
    <>
      <section className="relative w-full min-h-screen bg-[#1E1B19] text-[#FAF1E8] flex flex-col justify-between p-3 sm:p-6 lg:p-8 xl:px-12 xl:py-6 overflow-x-hidden select-none">
        {/* ========================================================
            TOP HEADER BAR
            - Unique Basai architectural logo mark (left)
            - Brand: BASAI (center)
            - Language selector: En | Np (right)
            ======================================================== */}
        <header className="w-full max-w-[1440px] mx-auto mb-3 sm:mb-6 px-2 sm:px-4 flex items-center justify-between">
          {/* LEFT: UNIQUE BASAI LOGO */}
          <Link
            href="/"
            className="flex items-center gap-2 group transition-transform hover:scale-105"
            aria-label="Basai Home"
          >
            <BasaiLogo className="h-7 sm:h-9 w-auto text-[#E4AA8B]" />
          </Link>

          {/* CENTER: BASAI BRAND TITLE */}
          <div className="flex items-center">
            <span className="text-[20px] sm:text-[24px] font-normal tracking-[0.24em] uppercase text-[#E4AA8B] font-stedelijk">
              BASAI
            </span>
          </div>

          {/* RIGHT: RESERVATIONS QUICK LINK */}
          <div className="flex items-center">
            <Link
              href="/rooms"
              className="text-xs sm:text-sm font-medium text-[#E4AA8B]/80 hover:text-[#E4AA8B] tracking-wider uppercase transition"
            >
              Sanctuaries
            </Link>
          </div>
        </header>

        {/* ========================================================
            MAIN FRAMED HERO CONTAINER
            - Framed image using existing /hero.png
            - Monumental headline & "Discover our hotels" CTA
            - Floating Right Booking Widget Card with Calendar
            ======================================================== */}
        <div className="relative w-full max-w-[1440px] mx-auto flex-1 rounded-2xl sm:rounded-3xl shadow-2xl min-h-[780px] lg:min-h-[660px] xl:min-h-[720px] flex flex-col justify-between">
          {/* HERO IMAGE BACKGROUND (USING EXISTING /hero.png) */}
          <div className="absolute inset-0 z-0 rounded-2xl sm:rounded-3xl overflow-hidden">
            <Image
              src="/hero.png"
              alt="Basai Sanctuary & Hospitality"
              fill
              priority
              className="object-cover object-center scale-[1.01]"
              sizes="(max-width: 1440px) 100vw, 1440px"
            />
            {/* Subtle natural film vignette for readability */}
            <div className="absolute inset-0 bg-black/25 sm:bg-black/20" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/25" />
          </div>

          {/* HERO CONTENT: HEADLINE & DISCOVER BUTTON (LEFT/CENTER) + BOOKING WIDGET (RIGHT) */}
          <div className="relative z-10 w-full h-full flex-1 flex flex-col lg:flex-row items-center justify-between p-5 sm:p-10 lg:p-12 xl:p-14 gap-8 pb-28 lg:pb-12">
            
            {/* HEADLINE & DISCOVER BUTTON (ARCHITYPE STEDELIJK) */}
            <div className="w-full lg:max-w-[55%] flex flex-col items-center lg:items-center text-center my-auto pt-4 sm:pt-6 lg:pt-0">
              <h1
                className="font-stedelijk uppercase tracking-wider text-3xl sm:text-5xl md:text-6xl lg:text-[66px] xl:text-[76px] text-[#E4AA8B] leading-[1.06] drop-shadow-[0_4px_16px_rgba(0,0,0,0.7)]"
                style={{ textTransform: "uppercase" }}
              >
                FOUR UNIQUE PLACES TO<br />
                STAY AND EAT AT BASAI
              </h1>

              {/* PILL BUTTON: DISCOVER OUR HOTELS */}
              <div className="mt-5 sm:mt-7">
                <Link
                  href="/rooms"
                  className="inline-block rounded-full border border-white/80 bg-black/25 backdrop-blur-xs text-white px-6 sm:px-7 py-2.5 text-xs sm:text-sm font-medium tracking-wide hover:bg-white/20 transition-all duration-300 shadow-md"
                >
                  Discover our hotels
                </Link>
              </div>
            </div>

            {/* FLOATING BOOKING WIDGET CARD (RIGHT) */}
            <div className="w-full lg:w-auto flex justify-center lg:justify-end my-auto z-20">
              <BookingWidgetCard lang={lang} />
            </div>
          </div>

          {/* INTERNAL FLOATING BOTTOM NAV (ONLY IF NOT CONTROLLED AT ROOT) */}
          {!hideFloatingNav && (
            <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-30">
              <BottomFloatingNav lang={lang} onOpenMenu={openMenu} />
            </div>
          )}
        </div>
      </section>

      {/* INTERNAL FULL SCREEN MENU (IF NOT CONTROLLED AT ROOT) */}
      {!controlledOpenMenu && (
        <FullScreenMenu
          isOpen={internalMenuOpen}
          onClose={() => setInternalMenuOpen(false)}
          activeBrand="Basai"
          lang={lang}
        />
      )}
    </>
  );
}
