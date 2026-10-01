"use client";

import Link from "next/link";
import BasaiLogo from "./BasaiLogo";
import RevealOnScroll from "./RevealOnScroll";

interface FooterSectionProps {
  lang?: "en" | "np";
}

export default function FooterSection({ lang = "en" }: FooterSectionProps) {
  return (
    <footer className="relative w-full bg-[#F7F2EB] text-[#221B18] pt-20 sm:pt-28 pb-40 sm:pb-44 px-4 sm:px-8 lg:px-14 border-t border-[#EAE1D5] select-none overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <RevealOnScroll direction="up">
          {/* TOP FOOTER ROW: BRAND HERO & NEWSLETTER / RESERVATIONS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 sm:gap-16 pb-16 sm:pb-20 border-b border-[#E5DACF]">
            {/* BRAND & PHILOSOPHY (COLS 1-5) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border border-[#D5C6BA] bg-white flex items-center justify-center shadow-xs">
                  <BasaiLogo className="w-5 h-5 text-[#221B18]" />
                </div>
                <div>
                  <span className="font-stedelijk uppercase text-2xl tracking-[0.2em] text-[#221B18] block leading-none">
                    BASAI
                  </span>
                  <span className="text-[10px] uppercase font-mono tracking-[0.25em] text-[#B26B4A] block mt-1 font-semibold">
                    BOUTIQUE HOSPITALITY
                  </span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-[#5C4F46] leading-relaxed max-w-md font-normal">
                Architectural sanctuaries rooted in the Himalayas. Curated heritage stays, organic highland cuisine, and slow living across Nepal.
              </p>

              <div className="pt-2 flex items-center gap-6 text-xs text-[#827165] font-medium">
                <span>Kathmandu</span>
                <span>·</span>
                <span>Pokhara</span>
                <span>·</span>
                <span>Mustang</span>
                <span>·</span>
                <span>Dharan</span>
              </div>
            </div>

            {/* QUICK NAVIGATION COLUMNS (COLS 6-12) */}
            <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
              {/* COL 1: SANCTUARIES */}
              <div className="space-y-4">
                <span className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#B26B4A] block font-semibold">
                  SANCTUARIES
                </span>
                <ul className="space-y-2.5 text-xs sm:text-sm text-[#4A3E36]">
                  <li>
                    <Link href="#sanctuaries" className="hover:text-[#B26B4A] transition-colors font-medium">
                      Dwarika's Heritage
                    </Link>
                  </li>
                  <li>
                    <Link href="#sanctuaries" className="hover:text-[#B26B4A] transition-colors font-medium">
                      The Pavilions Valley
                    </Link>
                  </li>
                  <li>
                    <Link href="#sanctuaries" className="hover:text-[#B26B4A] transition-colors font-medium">
                      Shinta Mani Mustang
                    </Link>
                  </li>
                  <li>
                    <Link href="/rooms" className="hover:text-[#B26B4A] transition-colors inline-flex items-center gap-1 font-semibold text-[#221B18]">
                      <span>View all suites</span>
                      <span>&rarr;</span>
                    </Link>
                  </li>
                </ul>
              </div>

              {/* COL 2: EXPERIENCES */}
              <div className="space-y-4">
                <span className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#B26B4A] block font-semibold">
                  EXPERIENCES
                </span>
                <ul className="space-y-2.5 text-xs sm:text-sm text-[#4A3E36]">
                  <li>
                    <Link href="#dining" className="hover:text-[#B26B4A] transition-colors font-medium">
                      Chuli Restaurant
                    </Link>
                  </li>
                  <li>
                    <Link href="#experiences" className="hover:text-[#B26B4A] transition-colors font-medium">
                      Curated Journeys
                    </Link>
                  </li>
                  <li>
                    <Link href="#faq" className="hover:text-[#B26B4A] transition-colors font-medium">
                      Guest Concierge
                    </Link>
                  </li>
                  <li>
                    <Link href="/compare" className="hover:text-[#B26B4A] transition-colors font-medium">
                      Compare Sanctuaries
                    </Link>
                  </li>
                </ul>
              </div>

              {/* COL 3: CONCIERGE & BOOKING */}
              <div className="space-y-4 col-span-2 sm:col-span-1">
                <span className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#B26B4A] block font-semibold">
                  DIRECT RESERVATIONS
                </span>
                <p className="text-xs text-[#63554B] leading-relaxed">
                  Best rates guaranteed when reserving directly through Basai.
                </p>
                <div className="pt-2">
                  <Link
                    href="/booking"
                    className="inline-block px-5 py-2.5 rounded-full bg-[#E8A88A] hover:bg-[#DE9977] text-[#2C231E] font-medium text-xs tracking-wide transition-all duration-300 shadow-sm border border-black/5 hover:scale-[1.02]"
                  >
                    Book a stay
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </RevealOnScroll>

        {/* BOTTOM LEGAL & COPYRIGHT ROW */}
        <div className="pt-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#7A6A5E]">
          <p>© {new Date().getFullYear()} BASAI HOSPITALITY GROUP. ALL RIGHTS RESERVED.</p>

          <div className="flex items-center gap-6 font-medium">
            <Link href="/guest-portal" className="hover:text-[#221B18] transition-colors">
              Guest Portal
            </Link>
            <Link href="/admin" className="hover:text-[#221B18] transition-colors">
              Portal Access
            </Link>
            <span>·</span>
            <span>Nepal & SAARC</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
