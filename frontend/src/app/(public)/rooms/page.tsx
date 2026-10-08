"use client";

import { useState, useMemo, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import BasaiLogo from "@/components/public/BasaiLogo";
import FullScreenMenu from "@/components/public/FullScreenMenu";
import DualMonthCalendar from "@/components/public/DualMonthCalendar";
import MobileCalendarDrawer from "@/components/public/MobileCalendarDrawer";
import RolesManualModal from "@/components/public/RolesManualModal";
import { BASAI_SUITES, SuiteItem } from "@/data/suites";

const SANCTUARY_META: { [key: string]: { name: string; heroImg: string; region: string; quote: string } } = {
  all: {
    name: "All Basai Sanctuaries",
    heroImg: "/hero.png",
    region: "Across Nepal",
    quote: "Architectural sanctuaries rooted in Himalayan stillness and living heritage.",
  },
  kathmandu: {
    name: "Dwarika's Heritage Sanctuary",
    heroImg: "/kathmandu.png",
    region: "Kathmandu Valley · 1,400m",
    quote: "Living museum of 14th-century Newari woodwork, terracotta courtyards, and palace suites.",
  },
  pokhara: {
    name: "The Pavilions Mountain Sanctuary",
    heroImg: "/pokhara.png",
    region: "Pokhara Foothills · 820m",
    quote: "Floor-to-ceiling glass farm villas facing the snow crest of sacred Machapuchare.",
  },
  mustang: {
    name: "Shinta Mani High Sanctuary",
    heroImg: "/mustang.png",
    region: "Mustang Highlands · 2,800m",
    quote: "High-altitude Tibetan slate architecture, canyon hearths, and sacred ridge vistas.",
  },
  dharan: {
    name: "Basai Foothill & River Haven",
    heroImg: "/hero.png",
    region: "Bhedetar Ridge & Koshi Safari",
    quote: "Tea garden terraces, fireside dining at Chuli, and wilderness riverbank suites.",
  },
};

function RoomsPageContent() {
  const searchParams = useSearchParams();
  const [selectedSanctuary, setSelectedSanctuary] = useState<string>("all");
  const [selectedView, setSelectedView] = useState<string>("all");
  const [guestsCount, setGuestsCount] = useState<number>(2);
  const [currency, setCurrency] = useState<"NPR" | "USD">("NPR");
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc" | "space">("featured");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);

  // READ QUERY PARAMETERS (?sanctuary=mustang or ?hotel=mustang)
  useEffect(() => {
    const sanctuaryParam =
      searchParams.get("sanctuary") ||
      searchParams.get("hotel") ||
      searchParams.get("tenant");
    if (sanctuaryParam && SANCTUARY_META[sanctuaryParam.toLowerCase()]) {
      setSelectedSanctuary(sanctuaryParam.toLowerCase());
    }
    const checkInParam = searchParams.get("checkIn");
    if (checkInParam) setCheckIn(checkInParam);
    const checkOutParam = searchParams.get("checkOut");
    if (checkOutParam) setCheckOut(checkOutParam);
  }, [searchParams]);

  // CUSTOM CALENDAR STATE (MATCHING LANDING PAGE)
  const [checkIn, setCheckIn] = useState<string>("2026-09-30");
  const [checkOut, setCheckOut] = useState<string>("2026-10-01");
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
  const [calendarTarget, setCalendarTarget] = useState<"checkIn" | "checkOut">("checkIn");
  const calendarRef = useRef<HTMLDivElement>(null);

  // IMAGE CAROUSEL INDEX PER SUITE
  const [activeImageIndex, setActiveImageIndex] = useState<{ [suiteId: string]: number }>({});

  // COMPARISON LIST
  const [compareList, setCompareList] = useState<string[]>([]);

  // CLOSE CALENDAR ON OUTSIDE CLICK
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const targetNode = e.target as Node;
      if (calendarRef.current && !calendarRef.current.contains(targetNode)) {
        setIsCalendarOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const parseDate = (dateStr: string) => {
    const [yearStr, monthStr, dayStr] = dateStr.split("-");
    const date = new Date(parseInt(yearStr), parseInt(monthStr) - 1, parseInt(dayStr));
    const day = date.getDate();
    const month = date.toLocaleDateString("en-US", { month: "long" });
    const year = date.getFullYear();
    return { day, month, year };
  };

  const checkInParsed = parseDate(checkIn);
  const checkOutParsed = parseDate(checkOut);

  const toggleCompare = (suiteId: string) => {
    setCompareList((prev) =>
      prev.includes(suiteId)
        ? prev.filter((id) => id !== suiteId)
        : prev.length < 3
        ? [...prev, suiteId]
        : prev
    );
  };

  // FILTERED SUITES
  const filteredSuites = useMemo(() => {
    return BASAI_SUITES.filter((suite) => {
      if (selectedSanctuary !== "all" && suite.sanctuaryId !== selectedSanctuary) return false;
      if (suite.specs.maxGuests < guestsCount) return false;
      if (selectedView !== "all") {
        const viewLower = suite.specs.view.toLowerCase();
        if (selectedView === "mountain" && !viewLower.includes("mountain") && !viewLower.includes("machapuchare") && !viewLower.includes("peak")) return false;
        if (selectedView === "heritage" && !viewLower.includes("heritage") && !viewLower.includes("courtyard")) return false;
        if (selectedView === "ridge" && !viewLower.includes("ridge") && !viewLower.includes("tea")) return false;
        if (selectedView === "river" && !viewLower.includes("river") && !viewLower.includes("wetlands")) return false;
      }
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const matchesTitle = suite.title.toLowerCase().includes(q);
        const matchesSanctuary = suite.sanctuary.toLowerCase().includes(q);
        const matchesDesc = suite.description.toLowerCase().includes(q);
        const matchesAmenities = suite.amenities.some((a) => a.toLowerCase().includes(q));
        if (!matchesTitle && !matchesSanctuary && !matchesDesc && !matchesAmenities) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === "price-asc") return a.priceNpr - b.priceNpr;
      if (sortBy === "price-desc") return b.priceNpr - a.priceNpr;
      if (sortBy === "space") return b.specs.sqFt - a.specs.sqFt;
      return 0;
    });
  }, [selectedSanctuary, selectedView, guestsCount, searchQuery, sortBy]);

  const currentMeta = SANCTUARY_META[selectedSanctuary] || SANCTUARY_META.all;

  const formatPrice = (priceNpr: number, priceUsd: number) => {
    return currency === "USD" ? `$${priceUsd.toLocaleString()}` : `NPR ${priceNpr.toLocaleString()}`;
  };

  return (
    <div className="w-full min-h-screen bg-[#1E1B19] text-[#FAF1E8] select-none">
      {/* ========================================================
          1. IMMERSIVE MONUMENTAL HERO SECTION
          Replaces standard navbar with an atmospheric framed hero
          displaying the specific hotel imagery and custom calendar
          ======================================================== */}
      <section className="relative w-full min-h-[92vh] lg:min-h-[96vh] flex flex-col justify-between p-3 sm:p-6 lg:p-8 xl:px-12 xl:py-6 overflow-hidden">
        {/* INTEGRATED TRANSLUCENT TOP HEADER BAR */}
        <header className="w-full max-w-[1440px] mx-auto mb-3 sm:mb-6 px-2 sm:px-4 flex items-center justify-between z-30">
          {/* BASAI LOGO */}
          <Link
            href="/"
            className="flex items-center gap-2 group transition-transform hover:scale-105"
            aria-label="Return to Basai Home"
          >
            <BasaiLogo className="h-7 sm:h-9 w-auto text-[#E4AA8B]" />
          </Link>

          {/* BRAND TITLE */}
          <div className="flex items-center">
            <span className="text-[20px] sm:text-[24px] font-normal tracking-[0.24em] uppercase text-[#E4AA8B] font-stedelijk">
              BASAI
            </span>
          </div>

          {/* RIGHT NAVIGATION ACTIONS */}
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-xs sm:text-sm font-medium text-[#E4AA8B]/80 hover:text-[#E4AA8B] tracking-wider uppercase transition hidden sm:inline-block"
            >
              Overview
            </Link>

            {/* ROLES & SYSTEM MANUAL '?' TRIGGER BUTTON */}
            <button
              type="button"
              onClick={() => setIsManualOpen(true)}
              aria-label="Open System Manual & Roles Guide"
              title="Basai Operating Manual & Roles Guide"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-[#D4AF37]/50 hover:border-[#E4AA8B] bg-white/5 hover:bg-[#D4AF37]/15 text-[#D4AF37] hover:text-[#FAF1E8] flex items-center justify-center font-mono text-sm font-bold transition cursor-pointer shadow-xs"
            >
              ?
            </button>

            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              aria-label="Open navigation menu"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-white/20 hover:border-[#E4AA8B] text-[#FAF1E8] hover:text-[#E4AA8B] flex items-center justify-center transition cursor-pointer"
            >
              <div className="w-3.5 h-3 flex flex-col justify-between">
                <span className="w-full h-[1.5px] bg-current rounded-full" />
                <span className="w-full h-[1.5px] bg-current rounded-full" />
                <span className="w-full h-[1.5px] bg-current rounded-full" />
              </div>
            </button>
          </div>
        </header>

        {/* FRAMED HERO CONTAINER WITH DYNAMIC SANCTUARY IMAGE */}
        <div className="relative w-full max-w-[1440px] mx-auto flex-1 rounded-2xl sm:rounded-3xl shadow-2xl min-h-[640px] lg:min-h-[680px] flex flex-col justify-between overflow-hidden border border-white/10">
          {/* DYNAMIC BACKGROUND IMAGE (SWITCHES TO SELECTED HOTEL) */}
          <div className="absolute inset-0 z-0">
            <Image
              src={currentMeta.heroImg}
              alt={currentMeta.name}
              fill
              priority
              className="object-cover object-center scale-[1.01] transition-all duration-700 ease-out"
              sizes="(max-width: 1440px) 100vw, 1440px"
            />
            <div className="absolute inset-0 bg-black/45 sm:bg-black/35" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />
          </div>

          {/* HERO INNER CONTENT & BESPOKE CALENDAR WIDGET */}
          <div className="relative z-10 w-full h-full flex-1 flex flex-col lg:flex-row items-center justify-between p-5 sm:p-10 lg:p-12 xl:p-14 gap-8 pb-12">
            {/* LEFT COLUMN: EDITORIAL STATEMENT */}
            <div className="w-full lg:max-w-[50%] flex flex-col items-center lg:items-start text-center lg:text-left my-auto pt-4 sm:pt-6 lg:pt-0">
              <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/15 text-[11px] font-mono uppercase tracking-[0.22em] text-[#E4AA8B]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E4AA8B]" />
                <span>{currentMeta.region}</span>
              </div>

              <h1
                className="font-stedelijk uppercase text-3xl sm:text-5xl md:text-6xl lg:text-[62px] text-[#E4AA8B] leading-[1.05] drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]"
                style={{ textTransform: "uppercase" }}
              >
                FIND YOUR SANCTUARY ACROSS NEPAL
              </h1>

              <p className="mt-4 text-xs sm:text-sm text-white/85 max-w-lg leading-relaxed font-normal drop-shadow-md">
                {currentMeta.quote}
              </p>

              {/* QUICK HOTEL SWITCHER PILLS INSIDE HERO */}
              <div className="mt-6 flex flex-wrap gap-2 justify-center lg:justify-start">
                {[
                  { id: "all", label: "All Sanctuaries" },
                  { id: "kathmandu", label: "Kathmandu" },
                  { id: "pokhara", label: "Pokhara" },
                  { id: "mustang", label: "Mustang" },
                  { id: "dharan", label: "Eastern Ridge" },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedSanctuary(s.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wide transition cursor-pointer backdrop-blur-md ${
                      selectedSanctuary === s.id
                        ? "bg-[#E8A88A] text-[#2C231E] font-semibold shadow-md"
                        : "bg-black/40 border border-white/20 text-white/90 hover:bg-white/20"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* RIGHT COLUMN: OUR BESPOKE LUXURY CALENDAR BOOKING CARD */}
            <div ref={calendarRef} className="w-full lg:w-auto flex justify-center lg:justify-end my-auto z-20">
              <div className="relative bg-[#FAF1E8] text-[#2C231E] rounded-2xl p-5 sm:p-6 shadow-2xl w-full max-w-[340px] sm:max-w-[360px] border border-[#EBDCD0]/80 backdrop-blur-xs select-none">
                {/* PROPERTY SELECTOR */}
                <div className="mb-4">
                  <span className="block text-[11px] font-mono text-[#695C53] uppercase mb-1">
                    Destination Sanctuary
                  </span>
                  <select
                    value={selectedSanctuary}
                    onChange={(e) => setSelectedSanctuary(e.target.value)}
                    className="w-full bg-white rounded-lg border border-[#E5DACF] px-4 py-3 text-xs sm:text-[13px] font-medium text-[#2C231E] outline-none cursor-pointer hover:border-[#DE9977] transition shadow-2xs"
                  >
                    <option value="all">All Basai Properties (Nepal)</option>
                    <option value="kathmandu">Dwarika's Heritage (Kathmandu)</option>
                    <option value="pokhara">The Pavilions (Pokhara Foothills)</option>
                    <option value="mustang">Shinta Mani (Mustang Highlands)</option>
                    <option value="dharan">Basai Haven (Bhedetar & Koshi)</option>
                  </select>
                </div>

                {/* CUSTOM DATES WITH BESPOKE CALENDAR MODAL */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {/* CHECK-IN CARD */}
                  <div>
                    <span className="block text-[11px] font-mono text-[#695C53] uppercase mb-1">
                      Check-in
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setCalendarTarget("checkIn");
                        setIsCalendarOpen(true);
                      }}
                      className={`w-full relative rounded-lg border py-3 px-2 flex flex-col items-center justify-center text-center cursor-pointer transition shadow-2xs group min-h-[96px] ${
                        isCalendarOpen && calendarTarget === "checkIn"
                          ? "bg-[#F0D5C7] border-[#DE9977] ring-1 ring-[#DE9977]"
                          : "bg-white border-[#E5DACF] hover:border-[#DE9977]"
                      }`}
                    >
                      <span className="text-3xl sm:text-4xl font-semibold text-[#2C231E] tracking-tight leading-none">
                        {checkInParsed.day}.
                      </span>
                      <span className="text-[11px] text-[#52463E] mt-1 leading-tight font-medium">
                        {checkInParsed.month}
                      </span>
                      <span className="text-[11px] text-[#52463E] leading-tight font-medium">
                        {checkInParsed.year}
                      </span>
                      <span className="text-[8px] text-[#2C231E] mt-1 group-hover:translate-y-0.5 transition-transform">
                        ▼
                      </span>
                    </button>
                  </div>

                  {/* CHECK-OUT CARD */}
                  <div>
                    <span className="block text-[11px] font-mono text-[#695C53] uppercase mb-1">
                      Check-out
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setCalendarTarget("checkOut");
                        setIsCalendarOpen(true);
                      }}
                      className={`w-full relative rounded-lg border py-3 px-2 flex flex-col items-center justify-center text-center cursor-pointer transition shadow-2xs group min-h-[96px] ${
                        isCalendarOpen && calendarTarget === "checkOut"
                          ? "bg-[#F0D5C7] border-[#DE9977] ring-1 ring-[#DE9977]"
                          : "bg-white border-[#E5DACF] hover:border-[#DE9977]"
                      }`}
                    >
                      <span className="text-3xl sm:text-4xl font-semibold text-[#2C231E] tracking-tight leading-none">
                        {checkOutParsed.day}.
                      </span>
                      <span className="text-[11px] text-[#52463E] mt-1 leading-tight font-medium">
                        {checkOutParsed.month}
                      </span>
                      <span className="text-[11px] text-[#52463E] leading-tight font-medium">
                        {checkOutParsed.year}
                      </span>
                      <span className="text-[8px] text-[#2C231E] mt-1 group-hover:translate-y-0.5 transition-transform">
                        ▼
                      </span>
                    </button>
                  </div>
                </div>

                {/* GUESTS PER ROOM */}
                <div className="flex items-center justify-between mb-4 pt-1">
                  <span className="text-[12px] font-mono text-[#695C53] uppercase">
                    Guests per room
                  </span>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setGuestsCount(Math.max(1, guestsCount - 1))}
                      className="w-7 h-7 rounded-full border border-[#D5C6BA] flex items-center justify-center text-[#2C231E] text-base hover:bg-[#EFE4DA] active:scale-95 transition cursor-pointer select-none"
                    >
                      −
                    </button>
                    <span className="text-[14px] font-semibold text-[#2C231E] min-w-[18px] text-center">
                      {guestsCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => setGuestsCount(Math.min(4, guestsCount + 1))}
                      className="w-7 h-7 rounded-full border border-[#D5C6BA] flex items-center justify-center text-[#2C231E] text-base hover:bg-[#EFE4DA] active:scale-95 transition cursor-pointer select-none"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* SMOOTH SCROLL TO SUITES CTA */}
                <a
                  href="#suites-catalogue"
                  className="w-full bg-[#E8A88A] hover:bg-[#DE9977] active:bg-[#D58C6B] text-[#2C231E] font-medium text-xs sm:text-[13px] py-3.5 px-4 rounded-lg flex items-center justify-center gap-2 shadow-2xs hover:shadow transition-all duration-200 cursor-pointer text-center block"
                >
                  <span>Explore Available Suites ({filteredSuites.length})</span>
                  <span className="text-xs">↓</span>
                </a>

                {/* ========================================================
                    DESKTOP DUAL-MONTH CALENDAR POPOVER
                    ======================================================== */}
                {isCalendarOpen && (
                  <div className="hidden md:block absolute bottom-0 right-[105%] z-50 animate-in fade-in zoom-in-95 duration-200">
                    <DualMonthCalendar
                      checkIn={checkIn}
                      checkOut={checkOut}
                      activeSelection={calendarTarget}
                      onSelectCheckIn={(date) => {
                        setCheckIn(date);
                        setCalendarTarget("checkOut");
                      }}
                      onSelectCheckOut={(date) => {
                        setCheckOut(date);
                        setIsCalendarOpen(false);
                      }}
                      onClose={() => setIsCalendarOpen(false)}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          MOBILE CALENDAR DRAWER (BOTTOM SHEET)
          ======================================================== */}
      {isCalendarOpen && (
        <div className="md:hidden">
          <MobileCalendarDrawer
            checkIn={checkIn}
            checkOut={checkOut}
            activeSelection={calendarTarget}
            onSelectCheckIn={(date) => {
              setCheckIn(date);
              setCalendarTarget("checkOut");
            }}
            onSelectCheckOut={(date) => {
              setCheckOut(date);
              setIsCalendarOpen(false);
            }}
            onClose={() => setIsCalendarOpen(false)}
          />
        </div>
      )}

      {/* ========================================================
          2. SUITE CATALOGUE CANVAS (WARM IVORY BACKGROUND)
          ======================================================== */}
      <div id="suites-catalogue" className="w-full bg-[#F7F2EB] text-[#221B18] pt-12 pb-24">
        {/* REFINED FILTER CONTROLS BAR */}
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-14 mb-10">
          <div className="bg-white rounded-2xl border border-[#E5DACF] p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            {/* LEFT: HORIZON & SORT FILTERS */}
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto text-xs">
              <span className="font-mono text-[11px] text-[#827165] uppercase">
                Horizon:
              </span>
              <select
                value={selectedView}
                onChange={(e) => setSelectedView(e.target.value)}
                className="bg-[#FAF7F2] border border-[#D5C6BA] rounded-lg px-3 py-1.5 text-xs font-medium text-[#221B18] outline-none"
              >
                <option value="all">All Horizons</option>
                <option value="mountain">Mountain Panorama</option>
                <option value="heritage">Heritage Courtyard</option>
                <option value="ridge">Tea Garden Ridge</option>
                <option value="river">Riverside Safari</option>
              </select>

              <span className="font-mono text-[11px] text-[#827165] uppercase ml-2">
                Sort:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-[#FAF7F2] border border-[#D5C6BA] rounded-lg px-3 py-1.5 text-xs font-medium text-[#221B18] outline-none"
              >
                <option value="featured">Featured Curations</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="space">Largest Suite Space</option>
              </select>
            </div>

            {/* RIGHT: SEARCH & CURRENCY TOGGLE */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
              <input
                type="text"
                placeholder="Search amenities (fireplace, tub)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#FAF7F2] border border-[#D5C6BA] rounded-lg px-3 py-1.5 text-xs text-[#221B18] placeholder-[#9C8B7E] outline-none w-48 sm:w-60"
              />

              <div className="inline-flex items-center p-0.5 bg-[#FAF7F2] rounded-full border border-[#D5C6BA] text-xs">
                <button
                  type="button"
                  onClick={() => setCurrency("NPR")}
                  className={`px-2.5 py-1 rounded-full font-medium transition ${
                    currency === "NPR"
                      ? "bg-[#221B18] text-white shadow-xs"
                      : "text-[#5C4F46] hover:text-[#221B18]"
                  }`}
                >
                  NPR
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency("USD")}
                  className={`px-2.5 py-1 rounded-full font-medium transition ${
                    currency === "USD"
                      ? "bg-[#221B18] text-white shadow-xs"
                      : "text-[#5C4F46] hover:text-[#221B18]"
                  }`}
                >
                  USD
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SUITE CARDS LIST */}
        <main className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-14">
          {filteredSuites.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-[#E5DACF] p-8 max-w-md mx-auto">
              <span className="text-3xl mb-3 block">🏔️</span>
              <h3 className="font-stedelijk uppercase text-xl text-[#221B18] mb-1">
                NO SUITES MATCH SELECTED CRITERIA
              </h3>
              <p className="text-xs text-[#695C53] mb-4">
                Try selecting "All Sanctuaries" or resetting your search.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedSanctuary("all");
                  setSelectedView("all");
                  setSearchQuery("");
                }}
                className="bg-[#221B18] text-white px-5 py-2 rounded-full text-xs font-medium"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="space-y-12 sm:space-y-16">
              {filteredSuites.map((suite) => {
                const currentImgIdx = activeImageIndex[suite.id] || 0;
                const isCompared = compareList.includes(suite.id);

                return (
                  <article
                    key={suite.id}
                    className="group bg-white rounded-2xl sm:rounded-3xl border border-[#E5DACF] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col lg:flex-row"
                  >
                    {/* PHOTO SHOWCASE */}
                    <div className="w-full lg:w-[48%] relative flex flex-col bg-[#1A1816] shrink-0">
                      <div className="relative aspect-[16/11] sm:aspect-[16/10] lg:aspect-auto lg:h-full w-full overflow-hidden min-h-[300px]">
                        <Image
                          src={suite.images[currentImgIdx] || suite.images[0]}
                          alt={suite.title}
                          fill
                          className="object-cover object-center group-hover:scale-102 transition-transform duration-700"
                          sizes="(max-width: 1024px) 100vw, 50vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

                        {/* BADGES */}
                        <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                          {suite.badge && (
                            <span className="text-[10px] font-mono tracking-widest uppercase bg-[#E8A88A] text-[#2C231E] font-semibold px-3 py-1 rounded-full shadow-xs">
                              {suite.badge}
                            </span>
                          )}
                          <span className="text-[10px] font-mono tracking-wider uppercase bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full border border-white/20">
                            {suite.location}
                          </span>
                        </div>

                        {/* REMAINING SUITES */}
                        <div className="absolute bottom-4 left-4 z-10">
                          <span className="text-[11px] font-medium bg-black/70 backdrop-blur-md text-white/90 px-3 py-1 rounded-full border border-white/10 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#E8A88A] animate-pulse" />
                            Only {suite.remainingSuites} suites left
                          </span>
                        </div>

                        {/* CAROUSEL DOTS */}
                        {suite.images.length > 1 && (
                          <div className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20">
                            {suite.images.map((_, dotIdx) => (
                              <button
                                key={dotIdx}
                                type="button"
                                onClick={() =>
                                  setActiveImageIndex((prev) => ({
                                    ...prev,
                                    [suite.id]: dotIdx,
                                  }))
                                }
                                className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                                  currentImgIdx === dotIdx
                                    ? "bg-white scale-125"
                                    : "bg-white/40 hover:bg-white/80"
                                }`}
                                aria-label={`View photo ${dotIdx + 1}`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* SUITE CONTENT */}
                    <div className="w-full lg:w-[52%] p-6 sm:p-9 lg:p-10 flex flex-col justify-between">
                      <div>
                        {/* SANCTUARY HEADER & RATING */}
                        <div className="flex items-center justify-between gap-4 mb-2">
                          <span className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#B26B4A] font-semibold">
                            {suite.sanctuary}
                          </span>
                          <div className="flex items-center gap-1 text-xs text-[#221B18] font-medium">
                            <span className="text-amber-500">★</span>
                            <span>{suite.rating}</span>
                            <span className="text-[#827165] font-normal">
                              ({suite.reviewsCount})
                            </span>
                          </div>
                        </div>

                        {/* SUITE TITLE */}
                        <h2
                          className="font-stedelijk uppercase text-2xl sm:text-3xl lg:text-[34px] text-[#221B18] leading-[1.08] tracking-wide"
                          style={{ textTransform: "uppercase" }}
                        >
                          {suite.title}
                        </h2>

                        <p className="mt-1.5 text-xs sm:text-[13px] text-[#827165] font-medium italic">
                          "{suite.tagline}"
                        </p>

                        {/* ARCHITECTURAL SPECS */}
                        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-3 border-y border-[#EAE1D5] text-xs">
                          <div>
                            <span className="text-[10px] uppercase font-mono text-[#827165] block">
                              Area
                            </span>
                            <span className="font-semibold text-[#221B18]">
                              {suite.specs.sqFt} sq.ft ({suite.specs.sqM} m²)
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-mono text-[#827165] block">
                              Bed
                            </span>
                            <span className="font-semibold text-[#221B18]">
                              {suite.specs.bed}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-mono text-[#827165] block">
                              Occupancy
                            </span>
                            <span className="font-semibold text-[#221B18]">
                              Max {suite.specs.maxGuests} Guests
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-mono text-[#827165] block">
                              Horizon
                            </span>
                            <span className="font-semibold text-[#221B18] truncate block">
                              {suite.specs.view}
                            </span>
                          </div>
                        </div>

                        <p className="mt-4 text-xs sm:text-sm text-[#4A3E36] leading-relaxed font-normal">
                          {suite.description}
                        </p>

                        {/* HIGHLIGHTS */}
                        <ul className="mt-4 space-y-1.5 text-xs text-[#5C4F46]">
                          {suite.highlights.map((item, hIdx) => (
                            <li key={hIdx} className="flex items-start gap-2">
                              <span className="text-[#B26B4A] mt-0.5">✦</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>

                        {/* AMENITIES */}
                        <div className="mt-5 flex flex-wrap gap-1.5 font-times">
                          {suite.amenities.slice(0, 5).map((amenity, aIdx) => (
                            <span
                              key={aIdx}
                              className="text-xs bg-[#F7F2EB] text-[#4A3E36] px-2.5 py-1 rounded-md border border-[#E5DACF] font-normal"
                            >
                              {amenity}
                            </span>
                          ))}
                          {suite.amenities.length > 5 && (
                            <span className="text-[11px] text-[#827165] px-2 py-1 font-mono">
                              +{suite.amenities.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>

                      {/* PRICING & ACTIONS */}
                      <div className="mt-8 pt-6 border-t border-[#EAE1D5] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-baseline gap-2">
                            <span className="font-stedelijk uppercase text-2xl sm:text-3xl text-[#221B18] font-normal tracking-wide">
                              {formatPrice(suite.priceNpr, suite.priceUsd)}
                            </span>
                            <span className="text-xs text-[#827165] font-normal">
                              / night
                            </span>
                          </div>
                          <span className="text-[11px] text-[#2E7D32] font-medium block mt-0.5">
                            ✓ Includes organic breakfast & taxes · Free cancel up to 48h
                          </span>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => toggleCompare(suite.id)}
                            className={`px-3.5 py-2.5 rounded-full text-xs font-medium border transition cursor-pointer ${
                              isCompared
                                ? "bg-[#221B18] text-white border-[#221B18]"
                                : "bg-white text-[#4A3E36] border-[#D5C6BA] hover:border-[#B26B4A]"
                            }`}
                          >
                            {isCompared ? "✓ Added" : "+ Compare"}
                          </button>

                          <Link
                            href={`/rooms/${suite.slug}`}
                            className="px-4 py-2.5 rounded-full border border-[#D5C6BA] text-[#221B18] text-xs font-medium hover:bg-[#FAF1E8] transition"
                          >
                            Suite Specs
                          </Link>

                          <Link
                            href={`/booking?room=${suite.slug}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guestsCount}`}
                            className="bg-[#E8A88A] hover:bg-[#DE9977] active:bg-[#D58C6B] text-[#2C231E] px-5 sm:px-6 py-2.5 rounded-full text-xs sm:text-[13px] font-medium tracking-wide shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-1.5"
                          >
                            <span>Select Suite</span>
                            <span>→</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* ========================================================
          3. MINIMAL QUIET ARCHITECTURAL FOOTER NOTE
          Replaces the heavy footer with a serene, whisper-quiet credit
          ======================================================== */}
      <footer className="w-full bg-[#1A1816] py-10 px-4 text-center border-t border-white/10 select-none">
        <div className="flex items-center justify-center gap-3 mb-2">
          <BasaiLogo className="h-5 w-auto text-[#E4AA8B]" />
          <span className="font-stedelijk uppercase text-sm tracking-[0.22em] text-[#E4AA8B]">
            BASAI
          </span>
        </div>
        <p className="text-[11px] font-mono uppercase tracking-widest text-[#827165]">
          ARCHITECTURAL RESIDENCES · KATHMANDU · POKHARA · MUSTANG · EASTERN RIDGE · © 2026
        </p>
      </footer>

      {/* FLOATING COMPARISON TRAY */}
      {compareList.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#1E1B19] text-[#FAF1E8] px-5 py-3 rounded-full shadow-2xl border border-white/20 flex items-center gap-4 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#E8A88A] animate-pulse" />
            <span className="text-xs font-medium">
              {compareList.length} suite{compareList.length > 1 ? "s" : ""} selected to compare
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/compare?rooms=${compareList.join(",")}`}
              className="bg-[#E8A88A] hover:bg-[#DE9977] text-[#2C231E] px-4 py-1.5 rounded-full text-xs font-medium transition"
            >
              Compare Now →
            </Link>
            <button
              type="button"
              onClick={() => setCompareList([])}
              className="text-white/60 hover:text-white text-xs"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* REUSABLE FULL SCREEN MENU OVERLAY */}
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
    </div>
  );
}

export default function RoomsPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-screen bg-[#1E1B19] flex items-center justify-center">
          <span className="font-mono text-xs uppercase tracking-widest text-[#E4AA8B] animate-pulse">
            Loading Basai Sanctuaries...
          </span>
        </div>
      }
    >
      <RoomsPageContent />
    </Suspense>
  );
}
