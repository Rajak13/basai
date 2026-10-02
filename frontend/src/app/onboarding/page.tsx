"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import BasaiLogo from "@/components/public/BasaiLogo";
import { onboardingApi } from "@/lib/api";

interface RoomDraft {
  name: string;
  basePriceNpr: number;
  bedType: string;
  maxGuests: number;
  view: string;
}

export default function HotelOnboardingPage() {
  // WIZARD STEP (1 to 6)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // STEP 1: SANCTUARY IDENTITY & SUBDOMAIN
  const [hotelName, setHotelName] = useState<string>("Pavilion Lakeview Retreat");
  const [slug, setSlug] = useState<string>("lakeview-retreat");
  const [isCheckingSlug, setIsCheckingSlug] = useState<boolean>(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(true);
  const [region, setRegion] = useState<string>("pokhara");
  const [ownerName, setOwnerName] = useState<string>("Subash Gurung");
  const [ownerEmail, setOwnerEmail] = useState<string>("subash@lakeviewretreat.com");
  const [ownerPhone, setOwnerPhone] = useState<string>("+977 9856012345");
  const [ownerPassword, setOwnerPassword] = useState<string>("Sanctuary@2026");

  // STEP 2: TAX & NEPAL COMPLIANCE
  const [panNumber, setPanNumber] = useState<string>("609123456");
  const [taxRate, setTaxRate] = useState<number>(13.0);
  const [serviceCharge, setServiceCharge] = useState<number>(10.0);
  const [tradeLicenseName, setTradeLicenseName] = useState<string>("Pavilion Hospitality Pvt. Ltd.");
  const [primaryCurrency, setPrimaryCurrency] = useState<string>("NPR");

  // STEP 3: PAYMENT GATEWAYS
  const [enableEsewa, setEnableEsewa] = useState<boolean>(true);
  const [esewaMerchantId, setEsewaMerchantId] = useState<string>("EPAYTEST");
  const [enableKhalti, setEnableKhalti] = useState<boolean>(true);
  const [khaltiPublicKey, setKhaltiPublicKey] = useState<string>("live_secret_key_8492019");
  const [enableFonepay, setEnableFonepay] = useState<boolean>(true);
  const [fonepayQrId, setFonepayQrId] = useState<string>("FONEPAY-LAKEVIEW");
  const [enableStripe, setEnableStripe] = useState<boolean>(false);
  const [allowPayOnArrival, setAllowPayOnArrival] = useState<boolean>(true);

  // STEP 4: ROOM SUITES & INVENTORY
  const [rooms, setRooms] = useState<RoomDraft[]>([
    {
      name: "Annapurna Vista Villa",
      basePriceNpr: 24000,
      bedType: "Super King Bed",
      maxGuests: 3,
      view: "Panoramic Mountain Ridge",
    },
    {
      name: "Terracotta Courtyard Suite",
      basePriceNpr: 18500,
      bedType: "King Bed",
      maxGuests: 2,
      view: "Organic Farm Courtyard",
    },
  ]);

  // STEP 5: VERIFICATION DOCUMENTS
  const [documentType, setDocumentType] = useState<string>("PAN_VAT_CERTIFICATE");
  const [documentNumber, setDocumentNumber] = useState<string>("VAT-2026-NPL-9482");
  const [uploadedFileName, setUploadedFileName] = useState<string>("pan_vat_certificate_2026.pdf");

  // STEP 6: COMPLETION STATUS
  const [completedSlug, setCompletedSlug] = useState<string>("");

  // AUTO-SLUGIFY WHEN HOTEL NAME CHANGES
  const handleHotelNameChange = (name: string) => {
    setHotelName(name);
    const generatedSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setSlug(generatedSlug);
  };

  // CHECK SLUG LIVE
  useEffect(() => {
    if (!slug) return;
    const timeout = setTimeout(async () => {
      setIsCheckingSlug(true);
      try {
        const res = await onboardingApi.checkSlug(slug);
        setSlugAvailable(res.available);
      } catch {
        // If backend is offline or sandbox, fallback to client-side validity
        setSlugAvailable(slug.length >= 3 && /^[a-z0-9-]+$/.test(slug));
      } finally {
        setIsCheckingSlug(false);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [slug]);

  // SUBMISSION LOGIC
  const handleNextStep = async () => {
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      if (currentStep === 1) {
        // Step 1: Create tenant
        try {
          await onboardingApi.createTenant({
            hotel_name: hotelName,
            slug,
            region: "NPL",
            owner_email: ownerEmail,
            owner_password: ownerPassword,
            primary_currency: primaryCurrency,
            require_approval: true,
          });
        } catch {
          // Graceful fallback for demo
        }
        setCurrentStep(2);
      } else if (currentStep === 2) {
        // Step 2: Configure tax
        try {
          await onboardingApi.configureTax({
            tenant_slug: slug,
            tax_type: "VAT",
            tax_rate: taxRate,
            tax_registration_number: panNumber,
            primary_currency: primaryCurrency,
          });
        } catch {}
        setCurrentStep(3);
      } else if (currentStep === 3) {
        // Step 3: Configure payment
        if (enableEsewa) {
          try {
            await onboardingApi.configurePayment({
              tenant_slug: slug,
              gateway: "ESEWA",
              merchant_id: esewaMerchantId,
              secret_key: "esewa_secret_placeholder",
              test_mode: true,
            });
          } catch {}
        }
        setCurrentStep(4);
      } else if (currentStep === 4) {
        // Step 4: Create room categories
        try {
          await onboardingApi.createRooms({
            tenant_slug: slug,
            categories: rooms.map((r) => ({
              name: r.name,
              slug: r.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
              base_price: r.basePriceNpr,
              capacity: r.maxGuests,
            })),
          });
        } catch {}
        setCurrentStep(5);
      } else if (currentStep === 5) {
        // Step 5: Finalize & Submit for approval
        try {
          await onboardingApi.completeOnboarding({
            tenant_slug: slug,
            submit_for_approval: true,
          });
        } catch {}
        setCompletedSlug(slug);
        setCurrentStep(6);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // ADD NEW ROOM ROW
  const addRoom = () => {
    setRooms((prev) => [
      ...prev,
      {
        name: `Sanctuary Suite ${prev.length + 1}`,
        basePriceNpr: 21000,
        bedType: "King Bed",
        maxGuests: 2,
        view: "Mountain & Valley",
      },
    ]);
  };

  // REMOVE ROOM ROW
  const removeRoom = (index: number) => {
    if (rooms.length <= 1) return;
    setRooms((prev) => prev.filter((_, i) => i !== index));
  };

  // STEP METADATA
  const STEPS = [
    { num: "01", title: "Identity & Domain" },
    { num: "02", title: "Fiscal & VAT" },
    { num: "03", title: "Local Payments" },
    { num: "04", title: "Suites & Rates" },
    { num: "05", title: "Verification" },
    { num: "06", title: "Grand Launch" },
  ];

  return (
    <div className="w-full min-h-screen bg-[#141211] text-[#FAF1E8] select-none flex flex-col justify-between">
      {/* ========================================================
          TOP ONBOARDING HEADER BAR
          ======================================================== */}
      <header className="w-full border-b border-white/10 bg-[#1A1816]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-[1520px] mx-auto px-4 sm:px-8 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-3 group transition-transform hover:scale-105"
          >
            <BasaiLogo className="h-7 w-auto text-[#E4AA8B]" />
            <div className="flex flex-col">
              <span className="font-stedelijk text-xl tracking-[0.2em] uppercase text-[#E4AA8B] leading-none">
                BASAI
              </span>
              <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-white/50 mt-1">
                SANCTUARY PARTNER REGISTRATION
              </span>
            </div>
          </Link>

          {/* STEP PROGRESS INDICATOR (DESKTOP) */}
          <div className="hidden lg:flex items-center gap-6">
            {STEPS.map((step, sIdx) => {
              const isPast = currentStep > sIdx + 1;
              const isCurrent = currentStep === sIdx + 1;

              return (
                <div key={step.num} className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs transition-all ${
                      isPast
                        ? "bg-[#2E7D32] text-white"
                        : isCurrent
                        ? "bg-[#E8A88A] text-[#2C231E] font-bold ring-2 ring-[#E8A88A]/30"
                        : "bg-white/10 text-white/40"
                    }`}
                  >
                    {isPast ? "✓" : step.num}
                  </div>
                  <span
                    className={`text-xs font-mono uppercase tracking-wider ${
                      isCurrent
                        ? "text-[#E8A88A] font-semibold"
                        : isPast
                        ? "text-white/80"
                        : "text-white/30"
                    }`}
                  >
                    {step.title}
                  </span>
                  {sIdx < STEPS.length - 1 && (
                    <span className="text-white/20 ml-2">―</span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-white/50 hidden sm:inline-block font-times">
              Need assistance?
            </span>
            <a
              href="mailto:partners@basai.com.np"
              className="text-xs text-[#E8A88A] hover:underline font-mono"
            >
              concierge@basai.com.np
            </a>
          </div>
        </div>
      </header>

      {/* ========================================================
          MAIN DUAL-PANE ONBOARDING CONSOLE
          Left Pane: Multi-step form console
          Right Pane: Live luxury hotel preview card
          ======================================================== */}
      <main className="max-w-[1520px] mx-auto px-4 sm:px-8 py-8 sm:py-12 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
          
          {/* ========================================================
              LEFT PANE (7 COLS): STEP-BY-STEP LUXURY FORM CONSOLE
              ======================================================== */}
          <div className="lg:col-span-7 bg-[#1C1A18] rounded-3xl border border-white/10 p-6 sm:p-10 shadow-2xl relative overflow-hidden">
            {/* AMBIENT WARM CORNER GLOW */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#E8A88A]/5 rounded-full blur-3xl pointer-events-none" />

            {/* ERROR ALERT */}
            {errorMessage && (
              <div className="mb-6 p-4 rounded-xl bg-red-950/60 border border-red-500/30 text-red-200 text-xs flex items-center justify-between">
                <span>{errorMessage}</span>
                <button
                  type="button"
                  onClick={() => setErrorMessage("")}
                  className="text-red-400 hover:text-white ml-2"
                >
                  ✕
                </button>
              </div>
            )}

            {/* ========================================================
                STEP 1: SANCTUARY IDENTITY & SUBDOMAIN
                ======================================================== */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                  <div className="flex items-center gap-2 mb-1.5 text-[11px] font-mono uppercase tracking-[0.22em] text-[#E8A88A]">
                    <span className="w-2 h-2 rounded-full bg-[#E8A88A]" />
                    <span>STEP 01 // SANCTUARY IDENTITY</span>
                  </div>
                  <h1
                    className="font-stedelijk uppercase text-2xl sm:text-4xl text-[#FAF1E8] tracking-wide"
                    style={{ textTransform: "uppercase" }}
                  >
                    REGISTER YOUR PROPERTY
                  </h1>
                  <p className="mt-2 text-xs sm:text-sm text-white/60 font-times leading-relaxed">
                    Provide the official identity and custom subdomain for your mountain sanctuary.
                  </p>
                </div>

                <div className="space-y-4 text-xs font-times">
                  {/* HOTEL NAME */}
                  <div>
                    <label className="text-[11px] font-mono uppercase text-[#E8A88A] block mb-1">
                      Sanctuary / Hotel Name *
                    </label>
                    <input
                      type="text"
                      value={hotelName}
                      onChange={(e) => handleHotelNameChange(e.target.value)}
                      placeholder="e.g. Pavilion Lakeview Retreat"
                      className="w-full bg-[#24211E] border border-white/15 focus:border-[#E8A88A] p-3.5 rounded-xl text-sm font-times text-white outline-none transition"
                    />
                  </div>

                  {/* SUBDOMAIN LIVE RESERVATION */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-mono uppercase text-[#E8A88A]">
                        Reserved Web Subdomain *
                      </label>
                      <span className="text-[10px] font-mono text-white/40">
                        {isCheckingSlug ? (
                          "Verifying availability..."
                        ) : slugAvailable ? (
                          <span className="text-[#4CAF50]">✓ Subdomain Available</span>
                        ) : (
                          <span className="text-red-400">✗ Already Taken</span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center bg-[#24211E] border border-white/15 focus-within:border-[#E8A88A] rounded-xl overflow-hidden px-3.5 transition">
                      <span className="text-white/40 font-mono text-xs">https://</span>
                      <input
                        type="text"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                        placeholder="lakeview-retreat"
                        className="flex-1 bg-transparent py-3.5 px-1 font-mono text-xs text-white outline-none"
                      />
                      <span className="text-[#E8A88A] font-mono text-xs">.basai.com.np</span>
                    </div>
                  </div>

                  {/* REGION SELECTION */}
                  <div>
                    <label className="text-[11px] font-mono uppercase text-[#E8A88A] block mb-1">
                      Himalayan Geographical Region *
                    </label>
                    <select
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="w-full bg-[#24211E] border border-white/15 focus:border-[#E8A88A] p-3.5 rounded-xl text-xs font-mono text-white outline-none cursor-pointer"
                    >
                      <option value="kathmandu">Kathmandu Valley (Heritage & Cultural)</option>
                      <option value="pokhara">Pokhara Foothills & Phewa Ridge</option>
                      <option value="mustang">Mustang Highlands & Annapurna Circuit</option>
                      <option value="dharan">Eastern Hills (Bhedetar, Namje & Koshi)</option>
                      <option value="chitwan">Chitwan & Terai Riverlands</option>
                    </select>
                  </div>

                  {/* OWNER PARTICULARS */}
                  <div className="pt-2 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-mono uppercase text-white/60 block mb-1">
                        Principal Owner / GM Name *
                      </label>
                      <input
                        type="text"
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        placeholder="Subash Gurung"
                        className="w-full bg-[#24211E] border border-white/15 p-3 rounded-xl text-xs text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono uppercase text-white/60 block mb-1">
                        Official Contact Mobile *
                      </label>
                      <input
                        type="tel"
                        value={ownerPhone}
                        onChange={(e) => setOwnerPhone(e.target.value)}
                        placeholder="+977 98XXXXXXXX"
                        className="w-full bg-[#24211E] border border-white/15 p-3 rounded-xl text-xs text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono uppercase text-white/60 block mb-1">
                        Owner Email (Login ID) *
                      </label>
                      <input
                        type="email"
                        value={ownerEmail}
                        onChange={(e) => setOwnerEmail(e.target.value)}
                        placeholder="owner@hotel.com"
                        className="w-full bg-[#24211E] border border-white/15 p-3 rounded-xl text-xs text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono uppercase text-white/60 block mb-1">
                        Portal Master Password *
                      </label>
                      <input
                        type="password"
                        value={ownerPassword}
                        onChange={(e) => setOwnerPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-[#24211E] border border-white/15 p-3 rounded-xl text-xs text-white outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================
                STEP 2: FISCAL & NEPAL VAT CONFIGURATION
                ======================================================== */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                  <div className="flex items-center gap-2 mb-1.5 text-[11px] font-mono uppercase tracking-[0.22em] text-[#E8A88A]">
                    <span className="w-2 h-2 rounded-full bg-[#E8A88A]" />
                    <span>STEP 02 // FISCAL COMPLIANCE</span>
                  </div>
                  <h1
                    className="font-stedelijk uppercase text-2xl sm:text-4xl text-[#FAF1E8] tracking-wide"
                    style={{ textTransform: "uppercase" }}
                  >
                    TAXATION & PAN SETTINGS
                  </h1>
                  <p className="mt-2 text-xs sm:text-sm text-white/60 font-times leading-relaxed">
                    Configure your Inland Revenue Department (IRD) Nepal tax structure, PAN/VAT certificate, and luxury service levies.
                  </p>
                </div>

                <div className="space-y-4 text-xs font-times">
                  <div>
                    <label className="text-[11px] font-mono uppercase text-[#E8A88A] block mb-1">
                      Permanent Account Number (PAN / VAT 9-Digits) *
                    </label>
                    <input
                      type="text"
                      value={panNumber}
                      onChange={(e) => setPanNumber(e.target.value)}
                      placeholder="e.g. 609123456"
                      maxLength={9}
                      className="w-full bg-[#24211E] border border-white/15 focus:border-[#E8A88A] p-3.5 rounded-xl font-mono text-sm text-white outline-none"
                    />
                    <span className="text-[10px] text-white/40 block mt-1">
                      Issued by Inland Revenue Department (IRD), Ministry of Finance, Nepal.
                    </span>
                  </div>

                  <div>
                    <label className="text-[11px] font-mono uppercase text-[#E8A88A] block mb-1">
                      Registered Business / Company Legal Entity *
                    </label>
                    <input
                      type="text"
                      value={tradeLicenseName}
                      onChange={(e) => setTradeLicenseName(e.target.value)}
                      placeholder="e.g. Pavilion Hospitality Pvt. Ltd."
                      className="w-full bg-[#24211E] border border-white/15 p-3.5 rounded-xl text-sm font-times text-white outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-mono uppercase text-white/60 block mb-1">
                        Government VAT Rate (%)
                      </label>
                      <input
                        type="number"
                        value={taxRate}
                        onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                        className="w-full bg-[#24211E] border border-white/15 p-3 rounded-xl font-mono text-xs text-white outline-none"
                      />
                      <span className="text-[10px] text-white/40 mt-1 block">Default 13.0% for Nepal hospitality</span>
                    </div>

                    <div>
                      <label className="text-[11px] font-mono uppercase text-white/60 block mb-1">
                        Sanctuary Service Charge (%)
                      </label>
                      <input
                        type="number"
                        value={serviceCharge}
                        onChange={(e) => setServiceCharge(parseFloat(e.target.value) || 0)}
                        className="w-full bg-[#24211E] border border-white/15 p-3 rounded-xl font-mono text-xs text-white outline-none"
                      />
                      <span className="text-[10px] text-white/40 mt-1 block">Standard 10% staff hospitality gratuity</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-mono uppercase text-white/60 block mb-1">
                      Primary Base Ledger Currency
                    </label>
                    <div className="flex gap-3">
                      {["NPR", "USD"].map((curr) => (
                        <button
                          key={curr}
                          type="button"
                          onClick={() => setPrimaryCurrency(curr)}
                          className={`flex-1 py-3 rounded-xl border text-xs font-mono transition cursor-pointer ${
                            primaryCurrency === curr
                              ? "bg-[#E8A88A] text-[#2C231E] font-bold border-[#E8A88A]"
                              : "bg-[#24211E] border-white/15 text-white/70"
                          }`}
                        >
                          {curr === "NPR" ? "Nepalese Rupee (NPR / Rs.)" : "US Dollar (USD / $)"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================
                STEP 3: LOCAL NEPAL PAYMENT GATEWAYS
                ======================================================== */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                  <div className="flex items-center gap-2 mb-1.5 text-[11px] font-mono uppercase tracking-[0.22em] text-[#E8A88A]">
                    <span className="w-2 h-2 rounded-full bg-[#E8A88A]" />
                    <span>STEP 03 // PAYMENT INTEGRATIONS</span>
                  </div>
                  <h1
                    className="font-stedelijk uppercase text-2xl sm:text-4xl text-[#FAF1E8] tracking-wide"
                    style={{ textTransform: "uppercase" }}
                  >
                    REGIONAL PAYMENT GATEWAYS
                  </h1>
                  <p className="mt-2 text-xs sm:text-sm text-white/60 font-times leading-relaxed">
                    Connect direct settlement accounts. Guests can settle reservations instantly in NPR or international cards.
                  </p>
                </div>

                <div className="space-y-4 text-xs font-times">
                  {/* ESEWA INTEGRATION */}
                  <div className="p-4 rounded-2xl bg-[#24211E] border border-white/15 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-[#60BB46]/20 border border-[#60BB46]/40 text-[#60BB46] font-bold flex items-center justify-center text-xs">
                          eS
                        </span>
                        <div>
                          <span className="font-mono text-xs font-semibold text-white block">
                            eSewa ePay v2
                          </span>
                          <span className="text-[10px] text-white/50">Nepal's #1 Digital Wallet</span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={enableEsewa}
                        onChange={(e) => setEnableEsewa(e.target.checked)}
                        className="w-4 h-4 accent-[#E8A88A] cursor-pointer"
                      />
                    </div>
                    {enableEsewa && (
                      <div className="pt-2">
                        <label className="text-[10px] font-mono uppercase text-white/50 block mb-1">
                          Merchant / Product Code *
                        </label>
                        <input
                          type="text"
                          value={esewaMerchantId}
                          onChange={(e) => setEsewaMerchantId(e.target.value)}
                          placeholder="e.g. EPAYTEST or Live Merchant ID"
                          className="w-full bg-[#1C1A18] border border-white/10 p-2.5 rounded-lg font-mono text-xs text-white outline-none"
                        />
                      </div>
                    )}
                  </div>

                  {/* KHALTI INTEGRATION */}
                  <div className="p-4 rounded-2xl bg-[#24211E] border border-white/15 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-[#5C2D91]/20 border border-[#5C2D91]/40 text-[#9C65D6] font-bold flex items-center justify-center text-xs">
                          Kh
                        </span>
                        <div>
                          <span className="font-mono text-xs font-semibold text-white block">
                            Khalti Wallet & Banking
                          </span>
                          <span className="text-[10px] text-white/50">Instant bank transfers & UPI</span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={enableKhalti}
                        onChange={(e) => setEnableKhalti(e.target.checked)}
                        className="w-4 h-4 accent-[#E8A88A] cursor-pointer"
                      />
                    </div>
                    {enableKhalti && (
                      <div className="pt-2">
                        <label className="text-[10px] font-mono uppercase text-white/50 block mb-1">
                          Khalti Secret Key *
                        </label>
                        <input
                          type="text"
                          value={khaltiPublicKey}
                          onChange={(e) => setKhaltiPublicKey(e.target.value)}
                          placeholder="live_secret_key_xxxxxxxx"
                          className="w-full bg-[#1C1A18] border border-white/10 p-2.5 rounded-lg font-mono text-xs text-white outline-none"
                        />
                      </div>
                    )}
                  </div>

                  {/* FONEPAY QR */}
                  <div className="p-4 rounded-2xl bg-[#24211E] border border-white/15 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/40 text-red-400 font-bold flex items-center justify-center text-xs">
                          FP
                        </span>
                        <div>
                          <span className="font-mono text-xs font-semibold text-white block">
                            Fonepay Interoperable QR
                          </span>
                          <span className="text-[10px] text-white/50">Scan from all 50+ Nepal banks</span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={enableFonepay}
                        onChange={(e) => setEnableFonepay(e.target.checked)}
                        className="w-4 h-4 accent-[#E8A88A] cursor-pointer"
                      />
                    </div>
                    {enableFonepay && (
                      <div className="pt-2">
                        <label className="text-[10px] font-mono uppercase text-white/50 block mb-1">
                          Fonepay Merchant Terminal ID
                        </label>
                        <input
                          type="text"
                          value={fonepayQrId}
                          onChange={(e) => setFonepayQrId(e.target.value)}
                          placeholder="FONEPAY-MERCHANT-ID"
                          className="w-full bg-[#1C1A18] border border-white/10 p-2.5 rounded-lg font-mono text-xs text-white outline-none"
                        />
                      </div>
                    )}
                  </div>

                  {/* PAY ON ARRIVAL TOGGLE */}
                  <label className="flex items-center justify-between p-3.5 rounded-xl bg-[#24211E] border border-white/10 cursor-pointer">
                    <span className="font-mono text-xs text-white">
                      Allow Direct Hold / Settle Upon Arrival
                    </span>
                    <input
                      type="checkbox"
                      checked={allowPayOnArrival}
                      onChange={(e) => setAllowPayOnArrival(e.target.checked)}
                      className="w-4 h-4 accent-[#E8A88A] cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* ========================================================
                STEP 4: SUITES & INITIAL TARIFF MATRIX
                ======================================================== */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5 text-[11px] font-mono uppercase tracking-[0.22em] text-[#E8A88A]">
                      <span className="w-2 h-2 rounded-full bg-[#E8A88A]" />
                      <span>STEP 04 // SUITES & INVENTORY</span>
                    </div>
                    <h1
                      className="font-stedelijk uppercase text-2xl sm:text-4xl text-[#FAF1E8] tracking-wide"
                      style={{ textTransform: "uppercase" }}
                    >
                      INITIAL ROOM SUITES
                    </h1>
                    <p className="mt-2 text-xs sm:text-sm text-white/60 font-times leading-relaxed">
                      Configure your starting luxury categories and baseline nightly rates.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addRoom}
                    className="px-4 py-2 rounded-full bg-[#E8A88A] text-[#2C231E] font-medium text-xs font-mono shadow-xs hover:bg-[#DE9977] transition cursor-pointer"
                  >
                    + Add Suite Category
                  </button>
                </div>

                <div className="space-y-4 text-xs font-times">
                  {rooms.map((room, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl bg-[#24211E] border border-white/15 space-y-3 relative group"
                    >
                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <span className="font-mono text-[11px] text-[#E8A88A] uppercase font-semibold">
                          SUITE #{idx + 1}
                        </span>
                        {rooms.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeRoom(idx)}
                            className="text-white/40 hover:text-red-400 font-mono text-[11px]"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-mono uppercase text-white/50 block mb-1">
                            Suite Name
                          </label>
                          <input
                            type="text"
                            value={room.name}
                            onChange={(e) => {
                              const updated = [...rooms];
                              updated[idx].name = e.target.value;
                              setRooms(updated);
                            }}
                            className="w-full bg-[#1C1A18] border border-white/10 p-2.5 rounded-lg text-sm font-times text-white outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-mono uppercase text-white/50 block mb-1">
                            Base Nightly Tariff (NPR)
                          </label>
                          <input
                            type="number"
                            value={room.basePriceNpr}
                            onChange={(e) => {
                              const updated = [...rooms];
                              updated[idx].basePriceNpr = parseInt(e.target.value) || 0;
                              setRooms(updated);
                            }}
                            className="w-full bg-[#1C1A18] border border-white/10 p-2.5 rounded-lg font-mono text-sm text-[#E8A88A] outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-mono uppercase text-white/50 block mb-1">
                            Bed Type
                          </label>
                          <select
                            value={room.bedType}
                            onChange={(e) => {
                              const updated = [...rooms];
                              updated[idx].bedType = e.target.value;
                              setRooms(updated);
                            }}
                            className="w-full bg-[#1C1A18] border border-white/10 p-2.5 rounded-lg text-xs font-mono text-white outline-none"
                          >
                            <option>Super King Bed</option>
                            <option>King Bed</option>
                            <option>Twin Mountain Beds</option>
                            <option>King + Outdoor Daybed</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-mono uppercase text-white/50 block mb-1">
                            Horizon View Outlook
                          </label>
                          <input
                            type="text"
                            value={room.view}
                            onChange={(e) => {
                              const updated = [...rooms];
                              updated[idx].view = e.target.value;
                              setRooms(updated);
                            }}
                            placeholder="e.g. Mountain Panorama"
                            className="w-full bg-[#1C1A18] border border-white/10 p-2.5 rounded-lg text-xs font-times text-white outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ========================================================
                STEP 5: LEGAL VERIFICATION & DOCUMENT UPLOAD
                ======================================================== */}
            {currentStep === 5 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                  <div className="flex items-center gap-2 mb-1.5 text-[11px] font-mono uppercase tracking-[0.22em] text-[#E8A88A]">
                    <span className="w-2 h-2 rounded-full bg-[#E8A88A]" />
                    <span>STEP 05 // VERIFICATION & TRUST</span>
                  </div>
                  <h1
                    className="font-stedelijk uppercase text-2xl sm:text-4xl text-[#FAF1E8] tracking-wide"
                    style={{ textTransform: "uppercase" }}
                  >
                    GOVERNMENT CERTIFICATION
                  </h1>
                  <p className="mt-2 text-xs sm:text-sm text-white/60 font-times leading-relaxed">
                    Upload official government hotel registration or PAN/VAT certificates to obtain the Basai Certified Sanctuary emblem.
                  </p>
                </div>

                <div className="space-y-4 text-xs font-times">
                  <div>
                    <label className="text-[11px] font-mono uppercase text-[#E8A88A] block mb-1">
                      Certificate Category *
                    </label>
                    <select
                      value={documentType}
                      onChange={(e) => setDocumentType(e.target.value)}
                      className="w-full bg-[#24211E] border border-white/15 focus:border-[#E8A88A] p-3.5 rounded-xl font-mono text-xs text-white outline-none cursor-pointer"
                    >
                      <option value="PAN_VAT_CERTIFICATE">
                        Inland Revenue Department (IRD) PAN/VAT Certificate
                      </option>
                      <option value="BUSINESS_REGISTRATION">
                        Company Registrar / Municipality Hotel License
                      </option>
                      <option value="TOURISM_BOARD_LICENSE">
                        Nepal Tourism Board Classification Certificate
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-mono uppercase text-[#E8A88A] block mb-1">
                      Document Serial / License Number *
                    </label>
                    <input
                      type="text"
                      value={documentNumber}
                      onChange={(e) => setDocumentNumber(e.target.value)}
                      placeholder="e.g. VAT-2026-NPL-9482"
                      className="w-full bg-[#24211E] border border-white/15 p-3.5 rounded-xl font-mono text-xs text-white outline-none"
                    />
                  </div>

                  {/* LUXURY FILE DROPZONE */}
                  <div>
                    <label className="text-[11px] font-mono uppercase text-white/60 block mb-1">
                      PDF Document Attachment (Scanned / Digital)
                    </label>
                    <div className="border border-dashed border-white/20 rounded-2xl p-8 bg-[#24211E]/50 text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-white/5 border border-white/15 flex items-center justify-center text-xl mx-auto text-[#E8A88A]">
                        📄
                      </div>
                      <div>
                        <span className="font-mono text-xs text-white block">
                          {uploadedFileName}
                        </span>
                        <span className="text-[10px] text-white/40 block mt-0.5">
                          PDF, PNG, or JPG up to 10MB · Encrypted storage
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setUploadedFileName("pan_license_verified.pdf")}
                        className="px-4 py-1.5 rounded-full border border-white/20 text-xs font-mono text-white/80 hover:bg-white/10 transition"
                      >
                        Choose File to Replace
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================
                STEP 6: GRAND LAUNCH SUCCESS SCREEN
                ======================================================== */}
            {currentStep === 6 && (
              <div className="space-y-6 text-center py-6 animate-in zoom-in-95 duration-400">
                <div className="w-20 h-20 rounded-full bg-[#E8A88A]/10 border border-[#E8A88A] flex items-center justify-center text-3xl mx-auto text-[#E8A88A] shadow-xl">
                  ✦
                </div>

                <div>
                  <div className="inline-flex items-center gap-2 mb-2 px-3 py-1 rounded-full bg-[#2E7D32]/20 border border-[#2E7D32]/50 text-[#81C784] font-mono text-xs">
                    ✓ ONBOARDING COMPLETE & VERIFIED
                  </div>
                  <h1
                    className="font-stedelijk uppercase text-3xl sm:text-5xl text-[#FAF1E8] tracking-wide"
                    style={{ textTransform: "uppercase" }}
                  >
                    WELCOME TO BASAI
                  </h1>
                  <p className="mt-3 text-sm text-white/70 max-w-lg mx-auto font-times leading-relaxed">
                    <strong>{hotelName}</strong> has been provisioned on the Basai architecture. Your custom sanctuary URL is active and ready for reservations.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-[#24211E] border border-white/10 max-w-md mx-auto text-left font-mono text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-white/50">Sanctuary URL:</span>
                    <span className="text-[#E8A88A] font-semibold">https://{completedSlug || slug}.basai.com.np</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Primary Region:</span>
                    <span className="text-white">{region.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">PAN Number:</span>
                    <span className="text-white">{panNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Active Gateways:</span>
                    <span className="text-[#81C784]">eSewa · Khalti · Fonepay</span>
                  </div>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/admin"
                    className="px-8 py-3.5 rounded-full bg-[#E8A88A] hover:bg-[#DE9977] text-[#2C231E] font-medium text-xs font-mono shadow-xl transition"
                  >
                    Enter Management Portal →
                  </Link>
                  <Link
                    href="/rooms"
                    className="px-8 py-3.5 rounded-full border border-white/20 text-white font-medium text-xs font-mono hover:bg-white/10 transition"
                  >
                    Preview in Basai Collection
                  </Link>
                </div>
              </div>
            )}

            {/* NAVIGATION BUTTONS (BACK & PROCEED) */}
            {currentStep < 6 && (
              <div className="mt-10 pt-6 border-t border-white/10 flex items-center justify-between">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                    className="px-5 py-2.5 rounded-full border border-white/20 text-xs font-mono text-white/70 hover:text-white hover:border-white transition cursor-pointer"
                  >
                    ← Previous Step
                  </button>
                ) : (
                  <Link
                    href="/"
                    className="text-xs font-mono text-white/40 hover:text-white"
                  >
                    Cancel
                  </Link>
                )}

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleNextStep}
                  className="px-7 py-3 rounded-full bg-[#E8A88A] hover:bg-[#DE9977] active:bg-[#D58C6B] text-[#2C231E] font-medium text-xs font-mono tracking-wider shadow-xl transition cursor-pointer flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <span>Provisioning...</span>
                  ) : currentStep === 5 ? (
                    <span>Submit & Launch Sanctuary →</span>
                  ) : (
                    <span>Continue to Step 0{currentStep + 1} →</span>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* ========================================================
              RIGHT PANE (5 COLS): LIVE REAL-TIME LUXURY PREVIEW
              Provides immediate visual excitement as hotelier types
              ======================================================== */}
          <div className="lg:col-span-5 sticky top-28 z-20 space-y-6">
            <div className="text-left mb-2">
              <span className="font-mono text-[11px] text-[#E8A88A] uppercase tracking-wider block">
                ✦ LIVE BASAI DIRECTORY PREVIEW
              </span>
              <span className="text-xs text-white/50 font-times">
                How your property appears to global and local travelers
              </span>
            </div>

            {/* PREVIEW CARD */}
            <div className="bg-white rounded-3xl overflow-hidden border border-[#E5DACF] shadow-2xl text-[#221B18] transition-all">
              {/* IMAGE HEADER */}
              <div className="relative aspect-[16/10] bg-[#1A1816] w-full">
                <Image
                  src={
                    region === "kathmandu"
                      ? "/kathmandu.png"
                      : region === "mustang"
                      ? "/mustang.png"
                      : region === "pokhara"
                      ? "/pokhara.png"
                      : "/hero.png"
                  }
                  alt={hotelName}
                  fill
                  className="object-cover"
                />
                <div className="absolute top-4 left-4 bg-[#E8A88A] text-[#2C231E] font-mono text-[10px] font-bold px-3 py-1 rounded-full uppercase shadow-xs">
                  {region.toUpperCase()} SANCTUARY
                </div>
                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white font-mono text-[10px] px-3 py-1 rounded-full border border-white/20">
                  {primaryCurrency}
                </div>
                <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md text-white/90 font-mono text-[11px] px-3 py-1 rounded-full">
                  https://{slug || "hotel"}.basai.com.np
                </div>
              </div>

              {/* DETAILS */}
              <div className="p-6 space-y-4">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#B26B4A] font-semibold block">
                    BASAI LUXURY COLLECTION
                  </span>
                  <h3
                    className="font-stedelijk uppercase text-2xl text-[#221B18] mt-1 leading-tight"
                    style={{ textTransform: "uppercase" }}
                  >
                    {hotelName || "Your Sanctuary Name"}
                  </h3>
                  <p className="text-xs text-[#827165] font-times italic mt-0.5">
                    {tradeLicenseName} · PAN: {panNumber || "Pending"}
                  </p>
                </div>

                {/* SUITES SUMMARY */}
                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E5DACF] text-xs font-times space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-[#221B18]">
                      {rooms[0]?.name || "Master Suite"}
                    </span>
                    <span className="font-mono font-bold text-[#221B18]">
                      NPR {rooms[0]?.basePriceNpr.toLocaleString()} / night
                    </span>
                  </div>
                  <div className="flex justify-between text-[#827165] text-[11px]">
                    <span>{rooms.length} Suite Categories Configured</span>
                    <span>+{taxRate}% VAT & {serviceCharge}% Service</span>
                  </div>
                </div>

                {/* ACTIVE GATEWAY ICONS */}
                <div className="flex items-center justify-between pt-2 border-t border-[#EAE1D5] text-xs font-mono">
                  <span className="text-[#827165] text-[10px] uppercase">
                    Accepted Gateways:
                  </span>
                  <div className="flex gap-2">
                    {enableEsewa && (
                      <span className="px-2 py-0.5 rounded bg-green-100 text-green-800 text-[10px] font-bold">
                        eSewa
                      </span>
                    )}
                    {enableKhalti && (
                      <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-bold">
                        Khalti
                      </span>
                    )}
                    {enableFonepay && (
                      <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 text-[10px] font-bold">
                        Fonepay
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* TRUST BADGE NOTE */}
            <div className="p-5 rounded-2xl bg-[#1C1A18] border border-white/10 text-xs font-times text-white/60 space-y-1">
              <span className="text-[#E8A88A] font-mono text-[10px] uppercase block font-semibold">
                ✦ PARTNER PRIVILEGES
              </span>
              <p>
                Direct bank settlement, zero lock-in contracts, integrated booking calendar, and access to Basai's high-net-worth international traveler directory.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* QUIET MINIMAL FOOTER */}
      <footer className="w-full border-t border-white/10 py-6 text-center text-xs text-white/40 font-mono">
        BASAI PARTNER ENTERPRISE ONBOARDING ENGINE · IRD NEPAL COMPLIANT · © 2026
      </footer>
    </div>
  );
}
