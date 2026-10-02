"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import BasaiLogo from "@/components/public/BasaiLogo";
import FullScreenMenu from "@/components/public/FullScreenMenu";
import DualMonthCalendar from "@/components/public/DualMonthCalendar";
import MobileCalendarDrawer from "@/components/public/MobileCalendarDrawer";
import { BASAI_SUITES, SuiteItem } from "@/data/suites";

interface SuiteDetailViewProps {
  slug: string;
}

export default function SuiteDetailView({ slug }: SuiteDetailViewProps) {
  // FIND CURRENT SUITE OR FALLBACK
  const suite = useMemo(() => {
    return BASAI_SUITES.find((s) => s.slug === slug) || BASAI_SUITES[0];
  }, [slug]);

  // COMPANION SUITES (EXCLUDE CURRENT)
  const companionSuites = useMemo(() => {
    return BASAI_SUITES.filter((s) => s.id !== suite.id).slice(0, 2);
  }, [suite.id]);

  // UI STATE
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [currency, setCurrency] = useState<"NPR" | "USD">("NPR");
  const [activeFloorplanZone, setActiveFloorplanZone] = useState<number>(0);

  // CUSTOM CALENDAR STATE
  const [checkIn, setCheckIn] = useState<string>("2026-09-30");
  const [checkOut, setCheckOut] = useState<string>("2026-10-01");
  const [guests, setGuests] = useState<number>(2);
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
  const [calendarTarget, setCalendarTarget] = useState<"checkIn" | "checkOut">("checkIn");
  const calendarRef = useRef<HTMLDivElement>(null);

  // CLOSE CALENDAR ON CLICK OUTSIDE
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

  // DATE PARSER
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

  // NIGHTS CALCULATION
  const nights = useMemo(() => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return isNaN(diffDays) || diffDays <= 0 ? 1 : diffDays;
  }, [checkIn, checkOut]);

  // PRICING CALCULATION
  const totalPriceNpr = suite.priceNpr * nights;
  const totalPriceUsd = suite.priceUsd * nights;

  const formatPrice = (npr: number, usd: number) => {
    return currency === "USD" ? `$${usd.toLocaleString()}` : `NPR ${npr.toLocaleString()}`;
  };

  // FLOORPLAN ZONES
  const floorplanZones = [
    {
      title: "Master Sleeping Chamber",
      dimensions: "340 sq.ft",
      details: `${suite.specs.bed} draped in organic hand-spun cotton, hand-hewn Sal timber beams, and acoustic stone insulation.`,
    },
    {
      title: "Private Outlook Terrace",
      dimensions: "180 sq.ft",
      details: `Expansive open-air balcony framing ${suite.specs.view} with traditional carved railings and cushioned daybeds.`,
    },
    {
      title: "Signature Bath En-Suite",
      dimensions: "120 sq.ft",
      details: "Freestanding beaten-copper or slate soaking tub, dual rainwater showers, and heated natural stone flooring.",
    },
    {
      title: "Hearth Living Lounge",
      dimensions: "80 sq.ft",
      details: "Intimate fireside seating with wood hearth, wool blankets, and curated Himalayan literature collection.",
    },
  ];

  // A DAY IN THIS SUITE TIMELINE
  const sanctuaryTimeline = [
    {
      time: "06:30",
      title: "Dawn Horizon & Mountain Tea",
      desc: "Awake to morning mist drifting across the valley. Freshly plucked organic Ilam tea delivered quietly to your balcony.",
    },
    {
      time: "08:30",
      title: "Artisanal Courtyard Breakfast",
      desc: "Warm millet crepes, wild mountain honey, seasonal orchard fruits, and hand-pressed French press coffee.",
    },
    {
      time: "16:00",
      title: "Herbal Soak & Afternoon Tea",
      desc: "Herbal mineral bath prepared with locally harvested Himalayan juniper and mountain salt, followed by fireside confectionery.",
    },
    {
      time: "19:30",
      title: "Fireside Hearth Dining",
      desc: "Indigenous seasonal dinner at Chuli or private terrace dining under crystal-clear unpolluted night skies.",
    },
  ];

  return (
    <div className="w-full min-h-screen bg-[#F7F2EB] text-[#221B18] select-none pb-24">
      {/* ========================================================
          1. IMMERSIVE MONUMENTAL SUITE HERO BANNER
          Framed full-height hero with integrated header on top of image
          ======================================================== */}
      <section className="relative w-full min-h-[75vh] lg:min-h-[82vh] p-3 sm:p-6 lg:p-8 xl:px-12 xl:py-6 flex flex-col justify-between overflow-hidden bg-[#1E1B19]">
        {/* INTEGRATED TRANSLUCENT TOP HEADER */}
        <header className="w-full max-w-[1440px] mx-auto mb-3 sm:mb-6 px-2 sm:px-4 flex items-center justify-between z-30">
          <Link
            href="/"
            className="flex items-center gap-2 group transition-transform hover:scale-105"
            aria-label="Return to Basai Home"
          >
            <BasaiLogo className="h-7 sm:h-9 w-auto text-[#E4AA8B]" />
          </Link>

          {/* SANCTUARY IDENTIFIER */}
          <div className="flex items-center">
            <span className="text-xs sm:text-sm font-mono tracking-[0.22em] uppercase text-[#E4AA8B] font-semibold">
              {suite.location}
            </span>
          </div>

          {/* BACK TO SUITES & MENU TRIGGER */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/rooms"
              className="text-xs sm:text-[13px] font-medium text-[#E4AA8B]/90 hover:text-[#E4AA8B] tracking-wider uppercase transition flex items-center gap-1.5"
            >
              <span>←</span>
              <span>All Suites</span>
            </Link>

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

        {/* FRAMED HERO CONTAINER */}
        <div className="relative w-full max-w-[1440px] mx-auto flex-1 rounded-2xl sm:rounded-3xl shadow-2xl min-h-[520px] lg:min-h-[580px] flex flex-col justify-end overflow-hidden border border-white/10 p-6 sm:p-10 lg:p-12">
          {/* BACKGROUND HERO IMAGE */}
          <div className="absolute inset-0 z-0">
            <Image
              src={suite.images[0]}
              alt={suite.title}
              fill
              priority
              className="object-cover object-center scale-[1.01]"
              sizes="(max-width: 1440px) 100vw, 1440px"
            />
            <div className="absolute inset-0 bg-black/45 sm:bg-black/35" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
          </div>

          {/* HERO BOTTOM CONTENT */}
          <div className="relative z-10 w-full flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-3xl">
              {/* BADGE */}
              <div className="flex items-center gap-2 mb-3">
                {suite.badge && (
                  <span className="text-[10px] font-mono tracking-widest uppercase bg-[#E8A88A] text-[#2C231E] font-semibold px-3 py-1 rounded-full shadow-xs">
                    {suite.badge}
                  </span>
                )}
                <span className="text-[10px] font-mono tracking-wider uppercase bg-black/60 backdrop-blur-md text-white/90 px-3 py-1 rounded-full border border-white/20">
                  {suite.sanctuary}
                </span>
              </div>

              {/* MONUMENTAL SUITE TITLE */}
              <h1
                className="font-stedelijk uppercase text-3xl sm:text-5xl lg:text-[62px] text-[#E4AA8B] leading-[1.04] drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]"
                style={{ textTransform: "uppercase" }}
              >
                {suite.title}
              </h1>

              <p className="mt-2.5 text-xs sm:text-sm text-white/90 font-normal italic max-w-xl leading-relaxed">
                "{suite.tagline}"
              </p>
            </div>

            {/* LIGHTBOX TRIGGER BUTTON */}
            <button
              type="button"
              onClick={() => {
                setLightboxIndex(0);
                setIsLightboxOpen(true);
              }}
              className="self-start lg:self-end bg-white/15 hover:bg-white/25 backdrop-blur-md text-white border border-white/30 px-5 py-2.5 rounded-full text-xs font-medium tracking-wide flex items-center gap-2 shadow-lg transition-all cursor-pointer"
            >
              <span>View Gallery ({suite.images.length} Photos)</span>
              <span>↗</span>
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================
          2. MAIN EDITORIAL CONTENT GRID
          Left: Architectural Story, Blueprint, Rituals, Privileges
          Right: Sticky Luxury Reservation Console with Custom Calendar
          ======================================================== */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-14 py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-14 items-start">
          
          {/* ========================================================
              LEFT COLUMN (7-8 COLS)
              ======================================================== */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-12 sm:space-y-16">
            
            {/* 1. QUICK ARCHITECTURAL SPECIFICATIONS RIBBON */}
            <div className="bg-white rounded-2xl border border-[#E5DACF] p-6 sm:p-7 shadow-xs">
              <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#B26B4A] block font-semibold mb-3">
                ARCHITECTURAL SPECIFICATIONS
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-mono text-[#827165] block">
                    Suite Floor Area
                  </span>
                  <span className="font-semibold text-sm text-[#221B18] mt-0.5 block">
                    {suite.specs.sqFt} sq.ft ({suite.specs.sqM} m²)
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-[#827165] block">
                    Bed Composition
                  </span>
                  <span className="font-semibold text-sm text-[#221B18] mt-0.5 block">
                    {suite.specs.bed}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-[#827165] block">
                    Sanctuary Capacity
                  </span>
                  <span className="font-semibold text-sm text-[#221B18] mt-0.5 block">
                    Max {suite.specs.maxGuests} Guests
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-[#827165] block">
                    Horizon Outlook
                  </span>
                  <span className="font-semibold text-sm text-[#221B18] mt-0.5 block truncate">
                    {suite.specs.view}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. THE LIVING HERITAGE STORY & PHILOSOPHY */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.22em] text-[#B26B4A]">
                <span className="w-2 h-2 rounded-full bg-[#B26B4A]" />
                <span>01 // LIVING HERITAGE & PROVENANCE</span>
              </div>
              <h2
                className="font-stedelijk uppercase text-2xl sm:text-4xl text-[#221B18] leading-[1.08]"
                style={{ textTransform: "uppercase" }}
              >
                THE ARCHITECTURAL PROVENANCE
              </h2>
              <p className="text-sm sm:text-base text-[#4A3E36] leading-relaxed font-normal">
                {suite.description}
              </p>
              
              {/* HIGHLIGHTS CALLOUT */}
              <div className="bg-[#FAF7F2] rounded-2xl border border-[#E5DACF] p-6 space-y-3 mt-6">
                <span className="text-[11px] font-mono uppercase text-[#B26B4A] font-semibold block">
                  KEY RESIDENCE DISTINCTIONS
                </span>
                <ul className="space-y-2 text-xs sm:text-sm text-[#4A3E36]">
                  {suite.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="text-[#B26B4A] mt-0.5 font-bold">✦</span>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* 3. PHOTO MOSAIC GALLERY SPREAD */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.22em] text-[#B26B4A]">
                  <span className="w-2 h-2 rounded-full bg-[#B26B4A]" />
                  <span>02 // SPATIAL GALLERY</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setLightboxIndex(0);
                    setIsLightboxOpen(true);
                  }}
                  className="text-xs font-medium text-[#B26B4A] hover:underline"
                >
                  Open Fullscreen (All {suite.images.length})
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {suite.images.slice(1, 4).map((imgUrl, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setLightboxIndex(idx + 1);
                      setIsLightboxOpen(true);
                    }}
                    className={`relative rounded-2xl overflow-hidden border border-[#E5DACF] cursor-pointer group shadow-xs ${
                      idx === 2 ? "sm:col-span-2 aspect-[21/9]" : "aspect-[4/3]"
                    }`}
                  >
                    <Image
                      src={imgUrl}
                      alt={`${suite.title} Photo ${idx + 2}`}
                      fill
                      className="object-cover group-hover:scale-103 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    <span className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-[10px] font-mono">
                      Expand ↗
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* 4. INTERACTIVE SPATIAL BLUEPRINT & FLOORPLAN */}
            <section className="bg-white rounded-3xl border border-[#E5DACF] p-6 sm:p-8 space-y-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EAE1D5] pb-4">
                <div>
                  <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.22em] text-[#B26B4A]">
                    <span className="w-2 h-2 rounded-full bg-[#B26B4A]" />
                    <span>03 // SPATIAL ARCHITECTURE</span>
                  </div>
                  <h3
                    className="font-stedelijk uppercase text-xl sm:text-2xl text-[#221B18] mt-1"
                    style={{ textTransform: "uppercase" }}
                  >
                    FLOORPLAN & BLUEPRINT ZONES
                  </h3>
                </div>
                <span className="text-xs font-mono text-[#827165]">
                  Location: {suite.specs.floor}
                </span>
              </div>

              {/* ZONE SELECTOR TABS */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 text-xs">
                {floorplanZones.map((zone, zIdx) => (
                  <button
                    key={zIdx}
                    type="button"
                    onClick={() => setActiveFloorplanZone(zIdx)}
                    className={`px-3.5 py-2 rounded-xl font-medium transition whitespace-nowrap cursor-pointer ${
                      activeFloorplanZone === zIdx
                        ? "bg-[#221B18] text-white shadow-xs"
                        : "bg-[#FAF7F2] text-[#4A3E36] border border-[#D5C6BA] hover:border-[#B26B4A]"
                    }`}
                  >
                    {zone.title}
                  </button>
                ))}
              </div>

              {/* ACTIVE ZONE CARD */}
              <div className="p-6 rounded-2xl bg-[#FAF7F2] border border-[#E5DACF] space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-stedelijk uppercase text-lg text-[#221B18]">
                    {floorplanZones[activeFloorplanZone].title}
                  </h4>
                  <span className="font-mono text-xs text-[#B26B4A] font-semibold">
                    {floorplanZones[activeFloorplanZone].dimensions}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#5C4F46] leading-relaxed">
                  {floorplanZones[activeFloorplanZone].details}
                </p>
              </div>
            </section>

            {/* 5. A DAY IN THIS SANCTUARY: SLOW LIVING TIMELINE */}
            <section className="space-y-6">
              <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.22em] text-[#B26B4A]">
                <span className="w-2 h-2 rounded-full bg-[#B26B4A]" />
                <span>04 // SLOW LIVING RITUALS</span>
              </div>
              <h3
                className="font-stedelijk uppercase text-2xl sm:text-3xl text-[#221B18]"
                style={{ textTransform: "uppercase" }}
              >
                A DAY IN THIS SANCTUARY
              </h3>

              <div className="space-y-4">
                {sanctuaryTimeline.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl border border-[#E5DACF] p-5 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-6 items-start"
                  >
                    <div className="font-mono text-xs font-semibold text-[#B26B4A] bg-[#FAF1E8] px-3 py-1.5 rounded-lg shrink-0">
                      {item.time}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm sm:text-base text-[#221B18]">
                        {item.title}
                      </h4>
                      <p className="text-xs sm:text-sm text-[#5C4F46] mt-1 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 6. IN-SUITE PRIVILEGES & INCLUSIONS */}
            <section className="bg-white rounded-3xl border border-[#E5DACF] p-6 sm:p-8 space-y-6 shadow-xs">
              <div>
                <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.22em] text-[#B26B4A]">
                  <span className="w-2 h-2 rounded-full bg-[#B26B4A]" />
                  <span>05 // PRIVILEGES & INCLUSIONS</span>
                </div>
                <h3
                  className="font-stedelijk uppercase text-xl sm:text-2xl text-[#221B18] mt-1"
                  style={{ textTransform: "uppercase" }}
                >
                  ALL IN-SUITE AMENITIES
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                {suite.amenities.map((amenity, aIdx) => (
                  <div
                    key={aIdx}
                    className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E5DACF] text-[#4A3E36] flex items-center gap-3"
                  >
                    <span className="text-[#2E7D32] font-bold">✓</span>
                    <span className="font-medium">{amenity}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* 7. COMPANION SANCTUARIES */}
            <section className="space-y-4 pt-4">
              <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.22em] text-[#B26B4A]">
                <span className="w-2 h-2 rounded-full bg-[#B26B4A]" />
                <span>06 // COMPANION SANCTUARIES</span>
              </div>
              <h3
                className="font-stedelijk uppercase text-xl sm:text-2xl text-[#221B18]"
                style={{ textTransform: "uppercase" }}
              >
                YOU MAY ALSO APPRECIATE
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {companionSuites.map((comp) => (
                  <Link
                    key={comp.id}
                    href={`/rooms/${comp.slug}`}
                    className="group bg-white rounded-2xl border border-[#E5DACF] overflow-hidden p-4 block shadow-xs hover:shadow-md transition-all"
                  >
                    <div className="relative aspect-[16/10] rounded-xl overflow-hidden mb-3">
                      <Image
                        src={comp.images[0]}
                        alt={comp.title}
                        fill
                        className="object-cover group-hover:scale-103 transition-transform duration-500"
                      />
                      <span className="absolute top-2 left-2 bg-black/60 text-white px-2 py-0.5 rounded-full text-[10px] font-mono">
                        {comp.sanctuary}
                      </span>
                    </div>
                    <h4 className="font-stedelijk uppercase text-base text-[#221B18] group-hover:text-[#B26B4A] transition-colors">
                      {comp.title}
                    </h4>
                    <span className="text-xs text-[#827165] block mt-0.5">
                      {formatPrice(comp.priceNpr, comp.priceUsd)} / night
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          </div>

          {/* ========================================================
              RIGHT COLUMN (4-5 COLS)
              STICKY LUXURY RESERVATION CARD WITH CUSTOM CALENDAR
              ======================================================== */}
          <div className="lg:col-span-5 xl:col-span-4 sticky top-6 z-20 space-y-6">
            <div className="bg-white rounded-3xl border border-[#E5DACF] p-6 sm:p-8 shadow-xl space-y-6">
              {/* TARIFF HEADER & CURRENCY TOGGLE */}
              <div className="flex items-center justify-between border-b border-[#EAE1D5] pb-5">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#827165] block">
                    Nightly Sanctuary Tariff
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-stedelijk uppercase text-3xl sm:text-4xl text-[#221B18] tracking-wide">
                      {formatPrice(suite.priceNpr, suite.priceUsd)}
                    </span>
                    <span className="text-xs text-[#827165]">/ night</span>
                  </div>
                </div>

                {/* CURRENCY TOGGLE */}
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

              {/* CUSTOM DUAL-MONTH CALENDAR INTEGRATION */}
              <div ref={calendarRef} className="relative space-y-2">
                <span className="text-[10px] font-mono uppercase text-[#827165] block">
                  Select Stay Dates
                </span>

                <div className="grid grid-cols-2 gap-3">
                  {/* CHECK-IN CARD */}
                  <button
                    type="button"
                    onClick={() => {
                      setCalendarTarget("checkIn");
                      setIsCalendarOpen(true);
                    }}
                    className={`w-full relative rounded-xl border py-3 px-2 flex flex-col items-center justify-center text-center cursor-pointer transition shadow-2xs group min-h-[96px] ${
                      isCalendarOpen && calendarTarget === "checkIn"
                        ? "bg-[#F0D5C7] border-[#DE9977] ring-1 ring-[#DE9977]"
                        : "bg-[#FAF7F2] border-[#D5C6BA] hover:border-[#DE9977]"
                    }`}
                  >
                    <span className="text-[10px] font-mono uppercase text-[#827165] mb-0.5">
                      Check-in
                    </span>
                    <span className="text-3xl font-semibold text-[#2C231E] tracking-tight leading-none">
                      {checkInParsed.day}.
                    </span>
                    <span className="text-[11px] text-[#52463E] mt-1 font-medium">
                      {checkInParsed.month} {checkInParsed.year}
                    </span>
                    <span className="text-[8px] text-[#2C231E] mt-1">▼</span>
                  </button>

                  {/* CHECK-OUT CARD */}
                  <button
                    type="button"
                    onClick={() => {
                      setCalendarTarget("checkOut");
                      setIsCalendarOpen(true);
                    }}
                    className={`w-full relative rounded-xl border py-3 px-2 flex flex-col items-center justify-center text-center cursor-pointer transition shadow-2xs group min-h-[96px] ${
                      isCalendarOpen && calendarTarget === "checkOut"
                        ? "bg-[#F0D5C7] border-[#DE9977] ring-1 ring-[#DE9977]"
                        : "bg-[#FAF7F2] border-[#D5C6BA] hover:border-[#DE9977]"
                    }`}
                  >
                    <span className="text-[10px] font-mono uppercase text-[#827165] mb-0.5">
                      Check-out
                    </span>
                    <span className="text-3xl font-semibold text-[#2C231E] tracking-tight leading-none">
                      {checkOutParsed.day}.
                    </span>
                    <span className="text-[11px] text-[#52463E] mt-1 font-medium">
                      {checkOutParsed.month} {checkOutParsed.year}
                    </span>
                    <span className="text-[8px] text-[#2C231E] mt-1">▼</span>
                  </button>
                </div>

                {/* DESKTOP CALENDAR MODAL POPOVER */}
                {isCalendarOpen && (
                  <div className="hidden md:block absolute top-[105%] right-0 z-50 animate-in fade-in zoom-in-95 duration-200">
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

              {/* GUESTS SELECTOR */}
              <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#D5C6BA] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-[#827165] uppercase block">
                    Guests
                  </span>
                  <span className="font-semibold text-xs text-[#221B18]">
                    {guests} Adults
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setGuests(Math.max(1, guests - 1))}
                    className="w-6 h-6 rounded-full border border-[#D5C6BA] flex items-center justify-center hover:bg-white text-xs"
                  >
                    −
                  </button>
                  <button
                    type="button"
                    onClick={() => setGuests(Math.min(suite.specs.maxGuests, guests + 1))}
                    className="w-6 h-6 rounded-full border border-[#D5C6BA] flex items-center justify-center hover:bg-white text-xs"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* PRICE BREAKDOWN */}
              <div className="space-y-2 text-xs text-[#4A3E36] border-t border-b border-[#EAE1D5] py-4">
                <div className="flex justify-between">
                  <span>
                    {formatPrice(suite.priceNpr, suite.priceUsd)} × {nights} Night{nights > 1 ? "s" : ""}
                  </span>
                  <span className="font-semibold text-[#221B18]">
                    {formatPrice(totalPriceNpr, totalPriceUsd)}
                  </span>
                </div>
                <div className="flex justify-between text-[#2E7D32]">
                  <span>Himalayan Organic Breakfast</span>
                  <span>Included</span>
                </div>
                <div className="flex justify-between text-[#2E7D32]">
                  <span>All Taxes & Service Fees</span>
                  <span>Included</span>
                </div>
              </div>

              {/* REMAINING AVAILABILITY BADGE */}
              <div className="bg-[#FAF1E8] p-3 rounded-xl border border-[#DE9977] flex items-center gap-2 text-xs text-[#B26B4A]">
                <span className="w-2 h-2 rounded-full bg-[#B26B4A] animate-pulse" />
                <span className="font-medium">
                  High Demand: Only {suite.remainingSuites} suites remain for these dates
                </span>
              </div>

              {/* PRIMARY PROCEED CTA */}
              <Link
                href={`/booking?room=${suite.slug}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`}
                className="w-full bg-[#E8A88A] hover:bg-[#DE9977] active:bg-[#D58C6B] text-[#2C231E] font-medium text-sm py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer text-center block"
              >
                <span>Reserve This Suite</span>
                <span>→</span>
              </Link>

              <div className="text-center space-y-1">
                <p className="text-[11px] text-[#2E7D32] font-medium">
                  ✓ Free cancellation up to 48 hours before check-in
                </p>
                <p className="text-[11px] text-[#827165]">
                  Instant confirmation · Direct booking guarantees best allocation
                </p>
              </div>

              {/* CONCIERGE ASSISTANCE */}
              <div className="pt-4 border-t border-[#EAE1D5] flex items-center justify-between text-xs text-[#827165]">
                <span>Special arrangement inquiries?</span>
                <Link href="#contact" className="text-[#B26B4A] hover:underline font-medium">
                  Direct Butler Chat
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ========================================================
          MOBILE CALENDAR DRAWER (TOUCH SHEET)
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
          FULLSCREEN PHOTO LIGHTBOX MODAL
          ======================================================== */}
      {isLightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/95 text-white flex flex-col justify-between p-4 sm:p-8 animate-in fade-in duration-200 select-none"
        >
          {/* LIGHTBOX TOP HEADER */}
          <div className="flex items-center justify-between z-10">
            <div>
              <span className="font-stedelijk uppercase text-lg sm:text-xl text-[#E4AA8B]">
                {suite.title}
              </span>
              <span className="text-xs text-white/60 block font-mono">
                Photo {lightboxIndex + 1} of {suite.images.length}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="w-10 h-10 rounded-full border border-white/20 hover:border-white text-white flex items-center justify-center text-xl transition cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* LIGHTBOX MAIN PHOTO */}
          <div className="relative flex-1 w-full max-w-5xl mx-auto my-4 flex items-center justify-center">
            <div className="relative w-full h-full max-h-[78vh]">
              <Image
                src={suite.images[lightboxIndex]}
                alt={`${suite.title} full view`}
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

          {/* LIGHTBOX BOTTOM CONTROLS & THUMBNAILS */}
          <div className="flex items-center justify-between max-w-5xl mx-auto w-full z-10 pt-2">
            <button
              type="button"
              onClick={() =>
                setLightboxIndex((prev) => (prev > 0 ? prev - 1 : suite.images.length - 1))
              }
              className="px-4 py-2 rounded-full border border-white/20 hover:border-white text-xs font-mono transition cursor-pointer"
            >
              ← Previous
            </button>

            {/* THUMBNAIL DOTS */}
            <div className="flex items-center gap-2">
              {suite.images.map((_, dotIdx) => (
                <button
                  key={dotIdx}
                  type="button"
                  onClick={() => setLightboxIndex(dotIdx)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    lightboxIndex === dotIdx ? "bg-[#E8A88A] scale-125" : "bg-white/30"
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                setLightboxIndex((prev) => (prev < suite.images.length - 1 ? prev + 1 : 0))
              }
              className="px-4 py-2 rounded-full border border-white/20 hover:border-white text-xs font-mono transition cursor-pointer"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* QUIET MINIMAL FOOTER STRIP */}
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

      {/* FULL SCREEN MENU */}
      <FullScreenMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        activeBrand="Basai"
      />
    </div>
  );
}
