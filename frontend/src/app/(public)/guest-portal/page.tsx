"use client";

import { useState } from "react";
import Link from "next/link";

export default function GuestPortalPage() {
  const [bookingRef, setBookingRef] = useState("BASAI-849201");
  const [isFound, setIsFound] = useState(false);
  const [isCheckinDone, setIsCheckinDone] = useState(false);

  return (
    <div className="w-full min-h-screen bg-[#F7F2EB] text-[#221B18] select-none pb-32">
      {/* HEADER */}
      <section className="w-full pt-10 sm:pt-14 pb-8 sm:pb-12 px-4 sm:px-8 lg:px-14 border-b border-[#EAE1D5]">
        <div className="max-w-[1440px] mx-auto">
          <div className="flex items-center gap-2 text-xs font-mono tracking-wider text-[#827165] mb-4">
            <Link href="/" className="hover:text-[#B26B4A] transition">
              BASAI
            </Link>
            <span>/</span>
            <span className="text-[#221B18] font-semibold">GUEST PORTAL & CONCIERGE</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2 text-[11px] font-mono uppercase tracking-[0.24em] text-[#B26B4A]">
                <span className="w-2 h-2 rounded-full bg-[#B26B4A]" />
                <span>EXPEDITE YOUR ARRIVAL</span>
              </div>
              <h1
                className="font-stedelijk uppercase text-3xl sm:text-5xl lg:text-[56px] text-[#221B18] tracking-wider leading-[1.05]"
                style={{ textTransform: "uppercase" }}
              >
                GUEST PORTAL & EXPRESS CHECK-IN
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-[#5C4F46] max-w-xl">
                Submit ID verification, select custom arrival preferences, and request fireside dining before you arrive.
              </p>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-10 sm:py-14 space-y-8">
        {/* LOOKUP RESERVATION */}
        <section className="bg-white rounded-2xl sm:rounded-3xl border border-[#E5DACF] p-6 sm:p-8 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#827165] font-semibold">
              RETRIEVE YOUR SANCTUARY STAY
            </span>
            <span className="text-xs text-[#827165]">Instant Lookup</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={bookingRef}
              onChange={(e) => setBookingRef(e.target.value)}
              placeholder="e.g. BASAI-849201"
              className="flex-1 bg-[#FAF7F2] border border-[#D5C6BA] p-3 rounded-xl text-xs sm:text-sm font-medium text-[#221B18] outline-none"
            />
            <button
              type="button"
              onClick={() => setIsFound(true)}
              className="bg-[#221B18] hover:bg-[#382F2A] text-white px-6 py-3 rounded-xl text-xs sm:text-sm font-medium transition cursor-pointer"
            >
              Retrieve Stay Details
            </button>
          </div>
        </section>

        {isFound && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* OVERVIEW */}
            <section className="bg-white rounded-2xl sm:rounded-3xl border border-[#E5DACF] p-6 sm:p-8 space-y-5 shadow-sm">
              <div className="flex justify-between items-center border-b border-[#EAE1D5] pb-4">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#B26B4A] block">
                    Confirmed Sanctuary
                  </span>
                  <h2 className="font-stedelijk uppercase text-2xl text-[#221B18] mt-0.5">
                    ROYAL NEWARI HERITAGE SUITE
                  </h2>
                </div>
                <span className="text-xs bg-[#E8F5E9] text-[#2E7D32] font-semibold px-3 py-1 rounded-full border border-[#C8E6C9]">
                  ✓ Confirmed & Allocated
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-mono text-[#827165] block">Sanctuary</span>
                  <span className="font-semibold text-[#221B18] text-sm mt-0.5 block">Dwarika's Heritage</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-[#827165] block">Arrival</span>
                  <span className="font-semibold text-[#221B18] text-sm mt-0.5 block">Oct 2, 2026 (14:00)</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-[#827165] block">Departure</span>
                  <span className="font-semibold text-[#221B18] text-sm mt-0.5 block">Oct 4, 2026 (12:00)</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-[#827165] block">Guest Count</span>
                  <span className="font-semibold text-[#221B18] text-sm mt-0.5 block">2 Adults</span>
                </div>
              </div>
            </section>

            {/* EXPRESS CHECK-IN FORM */}
            <section className="bg-white rounded-2xl sm:rounded-3xl border border-[#E5DACF] p-6 sm:p-8 space-y-5 shadow-sm">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#B26B4A] block font-semibold">
                  CONTACTLESS ARRIVAL
                </span>
                <h3 className="font-stedelijk uppercase text-xl text-[#221B18] mt-0.5">
                  PRE-ARRIVAL REGISTRATION
                </h3>
              </div>

              {isCheckinDone ? (
                <div className="p-5 rounded-2xl bg-[#F1F8E9] border border-[#C5E1A5] text-[#33691E] text-xs space-y-1">
                  <div className="font-semibold text-sm">✓ Express Check-in Complete!</div>
                  <p>Your sanctuary key will be prepared for immediate handover upon arrival at the gate.</p>
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-mono uppercase text-[#827165] block mb-1">
                        Estimated Arrival Time
                      </label>
                      <input
                        type="time"
                        defaultValue="14:30"
                        className="w-full bg-[#FAF7F2] border border-[#D5C6BA] p-3 rounded-xl outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono uppercase text-[#827165] block mb-1">
                        Government ID / Passport No.
                      </label>
                      <input
                        type="text"
                        placeholder="NP-XXXXXXXX or Passport"
                        className="w-full bg-[#FAF7F2] border border-[#D5C6BA] p-3 rounded-xl outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono uppercase text-[#827165] block mb-1">
                      Dietary & Pillow Preferences
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Buckwheat pillow, lactose-free milk"
                      className="w-full bg-[#FAF7F2] border border-[#D5C6BA] p-3 rounded-xl outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsCheckinDone(true)}
                    className="w-full bg-[#E8A88A] hover:bg-[#DE9977] text-[#2C231E] py-3 rounded-xl font-medium text-xs sm:text-sm transition cursor-pointer shadow-xs"
                  >
                    Submit Express Check-In
                  </button>
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
