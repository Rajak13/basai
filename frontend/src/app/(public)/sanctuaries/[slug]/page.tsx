import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import BasaiLogo from "@/components/public/BasaiLogo";
import { BASAI_SUITES, SuiteItem } from "@/data/suites";

interface SanctuaryMeta {
  name: string;
  tagline: string;
  heroImg: string;
  region: string;
  elevation: string;
  quote: string;
  philosophy: string;
  climate: string;
  curatedRitual: string;
}

const SANCTUARIES: Record<string, SanctuaryMeta> = {
  mustang: {
    name: "Shinta Mani High Sanctuary",
    tagline: "High-Altitude Tibetan Stone Architecture & Trans-Himalayan Stargazing",
    heroImg: "/mustang.png",
    region: "Jomsom, Mustang Highlands",
    elevation: "2,800m",
    quote: "Perched above the sacred Kali Gandaki canyon where Tibetan Buddhism meets the arid winds of Nilgiri.",
    philosophy:
      "Hand-carved slate masonry and reclaimed pine hearths designed by Bill Bensley. A haven of complete isolation, heated cedarwood baths, and ancient Bon rituals.",
    climate: "Crisp mountain sun with cool high-altitude canyon winds (4°C - 18°C).",
    curatedRitual: "Twilight Bonfire & High-Altitude Tibetan Singing Bowl Sound Journey",
  },
  kathmandu: {
    name: "Dwarika's Heritage Sanctuary",
    tagline: "Living Museum of 14th-Century Newari Woodcraft & Royal Terracotta Courtyards",
    heroImg: "/kathmandu.png",
    region: "Kathmandu Valley",
    elevation: "1,400m",
    quote: "An architectural resurrection of royal Malla palaces, where every carved window is a preserved antiquity.",
    philosophy:
      "Each terracotta brick and carved timber lintel is rescued from medieval ruins. Hand-beaten copper tubs, organic Krishnarpan dining, and peaceful meditation courtyards.",
    climate: "Temperate subtropical valley highland with warm afternoons (16°C - 26°C).",
    curatedRitual: "Dawn Lotus Temple Blessing & Traditional 6-Course Krishnarpan Feast",
  },
  pokhara: {
    name: "The Pavilions Mountain Sanctuary",
    tagline: "Eco-Luxury Organic Farm Villas Facing the Fishtail Peak",
    heroImg: "/pokhara.png",
    region: "Phewa Ridge & Annapurna Foothills",
    elevation: "820m",
    quote: "A quiet valley retreat nestled between organic paddy terraces and unobstructed panoramas of Machapuchare.",
    philosophy:
      "Solar-powered stone villas built with local river rock and organic farm-to-table cuisine. A mindful sanctuary designed to restore vitality after mountain expeditions.",
    climate: "Subtropical green foothills with clear Himalayan morning vistas (18°C - 28°C).",
    curatedRitual: "Sunrise Yoga on the Phewa Deck & Organic Himalayan Herbal Soaking",
  },
  dharan: {
    name: "Basai Foothill & River Haven",
    tagline: "Wilderness Safari Pavilions & Fireside Dining along the Koshi Wetlands",
    heroImg: "/hero.png",
    region: "Bhedetar Ridge & Koshi Riverlands",
    elevation: "210m - 1,420m",
    quote: "Where the cool mist of eastern tea hills descends into the tranquil wildlife sanctuaries of the Koshi river.",
    philosophy:
      "Polished teakwood safari pavilions and riverfront campfire culinary experiences at Chuli. Intimate dawn birdwatching safaris and handcrafted highland hospitality.",
    climate: "Warm river breeze shifting into cool hilltop fog (15°C - 30°C).",
    curatedRitual: "Dawn Naturalist River Safari & Sunset Wild Herb Dining at Chuli",
  },
};

interface SanctuaryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: SanctuaryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const normalized = slug.toLowerCase();
  const sanctuary = SANCTUARIES[normalized];

  if (!sanctuary) {
    return {
      title: `${slug.toUpperCase()} | Basai Mountain Sanctuaries`,
      description: "Bespoke architectural sanctuaries rooted in the Himalayas.",
    };
  }

  return {
    title: `${sanctuary.name.toUpperCase()} // Basai Himalayan Sanctuaries`,
    description: sanctuary.tagline,
    openGraph: {
      title: sanctuary.name,
      description: sanctuary.quote,
      images: [{ url: sanctuary.heroImg, width: 1200, height: 800, alt: sanctuary.name }],
    },
  };
}

