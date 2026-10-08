"use client";

import Link from "next/link";
import { useState } from "react";
import BasaiLogo from "./BasaiLogo";
import FullScreenMenu from "./FullScreenMenu";
import RolesManualModal from "./RolesManualModal";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-[#1E1B19]/95 backdrop-blur-md border-b border-white/10 text-[#FAF1E8] select-none transition-all">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 h-18 sm:h-20 flex items-center justify-between">
          {/* BRAND EMBLEM & LOGO */}
          <Link
            href="/"
            className="flex items-center gap-2.5 sm:gap-3 group transition-transform hover:scale-105"
            aria-label="Basai Home"
          >
            <BasaiLogo className="h-7 sm:h-8 w-auto text-[#E4AA8B]" />
            <span className="font-stedelijk text-xl sm:text-2xl tracking-[0.22em] uppercase text-[#E4AA8B]">
              BASAI
            </span>
          </Link>

          {/* DESKTOP CURATED NAV LINKS */}
          <nav className="hidden md:flex items-center gap-7 lg:gap-9 text-xs lg:text-[13px] font-medium tracking-wider uppercase text-[#FAF1E8]/80">
            <Link
              href="/rooms"
              className="hover:text-[#E4AA8B] transition-colors py-1 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1.5px] after:bg-[#E4AA8B] hover:after:w-full after:transition-all"
            >
              Sanctuaries
            </Link>
            <Link
              href="/#dining"
              className="hover:text-[#E4AA8B] transition-colors py-1 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1.5px] after:bg-[#E4AA8B] hover:after:w-full after:transition-all"
            >
              Chuli Dining
            </Link>
            <Link
              href="/#experiences"
              className="hover:text-[#E4AA8B] transition-colors py-1 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1.5px] after:bg-[#E4AA8B] hover:after:w-full after:transition-all"
            >
              Experiences
            </Link>
            <Link
              href="/compare"
              className="hover:text-[#E4AA8B] transition-colors py-1 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1.5px] after:bg-[#E4AA8B] hover:after:w-full after:transition-all"
            >
              Compare
            </Link>
            <Link
              href="/#faq"
              className="hover:text-[#E4AA8B] transition-colors py-1 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1.5px] after:bg-[#E4AA8B] hover:after:w-full after:transition-all"
            >
              Stories & FAQ
            </Link>
          </nav>

          {/* RIGHT ACTIONS: BOOK BUTTON + MENU TRIGGER */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/booking"
              className="bg-[#E8A88A] hover:bg-[#DE9977] active:bg-[#D58C6B] text-[#2C231E] px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-[13px] font-medium tracking-wide shadow-md hover:shadow-lg transition-all duration-300"
            >
              Book Stay
            </Link>

            {/* ROLES & SYSTEM MANUAL '?' TRIGGER BUTTON */}
            <button
              type="button"
              onClick={() => setIsManualOpen(true)}
              aria-label="Open System Manual & Roles Guide"
              title="Basai Operating Manual & Roles Guide"
              className="w-9 sm:w-10 h-9 sm:h-10 rounded-full border border-[#D4AF37]/50 hover:border-[#E4AA8B] bg-white/5 hover:bg-[#D4AF37]/15 text-[#D4AF37] hover:text-[#FAF1E8] flex items-center justify-center font-mono text-sm font-bold transition-all cursor-pointer shadow-xs"
            >
              ?
            </button>

            {/* FULL SCREEN MENU HAMBURGER BUTTON */}
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              aria-label="Open navigation menu"
              className="w-9 sm:w-10 h-9 sm:h-10 rounded-full border border-white/20 hover:border-[#E4AA8B] text-[#FAF1E8] hover:text-[#E4AA8B] flex items-center justify-center transition-all cursor-pointer"
            >
              <div className="w-3.5 h-3 flex flex-col justify-between">
                <span className="w-full h-[1.5px] bg-current rounded-full" />
                <span className="w-full h-[1.5px] bg-current rounded-full" />
                <span className="w-full h-[1.5px] bg-current rounded-full" />
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* REUSABLE FULL SCREEN ARCHITECTURAL OVERLAY */}
      <FullScreenMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        activeBrand="Basai"
      />

      {/* ROLES & SYSTEM ARCHITECTURE MANUAL MODAL */}
      <RolesManualModal
        isOpen={isManualOpen}
        onClose={() => setIsManualOpen(false)}
      />
    </>
  );
}
