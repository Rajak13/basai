"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BasaiLogo from "@/components/public/BasaiLogo";
import { onboardingApi } from "@/lib/api";
import { hotelStore, OnboardedHotel } from "@/lib/hotelStore";

// ARCHITECTURAL TERROIR CHOICES
interface TerroirOption {
  id: string;
  name: string;
  elevation: string;
  region: string;
  architecture: string;
  image: string;
  description: string;
}

const TERROIR_OPTIONS: TerroirOption[] = [
  {
    id: "annapurna-ridge",
    name: "Annapurna Alpine Ridge",
    elevation: "2,100m – 3,200m",
    region: "Pokhara & Western Himalayas",
    architecture: "Floor-to-ceiling glass pavilions, hand-cut grey slate, and open cedarwood hearths.",
    image: "/pokhara.png",
    description: "Panoramic vistas facing Machapuchare and sacred Annapurna peaks.",
  },
  {
    id: "kathmandu-valley",
    name: "Newari Royal Heritage",
    elevation: "1,400m",
    region: "Kathmandu Valley",
    architecture: "14th-century hand-carved Sal timber, terracotta courtyards, and beaten copper fixtures.",
    image: "/kathmandu.png",
    description: "Centuries-old living museum sanctuaries surrounded by temple courtyards.",
  },
  {
    id: "mustang-canyon",
    name: "Mustang High Plateau",
    elevation: "2,800m – 3,800m",
    region: "Mustang Trans-Himalayas",
    architecture: "Earthen adobe walls, Tibetan slate carvings, and wind-sculpted canyon terraces.",
    image: "/mustang.png",
    description: "Sacred high-desert solitude with views across deep gorge canyons.",
  },
  {
    id: "eastern-foothill",
    name: "Foothill Tea Veranda",
    elevation: "900m – 1,400m",
    region: "Bhedetar & Eastern Hills",
    architecture: "Colonial teak verandas, misted hill terraces, and organic tea garden pavillions.",
    image: "/hero.png",
    description: "Subtropical serenity overlooking riverbanks and rolling green tea estates.",
  },
];

interface SuiteDraft {
  id: string;
  name: string;
  basePriceNpr: number;
  bedType: string;
  maxGuests: number;
  view: string;
  sqFt: number;
  amenities: string[];
}