export default async function SanctuaryPage({ params }: SanctuaryPageProps) {
  const { slug } = await params;
  const normalized = slug.toLowerCase();
  const sanctuary = SANCTUARIES[normalized];

  // Filter suites for this sanctuary
  const suites: SuiteItem[] = BASAI_SUITES.filter(
    (s) => s.sanctuaryId.toLowerCase() === normalized
  );

  return (
    <div className="w-full min-h-screen bg-[#1E1B19] text-[#FAF1E8] select-none font-times">
      {/* ========================================================
          1. INTEGRATED LUXURY SANCTUARY HEADER
          ======================================================== */}
      <header className="sticky top-0 z-40 bg-[#1E1B19]/90 backdrop-blur-md border-b border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <BasaiLogo size={22} className="text-[#E4AA8B]" />
            <span
              className="font-stedelijk text-sm sm:text-base text-[#FAF1E8] tracking-widest uppercase group-hover:text-[#E4AA8B] transition-colors"
              style={{ textTransform: "uppercase" }}
            >
              BASAI
            </span>
          </Link>
          <span className="text-white/20 font-mono text-xs hidden sm:inline">/</span>
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#E4AA8B] hidden sm:inline">
            {sanctuary ? sanctuary.region : "ESTATE PORTAL"}
          </span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/rooms"
            className="text-xs font-mono uppercase tracking-widest text-white/70 hover:text-white transition-colors"
          >
            All Sanctuaries
          </Link>
          <Link
            href={`/rooms?sanctuary=${normalized}`}
            className="bg-[#FAF1E8] text-[#1E1B19] px-4 py-2 rounded-full font-mono text-[11px] uppercase tracking-wider font-semibold hover:bg-[#E4AA8B] transition-colors shadow-sm"
          >
            Check Availability
          </Link>
        </div>
      </header>

      {/* ========================================================
          2. ATMOSPHERIC MONUMENTAL HERO
          ======================================================== */}
      <section className="relative w-full h-[65vh] min-h-[500px] max-h-[720px] flex items-end px-4 sm:px-8 lg:px-14 pb-12 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src={sanctuary ? sanctuary.heroImg : "/hero.png"}
            alt={sanctuary ? sanctuary.name : "Basai Sanctuary"}
            fill
            priority
            sizes="100vw"
            className="object-cover brightness-[0.70] contrast-[1.05]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1E1B19] via-[#1E1B19]/40 to-black/30" />
        </div>

        <div className="relative z-10 max-w-[1440px] w-full mx-auto space-y-3">
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono uppercase tracking-[0.22em] text-[#E4AA8B]">
            <span className="w-2 h-2 rounded-full bg-[#E4AA8B]" />
            <span>ESTATE OVERVIEW // {sanctuary ? sanctuary.elevation : "HIMALAYAS"}</span>
            <span className="text-white/30">•</span>
            <span>{sanctuary ? sanctuary.region : "NEPAL"}</span>
          </div>

          <h1
            className="font-stedelijk uppercase text-3xl sm:text-5xl lg:text-6xl text-[#FAF1E8] tracking-wider leading-[1.05] max-w-4xl"
            style={{ textTransform: "uppercase" }}
          >
            {sanctuary ? sanctuary.name : `${slug.toUpperCase()} SANCTUARY`}
          </h1>

          <p className="text-base sm:text-xl text-white/80 max-w-2xl leading-relaxed italic">
            "{sanctuary ? sanctuary.quote : "Architectural stillness rooted in Himalayan living heritage."}"
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              href={`/booking?sanctuary=${normalized}`}
              className="bg-[#E4AA8B] text-[#1E1B19] px-6 py-3 rounded-full font-mono text-xs uppercase tracking-widest font-semibold hover:bg-white transition-all shadow-lg"
            >
              Direct Reservation Privilege →
            </Link>
            <Link
              href={`/rooms?sanctuary=${normalized}`}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white px-5 py-3 rounded-full font-mono text-xs uppercase tracking-widest transition-all"
            >
              View Available Suites ({suites.length})
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================
          3. SANCTUARY PHILOSOPHY & DETAILS
          ======================================================== */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-14 py-16 border-b border-white/10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 space-y-5">
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#E4AA8B] block">
              ARCHITECTURAL PHILOSOPHY
            </span>
            <h2
              className="font-stedelijk uppercase text-2xl sm:text-4xl text-[#FAF1E8] tracking-wide"
              style={{ textTransform: "uppercase" }}
            >
              CRAFTED BY NATURE, SHAPED BY ANCIENT HERITAGE
            </h2>
            <p className="text-white/70 text-base sm:text-lg leading-relaxed">
              {sanctuary
                ? sanctuary.philosophy
                : "This sanctuary is part of the Basai portfolio of bespoke Himalayan retreats, designed to offer timeless seclusion and deep architectural resonance."}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <div className="bg-[#24211E] border border-white/10 p-5 rounded-2xl">
                <span className="text-[10px] font-mono uppercase text-[#E4AA8B] block mb-1">
                  SIGNATURE RITUAL
                </span>
                <p className="text-sm text-white font-medium">
                  {sanctuary ? sanctuary.curatedRitual : "Daily Twilight Tea & Silent Meditation"}
                </p>
              </div>
              <div className="bg-[#24211E] border border-white/10 p-5 rounded-2xl">
                <span className="text-[10px] font-mono uppercase text-[#E4AA8B] block mb-1">
                  ESTATE CLIMATE
                </span>
                <p className="text-sm text-white font-medium">
                  {sanctuary ? sanctuary.climate : "Pleasant mountain breezes with crisp starlit nights"}
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-[#251D17] border border-[#D4AF37]/30 p-8 rounded-3xl space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[11px] font-mono uppercase text-[#D4AF37] tracking-widest">
                <span>✦ DIRECT RESIDENCE PRIVILEGE</span>
              </div>
              <h3 className="font-stedelijk uppercase text-2xl text-white">
                CURATED INCLUSIONS
              </h3>
              <ul className="space-y-3 text-xs text-white/80">
                <li className="flex items-center gap-2">
                  <span className="text-[#D4AF37]">✓</span>
                  <span>Complimentary Organic Breakfast from Chuli kitchen</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#D4AF37]">✓</span>
                  <span>Dedicated Himalayan Butler & Concierge service</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#D4AF37]">✓</span>
                  <span>High-speed Starlink / Fiber WiFi in all suites</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#D4AF37]">✓</span>
                  <span>Complimentary airport / trail arrival pick-up</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#D4AF37]">✓</span>
                  <span>48-hour flexible cancellation privilege</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-white/10">
              <Link
                href={`/booking?sanctuary=${normalized}`}
                className="w-full block text-center bg-[#FAF1E8] text-[#1E1B19] py-3.5 rounded-full font-mono text-xs uppercase tracking-widest font-semibold hover:bg-[#E4AA8B] transition-colors"
              >
                Reserve Sanctuary Stay
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          4. CURATED SUITE RESIDENCES
          ======================================================== */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-14 py-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#E4AA8B] block mb-1">
              EXCLUSIVE SUITE COLLECTION
            </span>
            <h2
              className="font-stedelijk uppercase text-2xl sm:text-4xl text-[#FAF1E8] tracking-wider"
              style={{ textTransform: "uppercase" }}
            >
              RESIDENCES AT THIS PROPERTY
            </h2>
          </div>
          <Link
            href="/rooms"
            className="text-xs font-mono uppercase tracking-widest text-[#E4AA8B] hover:text-white transition-colors"
          >
            Compare with other sanctuaries →
          </Link>
        </div>

        {suites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {suites.map((suite) => (
              <div
                key={suite.id}
                className="bg-[#24211E] rounded-3xl border border-white/10 overflow-hidden flex flex-col group hover:border-[#E4AA8B]/50 transition-all duration-300"
              >
                <div className="relative h-64 w-full overflow-hidden">
                  <Image
                    src={suite.images[0] || "/hero.png"}
                    alt={suite.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-700 brightness-90"
                  />
                  <div className="absolute top-3 left-3 bg-[#1E1B19]/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest text-[#E4AA8B]">
                    {suite.badge || "SANCTUARY SUITE"}
                  </div>
                  <div className="absolute bottom-3 right-3 bg-[#1E1B19]/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-mono text-white">
                    {suite.specs.sqFt} sq.ft · Max {suite.specs.maxGuests} Guests
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3
                      className="font-stedelijk uppercase text-xl text-[#FAF1E8] group-hover:text-[#E4AA8B] transition-colors"
                      style={{ textTransform: "uppercase" }}
                    >
                      {suite.title}
                    </h3>
                    <p className="text-xs text-white/60 line-clamp-2 leading-relaxed">
                      {suite.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-white/50 block">
                        Direct Rate
                      </span>
                      <span className="text-lg font-semibold text-[#E4AA8B]">
                        NPR {suite.priceNpr.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-white/50 font-mono"> / night</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/rooms/${suite.slug}`}
                        className="bg-white/10 hover:bg-white/20 text-white px-3.5 py-2 rounded-xl text-xs font-mono uppercase tracking-wider transition-colors"
                      >
                        Specs
                      </Link>
                      <Link
                        href={`/booking?suite=${suite.id}`}
                        className="bg-[#FAF1E8] text-[#1E1B19] px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider font-semibold hover:bg-[#E4AA8B] transition-colors"
                      >
                        Book
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#24211E] rounded-3xl border border-white/10 p-12 text-center space-y-4">
            <h3 className="font-stedelijk uppercase text-2xl text-white">
              SANCTUARY INAUGURATION PENDING
            </h3>
            <p className="text-sm text-white/60 max-w-md mx-auto">
              This property is currently being onboarded onto the Basai network. Check back soon or register your own sanctuary.
            </p>
            <Link
              href="/onboarding"
              className="inline-block bg-[#E4AA8B] text-[#1E1B19] px-6 py-2.5 rounded-full font-mono text-xs uppercase tracking-widest font-semibold hover:bg-white transition-colors"
            >
              Hotelier Studio Onboarding →
            </Link>
          </div>
        )}
      </section>

      {/* ========================================================
          5. FOOTER RETURN STRIP
          ======================================================== */}
      <footer className="border-t border-white/10 py-8 px-4 text-center text-xs text-white/40 font-mono">
        <p>© 2026 BASAI HIMALAYAN SANCTUARIES & BOUTIQUE HOSPITALITY GROUP</p>
      </footer>
    </div>
  );
}
