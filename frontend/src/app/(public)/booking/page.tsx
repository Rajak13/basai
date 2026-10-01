"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { BASAI_SUITES } from "@/data/suites";

function BookingContent() {
  const searchParams = useSearchParams();
  const roomParam = searchParams.get("room");
  const checkInParam = searchParams.get("checkIn") || "2026-10-02";
  const checkOutParam = searchParams.get("checkOut") || "2026-10-04";
  const guestsParam = Number(searchParams.get("guests")) || 2;

  // SELECTED ROOM
  const initialSuite =
    BASAI_SUITES.find((s) => s.slug === roomParam || s.id === roomParam) ||
    BASAI_SUITES[0];

  const [selectedSuiteId, setSelectedSuiteId] = useState<string>(initialSuite.id);
  const [checkIn, setCheckIn] = useState<string>(checkInParam);
  const [checkOut, setCheckOut] = useState<string>(checkOutParam);
  const [guests, setGuests] = useState<number>(guestsParam);
  const [selectedGateway, setSelectedGateway] = useState<string>("ESEWA");
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [bookingRef, setBookingRef] = useState<string>("");

  const activeSuite = useMemo(() => {
    return BASAI_SUITES.find((s) => s.id === selectedSuiteId) || BASAI_SUITES[0];
  }, [selectedSuiteId]);

  // ADD-ONS LIST
  const ADDONS = [
    {
      id: "transfer",
      name: "Private Airport Escort (Luxury AC SUV)",
      desc: "Personal chauffeur greeting directly at Tribhuvan (Kathmandu) or Pokhara airport terminal",
      priceNpr: 4500,
      priceUsd: 35,
    },
    {
      id: "chuli_tasting",
      name: "Chuli Hearth 7-Course Chef's Tasting for Two",
      desc: "Indigenous foraged seasonal dinner paired with Himalayan spirits by the firepit",
      priceNpr: 7500,
      priceUsd: 55,
    },
    {
      id: "monastery",
      name: "Dawn Monastery Walking Meditation & Historian Guide",
      desc: "Private sunrise walking tour of ancient courtyard shrines with our resident historian",
      priceNpr: 3500,
      priceUsd: 25,
    },
  ];

  // NIGHTS CALCULATION
  const nights = useMemo(() => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return isNaN(diffDays) || diffDays <= 0 ? 2 : diffDays;
  }, [checkIn, checkOut]);

  // TOTAL CALCULATIONS
  const baseTotal = activeSuite.priceNpr * nights;
  const addonsTotal = selectedAddons.reduce((sum, addonId) => {
    const addon = ADDONS.find((a) => a.id === addonId);
    return sum + (addon ? addon.priceNpr : 0);
  }, 0);
  const grandTotalNpr = baseTotal + addonsTotal;
  const grandTotalUsd = Math.round(grandTotalNpr / 133);

  const toggleAddon = (id: string) => {
    setSelectedAddons((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const randomRef = `BASAI-${Math.floor(100000 + Math.random() * 900000)}`;
    setBookingRef(randomRef);
    setIsSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
            <Link href="/rooms" className="hover:text-[#B26B4A] transition">
              SANCTUARIES
            </Link>
            <span>/</span>
            <span className="text-[#221B18] font-semibold uppercase">RESERVATION ENGINE</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2 text-[11px] font-mono uppercase tracking-[0.22em] text-[#B26B4A] font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#B26B4A]" />
                <span>DIRECT RESERVATION PRIVILEGE</span>
              </div>
              <h1
                className="font-stedelijk uppercase text-3xl sm:text-5xl lg:text-[56px] text-[#221B18] tracking-wider leading-[1.05]"
                style={{ textTransform: "uppercase" }}
              >
                CONFIRM YOUR SANCTUARY STAY
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-[#5C4F46] max-w-xl">
                Guaranteed room category, organic Himalayan breakfast, flexible 48h cancellation, and personal butler assignment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CONFIRMATION BANNER OR FORM */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-14 py-10 sm:py-14">
        {isSubmitted ? (
          /* INSTANT LUXURY CONFIRMATION SCREEN */
          <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-[#E5DACF] p-8 sm:p-12 shadow-xl text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-[#F7F2EB] border border-[#B26B4A] text-[#B26B4A] flex items-center justify-center text-2xl mx-auto shadow-xs">
              ✓
            </div>

            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#B26B4A] block mb-1">
                SANCTUARY RESERVED
              </span>
              <h2
                className="font-stedelijk uppercase text-3xl sm:text-4xl text-[#221B18]"
                style={{ textTransform: "uppercase" }}
              >
                YOUR STAY IS CONFIRMED
              </h2>
              <div className="mt-3 inline-block font-mono text-xs bg-[#FAF7F2] border border-[#D5C6BA] px-4 py-1.5 rounded-full text-[#4A3E36]">
                Booking Reference: <strong className="text-[#221B18]">{bookingRef}</strong>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#5C4F46] leading-relaxed max-w-lg mx-auto">
              A comprehensive confirmation voucher and arrival guide for <strong>{activeSuite.title}</strong> has been prepared. Our sanctuary concierge will contact your provided WhatsApp / Mobile number 24 hours prior to check-in.
            </p>

            <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#E5DACF] text-xs text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-[#827165]">Sanctuary:</span>
                <span className="font-semibold text-[#221B18]">{activeSuite.sanctuary}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#827165]">Dates:</span>
                <span className="font-semibold text-[#221B18]">{checkIn} to {checkOut} ({nights} Nights)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#827165]">Guests:</span>
                <span className="font-semibold text-[#221B18]">{guests} Adults</span>
              </div>
              <div className="flex justify-between border-t border-[#EAE1D5] pt-2">
                <span className="text-[#827165]">Total Amount:</span>
                <span className="font-semibold text-[#221B18]">NPR {grandTotalNpr.toLocaleString()} (approx. ${grandTotalUsd} USD)</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Link
                href="/rooms"
                className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#221B18] text-white text-xs font-medium hover:bg-[#382F2A] transition"
              >
                Explore Other Sanctuaries
              </Link>
              <Link
                href="/"
                className="w-full sm:w-auto px-6 py-3 rounded-full border border-[#D5C6BA] text-[#221B18] text-xs font-medium hover:bg-[#FAF1E8] transition"
              >
                Return to Home
              </Link>
            </div>
          </div>
        ) : (
          /* RESERVATION CONSOLE TWO-COLUMN LAYOUT */
          <form onSubmit={handleBookingSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-14 items-start">
            {/* LEFT 7-8 COLS: FORM STEPS */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-8">
              {/* STEP 1: SUITE & STAY DATES */}
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E5DACF] p-6 sm:p-8 space-y-5">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#FAF1E8] border border-[#B26B4A] text-[#B26B4A] font-mono text-xs flex items-center justify-center font-semibold">
                    1
                  </span>
                  <h2 className="font-stedelijk uppercase text-xl sm:text-2xl text-[#221B18]">
                    SANCTUARY & STAY SCHEDULE
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* SELECT SUITE CATEGORY */}
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-mono uppercase text-[#827165] block mb-1">
                      Chosen Suite
                    </label>
                    <select
                      value={selectedSuiteId}
                      onChange={(e) => setSelectedSuiteId(e.target.value)}
                      className="w-full bg-[#FAF7F2] border border-[#D5C6BA] rounded-xl p-3 text-xs font-medium text-[#221B18] outline-none cursor-pointer"
                    >
                      {BASAI_SUITES.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.title} — NPR {s.priceNpr.toLocaleString()}/night ({s.sanctuary})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* CHECK-IN */}
                  <div>
                    <label className="text-[10px] font-mono uppercase text-[#827165] block mb-1">
                      Check-In Date
                    </label>
                    <input
                      type="date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      required
                      className="w-full bg-[#FAF7F2] border border-[#D5C6BA] rounded-xl p-3 text-xs font-medium text-[#221B18] outline-none"
                    />
                  </div>

                  {/* CHECK-OUT */}
                  <div>
                    <label className="text-[10px] font-mono uppercase text-[#827165] block mb-1">
                      Check-Out Date
                    </label>
                    <input
                      type="date"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      required
                      className="w-full bg-[#FAF7F2] border border-[#D5C6BA] rounded-xl p-3 text-xs font-medium text-[#221B18] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* STEP 2: GUEST DETAILS */}
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E5DACF] p-6 sm:p-8 space-y-5">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#FAF1E8] border border-[#B26B4A] text-[#B26B4A] font-mono text-xs flex items-center justify-center font-semibold">
                    2
                  </span>
                  <h2 className="font-stedelijk uppercase text-xl sm:text-2xl text-[#221B18]">
                    GUEST REGISTRATION
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="text-[10px] font-mono uppercase text-[#827165] block mb-1">
                      Full Legal Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Maya Shrestha"
                      required
                      className="w-full bg-[#FAF7F2] border border-[#D5C6BA] rounded-xl p-3 text-xs font-medium text-[#221B18] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono uppercase text-[#827165] block mb-1">
                      Mobile / WhatsApp (with country code) *
                    </label>
                    <input
                      type="tel"
                      placeholder="+977 9801234567"
                      required
                      className="w-full bg-[#FAF7F2] border border-[#D5C6BA] rounded-xl p-3 text-xs font-medium text-[#221B18] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono uppercase text-[#827165] block mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      placeholder="maya@example.com"
                      required
                      className="w-full bg-[#FAF7F2] border border-[#D5C6BA] rounded-xl p-3 text-xs font-medium text-[#221B18] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono uppercase text-[#827165] block mb-1">
                      Special Requests (Dietary, High Floor, Early Arrival)
                    </label>
                    <input
                      type="text"
                      placeholder="Optional notes for your butler"
                      className="w-full bg-[#FAF7F2] border border-[#D5C6BA] rounded-xl p-3 text-xs font-medium text-[#221B18] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* STEP 3: CURATED BESPOKE EXPERIENCES & ADD-ONS */}
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E5DACF] p-6 sm:p-8 space-y-5">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#FAF1E8] border border-[#B26B4A] text-[#B26B4A] font-mono text-xs flex items-center justify-center font-semibold">
                    3
                  </span>
                  <h2 className="font-stedelijk uppercase text-xl sm:text-2xl text-[#221B18]">
                    BESPOKE EXPERIENCES & TRANSFERS
                  </h2>
                </div>

                <div className="space-y-3">
                  {ADDONS.map((addon) => {
                    const isChecked = selectedAddons.includes(addon.id);
                    return (
                      <label
                        key={addon.id}
                        className={`flex items-start gap-4 p-4 rounded-xl border transition cursor-pointer select-none ${
                          isChecked
                            ? "border-[#B26B4A] bg-[#FAF1E8]/50"
                            : "border-[#E5DACF] hover:border-[#D5C6BA] bg-white"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleAddon(addon.id)}
                          className="mt-1 accent-[#B26B4A] cursor-pointer"
                        />
                        <div className="flex-1">
                          <span className="font-medium text-xs text-[#221B18] block">
                            {addon.name}
                          </span>
                          <p className="text-[11px] text-[#827165] mt-0.5 leading-relaxed">
                            {addon.desc}
                          </p>
                        </div>
                        <span className="text-xs font-semibold text-[#221B18] shrink-0 font-mono">
                          +NPR {addon.priceNpr.toLocaleString()}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* STEP 4: PAYMENT OPTIONS */}
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E5DACF] p-6 sm:p-8 space-y-5">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#FAF1E8] border border-[#B26B4A] text-[#B26B4A] font-mono text-xs flex items-center justify-center font-semibold">
                    4
                  </span>
                  <h2 className="font-stedelijk uppercase text-xl sm:text-2xl text-[#221B18]">
                    PAYMENT PREFERENCE
                  </h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  {[
                    { id: "ESEWA", label: "eSewa ePay", badge: "Instant Nepal" },
                    { id: "KHALTI", label: "Khalti Wallet", badge: "Instant Nepal" },
                    { id: "STRIPE", label: "Credit Card", badge: "Visa / Mastercard" },
                    { id: "ARRIVAL", label: "Pay on Arrival", badge: "Hold with Card" },
                  ].map((gw) => (
                    <button
                      key={gw.id}
                      type="button"
                      onClick={() => setSelectedGateway(gw.id)}
                      className={`p-3.5 rounded-xl border text-center transition cursor-pointer flex flex-col justify-between ${
                        selectedGateway === gw.id
                          ? "border-[#B26B4A] bg-[#FAF1E8] text-[#221B18] font-semibold shadow-xs"
                          : "border-[#E5DACF] bg-white text-[#4A3E36] hover:border-[#D5C6BA]"
                      }`}
                    >
                      <span className="text-xs block">{gw.label}</span>
                      <span className="text-[10px] text-[#827165] font-mono mt-1 block">
                        {gw.badge}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT 4-5 COLS: SUMMARY CART & INSTANT CTA */}
            <div className="lg:col-span-5 xl:col-span-4 sticky top-24 z-20 space-y-6">
              <div className="bg-white rounded-3xl border border-[#E5DACF] p-6 sm:p-8 shadow-xl space-y-6">
                {/* PREVIEW IMAGE & TITLE */}
                <div className="relative aspect-[16/10] rounded-2xl overflow-hidden border border-[#E5DACF]">
                  <Image
                    src={activeSuite.images[0]}
                    alt={activeSuite.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-[10px] font-mono">
                    {activeSuite.sanctuary}
                  </div>
                </div>

                <div>
                  <h3
                    className="font-stedelijk uppercase text-xl text-[#221B18] leading-tight"
                    style={{ textTransform: "uppercase" }}
                  >
                    {activeSuite.title}
                  </h3>
                  <span className="text-xs text-[#827165] mt-1 block">
                    {nights} Nights · {guests} Adults · {activeSuite.specs.view}
                  </span>
                </div>

                {/* PRICE BREAKDOWN */}
                <div className="space-y-2.5 text-xs text-[#4A3E36] border-t border-b border-[#EAE1D5] py-4">
                  <div className="flex justify-between">
                    <span>
                      NPR {activeSuite.priceNpr.toLocaleString()} × {nights} nights
                    </span>
                    <span className="font-semibold text-[#221B18]">
                      NPR {baseTotal.toLocaleString()}
                    </span>
                  </div>

                  {selectedAddons.length > 0 && (
                    <div className="flex justify-between text-[#827165]">
                      <span>Selected Add-ons & Experiences</span>
                      <span className="font-semibold text-[#221B18]">
                        +NPR {addonsTotal.toLocaleString()}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-[#2E7D32]">
                    <span>Organic Himalayan Breakfast</span>
                    <span>Included</span>
                  </div>

                  <div className="flex justify-between text-[#2E7D32]">
                    <span>All Government Taxes (13% VAT)</span>
                    <span>Included</span>
                  </div>
                </div>

                {/* TOTAL ROW */}
                <div>
                  <div className="flex justify-between items-baseline">
                    <span className="font-mono text-xs uppercase text-[#827165]">
                      Grand Total Due
                    </span>
                    <div className="text-right">
                      <span className="font-stedelijk uppercase text-2xl sm:text-3xl text-[#221B18] block leading-none">
                        NPR {grandTotalNpr.toLocaleString()}
                      </span>
                      <span className="text-[11px] text-[#827165] mt-0.5 block">
                        Approx. ${grandTotalUsd} USD
                      </span>
                    </div>
                  </div>
                </div>

                {/* SUBMIT BUTTON */}
                <button
                  type="submit"
                  className="w-full bg-[#E8A88A] hover:bg-[#DE9977] active:bg-[#D58C6B] text-[#2C231E] font-medium text-sm py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
                >
                  <span>Confirm Reservation</span>
                  <span>→</span>
                </button>

                <div className="text-center space-y-1">
                  <p className="text-[11px] text-[#2E7D32] font-medium">
                    ✓ Direct Sanctuary Guarantee · Best Rate Assured
                  </p>
                  <p className="text-[11px] text-[#827165]">
                    Encrypted secure transaction · Instant PDF confirmation
                  </p>
                </div>
              </div>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}

export default function BookingCheckoutPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center">Loading reservation engine...</div>}>
      <BookingContent />
    </Suspense>
  );
}
