"use client";

import { useState, useMemo, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import BasaiLogo from "@/components/public/BasaiLogo";
import DualMonthCalendar from "@/components/public/DualMonthCalendar";
import MobileCalendarDrawer from "@/components/public/MobileCalendarDrawer";
import { BASAI_SUITES } from "@/data/suites";

function BookingContent() {
  const searchParams = useSearchParams();
  const roomParam = searchParams.get("room");
  const checkInParam = searchParams.get("checkIn") || "2026-09-30";
  const checkOutParam = searchParams.get("checkOut") || "2026-10-01";
  const guestsParam = Number(searchParams.get("guests")) || 2;

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

  // CUSTOM CALENDAR POPOVER STATE
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
  const [calendarTarget, setCalendarTarget] = useState<"checkIn" | "checkOut">("checkIn");
  const datePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const targetNode = e.target as Node;
      if (datePickerRef.current && !datePickerRef.current.contains(targetNode)) {
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

  const activeSuite = useMemo(() => {
    return BASAI_SUITES.find((s) => s.id === selectedSuiteId) || BASAI_SUITES[0];
  }, [selectedSuiteId]);

  const ADDONS = [
    {
      id: "transfer",
      name: "Private Airport Escort (Luxury AC SUV)",
      desc: "Chauffeur greeting at arrival terminal to your sanctuary",
      priceNpr: 4500,
    },
    {
      id: "chuli_tasting",
      name: "Chuli Hearth 7-Course Chef's Tasting for Two",
      desc: "Seasonal foraged dinner with mountain spirits by firepit",
      priceNpr: 7500,
    },
    {
      id: "monastery",
      name: "Dawn Courtyard Meditation & Historian Guide",
      desc: "Private sunrise walking tour of ancient courtyard shrines",
      priceNpr: 3500,
    },
  ];

  const nights = useMemo(() => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return isNaN(diffDays) || diffDays <= 0 ? 1 : diffDays;
  }, [checkIn, checkOut]);

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
    <div className="w-full min-h-screen bg-[#F7F2EB] text-[#221B18] select-none pb-24">
      {/* ========================================================
          1. INTEGRATED MINIMAL HEADER (NO CLUNKY NAVBAR)
          ======================================================== */}
      <header className="w-full bg-[#1E1B19] text-[#FAF1E8] px-4 sm:px-8 lg:px-14 py-4 sm:py-5 border-b border-white/10">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 group transition-transform hover:scale-105"
            aria-label="Basai Home"
          >
            <BasaiLogo className="h-7 w-auto text-[#E4AA8B]" />
            <span className="font-stedelijk text-xl tracking-[0.2em] uppercase text-[#E4AA8B]">
              BASAI
            </span>
          </Link>

          <Link
            href="/rooms"
            className="text-xs sm:text-sm font-medium text-[#E4AA8B]/80 hover:text-[#E4AA8B] tracking-wider uppercase transition flex items-center gap-1.5"
          >
            <span>←</span>
            <span>All Sanctuaries</span>
          </Link>
        </div>
      </header>

      {/* ========================================================
          2. RESERVATION HERO BANNER
          ======================================================== */}
      <section className="w-full bg-[#1E1B19] text-[#FAF1E8] pb-12 px-4 sm:px-8 lg:px-14">
        <div className="max-w-[1440px] mx-auto pt-6">
          <div className="flex items-center gap-2 mb-2 text-[11px] font-mono uppercase tracking-[0.22em] text-[#E4AA8B]">
            <span className="w-2 h-2 rounded-full bg-[#E4AA8B]" />
            <span>DIRECT RESERVATION PRIVILEGE</span>
          </div>
          <h1
            className="font-stedelijk uppercase text-3xl sm:text-5xl text-[#E4AA8B] tracking-wider leading-[1.06]"
            style={{ textTransform: "uppercase" }}
          >
            CONFIRM YOUR SANCTUARY STAY
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-white/70 max-w-xl">
            Direct booking ensures optimal suite allocation, complimentary organic breakfast, and 48-hour flexible cancellation.
          </p>
        </div>
      </section>

      {/* ========================================================
          3. MAIN BOOKING ENGINE
          ======================================================== */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-14 -mt-4">
        {isSubmitted ? (
          /* CONFIRMATION CARD */
          <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-[#E5DACF] p-8 sm:p-12 shadow-xl text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-[#F7F2EB] border border-[#B26B4A] text-[#B26B4A] flex items-center justify-center text-2xl mx-auto">
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
                Reference: <strong className="text-[#221B18]">{bookingRef}</strong>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#5C4F46] leading-relaxed max-w-lg mx-auto">
              A comprehensive itinerary for <strong>{activeSuite.title}</strong> has been secured. Our sanctuary concierge will contact your WhatsApp / Mobile number 24 hours prior to check-in.
            </p>

            <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#E5DACF] text-xs text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-[#827165]">Sanctuary:</span>
                <span className="font-semibold text-[#221B18]">{activeSuite.sanctuary}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#827165]">Schedule:</span>
                <span className="font-semibold text-[#221B18]">
                  {checkIn} to {checkOut} ({nights} Night{nights > 1 ? "s" : ""})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#827165]">Guests:</span>
                <span className="font-semibold text-[#221B18]">{guests} Adults</span>
              </div>
              <div className="flex justify-between border-t border-[#EAE1D5] pt-2">
                <span className="text-[#827165]">Grand Total:</span>
                <span className="font-semibold text-[#221B18]">
                  NPR {grandTotalNpr.toLocaleString()} (${grandTotalUsd} USD)
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Link
                href="/rooms"
                className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#221B18] text-white text-xs font-medium hover:bg-[#382F2A] transition"
              >
                View Other Sanctuaries
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
          /* FORM LAYOUT */
          <form onSubmit={handleBookingSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-14 items-start">
            {/* LEFT 7-8 COLS: FORM STEPS */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-8">
              {/* STEP 1: SUITE & CUSTOM BESPOKE CALENDAR */}
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E5DACF] p-6 sm:p-8 space-y-5 shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#FAF1E8] border border-[#B26B4A] text-[#B26B4A] font-mono text-xs flex items-center justify-center font-semibold">
                    1
                  </span>
                  <h2 className="font-stedelijk uppercase text-xl sm:text-2xl text-[#221B18]">
                    SUITE SELECTION & CALENDAR DATES
                  </h2>
                </div>

                <div className="space-y-4">
                  {/* SUITE DROPDOWN */}
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#827165] block mb-1">
                      Sanctuary Suite
                    </span>
                    <select
                      value={selectedSuiteId}
                      onChange={(e) => setSelectedSuiteId(e.target.value)}
                      className="w-full bg-[#FAF7F2] border border-[#D5C6BA] rounded-xl p-3.5 text-xs font-medium text-[#221B18] outline-none cursor-pointer"
                    >
                      {BASAI_SUITES.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.title} — NPR {s.priceNpr.toLocaleString()}/night ({s.sanctuary})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* CUSTOM CALENDAR BUTTONS */}
                  <div ref={datePickerRef} className="relative">
                    <span className="text-[10px] font-mono uppercase text-[#827165] block mb-1.5">
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
                        className={`w-full rounded-xl border p-3 flex flex-col items-center justify-center text-center cursor-pointer transition shadow-2xs group min-h-[96px] ${
                          isCalendarOpen && calendarTarget === "checkIn"
                            ? "bg-[#F0D5C7] border-[#DE9977] ring-1 ring-[#DE9977]"
                            : "bg-[#FAF7F2] border-[#D5C6BA] hover:border-[#DE9977]"
                        }`}
                      >
                        <span className="text-[10px] font-mono uppercase text-[#827165] mb-0.5">
                          Check-in Date
                        </span>
                        <span className="text-3xl font-semibold text-[#2C231E] tracking-tight leading-none">
                          {checkInParsed.day}.
                        </span>
                        <span className="text-xs text-[#52463E] mt-1 font-medium">
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
                        className={`w-full rounded-xl border p-3 flex flex-col items-center justify-center text-center cursor-pointer transition shadow-2xs group min-h-[96px] ${
                          isCalendarOpen && calendarTarget === "checkOut"
                            ? "bg-[#F0D5C7] border-[#DE9977] ring-1 ring-[#DE9977]"
                            : "bg-[#FAF7F2] border-[#D5C6BA] hover:border-[#DE9977]"
                        }`}
                      >
                        <span className="text-[10px] font-mono uppercase text-[#827165] mb-0.5">
                          Check-out Date
                        </span>
                        <span className="text-3xl font-semibold text-[#2C231E] tracking-tight leading-none">
                          {checkOutParsed.day}.
                        </span>
                        <span className="text-xs text-[#52463E] mt-1 font-medium">
                          {checkOutParsed.month} {checkOutParsed.year}
                        </span>
                        <span className="text-[8px] text-[#2C231E] mt-1">▼</span>
                      </button>
                    </div>

                    {/* DUAL-MONTH CALENDAR MODAL POPOVER */}
                    {isCalendarOpen && (
                      <div className="hidden md:block absolute top-[105%] left-0 z-50 animate-in fade-in zoom-in-95 duration-200">
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

              {/* MOBILE CALENDAR DRAWER */}
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

              {/* STEP 2: GUEST DETAILS */}
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E5DACF] p-6 sm:p-8 space-y-5 shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#FAF1E8] border border-[#B26B4A] text-[#B26B4A] font-mono text-xs flex items-center justify-center font-semibold">
                    2
                  </span>
                  <h2 className="font-stedelijk uppercase text-xl sm:text-2xl text-[#221B18]">
                    GUEST DETAILS
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
                      Mobile / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      placeholder="+977 98XXXXXXXX"
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
                      Special Butler Requests
                    </label>
                    <input
                      type="text"
                      placeholder="Dietary, early check-in notes"
                      className="w-full bg-[#FAF7F2] border border-[#D5C6BA] rounded-xl p-3 text-xs font-medium text-[#221B18] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* STEP 3: BESPOKE ADD-ONS */}
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E5DACF] p-6 sm:p-8 space-y-5 shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#FAF1E8] border border-[#B26B4A] text-[#B26B4A] font-mono text-xs flex items-center justify-center font-semibold">
                    3
                  </span>
                  <h2 className="font-stedelijk uppercase text-xl sm:text-2xl text-[#221B18]">
                    HIMALAYAN EXPERIENCES & TRANSFERS
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
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E5DACF] p-6 sm:p-8 space-y-5 shadow-xs">
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

            {/* RIGHT: SUMMARY CARD */}
            <div className="lg:col-span-5 xl:col-span-4 sticky top-6 z-20 space-y-6">
              <div className="bg-white rounded-3xl border border-[#E5DACF] p-6 sm:p-8 shadow-xl space-y-6">
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
                    {nights} Night{nights > 1 ? "s" : ""} · {guests} Adults · {activeSuite.specs.view}
                  </span>
                </div>

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
                      <span>Add-ons & Experiences</span>
                      <span className="font-semibold text-[#221B18]">
                        +NPR {addonsTotal.toLocaleString()}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-[#2E7D32]">
                    <span>Himalayan Organic Breakfast</span>
                    <span>Included</span>
                  </div>

                  <div className="flex justify-between text-[#2E7D32]">
                    <span>All Taxes (13% VAT)</span>
                    <span>Included</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-baseline">
                    <span className="font-mono text-xs uppercase text-[#827165]">
                      Total Due
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
                    Encrypted secure transaction · Instant confirmation
                  </p>
                </div>
              </div>
            </div>
          </form>
        )}
      </main>

      {/* QUIET MINIMAL FOOTER STRIP */}
      <footer className="mt-20 text-center border-t border-[#EAE1D5] pt-8 text-[11px] font-mono text-[#827165] uppercase">
        BASAI RESIDENCES & SANCTUARIES · KATHMANDU · POKHARA · MUSTANG · DHARAN
      </footer>
    </div>
  );
}

export default function BookingCheckoutPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs">Loading reservation engine...</div>}>
      <BookingContent />
    </Suspense>
  );
}
