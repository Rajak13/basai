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
    { label: lang === "en" ? "Dining" : "भोजन", href: "#dining" },
    { label: lang === "en" ? "Sanctuaries" : "होटलहरू", href: "#sanctuaries" },
    { label: lang === "en" ? "FAQ" : "जिज्ञासा", href: "#faq" },
    { label: lang === "en" ? "Suites" : "कोठाहरू", href: "/rooms" },
  ];

  return (
    <div className="flex items-center gap-2 sm:gap-3 max-w-[96vw] sm:max-w-none select-none">
      {/* PEACH "BOOK ACCOMMODATION" QUICK ACTION */}
      {showBookCta && (
        <Link
          href="/booking"
          onClick={onBookClick}
          className="bg-[#E8A88A] hover:bg-[#DE9977] text-[#2C231E] font-medium text-xs sm:text-[13px] px-4 sm:px-5 py-2.5 sm:py-3 rounded-full shadow-xl border border-black/5 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer whitespace-nowrap shrink-0"
        >
          {lang === "en" ? "Book accommodation" : "कोठा बुक गर्नुहोस्"}
        </Link>
      )}

      {/* MAIN NAVIGATION PILL:
          On desktop: ALWAYS visible.
          On mobile: Visible when Book CTA is not active (to preserve full width without clipping).
          When Book CTA appears on mobile, full navigation is accessed cleanly via the Menu button. */}
      <nav
        aria-label="Bottom floating navigation"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        className={`${
          showBookCta ? "hidden md:flex" : "flex"
        } bg-white text-[#2C231E] rounded-full px-4 sm:px-7 py-2.5 sm:py-3 shadow-xl border border-black/5 items-center gap-3.5 sm:gap-7 text-xs sm:text-[13px] font-medium tracking-normal overflow-x-auto no-scrollbar [&::-webkit-scrollbar]:hidden whitespace-nowrap`}
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

      {/* HAMBURGER / FULL MENU BUTTON */}
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Open full site navigation menu"
        className="bg-white text-[#2C231E] rounded-full px-3.5 sm:px-0 w-auto sm:w-11 h-10 sm:h-11 flex items-center justify-center gap-2 shadow-xl border border-black/5 hover:bg-[#FAF7F2] active:scale-95 transition cursor-pointer shrink-0"
      >
        <div className="w-3.5 sm:w-4 h-3 flex flex-col justify-between">
          <span className="w-full h-[2px] bg-[#2C231E] rounded-full" />
          <span className="w-full h-[2px] bg-[#2C231E] rounded-full" />
          <span className="w-full h-[2px] bg-[#2C231E] rounded-full" />
        </div>
        <span className="text-xs font-medium md:hidden pr-0.5">Menu</span>
      </button>
    </div>
  );
}