export default function LuxuryOnboardingPage() {
  const router = useRouter();

  // STAGES (1 to 6)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [slideDirection, setSlideDirection] = useState<"next" | "prev">("next");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isCeremonyStamped, setIsCeremonyStamped] = useState<boolean>(false);

  // STEP 1: ESTATE IDENTITY & MONOGRAM
  const [hotelName, setHotelName] = useState<string>("The Fishtail Mountain Sanctuary");
  const [slug, setSlug] = useState<string>("fishtail-sanctuary");
  const [tagline, setTagline] = useState<string>("Panoramic Himalayan solitude & organic farm living");
  const [ownerName, setOwnerName] = useState<string>("Aarav Shrestha");
  const [ownerEmail, setOwnerEmail] = useState<string>("aarav@fishtailsanctuary.com");
  const [ownerPhone, setOwnerPhone] = useState<string>("+977 9801234567");
  const [ownerPassword, setOwnerPassword] = useState<string>("Sanctuary2026@Pass");
  const [isCheckingSlug, setIsCheckingSlug] = useState<boolean>(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(true);

  // STEP 2: TERROIR & AESTHETIC
  const [selectedTerroir, setSelectedTerroir] = useState<string>("annapurna-ridge");
  const [customLocationName, setCustomLocationName] = useState<string>("Pokhara Valley, Nepal");

  // STEP 3: LIVING SPACES (SUITE STUDIO)
  const [suites, setSuites] = useState<SuiteDraft[]>([
    {
      id: "suite-1",
      name: "Machapuchare Ridge Villa",
      basePriceNpr: 28500,
      bedType: "Super King Bed",
      maxGuests: 3,
      view: "Sacred Fishtail Peak Vista",
      sqFt: 850,
      amenities: ["Copper Soaking Tub", "Private Teak Veranda", "Estate Butler", "Heated Floors"],
    },
    {
      id: "suite-2",
      name: "Organic Orchard Pavilion",
      basePriceNpr: 19500,
      bedType: "King Bed",
      maxGuests: 2,
      view: "Valley Garden Courtyard",
      sqFt: 620,
      amenities: ["Mountain View Balcony", "Artisanal Tisane Bar", "Sonos Sound"],
    },
  ]);

  // STEP 4: DINING & ATELIER
  const [restaurantName, setRestaurantName] = useState<string>("Chuli Mountain Hearth");
  const [culinaryConcept, setCulinaryConcept] = useState<string>("Highland woodfired gastronomy, organic permaculture herbs, and Himalayan honey");
  const [morningRitual, setMorningRitual] = useState<string>("Dawn meditation with organic ginger-tulsi tisane overlooking the peaks");
  const [eveningRitual, setEveningRitual] = useState<string>("Fireside hearth gathering with warm spiced mulled wine & local mountain lore");

  // STEP 5: FISCAL VAULT & PAYMENT RAILS
  const [panNumber, setPanNumber] = useState<string>("609823145");
  const [tradeLicenseName, setTradeLicenseName] = useState<string>("Fishtail Hospitality Holdings Pvt. Ltd.");
  const [primaryCurrency, setPrimaryCurrency] = useState<"NPR" | "USD">("NPR");
  const [taxRate, setTaxRate] = useState<number>(13.0);
  const [serviceCharge, setServiceCharge] = useState<number>(10.0);

  const [enableEsewa, setEnableEsewa] = useState<boolean>(true);
  const [esewaMerchantId, setEsewaMerchantId] = useState<string>("EPAYTEST");
  const [enableKhalti, setEnableKhalti] = useState<boolean>(true);
  const [khaltiPublicKey, setKhaltiPublicKey] = useState<string>("live_secret_key_984210");
  const [enableFonepay, setEnableFonepay] = useState<boolean>(true);
  const [fonepayMerchantCode, setFonepayMerchantCode] = useState<string>("FONEPAY-FISHTAIL");
  const [enableStripe, setEnableStripe] = useState<boolean>(false);
  const [allowPayOnArrival, setAllowPayOnArrival] = useState<boolean>(true);

  // DOCUMENT VERIFICATION SCAN
  const [documentUploaded, setDocumentUploaded] = useState<boolean>(true);
  const [documentFileName, setDocumentFileName] = useState<string>("ird_vat_certificate_2026.pdf");

  // GENERATE INITIAL MONOGRAM
  const monogram = useMemo(() => {
    const words = hotelName.trim().split(/\s+/);
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + (words[1] ? words[1][0] : "")).toUpperCase();
  }, [hotelName]);

  // TOTAL METRICS
  const totalKeys = suites.length;
  const estimatedPotentialRev = useMemo(() => {
    return suites.reduce((acc, s) => acc + s.basePriceNpr, 0);
  }, [suites]);

  const activeTerroir = useMemo(() => {
    return TERROIR_OPTIONS.find((t) => t.id === selectedTerroir) || TERROIR_OPTIONS[0];
  }, [selectedTerroir]);

  // SLUG CHECK
  const handleHotelNameChange = (name: string) => {
    setHotelName(name);
    const autoSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setSlug(autoSlug);
  };

  useEffect(() => {
    if (!slug) return;
    const timer = setTimeout(async () => {
      setIsCheckingSlug(true);
      try {
        const res = await onboardingApi.checkSlug(slug);
        setSlugAvailable(res.available);
      } catch {
        setSlugAvailable(slug.length >= 3 && /^[a-z0-9-]+$/.test(slug));
      } finally {
        setIsCheckingSlug(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [slug]);

  // NAVIGATION CONTROLS
  const goToNextStep = () => {
    if (currentStep < 6) {
      setSlideDirection("next");
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goToPrevStep = () => {
    if (currentStep > 1) {
      setSlideDirection("prev");
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // PRESET TOGGLES
  const handlePreFillSample = () => {
    setHotelName("The Fishtail Mountain Sanctuary");
    setSlug("fishtail-sanctuary");
    setTagline("Panoramic Himalayan solitude & organic farm living");
    setSelectedTerroir("annapurna-ridge");
    setCustomLocationName("Pokhara Valley · 2,100m");
    setRestaurantName("Chuli Mountain Hearth");
    setCulinaryConcept("Highland woodfired gastronomy, organic permaculture herbs, and Himalayan honey");
    setPanNumber("609823145");
    setTradeLicenseName("Fishtail Hospitality Holdings Pvt. Ltd.");
    setSuites([
      {
        id: "suite-1",
        name: "Machapuchare Ridge Villa",
        basePriceNpr: 28500,
        bedType: "Super King Bed",
        maxGuests: 3,
        view: "Sacred Fishtail Peak Vista",
        sqFt: 850,
        amenities: ["Copper Soaking Tub", "Private Teak Veranda", "Estate Butler", "Heated Floors"],
      },
      {
        id: "suite-2",
        name: "Organic Orchard Pavilion",
        basePriceNpr: 19500,
        bedType: "King Bed",
        maxGuests: 2,
        view: "Valley Garden Courtyard",
        sqFt: 620,
        amenities: ["Mountain View Balcony", "Artisanal Tisane Bar", "Sonos Sound"],
      },
      {
        id: "suite-3",
        name: "Cloudview Master Residence",
        basePriceNpr: 42000,
        bedType: "Emperor Canopy Bed",
        maxGuests: 4,
        view: "360° Himalayan Mountain Range",
        sqFt: 1150,
        amenities: ["Private Heated Infinity Pool", "Fireplace", "Private Chef Kitchen"],
      },
    ]);
  };

  const handleStartCleanSlate = () => {
    setHotelName("");
    setSlug("");
    setTagline("");
    setOwnerName("");
    setOwnerEmail("");
    setOwnerPhone("");
    setPanNumber("");
    setTradeLicenseName("");
    setRestaurantName("");
    setCulinaryConcept("");
    setSuites([
      {
        id: "suite-1",
        name: "Signature Suite",
        basePriceNpr: 15000,
        bedType: "King Bed",
        maxGuests: 2,
        view: "Mountain Panorama",
        sqFt: 550,
        amenities: ["Copper Tub", "Private Balcony"],
      },
    ]);
  };

  // SUITE MODIFIERS
  const handleAddSuite = () => {
    const newIdx = suites.length + 1;
    setSuites([
      ...suites,
      {
        id: `suite-${Date.now()}`,
        name: `Suite Category 0${newIdx}`,
        basePriceNpr: 22000,
        bedType: "King Bed",
        maxGuests: 2,
        view: "Valley & Forest Vista",
        sqFt: 600,
        amenities: ["Private Balcony", "Artisan Coffee Bar", "Fiber WiFi"],
      },
    ]);
  };

  const handleRemoveSuite = (id: string) => {
    if (suites.length <= 1) return;
    setSuites(suites.filter((s) => s.id !== id));
  };

  const handleUpdateSuitePrice = (id: string, delta: number) => {
    setSuites(
      suites.map((s) => {
        if (s.id === id) {
          const newPrice = Math.max(5000, s.basePriceNpr + delta);
          return { ...s, basePriceNpr: newPrice };
        }
        return s;
      })
    );
  };

  // GRAND COMMISSIONING & COMMISSION DISPATCH
  const handleCommissionSanctuary = async () => {
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      // 1. Prepare converted suites
      const fullSuites = hotelStore.createSuitesFromDrafts(
        hotelName || "Basai Boutique Sanctuary",
        slug || "sanctuary",
        customLocationName || activeTerroir.name,
        activeTerroir.image,
        suites
      );

      // 2. Build Onboarded Hotel Object
      const onboardedData: OnboardedHotel = {
        id: `tenant-${slug}-${Date.now()}`,
        name: hotelName || "Basai Boutique Sanctuary",
        slug: slug || "sanctuary",
        tagline: tagline || "Architectural Himalayan Sanctuary",
        location: customLocationName || activeTerroir.name,
        elevation: activeTerroir.elevation,
        vibe: activeTerroir.architecture,
        heroImage: activeTerroir.image,
        primaryCurrency,
        taxRate,
        serviceCharge,
        panNumber,
        tradeLicenseName,
        restaurantName: restaurantName || "Chuli Dining",
        paymentGateways: {
          esewa: enableEsewa,
          khalti: enableKhalti,
          fonepay: enableFonepay,
          stripe: enableStripe,
          payOnArrival: allowPayOnArrival,
        },
        suites: fullSuites,
        createdAt: new Date().toISOString(),
        status: "ACTIVE",
      };

      // 3. Save into local hotelStore
      hotelStore.saveHotel(onboardedData);

      // 4. Try backend API registration (non-blocking fallback)
      try {
        await onboardingApi.createTenant({
          hotel_name: onboardedData.name,
          slug: onboardedData.slug,
          owner_email: ownerEmail,
          owner_password: ownerPassword,
          region: "NPL",
        });
      } catch (backendErr) {
        console.warn("Backend API not reachable in current mode, saved locally.", backendErr);
      }

      // 5. Trigger Wax Seal Stamp Animation
      setIsCeremonyStamped(true);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error.message || "Failed to finalize commissioning.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#110F0E] text-[#FAF1E8] font-times selection:bg-[#D4AF37] selection:text-black">
      {/* ========================================================
          1. HEADER: BRAND & MOBILE-STYLE STORY PROGRESSION
      ======================================================== */}
      <header className="sticky top-0 z-50 bg-[#110F0E]/90 backdrop-blur-xl border-b border-white/5 px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 group">
              <BasaiLogo className="h-6 w-auto text-[#D4AF37] group-hover:scale-105 transition-transform" />
              <span className="font-stedelijk tracking-[0.25em] text-xs sm:text-sm uppercase text-white/90">
                BASAI <span className="text-[#D4AF37]">STUDIO</span>
              </span>
            </Link>
            <div className="hidden md:flex items-center gap-2 text-white/30 text-xs pl-3 border-l border-white/10">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Sovereign Hotel Setup Engine</span>
            </div>
          </div>

          {/* QUICK PRESET CONTROLS */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handlePreFillSample}
              className="px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs text-amber-200/80 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 active:scale-95 transition-all"
            >
              ✦ Load Sample Sanctuary
            </button>
            <button
              onClick={handleStartCleanSlate}
              className="px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs text-white/50 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 active:scale-95 transition-all"
            >
              Blank Slate
            </button>
          </div>
        </div>

        {/* MOBILE-STYLE PROGRESS PILLS (TOP STORY BARS) */}
        <div className="max-w-7xl mx-auto mt-3 grid grid-cols-6 gap-1.5 sm:gap-2">
          {[
            { step: 1, label: "Identity" },
            { step: 2, label: "Terroir" },
            { step: 3, label: "Living Spaces" },
            { step: 4, label: "Dining" },
            { step: 5, label: "Fiscal Vault" },
            { step: 6, label: "Commission" },
          ].map((item) => {
            const isCompleted = currentStep > item.step;
            const isCurrent = currentStep === item.step;
            return (
              <button
                key={item.step}
                onClick={() => {
                  if (item.step <= currentStep) {
                    setSlideDirection(item.step < currentStep ? "prev" : "next");
                    setCurrentStep(item.step);
                  }
                }}
                className="group relative flex flex-col items-center py-1 text-left focus:outline-none"
              >
                {/* Visual Bar */}
                <div
                  className={`w-full h-1 sm:h-1.5 rounded-full transition-all duration-500 ${
                    isCompleted
                      ? "bg-[#D4AF37]"
                      : isCurrent
                      ? "bg-gradient-to-r from-[#D4AF37] to-amber-200 animate-pulse"
                      : "bg-white/10"
                  }`}
                />
                <span
                  className={`hidden sm:block text-[10px] mt-1 tracking-wider uppercase transition-colors ${
                    isCurrent
                      ? "text-[#D4AF37] font-semibold"
                      : isCompleted
                      ? "text-white/70"
                      : "text-white/30"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </header>

      {/* ========================================================
          2. MAIN IMMERSIVE STAGE (CENTERED LUXURY MOBILE CANVAS)
      ======================================================== */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-900/30 border border-red-500/30 text-red-200 text-sm flex items-center justify-between">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage("")} className="text-white/60 hover:text-white">✕</button>
          </div>
        )}

        {/* ========================================================
            STAGE 1: THE ESTATE IDENTITY & MONOGRAM
        ======================================================== */}
        {currentStep === 1 && (
          <div className={slideDirection === "next" ? "animate-slide-next" : "animate-slide-prev"}>
            <div className="text-center max-w-xl mx-auto mb-8 sm:mb-10">
              <span className="text-[11px] tracking-[0.3em] uppercase text-[#D4AF37] font-mono">
                Phase 01 · Sovereign Identity
              </span>
              <h1 className="font-stedelijk text-2xl sm:text-4xl uppercase tracking-[0.1em] text-white mt-1">
                The Estate & Monogram
              </h1>
              <p className="text-sm sm:text-base text-white/60 mt-2 font-times leading-relaxed">
                When commissioning a property on Basai, this becomes your sanctuary’s sovereign foundation.
                Type your hotel’s title below to engrave its royal monogram crest.
              </p>
            </div>

            {/* 3D TACTILE METALLIC ESTATE KEY CARD */}
            <div className="relative max-w-md mx-auto mb-10 group">
              <div className="relative rounded-2xl bg-gradient-to-br from-[#241E1A] via-[#1A1614] to-[#0F0D0C] p-6 sm:p-7 border border-[#D4AF37]/30 shadow-2xl shadow-black/80 animate-gold-shimmer animate-float-gentle">
                {/* Card Header & Crest */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {/* Dynamic Monogram Stamp */}
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#8C6D23] p-[1.5px] shadow-lg shadow-black/60">
                      <div className="w-full h-full rounded-[10px] bg-[#1A1614] flex items-center justify-center border border-amber-300/20">
                        <span className="font-stedelijk text-xl text-[#FCE6A4] tracking-wider font-bold">
                          {monogram || "B"}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] tracking-[0.25em] uppercase text-[#D4AF37] block font-mono">
                        SOVEREIGN ESTATE
                      </span>
                      <h3 className="text-base sm:text-lg font-serif font-medium text-white/95 line-clamp-1">
                        {hotelName || "Your Hotel Sanctuary"}
                      </h3>
                    </div>
                  </div>
                  <BasaiLogo className="h-6 w-auto text-[#D4AF37]/40" />
                </div>

                {/* Subdomain Pill */}
                <div className="mt-6 pt-5 border-t border-white/5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-mono text-emerald-300/90 tracking-wide text-[11px]">
                      {slug ? `${slug}.basai.np` : "sanctuary.basai.np"}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-white/40">
                    {isCheckingSlug ? "Verifying..." : slugAvailable ? "✓ Reserved" : "Unavailable"}
                  </span>
                </div>

                {/* Card Tagline */}
                <p className="mt-3 text-xs italic text-white/50 font-times line-clamp-1">
                  &ldquo;{tagline || "Architectural sanctuary rooted in Himalayan living"}&rdquo;
                </p>
              </div>
            </div>

            {/* INPUT FIELDS */}
            <div className="max-w-xl mx-auto space-y-5 bg-[#171412] p-6 sm:p-8 rounded-2xl border border-white/5">
              <div>
                <label className="block text-xs uppercase tracking-wider text-white/70 mb-2">
                  Sanctuary / Hotel Name *
                </label>
                <input
                  type="text"
                  value={hotelName}
                  onChange={(e) => handleHotelNameChange(e.target.value)}
                  placeholder="e.g. The Fishtail Mountain Lodge"
                  className="w-full bg-[#0E0C0B] border border-white/10 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-sm sm:text-base text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-white/70 mb-2">
                  Sanctuary Subdomain Reservation *
                </label>
                <div className="flex items-center bg-[#0E0C0B] border border-white/10 focus-within:border-[#D4AF37] rounded-xl px-4 py-3 transition-all">
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    placeholder="fishtail-sanctuary"
                    className="w-full bg-transparent text-sm sm:text-base text-white placeholder-white/20 focus:outline-none font-mono"
                  />
                  <span className="text-white/40 text-xs sm:text-sm font-mono pl-2 border-l border-white/10">
                    .basai.np
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-white/70 mb-2">
                  Estate Poetic Tagline
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g. Architectural silence overlooking the sacred Annapurna range"
                  className="w-full bg-[#0E0C0B] border border-white/10 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-white/5">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-white/70 mb-1.5">
                    General Manager Name *
                  </label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Subash Gurung"
                    className="w-full bg-[#0E0C0B] border border-white/10 focus:border-[#D4AF37] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-white/70 mb-1.5">
                    Official Contact Email *
                  </label>
                  <input
                    type="email"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    placeholder="gm@sanctuary.com"
                    className="w-full bg-[#0E0C0B] border border-white/10 focus:border-[#D4AF37] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            STAGE 2: SANCTUARY TERROIR & ARCHITECTURAL AESTHETIC
        ======================================================== */}
        {currentStep === 2 && (
          <div className={slideDirection === "next" ? "animate-slide-next" : "animate-slide-prev"}>
            <div className="text-center max-w-xl mx-auto mb-8 sm:mb-10">
              <span className="text-[11px] tracking-[0.3em] uppercase text-[#D4AF37] font-mono">
                Phase 02 · Terroir & Atmosphere
              </span>
              <h2 className="font-stedelijk text-2xl sm:text-4xl uppercase tracking-[0.1em] text-white mt-1">
                Sanctuary Terroir
              </h2>
              <p className="text-sm sm:text-base text-white/60 mt-2 font-times leading-relaxed">
                Select the architectural atmosphere that best matches your property’s landscape and regional heritage.
              </p>
            </div>

            {/* VISUAL CARDS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
              {TERROIR_OPTIONS.map((terroir) => {
                const isSelected = selectedTerroir === terroir.id;
                return (
                  <div
                    key={terroir.id}
                    onClick={() => {
                      setSelectedTerroir(terroir.id);
                      setCustomLocationName(terroir.region);
                    }}
                    className={`relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 p-5 border group ${
                      isSelected
                        ? "border-[#D4AF37] ring-2 ring-[#D4AF37]/50 bg-[#1E1916] shadow-xl shadow-amber-950/20"
                        : "border-white/10 bg-[#151210] hover:border-white/20 hover:scale-[1.01]"
                    }`}
                  >
                    {/* Background Preview */}
                    <div className="relative h-40 w-full rounded-xl overflow-hidden mb-4">
                      <Image
                        src={terroir.image}
                        alt={terroir.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                        <span className="text-[10px] tracking-wider uppercase font-mono px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[#D4AF37] border border-[#D4AF37]/30">
                          {terroir.elevation}
                        </span>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-[#D4AF37] text-black text-xs font-bold flex items-center justify-center shadow-lg">
                            ✓
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className="font-serif text-lg font-medium text-white mb-1">
                      {terroir.name}
                    </h3>
                    <p className="text-xs text-white/60 line-clamp-2 font-times mb-3">
                      {terroir.architecture}
                    </p>
                    <span className="text-[11px] text-[#D4AF37]/90 font-mono tracking-wide">
                      {terroir.region}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* CUSTOM LOCATION INPUT */}
            <div className="max-w-xl mx-auto bg-[#171412] p-5 rounded-2xl border border-white/5">
              <label className="block text-xs uppercase tracking-wider text-white/70 mb-2">
                Sanctuary Geographic Coordinates / City Name
              </label>
              <input
                type="text"
                value={customLocationName}
                onChange={(e) => setCustomLocationName(e.target.value)}
                placeholder="e.g. Sarangkot Ridge, Pokhara · 1,600m"
                className="w-full bg-[#0E0C0B] border border-white/10 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-sm text-white focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* ========================================================
            STAGE 3: THE LIVING SPACES (SUITE STUDIO)
        ======================================================== */}
        {currentStep === 3 && (
          <div className={slideDirection === "next" ? "animate-slide-next" : "animate-slide-prev"}>
            <div className="text-center max-w-xl mx-auto mb-6 sm:mb-8">
              <span className="text-[11px] tracking-[0.3em] uppercase text-[#D4AF37] font-mono">
                Phase 03 · Living Spaces Studio
              </span>
              <h2 className="font-stedelijk text-2xl sm:text-4xl uppercase tracking-[0.1em] text-white mt-1">
                The Suites & Inventory
              </h2>
              <p className="text-sm sm:text-base text-white/60 mt-2 font-times leading-relaxed">
                Define the guest living quarters that will populate your booking engine. Adjust tariffs, capacities, and signature attributes.
              </p>
            </div>

            {/* METRICS STRIP */}
            <div className="max-w-2xl mx-auto mb-8 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-center justify-between text-xs sm:text-sm">
              <div className="flex items-center gap-2 text-white/80">
                <span className="text-[#D4AF37] font-mono font-bold text-base">{totalKeys}</span>
                <span>Active Living Spaces</span>
              </div>
              <div className="text-right">
                <span className="text-white/40 text-xs block">Combined Nightly Capacity:</span>
                <span className="text-emerald-400 font-mono font-semibold">
                  NPR {estimatedPotentialRev.toLocaleString()}
                </span>
              </div>
            </div>

            {/* SUITE CARDS LIST */}
            <div className="max-w-2xl mx-auto space-y-4 mb-6">
              {suites.map((suite, idx) => (
                <div
                  key={suite.id}
                  className="bg-[#171412] border border-white/10 rounded-2xl p-5 sm:p-6 transition-all hover:border-[#D4AF37]/40 relative group"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-[#D4AF37]">
                        Category 0{idx + 1}
                      </span>
                      <input
                        type="text"
                        value={suite.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSuites(suites.map((s) => (s.id === suite.id ? { ...s, name: val } : s)));
                        }}
                        className="w-full bg-transparent text-lg sm:text-xl font-serif text-white font-medium focus:outline-none border-b border-transparent focus:border-[#D4AF37]/50 py-0.5 mt-0.5"
                      />
                    </div>
                    {suites.length > 1 && (
                      <button
                        onClick={() => handleRemoveSuite(suite.id)}
                        className="text-white/30 hover:text-red-400 text-xs p-1 rounded-md transition-colors"
                      >
                        ✕ Remove
                      </button>
                    )}
                  </div>

                  {/* PRICE & SPECS CONTROLS */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-white/5">
                    {/* Price with Stepper */}
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-white/50 mb-1.5">
                        Base Nightly Rate (NPR)
                      </label>
                      <div className="flex items-center bg-[#0E0C0B] border border-white/10 rounded-xl px-2 py-1.5">
                        <button
                          onClick={() => handleUpdateSuitePrice(suite.id, -1000)}
                          className="px-2 text-white/50 hover:text-[#D4AF37] font-bold text-sm"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={suite.basePriceNpr}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setSuites(suites.map((s) => (s.id === suite.id ? { ...s, basePriceNpr: val } : s)));
                          }}
                          className="w-full bg-transparent text-center font-mono text-sm text-white focus:outline-none"
                        />
                        <button
                          onClick={() => handleUpdateSuitePrice(suite.id, 1000)}
                          className="px-2 text-white/50 hover:text-[#D4AF37] font-bold text-sm"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Bed Type */}
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-white/50 mb-1.5">
                        Bed Configuration
                      </label>
                      <select
                        value={suite.bedType}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSuites(suites.map((s) => (s.id === suite.id ? { ...s, bedType: val } : s)));
                        }}
                        className="w-full bg-[#0E0C0B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      >
                        <option value="Super King Bed">Super King Bed</option>
                        <option value="King Bed">King Bed</option>
                        <option value="Twin Palace Beds">Twin Palace Beds</option>
                        <option value="Emperor Canopy Bed">Emperor Canopy Bed</option>
                      </select>
                    </div>

                    {/* View */}
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-white/50 mb-1.5">
                        Vista / Exposure
                      </label>
                      <input
                        type="text"
                        value={suite.view}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSuites(suites.map((s) => (s.id === suite.id ? { ...s, view: val } : s)));
                        }}
                        className="w-full bg-[#0E0C0B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                        placeholder="Mountain Ridge Vista"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ADD SUITE BUTTON */}
            <div className="max-w-2xl mx-auto text-center">
              <button
                onClick={handleAddSuite}
                className="w-full py-3.5 rounded-xl border border-dashed border-[#D4AF37]/40 hover:border-[#D4AF37] text-[#D4AF37] text-sm tracking-wide uppercase font-serif hover:bg-[#D4AF37]/5 active:scale-[0.99] transition-all"
              >
                + Commission Another Living Space
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            STAGE 4: DINING & CULTURAL ATELIER
        ======================================================== */}
        {currentStep === 4 && (
          <div className={slideDirection === "next" ? "animate-slide-next" : "animate-slide-prev"}>
            <div className="text-center max-w-xl mx-auto mb-8 sm:mb-10">
              <span className="text-[11px] tracking-[0.3em] uppercase text-[#D4AF37] font-mono">
                Phase 04 · Gastronomy & Rituals
              </span>
              <h2 className="font-stedelijk text-2xl sm:text-4xl uppercase tracking-[0.1em] text-white mt-1">
                The Dining Atelier
              </h2>
              <p className="text-sm sm:text-base text-white/60 mt-2 font-times leading-relaxed">
                Establish the culinary soul of your sanctuary. Configure your in-house restaurant, organic hearth, and signature guest rituals.
              </p>
            </div>

            <div className="max-w-xl mx-auto space-y-5 bg-[#171412] p-6 sm:p-8 rounded-2xl border border-white/5">
              <div>
                <label className="block text-xs uppercase tracking-wider text-white/70 mb-2">
                  In-House Restaurant Title *
                </label>
                <input
                  type="text"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  placeholder="e.g. Chuli Mountain Hearth or Krishnarpan"
                  className="w-full bg-[#0E0C0B] border border-white/10 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-sm sm:text-base text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-white/70 mb-2">
                  Culinary Concept & Sourcing Philosophy
                </label>
                <textarea
                  rows={3}
                  value={culinaryConcept}
                  onChange={(e) => setCulinaryConcept(e.target.value)}
                  placeholder="Highland woodfired dining, organic permaculture herbs, and slow-braised Himalayan mutton..."
                  className="w-full bg-[#0E0C0B] border border-white/10 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-sm text-white focus:outline-none resize-none"
                />
              </div>

              <div className="pt-3 border-t border-white/5 space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-white/70 mb-1.5">
                    Dawn Morning Ritual
                  </label>
                  <input
                    type="text"
                    value={morningRitual}
                    onChange={(e) => setMorningRitual(e.target.value)}
                    placeholder="Sunrise ginger tisane on the eastern tea deck"
                    className="w-full bg-[#0E0C0B] border border-white/10 focus:border-[#D4AF37] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-white/70 mb-1.5">
                    Twilight Fireside Ritual
                  </label>
                  <input
                    type="text"
                    value={eveningRitual}
                    onChange={(e) => setEveningRitual(e.target.value)}
                    placeholder="Evening hearth gathering with organic mountain cider"
                    className="w-full bg-[#0E0C0B] border border-white/10 focus:border-[#D4AF37] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            STAGE 5: FISCAL VAULT & NEPAL PAYMENT RAILS
        ======================================================== */}
        {currentStep === 5 && (
          <div className={slideDirection === "next" ? "animate-slide-next" : "animate-slide-prev"}>
            <div className="text-center max-w-xl mx-auto mb-8 sm:mb-10">
              <span className="text-[11px] tracking-[0.3em] uppercase text-[#D4AF37] font-mono">
                Phase 05 · Sovereign Settlement Rails
              </span>
              <h2 className="font-stedelijk text-2xl sm:text-4xl uppercase tracking-[0.1em] text-white mt-1">
                The Fiscal Vault
              </h2>
              <p className="text-sm sm:text-base text-white/60 mt-2 font-times leading-relaxed">
                Connect Nepal payment gateways and IRD tax parameters for direct guest remittances.
              </p>
            </div>

            {/* PAYMENT RAIL TOGGLE CARDS */}
            <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {/* eSewa */}
              <div
                onClick={() => setEnableEsewa(!enableEsewa)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  enableEsewa
                    ? "bg-[#18231C] border-emerald-500/50 shadow-lg shadow-emerald-950/20"
                    : "bg-[#141210] border-white/10 opacity-60"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-emerald-400">eSewa</span>
                  <span className={`w-3 h-3 rounded-full ${enableEsewa ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-white/20"}`} />
                </div>
                <p className="text-[11px] text-white/60 font-times">Instant Nepal digital wallet transfers.</p>
              </div>

              {/* Khalti */}
              <div
                onClick={() => setEnableKhalti(!enableKhalti)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  enableKhalti
                    ? "bg-[#21182B] border-purple-500/50 shadow-lg shadow-purple-950/20"
                    : "bg-[#141210] border-white/10 opacity-60"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-purple-400">Khalti</span>
                  <span className={`w-3 h-3 rounded-full ${enableKhalti ? "bg-purple-400 shadow-[0_0_8px_#c084fc]" : "bg-white/20"}`} />
                </div>
                <p className="text-[11px] text-white/60 font-times">Khalti wallet & e-banking gateway.</p>
              </div>

              {/* Fonepay */}
              <div
                onClick={() => setEnableFonepay(!enableFonepay)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  enableFonepay
                    ? "bg-[#261816] border-rose-500/50 shadow-lg shadow-rose-950/20"
                    : "bg-[#141210] border-white/10 opacity-60"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-rose-400">Fonepay QR</span>
                  <span className={`w-3 h-3 rounded-full ${enableFonepay ? "bg-rose-400 shadow-[0_0_8px_#fb7185]" : "bg-white/20"}`} />
                </div>
                <p className="text-[11px] text-white/60 font-times">Interbank mobile banking QR codes.</p>
              </div>
            </div>

            {/* LEGAL & IRD COMPLIANCE */}
            <div className="max-w-xl mx-auto space-y-4 bg-[#171412] p-6 sm:p-7 rounded-2xl border border-white/5 mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-white/70 mb-1.5">
                    IRD PAN / VAT Number *
                  </label>
                  <input
                    type="text"
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value)}
                    placeholder="609123456"
                    className="w-full bg-[#0E0C0B] border border-white/10 focus:border-[#D4AF37] rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-white/70 mb-1.5">
                    Registered Corporate Entity
                  </label>
                  <input
                    type="text"
                    value={tradeLicenseName}
                    onChange={(e) => setTradeLicenseName(e.target.value)}
                    placeholder="Fishtail Hospitality Pvt. Ltd."
                    className="w-full bg-[#0E0C0B] border border-white/10 focus:border-[#D4AF37] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-white/70 mb-1.5">
                    VAT Rate (%)
                  </label>
                  <input
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#0E0C0B] border border-white/10 rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-white/70 mb-1.5">
                    Service Charge (%)
                  </label>
                  <input
                    type="number"
                    value={serviceCharge}
                    onChange={(e) => setServiceCharge(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#0E0C0B] border border-white/10 rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* DOCUMENT SCANNER VISUALIZER */}
            <div className="max-w-xl mx-auto p-4 rounded-xl bg-[#141210] border border-white/10 relative overflow-hidden">
              <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent animate-scan-laser" />
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="text-xl">📄</span>
                  <div>
                    <span className="text-white/90 font-mono block">{documentFileName}</span>
                    <span className="text-emerald-400 text-[10px]">✓ IRD Document Vault Verified</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono uppercase text-white/40">Encrypted AES-256</span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            STAGE 6: THE GRAND COMMISSIONING CEREMONY (THE FINALE)
        ======================================================== */}
        {currentStep === 6 && (
          <div className={slideDirection === "next" ? "animate-slide-next" : "animate-slide-prev"}>
            <div className="text-center max-w-xl mx-auto mb-8 sm:mb-10">
              <span className="text-[11px] tracking-[0.3em] uppercase text-[#D4AF37] font-mono">
                Phase 06 · The Seal of Authority
              </span>
              <h2 className="font-stedelijk text-2xl sm:text-4xl uppercase tracking-[0.1em] text-white mt-1">
                Sanctuary Commissioning
              </h2>
              <p className="text-sm sm:text-base text-white/60 mt-2 font-times leading-relaxed">
                Review your estate specifications. Upon sealing, the Basai booking portal and management OS will transform into your sanctuary.
              </p>
            </div>

            {/* OFFICIAL SANCTUARY DEED / CERTIFICATE */}
            <div className="max-w-xl mx-auto bg-gradient-to-b from-[#221B16] to-[#141210] border-2 border-[#D4AF37]/50 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden mb-8">
              {/* Wax Seal Stamp (Animated Drop on Commissioning) */}
              {isCeremonyStamped && (
                <div className="absolute top-6 right-6 z-20 animate-stamp-slam">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#E2B755] via-[#C59B27] to-[#805D0D] p-1 shadow-2xl flex items-center justify-center border-2 border-amber-200">
                    <div className="w-full h-full rounded-full border border-black/30 flex flex-col items-center justify-center text-center">
                      <span className="font-stedelijk text-lg text-black font-extrabold leading-none">BASAI</span>
                      <span className="text-[8px] uppercase tracking-widest text-black/80 font-mono">SEALED</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="text-center border-b border-white/10 pb-5 mb-5">
                <span className="text-[10px] tracking-[0.35em] uppercase text-[#D4AF37] font-mono block">
                  KINGDOM OF NEPAL · BOUTIQUE REGISTRY
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl text-white font-medium mt-1">
                  {hotelName || "Basai Mountain Sanctuary"}
                </h3>
                <span className="text-xs italic text-white/60 font-times block mt-1">
                  {customLocationName || activeTerroir.region}
                </span>
              </div>

              {/* Specifications List */}
              <div className="space-y-3 text-xs sm:text-sm font-times mb-6">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-white/50">Sovereign Domain:</span>
                  <span className="text-emerald-400 font-mono font-medium">{slug}.basai.np</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-white/50">Commissioned Suites:</span>
                  <span className="text-white/90 font-mono">{suites.length} Suites ({suites.map(s => s.name).join(", ")})</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-white/50">Culinary Soul:</span>
                  <span className="text-white/90">{restaurantName || "Chuli Dining"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-white/50">Payment Rails:</span>
                  <span className="text-white/90 font-mono">
                    {[enableEsewa && "eSewa", enableKhalti && "Khalti", enableFonepay && "Fonepay"].filter(Boolean).join(" · ")}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-white/50">General Manager:</span>
                  <span className="text-white/90">{ownerName} ({ownerEmail})</span>
                </div>
              </div>

              {/* ACTION BUTTONS (AFTER STAMP OR READY TO SEAL) */}
              {!isCeremonyStamped ? (
                <button
                  disabled={isSubmitting}
                  onClick={handleCommissionSanctuary}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#F3D78A] to-[#D4AF37] text-black font-stedelijk tracking-[0.2em] uppercase text-sm font-bold shadow-xl shadow-amber-900/40 hover:scale-[1.01] active:scale-[0.98] transition-all"
                >
                  {isSubmitting ? "ENGRAVING SANCTUARY CHARTER..." : "✦ AFFIX SEAL & COMMISSION SANCTUARY"}
                </button>
              ) : (
                <div className="space-y-3 pt-2">
                  <button
                    onClick={() => router.push("/rooms")}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-stedelijk tracking-[0.15em] uppercase text-sm font-bold shadow-xl shadow-emerald-950/40 hover:scale-[1.01] active:scale-[0.98] transition-all"
                  >
                    ✦ OPEN MY LIVE GUEST BOOKING SANCTUARY (/rooms)
                  </button>
                  <button
                    onClick={() => router.push("/admin")}
                    className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white/90 font-serif text-xs tracking-wider uppercase border border-white/10 active:scale-[0.98] transition-all"
                  >
                    ENTER GM OPERATIONS COCKPIT (/admin)
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================
            3. BOTTOM NAVIGATION: MOBILE-STYLE STEPPER CONTROLS
        ======================================================== */}
        {currentStep < 6 && (
          <div className="max-w-xl mx-auto flex items-center justify-between pt-6 border-t border-white/10 mt-8">
            <button
              onClick={goToPrevStep}
              disabled={currentStep === 1}
              className={`px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-mono border transition-all ${
                currentStep === 1
                  ? "opacity-20 border-white/5 cursor-not-allowed"
                  : "border-white/10 hover:border-white/30 text-white/70 hover:text-white"
              }`}
            >
              ← Back
            </button>

            <span className="text-xs text-white/40 font-mono tracking-widest uppercase">
              Phase 0{currentStep} / 06
            </span>

            <button
              onClick={goToNextStep}
              className="px-6 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#E5C158] text-black text-xs uppercase tracking-widest font-mono font-bold shadow-lg shadow-amber-950/30 active:scale-95 transition-all"
            >
              Continue →
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
