"use client";

import Link from "next/link";
import { useEffect } from "react";
import BasaiLogo from "./BasaiLogo";

interface FullScreenMenuProps {
  isOpen: boolean;
  onClose: () => void;
  activeBrand?: string;
  lang?: "en" | "np";
}

export default function FullScreenMenu({
  isOpen,
  onClose,
  activeBrand = "Basai",
  lang = "en",
}: FullScreenMenuProps) {
  // Prevent background scrolling when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Basai navigation menu"
      className="fixed inset-0 z-50 bg-[#161413] text-[#FAF1E8] overflow-y-auto animate-in fade-in duration-300 select-none flex flex-col justify-between"
    >
      {/* AMBIENT BACKGROUND GLOW */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,rgba(228,170,139,0.08),transparent_50%)]" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_bottom_right,rgba(18,84,79,0.12),transparent_60%)]" />

      {/* TOP HEADER: BASAI LOGO + CLOSE BUTTON */}
      <div className="relative z-10 w-full max-w-[1440px] mx-auto px-6 sm:px-12 lg:px-16 pt-8 sm:pt-10 flex items-center justify-between">
        {/* BASAI LOGO */}
        <Link
          href="/"
          onClick={onClose}
          className="flex items-center gap-3 text-[#E4AA8B] hover:text-white transition group"
        >
          <BasaiLogo className="h-8 w-auto text-[#E4AA8B]" />
          <span className="font-stedelijk text-xl tracking-[0.2em] uppercase text-[#E4AA8B]">
            {activeBrand}
          </span>
        </Link>

        {/* CLOSE BUTTON */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-white/20 hover:border-[#E4AA8B] text-white hover:text-[#E4AA8B] hover:bg-white/5 active:scale-95 flex items-center justify-center transition cursor-pointer text-lg font-light"
        >
          ✕
        </button>
      </div>

      {/* MAIN 3-COLUMN CONTENT */}
      <div className="relative z-10 w-full max-w-[1440px] mx-auto px-6 sm:px-12 lg:px-16 py-10 sm:py-16 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* COLUMN 1: MAJOR HEADLINE LINKS (ARCHITYPE STEDELIJK) */}
          <div className="lg:col-span-5 flex flex-col gap-4 sm:gap-6">
            <Link
              href="/rooms"
              onClick={onClose}
              className="font-stedelijk uppercase text-3xl sm:text-4xl lg:text-[44px] xl:text-[50px] text-[#FAF1E8] hover:text-[#E4AA8B] transition-colors leading-[1.15] tracking-wide inline-block"
              style={{ textTransform: "uppercase" }}
            >
              Our Hotels
            </Link>
            <Link
              href="#dining"
              onClick={onClose}
              className="font-stedelijk uppercase text-3xl sm:text-4xl lg:text-[44px] xl:text-[50px] text-[#FAF1E8] hover:text-[#E4AA8B] transition-colors leading-[1.15] tracking-wide inline-block"
              style={{ textTransform: "uppercase" }}
            >
              Food and Drink
            </Link>
            <Link
              href="#sanctuaries"
              onClick={onClose}
              className="font-stedelijk uppercase text-3xl sm:text-4xl lg:text-[44px] xl:text-[50px] text-[#FAF1E8] hover:text-[#E4AA8B] transition-colors leading-[1.15] tracking-wide inline-block"
              style={{ textTransform: "uppercase" }}
            >
              Top Sanctuaries
            </Link>
            <Link
              href="#experiences"
              onClick={onClose}
              className="font-stedelijk uppercase text-3xl sm:text-4xl lg:text-[44px] xl:text-[50px] text-[#FAF1E8] hover:text-[#E4AA8B] transition-colors leading-[1.15] tracking-wide inline-block"
              style={{ textTransform: "uppercase" }}
            >
              Curated Chapters
            </Link>
            <Link
              href="#faq"
              onClick={onClose}
              className="font-stedelijk uppercase text-3xl sm:text-4xl lg:text-[44px] xl:text-[50px] text-[#FAF1E8] hover:text-[#E4AA8B] transition-colors leading-[1.15] tracking-wide inline-block"
              style={{ textTransform: "uppercase" }}
            >
              FAQ & Inquiries
            </Link>
          </div>

          {/* COLUMN 2: SECONDARY MAJOR HEADLINE LINKS (ARCHITYPE STEDELIJK) */}
          <div className="lg:col-span-4 flex flex-col gap-4 sm:gap-6">
            <Link
              href="/rooms?filter=offers"
              onClick={onClose}
              className="font-stedelijk uppercase text-3xl sm:text-4xl lg:text-[44px] xl:text-[50px] text-[#FAF1E8] hover:text-[#E4AA8B] transition-colors leading-[1.15] tracking-wide inline-block"
              style={{ textTransform: "uppercase" }}
            >
              Offers
            </Link>
            <Link
              href="/booking"
              onClick={onClose}
              className="font-stedelijk uppercase text-3xl sm:text-4xl lg:text-[44px] xl:text-[50px] text-[#FAF1E8] hover:text-[#E4AA8B] transition-colors leading-[1.15] tracking-wide inline-block"
              style={{ textTransform: "uppercase" }}
            >
              Direct Booking
            </Link>
            <Link
              href="/compare"
              onClick={onClose}
              className="font-stedelijk uppercase text-3xl sm:text-4xl lg:text-[44px] xl:text-[50px] text-[#FAF1E8] hover:text-[#E4AA8B] transition-colors leading-[1.15] tracking-wide inline-block"
              style={{ textTransform: "uppercase" }}
            >
              Compare Sanctuaries
            </Link>
            <Link
              href="#experiences"
              onClick={onClose}
              className="font-stedelijk uppercase text-3xl sm:text-4xl lg:text-[44px] xl:text-[50px] text-[#FAF1E8] hover:text-[#E4AA8B] transition-colors leading-[1.15] tracking-wide inline-block"
              style={{ textTransform: "uppercase" }}
            >
              Experiences
            </Link>
          </div>

          {/* COLUMN 3: UNIQUE BASAI PLATFORM, GUEST PORTAL & PROPERTY PORTFOLIO */}
          <div className="lg:col-span-3 flex flex-col justify-between h-full pt-2 lg:pt-0">
            {/* PLATFORM & SERVICES */}
            <div className="flex flex-col gap-2.5 sm:gap-3 text-sm sm:text-[15px]">
              <Link
                href="/guest-portal"
                onClick={onClose}
                className="text-[#FAF1E8] hover:text-[#E4AA8B] font-medium transition flex items-center justify-between"
              >
                <span>Basai Guest Portal</span>
                <span className="text-[10px] uppercase tracking-wider bg-[#E4AA8B]/20 text-[#E4AA8B] px-2 py-0.5 rounded-full">
                  Cross-Tenant
                </span>
              </Link>
              <Link
                href="/compare"
                onClick={onClose}
                className="text-[#FAF1E8] hover:text-[#E4AA8B] font-medium transition"
              >
                Compare Room Tiers
              </Link>
              <Link
                href="/admin"
                onClick={onClose}
                className="text-[#FAF1E8] hover:text-[#E4AA8B] font-medium transition flex items-center justify-between"
              >
                <span>Basai SaaS Admin</span>
                <span className="text-[10px] uppercase tracking-wider bg-white/10 text-white/80 px-2 py-0.5 rounded-full">
                  Platform
                </span>
              </Link>
              <Link
                href="#careers"
                onClick={onClose}
                className="text-[#A6978A] hover:text-[#FAF1E8] transition"
              >
                Work at Basai Hospitality
              </Link>
              <Link
                href="#gift-cards"
                onClick={onClose}
                className="text-[#A6978A] hover:text-[#FAF1E8] transition"
              >
                Gift Cards & Stays
              </Link>
              <Link
                href="#sustainability"
                onClick={onClose}
                className="text-[#A6978A] hover:text-[#FAF1E8] transition"
              >
                Sustainability & Heritage
              </Link>
              <Link
                href="#privacy"
                onClick={onClose}
                className="text-[#A6978A] hover:text-[#FAF1E8] transition"
              >
                Privacy Policy
              </Link>
              <Link
                href="#terms"
                onClick={onClose}
                className="text-[#A6978A] hover:text-[#FAF1E8] transition"
              >
                Terms and Conditions
              </Link>
            </div>

            {/* BASAI HOTEL PROPERTIES PORTFOLIO */}
            <div className="mt-8 pt-6 border-t border-white/10 flex flex-col gap-2">
              <span className="text-[11px] uppercase tracking-[0.2em] text-[#E4AA8B] font-medium">
                Basai Properties
              </span>
              <Link
                href="/rooms?hotel=basai-boutique"
                onClick={onClose}
                className="text-xs sm:text-[13px] text-[#A6978A] hover:text-[#E4AA8B] transition"
              >
                Basai Boutique (Dharan)
              </Link>
              <Link
                href="/rooms?hotel=basai-foothills"
                onClick={onClose}
                className="text-xs sm:text-[13px] text-[#A6978A] hover:text-[#E4AA8B] transition"
              >
                Basai Foothills Retreat (Bhedetar)
              </Link>
              <Link
                href="/rooms?hotel=basai-mountain"
                onClick={onClose}
                className="text-xs sm:text-[13px] text-[#A6978A] hover:text-[#E4AA8B] transition"
              >
                Basai Mountain Lodge (Namje)
              </Link>
              <Link
                href="/rooms?hotel=basai-riverside"
                onClick={onClose}
                className="text-xs sm:text-[13px] text-[#A6978A] hover:text-[#E4AA8B] transition"
              >
                Basai Riverside Sanctuary (Koshi)
              </Link>
            </div>
          </div>

        </div>
      </div>

      {/* BOTTOM FOOTER SECTION (4 COLUMNS) */}
      <div className="relative z-10 w-full max-w-[1440px] mx-auto px-6 sm:px-12 lg:px-16 pb-8 sm:pb-12 pt-6 border-t border-white/10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 text-xs text-[#A6978A]">
          {/* COL 1: GENERAL INQUIRIES */}
          <div>
            <span className="block text-[11px] uppercase tracking-wider text-[#FAF1E8] font-medium mb-1.5">
              General inquiries
            </span>
            <a
              href="mailto:info@basai.com"
              className="text-[#FAF1E8]/90 hover:text-[#E4AA8B] transition"
            >
              info@basai.com
            </a>
            <span className="block text-[11px] text-[#8C7A6E] mt-0.5">
              Basai Multi-Tenant Network
            </span>
          </div>

          {/* COL 2: CONTACT BOOKING */}
          <div>
            <span className="block text-[11px] uppercase tracking-wider text-[#FAF1E8] font-medium mb-1.5">
              Contact booking
            </span>
            <a
              href="mailto:booking@basai.com"
              className="text-[#FAF1E8]/90 hover:text-[#E4AA8B] transition block"
            >
              booking@basai.com
            </a>
            <a
              href="tel:+97725520000"
              className="text-[#FAF1E8]/90 hover:text-[#E4AA8B] transition block mt-0.5"
            >
              +977 25 520 000
            </a>
          </div>

          {/* COL 3: CONTACT SALES & SAAS */}
          <div>
            <span className="block text-[11px] uppercase tracking-wider text-[#FAF1E8] font-medium mb-1.5">
              Contact sales & onboarding
            </span>
            <a
              href="tel:+97725520111"
              className="text-[#FAF1E8]/90 hover:text-[#E4AA8B] transition block"
            >
              +977 25 520 111
            </a>
            <a
              href="mailto:sales@basai.com"
              className="text-[#FAF1E8]/90 hover:text-[#E4AA8B] transition block mt-0.5"
            >
              sales@basai.com
            </a>
          </div>

          {/* COL 4: FOLLOW US & LOCALIZATION */}
          <div>
            <span className="block text-[11px] uppercase tracking-wider text-[#FAF1E8] font-medium mb-1.5">
              Follow us
            </span>
            <div className="flex items-center gap-3 text-[#FAF1E8]/90">
              <a href="#linkedin" className="hover:text-[#E4AA8B] transition">
                LinkedIn
              </a>
              <span>•</span>
              <a href="#instagram" className="hover:text-[#E4AA8B] transition">
                Instagram
              </a>
              <span>•</span>
              <a href="#facebook" className="hover:text-[#E4AA8B] transition">
                Facebook
              </a>
            </div>
            <div className="mt-2 text-[10px] text-[#8C7A6E]">
              Nepal: NPR (Rs) • India: INR (₹) • Global: USD ($)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
