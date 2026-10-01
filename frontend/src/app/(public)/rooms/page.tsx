"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { BASAI_SUITES, SuiteItem } from "@/data/suites";

export default function RoomsPage() {
  // FILTER & SEARCH STATE
  const [selectedSanctuary, setSelectedSanctuary] = useState<string>("all");
  const [selectedView, setSelectedView] = useState<string>("all");
  const [guestsCount, setGuestsCount] = useState<number>(2);
  const [currency, setCurrency] = useState<"NPR" | "USD">("NPR");
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc" | "space">("featured");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // DATES (DEFAULT 2 NIGHTS)
  const [checkIn, setCheckIn] = useState<string>("2026-10-02");
  const [checkOut, setCheckOut] = useState<string>("2026-10-04");

  // IMAGE CAROUSEL INDEX MAP PER SUITE
  const [activeImageIndex, setActiveImageIndex] = useState<{ [suiteId: string]: number }>({});

  // COMPARISON SELECTION LIST
  const [compareList, setCompareList] = useState<string[]>([]);

  // TOGGLE COMPARE
  const toggleCompare = (suiteId: string) => {
    setCompareList((prev) =>
      prev.includes(suiteId)
        ? prev.filter((id) => id !== suiteId)
        : prev.length < 3
        ? [...prev, suiteId]
        : prev
    );
  };

  // FILTERED & SORTED SUITES
  const filteredSuites = useMemo(() => {
    return BASAI_SUITES.filter((suite) => {
      // Sanctuary filter
      if (selectedSanctuary !== "all" && suite.sanctuaryId !== selectedSanctuary) {
        return false;
      }
      // Guests filter
      if (suite.specs.maxGuests < guestsCount) {
        return false;
      }
      // View filter
      if (selectedView !== "all") {
        const viewLower = suite.specs.view.toLowerCase();
        if (selectedView === "mountain" && !viewLower.includes("mountain") && !viewLower.includes("machapuchare") && !viewLower.includes("peak")) return false;
        if (selectedView === "heritage" && !viewLower.includes("heritage") && !viewLower.includes("courtyard")) return false;
        if (selectedView === "ridge" && !viewLower.includes("ridge") && !viewLower.includes("tea")) return false;
        if (selectedView === "river" && !viewLower.includes("river") && !viewLower.includes("wetlands")) return false;
      }
      // Text search
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const matchesTitle = suite.title.toLowerCase().includes(query);
        const matchesSanctuary = suite.sanctuary.toLowerCase().includes(query);
        const matchesDesc = suite.description.toLowerCase().includes(query);
        const matchesAmenities = suite.amenities.some((a) => a.toLowerCase().includes(query));
        if (!matchesTitle && !matchesSanctuary && !matchesDesc && !matchesAmenities) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === "price-asc") return a.priceNpr - b.priceNpr;
      if (sortBy === "price-desc") return b.priceNpr - a.priceNpr;
      if (sortBy === "space") return b.specs.sqFt - a.specs.sqFt;
      return 0; // featured default
    });
  }, [selectedSanctuary, selectedView, guestsCount, searchQuery, sortBy]);

  // FORMAT PRICE HELPER
  const formatPrice = (priceNpr: number, priceUsd: number) => {
    if (currency === "USD") {
      return `$${priceUsd.toLocaleString()}`;
    }
    return `NPR ${priceNpr.toLocaleString()}`;
  };

  return (
    <div className="w-full min-h-screen bg-[#F7F2EB] text-[#221B18] select-none pb-32">
      {/* ========================================================
          1. EDITORIAL HEADER & BREADCRUMB
          ======================================================== */}
      <section className="w-full pt-10 sm:pt-14 pb-10 sm:pb-14 px-4 sm:px-8 lg:px-14 border-b border-[#EAE1D5] bg-[#F7F2EB]">
        <div className="max-w-[1440px] mx-auto">
          {/* BREADCRUMB */}
          <div className="flex items-center gap-2 text-xs font-mono tracking-wider text-[#827165] mb-4">
            <Link href="/" className="hover:text-[#B26B4A] transition">
              BASAI
            </Link>
            <span>/</span>
            <span className="text-[#221B18] font-semibold">SANCTUARIES & SUITES</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 mb-3 text-[11px] font-mono uppercase tracking-[0.24em] text-[#B26B4A]">
                <span className="w-2 h-2 rounded-full bg-[#B26B4A]" />
                <span>01 // AVAILABILITY & SELECTION</span>
              </div>
              <h1
                className="font-stedelijk uppercase text-3xl sm:text-5xl lg:text-[60px] text-[#221B18] tracking-wider leading-[1.04]"
                style={{ textTransform: "uppercase" }}
              >
                CURATED SUITES & SANCTUARIES
              </h1>
              <p className="mt-4 text-xs sm:text-sm text-[#5C4F46] leading-relaxed max-w-2xl font-normal">
                Handcrafted living spaces rooted in the Himalayas. From restored 14th-century Newari woodwork in Kathmandu to high-altitude slate pavilions in Mustang and organic mountain farm villas in Pokhara.
              </p>
            </div>

            {/* CURRENCY & INVENTORY BADGE */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              {/* CURRENCY TOGGLE */}
              <div className="inline-flex items-center p-1 bg-white rounded-full border border-[#D5C6BA] shadow-xs text-xs">
                <button
                  type="button"
                  onClick={() => setCurrency("NPR")}
                  className={`px-3 py-1 rounded-full font-medium transition ${
                    currency === "NPR"
                      ? "bg-[#221B18] text-white shadow-xs"
                      : "text-[#5C4F46] hover:text-[#221B18]"
                  }`}
                >
                  NPR (Rs.)
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency("USD")}
                  className={`px-3 py-1 rounded-full font-medium transition ${
                    currency === "USD"
                      ? "bg-[#221B18] text-white shadow-xs"
                      : "text-[#5C4F46] hover:text-[#221B18]"
                  }`}
                >
                  USD ($)
                </button>
              </div>

              <div className="text-xs font-mono text-[#827165] bg-white px-3.5 py-1.5 rounded-full border border-[#D5C6BA]">
                {filteredSuites.length} Suites Available
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          2. INTERACTIVE AVAILABILITY & FILTER CONSOLE
          ======================================================== */}
      <section className="sticky top-18 sm:top-20 z-30 w-full bg-[#F7F2EB]/95 backdrop-blur-md border-b border-[#EAE1D5] py-4 px-4 sm:px-8 lg:px-14 shadow-xs">
        <div className="max-w-[1440px] mx-auto">
          {/* TOP BAR: SANCTUARY TABS */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 text-xs whitespace-nowrap">
            <span className="font-mono text-[11px] text-[#827165] uppercase tracking-wider pr-1">
              Sanctuary:
            </span>
            {[
              { id: "all", label: "All Sanctuaries (Nepal)" },
              { id: "kathmandu", label: "Kathmandu (Dwarika's Heritage)" },
              { id: "pokhara", label: "Pokhara (The Pavilions)" },
              { id: "mustang", label: "Mustang (Shinta Mani)" },
              { id: "dharan", label: "Eastern Foothills (Bhedetar & Koshi)" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedSanctuary(tab.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
                  selectedSanctuary === tab.id
                    ? "bg-[#221B18] text-white shadow-xs"
                    : "bg-white text-[#4A3E36] border border-[#D5C6BA] hover:border-[#B26B4A]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* BOTTOM BAR: DATES, GUESTS, VIEW, SORT, AND SEARCH */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2 text-xs">
            {/* CHECK-IN */}
            <div className="bg-white rounded-xl border border-[#D5C6BA] px-3 py-2 flex flex-col justify-center">
              <span className="text-[10px] uppercase font-mono text-[#827165]">Check-in</span>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="bg-transparent font-medium text-[#221B18] text-xs outline-none cursor-pointer mt-0.5"
              />
            </div>

            {/* CHECK-OUT */}
            <div className="bg-white rounded-xl border border-[#D5C6BA] px-3 py-2 flex flex-col justify-center">
              <span className="text-[10px] uppercase font-mono text-[#827165]">Check-out</span>
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="bg-transparent font-medium text-[#221B18] text-xs outline-none cursor-pointer mt-0.5"
              />
            </div>

            {/* GUESTS */}
            <div className="bg-white rounded-xl border border-[#D5C6BA] px-3 py-2 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono text-[#827165] block leading-none">Guests</span>
                <span className="font-medium text-[#221B18] text-xs">{guestsCount} Adults</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setGuestsCount(Math.max(1, guestsCount - 1))}
                  className="w-5 h-5 rounded-full border border-[#D5C6BA] flex items-center justify-center hover:bg-[#FAF1E8]"
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={() => setGuestsCount(Math.min(4, guestsCount + 1))}
                  className="w-5 h-5 rounded-full border border-[#D5C6BA] flex items-center justify-center hover:bg-[#FAF1E8]"
                >
                  +
                </button>
              </div>
            </div>

            {/* VIEW FILTER */}
            <div className="bg-white rounded-xl border border-[#D5C6BA] px-3 py-2 flex flex-col justify-center">
              <span className="text-[10px] uppercase font-mono text-[#827165]">View Experience</span>
              <select
                value={selectedView}
                onChange={(e) => setSelectedView(e.target.value)}
                className="bg-transparent font-medium text-[#221B18] text-xs outline-none cursor-pointer mt-0.5"
              >
                <option value="all">All Horizons</option>
                <option value="mountain">Mountain Panorama</option>
                <option value="heritage">Heritage Courtyard</option>
                <option value="ridge">Tea Garden Ridge</option>
                <option value="river">Riverside Safari</option>
              </select>
            </div>

            {/* SORT BY */}
            <div className="bg-white rounded-xl border border-[#D5C6BA] px-3 py-2 flex flex-col justify-center">
              <span className="text-[10px] uppercase font-mono text-[#827165]">Order By</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent font-medium text-[#221B18] text-xs outline-none cursor-pointer mt-0.5"
              >
                <option value="featured">Featured Curations</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="space">Largest Suite Area</option>
              </select>
            </div>

            {/* SEARCH KEYWORDS */}
            <div className="bg-white rounded-xl border border-[#D5C6BA] px-3 py-2 flex items-center col-span-2 sm:col-span-1">
              <input
                type="text"
                placeholder="Search amenities (e.g. tub)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs font-normal text-[#221B18] placeholder-[#9C8B7E] outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-neutral-400 hover:text-neutral-700 ml-1"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          3. CURATED SUITE CARDS LISTING
          ======================================================== */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-14 py-12 sm:py-16">
        {filteredSuites.length === 0 ? (
          /* EMPTY STATE */
          <div className="text-center py-24 bg-white rounded-3xl border border-[#E5DACF] p-8 max-w-xl mx-auto shadow-xs">
            <span className="text-3xl mb-3 block">🏔️</span>
            <h3 className="font-stedelijk uppercase text-2xl text-[#221B18] mb-2">
              NO SANCTUARIES MATCH YOUR SEARCH
            </h3>
            <p className="text-xs sm:text-sm text-[#695C53] mb-6">
              We couldn't find available suites matching your exact filter combination. Try adjusting dates or selecting "All Sanctuaries".
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedSanctuary("all");
                setSelectedView("all");
                setGuestsCount(2);
                setSearchQuery("");
              }}
              className="bg-[#221B18] text-white px-6 py-2.5 rounded-full text-xs font-medium hover:bg-[#382F2A] transition"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          /* SUITE CARDS GRID */
          <div className="space-y-12 sm:space-y-16">
            {filteredSuites.map((suite, index) => {
              const currentImgIdx = activeImageIndex[suite.id] || 0;
              const isCompared = compareList.includes(suite.id);

              return (
                <article
                  key={suite.id}
                  className="group bg-white rounded-2xl sm:rounded-3xl border border-[#E5DACF] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col lg:flex-row"
                >
                  {/* LEFT: INTERACTIVE PHOTO SHOWCASE & GALLERY */}
                  <div className="w-full lg:w-[48%] relative flex flex-col bg-[#1A1816] shrink-0">
                    <div className="relative aspect-[16/11] sm:aspect-[16/10] lg:aspect-auto lg:h-full w-full overflow-hidden">
                      <Image
                        src={suite.images[currentImgIdx] || suite.images[0]}
                        alt={suite.title}
                        fill
                        className="object-cover object-center group-hover:scale-102 transition-transform duration-700"
                        sizes="(max-width: 1024px) 100vw, 50vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

                      {/* TOP BADGE */}
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

                      {/* BOTTOM LEFT: REMAINING ROOMS NOTIFICATION */}
                      <div className="absolute bottom-4 left-4 z-10">
                        <span className="text-[11px] font-medium bg-black/70 backdrop-blur-md text-white/90 px-3 py-1 rounded-full border border-white/10 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#E8A88A] animate-pulse" />
                          Only {suite.remainingSuites} suites left
                        </span>
                      </div>

                      {/* PHOTO GALLERY THUMBNAIL DOTS */}
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

                  {/* RIGHT: EDITORIAL SUITE DETAILS & BOOKING ACTION */}
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

                      {/* SUITE TITLE (ARCHITYPE STEDELIJK) */}
                      <h2
                        className="font-stedelijk uppercase text-2xl sm:text-3xl lg:text-[34px] text-[#221B18] leading-[1.08] tracking-wide"
                        style={{ textTransform: "uppercase" }}
                      >
                        {suite.title}
                      </h2>

                      {/* TAGLINE */}
                      <p className="mt-1.5 text-xs sm:text-[13px] text-[#827165] font-medium italic">
                        "{suite.tagline}"
                      </p>

                      {/* ARCHITECTURAL SPECIFICATIONS RIBBON */}
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

                      {/* DESCRIPTION */}
                      <p className="mt-4 text-xs sm:text-sm text-[#4A3E36] leading-relaxed font-normal">
                        {suite.description}
                      </p>

                      {/* KEY HIGHLIGHTS BULLETS */}
                      <ul className="mt-4 space-y-1.5 text-xs text-[#5C4F46]">
                        {suite.highlights.map((item, hIdx) => (
                          <li key={hIdx} className="flex items-start gap-2">
                            <span className="text-[#B26B4A] mt-0.5">✦</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>

                      {/* AMENITIES BADGES */}
                      <div className="mt-5 flex flex-wrap gap-1.5">
                        {suite.amenities.slice(0, 5).map((amenity, aIdx) => (
                          <span
                            key={aIdx}
                            className="text-[11px] bg-[#F7F2EB] text-[#4A3E36] px-2.5 py-1 rounded-md border border-[#E5DACF] font-normal"
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

                    {/* PRICING & ACTION CONSOLE */}
                    <div className="mt-8 pt-6 border-t border-[#EAE1D5] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* PRICE BLOCK */}
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
                          ✓ Includes breakfast & all taxes · Free cancel up to 48h
                        </span>
                      </div>

                      {/* CTA BUTTONS */}
                      <div className="flex items-center gap-2.5">
                        {/* COMPARE BUTTON */}
                        <button
                          type="button"
                          onClick={() => toggleCompare(suite.id)}
                          aria-label="Add to comparison"
                          className={`px-3.5 py-2.5 rounded-full text-xs font-medium border transition cursor-pointer ${
                            isCompared
                              ? "bg-[#221B18] text-white border-[#221B18]"
                              : "bg-white text-[#4A3E36] border-[#D5C6BA] hover:border-[#B26B4A]"
                          }`}
                        >
                          {isCompared ? "✓ Added" : "+ Compare"}
                        </button>

                        {/* SPECIFICATIONS & DETAIL PAGE */}
                        <Link
                          href={`/rooms/${suite.slug}`}
                          className="px-4 py-2.5 rounded-full border border-[#D5C6BA] text-[#221B18] text-xs font-medium hover:bg-[#FAF1E8] transition"
                        >
                          Suite Specs
                        </Link>

                        {/* PRIMARY SELECT & BOOK BUTTON */}
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

      {/* ========================================================
          4. FLOATING COMPARISON TRAY
          ======================================================== */}
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
    </div>
  );
}
