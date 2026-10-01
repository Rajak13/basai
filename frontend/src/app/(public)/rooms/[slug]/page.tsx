import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BASAI_SUITES } from "@/data/suites";

interface RoomDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function RoomDetailPage({ params }: RoomDetailPageProps) {
  const { slug } = await params;

  // FIND MATCHING SUITE OR FALLBACK
  const suite = BASAI_SUITES.find((s) => s.slug === slug) || BASAI_SUITES[0];

  return (
    <div className="w-full min-h-screen bg-[#F7F2EB] text-[#221B18] select-none pb-32">
      {/* ========================================================
          1. BREADCRUMB & HEADER
          ======================================================== */}
      <section className="w-full pt-10 sm:pt-14 pb-8 sm:pb-12 px-4 sm:px-8 lg:px-14 border-b border-[#EAE1D5]">
        <div className="max-w-[1440px] mx-auto">
          {/* BREADCRUMB */}
          <div className="flex items-center gap-2 text-xs font-mono tracking-wider text-[#827165] mb-4">
            <Link href="/" className="hover:text-[#B26B4A] transition">
              BASAI
            </Link>
            <span>/</span>
            <Link href="/rooms" className="hover:text-[#B26B4A] transition">
              SANCTUARIES
            </Link>
            <span>/</span>
            <span className="text-[#221B18] font-semibold uppercase">{suite.title}</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2 text-[11px] font-mono uppercase tracking-[0.22em] text-[#B26B4A] font-semibold">
                <span>{suite.sanctuary}</span>
                <span>·</span>
                <span>{suite.location}</span>
              </div>
              <h1
                className="font-stedelijk uppercase text-3xl sm:text-5xl lg:text-[56px] text-[#221B18] tracking-wider leading-[1.05]"
                style={{ textTransform: "uppercase" }}
              >
                {suite.title}
              </h1>
              <p className="mt-2 text-sm text-[#827165] italic font-medium">
                "{suite.tagline}"
              </p>
            </div>

            {/* RATING & BADGE */}
            <div className="flex items-center gap-3">
              {suite.badge && (
                <span className="text-xs font-mono tracking-widest uppercase bg-[#E8A88A] text-[#2C231E] font-semibold px-3.5 py-1.5 rounded-full shadow-xs">
                  {suite.badge}
                </span>
              )}
              <div className="bg-white px-3.5 py-1.5 rounded-full border border-[#D5C6BA] text-xs font-medium text-[#221B18] flex items-center gap-1.5">
                <span className="text-amber-500">★</span>
                <span>{suite.rating}</span>
                <span className="text-[#827165]">({suite.reviewsCount} reviews)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          2. EDITORIAL PHOTO MOSAIC GALLERY
          ======================================================== */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-14 pt-8 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 rounded-3xl overflow-hidden">
          {/* MAIN HERO IMAGE (7 COLS) */}
          <div className="md:col-span-7 relative aspect-[16/10] md:aspect-auto md:min-h-[460px] bg-neutral-900 rounded-2xl sm:rounded-3xl overflow-hidden border border-[#E5DACF]">
            <Image
              src={suite.images[0]}
              alt={suite.title}
              fill
              priority
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, 60vw"
            />
          </div>

          {/* SECONDARY IMAGES (5 COLS) */}
          <div className="md:col-span-5 grid grid-cols-2 md:grid-cols-1 gap-3 sm:gap-4">
            {suite.images.slice(1, 3).map((imgUrl, imgIdx) => (
              <div
                key={imgIdx}
                className="relative aspect-[4/3] md:aspect-auto md:min-h-[220px] bg-neutral-900 rounded-2xl sm:rounded-3xl overflow-hidden border border-[#E5DACF]"
              >
                <Image
                  src={imgUrl}
                  alt={`${suite.title} detail ${imgIdx + 1}`}
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 768px) 50vw, 40vw"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================
          3. MAIN CONTENT GRID (DETAILS + STICKY RESERVATION CARD)
          ======================================================== */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-14 items-start">
          
          {/* LEFT 7-8 COLS: STORY, SPECS, HIGHLIGHTS, AMENITIES, FLOORPLAN */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-10 sm:space-y-12">
            
            {/* ARCHITECTURAL SPECIFICATIONS BAR */}
            <div className="bg-white rounded-2xl border border-[#E5DACF] p-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-[10px] uppercase font-mono text-[#827165] block">
                  Suite Size
                </span>
                <span className="font-semibold text-sm text-[#221B18] mt-0.5 block">
                  {suite.specs.sqFt} sq.ft / {suite.specs.sqM} m²
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-[#827165] block">
                  Bed Configuration
                </span>
                <span className="font-semibold text-sm text-[#221B18] mt-0.5 block">
                  {suite.specs.bed}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-[#827165] block">
                  Max Guests
                </span>
                <span className="font-semibold text-sm text-[#221B18] mt-0.5 block">
                  Up to {suite.specs.maxGuests} Guests
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-[#827165] block">
                  Horizon View
                </span>
                <span className="font-semibold text-sm text-[#221B18] mt-0.5 block truncate">
                  {suite.specs.view}
                </span>
              </div>
            </div>

            {/* THE SUITE STORY */}
            <div className="space-y-4">
              <span className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#B26B4A] block font-semibold">
                ARCHITECTURAL PHILOSOPHY
              </span>
              <h2
                className="font-stedelijk uppercase text-2xl sm:text-3xl text-[#221B18]"
                style={{ textTransform: "uppercase" }}
              >
                LIVING HERITAGE & SLOW LUXURY
              </h2>
              <p className="text-sm sm:text-base text-[#4A3E36] leading-relaxed font-normal">
                {suite.description}
              </p>
            </div>

            {/* CURATED HIGHLIGHTS */}
            <div className="bg-white rounded-2xl border border-[#E5DACF] p-6 sm:p-8 space-y-4">
              <span className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#B26B4A] block font-semibold">
                EXCLUSIVE PRIVILEGES INCLUDED
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm text-[#4A3E36]">
                {suite.highlights.map((highlight, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <span className="text-[#B26B4A] text-base leading-none">✦</span>
                    <span className="leading-snug">{highlight}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* INCLUDED AMENITIES */}
            <div className="space-y-4">
              <span className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#B26B4A] block font-semibold">
                ALL IN-SUITE AMENITIES
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
                {suite.amenities.map((amenity, aIdx) => (
                  <div
                    key={aIdx}
                    className="bg-white p-3.5 rounded-xl border border-[#E5DACF] text-[#4A3E36] flex items-center gap-2.5 shadow-2xs"
                  >
                    <span className="text-[#2E7D32] font-semibold text-xs">✓</span>
                    <span className="font-medium text-xs">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* VIRTUAL FLOORPLAN ARCHITECTURAL BLUEPRINT */}
            <div className="bg-white rounded-2xl border border-[#E5DACF] p-6 sm:p-8 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#B26B4A] block font-semibold">
                  SPATIAL BLUEPRINT & LAYOUT
                </span>
                <span className="text-xs font-mono text-[#827165]">
                  Floor {suite.specs.floor}
                </span>
              </div>
              <div className="border border-dashed border-[#D5C6BA] rounded-xl p-8 bg-[#FAF7F2] text-center space-y-3">
                <div className="font-mono text-xs uppercase tracking-wider text-[#695C53]">
                  {suite.specs.sqFt} SQ.FT INTEGRATED ARCHITECTURAL SUITE
                </div>
                <div className="grid grid-cols-3 gap-2 max-w-md mx-auto text-xs py-4 text-[#827165]">
                  <div className="border border-[#D5C6BA] p-3 rounded-lg bg-white">
                    <span className="font-semibold block text-[#221B18]">Balcony & Terrace</span>
                    <span>180° Outlook</span>
                  </div>
                  <div className="border border-[#D5C6BA] p-3 rounded-lg bg-white">
                    <span className="font-semibold block text-[#221B18]">Master Chamber</span>
                    <span>{suite.specs.bed}</span>
                  </div>
                  <div className="border border-[#D5C6BA] p-3 rounded-lg bg-white">
                    <span className="font-semibold block text-[#221B18]">Stone En-Suite</span>
                    <span>Deep Soaking Tub</span>
                  </div>
                </div>
                <p className="text-xs text-[#827165]">
                  Designed for quiet sanctuary living with natural acoustic insulation and floor heating.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT 4-5 COLS: STICKY LUXURY RESERVATION CARD */}
          <div className="lg:col-span-5 xl:col-span-4 sticky top-24 z-20">
            <div className="bg-white rounded-3xl border border-[#E5DACF] p-6 sm:p-8 shadow-xl space-y-6">
              {/* PRICE HEADER */}
              <div className="border-b border-[#EAE1D5] pb-5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#827165] block">
                  Nightly Sanctuary Tariff
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-stedelijk uppercase text-3xl sm:text-4xl text-[#221B18] tracking-wide">
                    NPR {suite.priceNpr.toLocaleString()}
                  </span>
                  <span className="text-xs text-[#827165]">/ night</span>
                </div>
                <span className="text-xs text-[#827165] block mt-1">
                  (Approx. ${suite.priceUsd} USD · All taxes & artisanal breakfast included)
                </span>
              </div>

              {/* RESERVATION DATES SELECTOR */}
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#E5DACF]">
                    <span className="text-[10px] font-mono text-[#827165] uppercase block">
                      Check-In
                    </span>
                    <span className="font-semibold text-xs text-[#221B18] mt-0.5 block">
                      Oct 2, 2026
                    </span>
                  </div>
                  <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#E5DACF]">
                    <span className="text-[10px] font-mono text-[#827165] uppercase block">
                      Check-Out
                    </span>
                    <span className="font-semibold text-xs text-[#221B18] mt-0.5 block">
                      Oct 4, 2026
                    </span>
                  </div>
                </div>

                <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#E5DACF] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-[#827165] uppercase block">
                      Guests
                    </span>
                    <span className="font-semibold text-xs text-[#221B18]">
                      2 Adults
                    </span>
                  </div>
                  <span className="text-xs text-[#827165]">Max {suite.specs.maxGuests}</span>
                </div>
              </div>

              {/* REMAINING AVAILABILITY PILL */}
              <div className="bg-[#F7F2EB] p-3 rounded-xl border border-[#E5DACF] flex items-center gap-2 text-xs text-[#B26B4A]">
                <span className="w-2 h-2 rounded-full bg-[#B26B4A] animate-pulse" />
                <span className="font-medium">
                  High demand: Only {suite.remainingSuites} suites remain for these dates
                </span>
              </div>

              {/* PRIMARY PROCEED CTA */}
              <Link
                href={`/booking?room=${suite.slug}`}
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
                  Instant confirmation · Direct booking privilege guarantees best room allocation
                </p>
              </div>

              {/* CONCIERGE ASSISTANCE */}
              <div className="pt-4 border-t border-[#EAE1D5] flex items-center justify-between text-xs text-[#827165]">
                <span>Need custom arrangements?</span>
                <Link href="#contact" className="text-[#B26B4A] hover:underline font-medium">
                  Talk to Concierge
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
