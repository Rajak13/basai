"use client";

import { useState, useEffect } from "react";
import HeroSection from "@/components/public/HeroSection";
import CuratedCarouselSection from "@/components/public/CuratedCarouselSection";
import DiningSpotlightSection from "@/components/public/DiningSpotlightSection";
import HotelShowcaseSection from "@/components/public/HotelShowcaseSection";
import FAQSection from "@/components/public/FAQSection";
import FooterSection from "@/components/public/FooterSection";
import BottomFloatingNav from "@/components/public/BottomFloatingNav";
import FullScreenMenu from "@/components/public/FullScreenMenu";
import SmoothScrollProvider from "@/components/public/SmoothScrollProvider";

export default function HomePage() {
  const [lang, setLang] = useState<"en" | "np">("en");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Reveal the peach "Book accommodation" button when scrolled past the hero
      setIsScrolled(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <SmoothScrollProvider>
      <main className="w-full min-h-screen bg-[#1E1B19] overflow-x-hidden relative">
        {/* 1. HERO SECTION */}
        <HeroSection
          lang={lang}
          onToggleLang={setLang}
          onOpenMenu={() => setIsMenuOpen(true)}
          hideFloatingNav={true}
        />

        {/* 2. THE WORLD OF BASAI: CURATED EXPERIENCES & SANCTUARIES CAROUSEL */}
        <CuratedCarouselSection lang={lang} />

        {/* 3. SPOTLIGHT VENUE: CHULI DINING & HEARTH (VIDEO BACKGROUND) */}
        <DiningSpotlightSection
          lang={lang}
          videoSrc="/chuli-ambience.mp4"
        />

        {/* 4. ICONIC SANCTUARIES: 3 FEATURED HOTELS (ALTERNATING EDITORIAL SHOWCASE) */}
        <HotelShowcaseSection lang={lang} />

        {/* 5. FREQUENTLY ASKED QUESTIONS (LUXURY EDITORIAL ACCORDION) */}
        <FAQSection lang={lang} />

        {/* 6. BASAI BESPOKE FOOTER */}
        <FooterSection lang={lang} />

        {/* FLOATING BOTTOM NAV BAR - PINNED ACROSS SECTIONS */}
        <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-[calc(100vw-1.5rem)]">
          <BottomFloatingNav
            lang={lang}
            showBookCta={isScrolled}
            onOpenMenu={() => setIsMenuOpen(true)}
          />
        </div>

        {/* FULL-SCREEN NAVIGATION OVERLAY (DARK THEME WITH BASAI BRANDING) */}
        <FullScreenMenu
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          activeBrand="Basai"
          lang={lang}
        />
      </main>
    </SmoothScrollProvider>
  );
}
