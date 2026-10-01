"use client";

import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { BASAI_SUITES, SuiteItem } from "@/data/suites";
import { Suspense } from "react";

function CompareContent() {
  const searchParams = useSearchParams();
  const roomParams = searchParams.get("rooms");

  const selectedRooms: SuiteItem[] = roomParams
    ? BASAI_SUITES.filter((s) => roomParams.split(",").includes(s.id))
    : BASAI_SUITES.slice(0, 3);

  const displayRooms = selectedRooms.length > 0 ? selectedRooms : BASAI_SUITES.slice(0, 3);

  return (
    <div className="w-full min-h-screen bg-[#F7F2EB] text-[#221B18] select-none pb-32">
      {/* HEADER */}
      <section className="w-full pt-10 sm:pt-14 pb-10 sm:pb-12 px-4 sm:px-8 lg:px-14 border-b border-[#EAE1D5]">
        <div className="max-w-[1440px] mx-auto">
          <div className="flex items-center gap-2 text-xs font-mono tracking-wider text-[#827165] mb-4">
            <Link href="/" className="hover:text-[#B26B4A] transition">
              BASAI
            </Link>
            <span>/</span>
            <Link href="/rooms" className="hover:text-[#B26B4A] transition">
              SANCTUARIES
            </Link>
            <span>/</span>
            <span className="text-[#221B18] font-semibold">SUITE COMPARISON</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2 text-[11px] font-mono uppercase tracking-[0.24em] text-[#B26B4A]">
                <span className="w-2 h-2 rounded-full bg-[#B26B4A]" />
                <span>ARCHITECTURAL COMPARISON</span>
              </div>
              <h1
                className="font-stedelijk uppercase text-3xl sm:text-5xl text-[#221B18] tracking-wider leading-[1.06]"
                style={{ textTransform: "uppercase" }}
              >
                SIDE-BY-SIDE SANCTUARY COMPARISON
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-[#5C4F46] max-w-xl">
                Compare spatial layouts, horizons, artisanal features, and nightly tariffs to select the ideal sanctuary.
              </p>
            </div>

            <Link
              href="/rooms"
              className="text-xs font-medium text-[#B26B4A] hover:underline"
            >
              ← Back to All Suites
            </Link>
          </div>
        </div>
      </section>

      {/* COMPARISON MATRIX */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-14 py-10">
        <div className="overflow-x-auto border border-[#E5DACF] rounded-2xl sm:rounded-3xl bg-white shadow-sm">
          <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-[#E5DACF] bg-[#FAF7F2]">
                <th className="p-4 sm:p-6 w-1/4 font-mono text-[11px] uppercase tracking-wider text-[#827165]">
                  Sanctuary Suite
                </th>
                {displayRooms.map((suite) => (
                  <th key={suite.id} className="p-4 sm:p-6 w-1/4 align-top">
                    <div className="relative aspect-[16/10] rounded-xl overflow-hidden mb-3 border border-[#E5DACF]">
                      <Image
                        src={suite.images[0]}
                        alt={suite.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#B26B4A] block font-semibold">
                      {suite.sanctuary}
                    </span>
                    <h3
                      className="font-stedelijk uppercase text-lg sm:text-xl text-[#221B18] mt-0.5 leading-snug"
                      style={{ textTransform: "uppercase" }}
                    >
                      {suite.title}
                    </h3>
                    <div className="mt-2 font-stedelijk text-lg text-[#221B18]">
                      NPR {suite.priceNpr.toLocaleString()}
                      <span className="text-xs font-normal text-[#827165]"> / night</span>
                    </div>
                    <Link
                      href={`/booking?room=${suite.slug}`}
                      className="mt-3 block text-center bg-[#E8A88A] hover:bg-[#DE9977] text-[#2C231E] py-2 px-3 rounded-full text-xs font-medium transition shadow-xs"
                    >
                      Reserve Suite →
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE1D5] text-[#4A3E36]">
              <tr>
                <td className="p-4 sm:p-5 font-medium bg-[#FAF7F2] text-[#827165]">
                  Location & Altitude
                </td>
                {displayRooms.map((suite) => (
                  <td key={suite.id} className="p-4 sm:p-5 font-semibold text-[#221B18]">
                    {suite.location}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 sm:p-5 font-medium bg-[#FAF7F2] text-[#827165]">
                  Suite Dimensions
                </td>
                {displayRooms.map((suite) => (
                  <td key={suite.id} className="p-4 sm:p-5">
                    {suite.specs.sqFt} sq.ft ({suite.specs.sqM} m²)
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 sm:p-5 font-medium bg-[#FAF7F2] text-[#827165]">
                  Bed Configuration
                </td>
                {displayRooms.map((suite) => (
                  <td key={suite.id} className="p-4 sm:p-5">
                    {suite.specs.bed}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 sm:p-5 font-medium bg-[#FAF7F2] text-[#827165]">
                  Horizon Outlook
                </td>
                {displayRooms.map((suite) => (
                  <td key={suite.id} className="p-4 sm:p-5 font-medium text-[#221B18]">
                    {suite.specs.view}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 sm:p-5 font-medium bg-[#FAF7F2] text-[#827165]">
                  Max Capacity
                </td>
                {displayRooms.map((suite) => (
                  <td key={suite.id} className="p-4 sm:p-5">
                    Up to {suite.specs.maxGuests} Guests
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 sm:p-5 font-medium bg-[#FAF7F2] text-[#827165]">
                  Signature Bath
                </td>
                {displayRooms.map((suite) => (
                  <td key={suite.id} className="p-4 sm:p-5 text-[#2E7D32]">
                    ✓ Freestanding Soaking Tub & Rainshower
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 sm:p-5 font-medium bg-[#FAF7F2] text-[#827165]">
                  Included Privileges
                </td>
                {displayRooms.map((suite) => (
                  <td key={suite.id} className="p-4 sm:p-5 text-xs text-[#5C4F46] space-y-1">
                    <div>• Artisanal Himalayan Breakfast</div>
                    <div>• Dedicated Concierge Butler</div>
                    <div>• High-speed Fiber WiFi</div>
                    <div>• Free cancellation (48h)</div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

export default function RoomComparisonPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center">Loading comparison...</div>}>
      <CompareContent />
    </Suspense>
  );
}
