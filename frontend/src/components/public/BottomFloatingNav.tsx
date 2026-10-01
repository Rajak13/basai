"use client";

import Link from "next/link";

interface BottomFloatingNavProps {
  onOpenMenu: () => void;
  onSelectTab?: (tab: string) => void;
  showBookCta?: boolean;
  onBookClick?: () => void;
  lang?: "en" | "np";
}

export default function BottomFloatingNav({
  onOpenMenu,
  onSelectTab,
  showBookCta = false,
  onBookClick,
  lang = "en",
}: BottomFloatingNavProps) {
  const NAV_ITEMS = [
    { label: lang === "en" ? "Experiences" : "अनुभूति", href: "#experiences" },
    { label: lang === "en" ? "Chuli Dining" : "चूली रेस्टुरेन्ट", href: "#dining" },
    { label: lang === "en" ? "Top Sanctuaries" : "होटलहरू", href: "#sanctuaries" },
    { label: lang === "en" ? "FAQ" : "जिज्ञासा", href: "#faq" },
    { label: lang === "en" ? "All Suites" : "कोठाहरू", href: "/rooms" },
  ];

  return (
    <div className="flex items-center gap-2 sm:gap-3 max-w-[96vw] sm:max-w-none select-none">
      {/* PEACH "BOOK ACCOMMODATION" QUICK ACTION (MATCHING REFERENCE IN SECOND SECTION) */}
      {showBookCta && (
        <Link
          href="/booking"
          onClick={onBookClick}
          className="bg-[#E8A88A] hover:bg-[#DE9977] text-[#2C231E] font-medium text-xs sm:text-[13px] px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl shadow-xl border border-black/5 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer whitespace-nowrap shrink-0"
        >
          {lang === "en" ? "Book accommodation" : "कोठा बुक गर्नुहोस्"}
        </Link>
      )}

      {/* MAIN NAVIGATION PILL */}
      <nav
        aria-label="Bottom floating navigation"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        className="bg-white text-[#2C231E] rounded-xl sm:rounded-2xl px-3.5 sm:px-7 py-2.5 sm:py-3 shadow-xl border border-black/5 flex items-center gap-3 sm:gap-7 text-[11px] sm:text-[13px] font-medium tracking-normal overflow-x-auto no-scrollbar [&::-webkit-scrollbar]:hidden whitespace-nowrap"
      >
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => onSelectTab?.(item.label)}
            className="text-[#2C231E] hover:text-[#B26B4A] transition-colors py-0.5"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* HAMBURGER MENU BUTTON */}
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Open full site navigation menu"
        className="bg-white text-[#2C231E] rounded-xl sm:rounded-2xl w-10 sm:w-11 h-10 sm:h-11 flex items-center justify-center shadow-xl border border-black/5 hover:bg-[#FAF7F2] active:scale-95 transition cursor-pointer shrink-0"
      >
        <div className="w-3.5 sm:w-4 h-3 flex flex-col justify-between">
          <span className="w-full h-[2px] bg-[#2C231E] rounded-full" />
          <span className="w-full h-[2px] bg-[#2C231E] rounded-full" />
          <span className="w-full h-[2px] bg-[#2C231E] rounded-full" />
        </div>
      </button>
    </div>
  );
}
