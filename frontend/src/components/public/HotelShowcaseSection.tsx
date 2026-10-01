"use client";

import Image from "next/image";
import Link from "next/link";
import RevealOnScroll from "./RevealOnScroll";

interface HotelItem {
  id: string;
  tag: string;
  eyebrowEn: string;
  eyebrowNp: string;
  nameEn: string;
  nameNp: string;
  locationEn: string;
  locationNp: string;
  descriptionEn: string;
  descriptionNp: string;
  image: string;
  stats: { labelEn: string; labelNp: string; valueEn: string; valueNp: string }[];
  accentColor: string;
}

const TOP_HOTELS: HotelItem[] = [
  {
    id: "dwarikas",
    tag: "01",
    eyebrowEn: "HERITAGE SANCTUARY",
    eyebrowNp: "सम्पदा विश्राम",
    nameEn: "DWARIKA'S SANCTUARY",
    nameNp: "द्वारिका सम्पदा बसाइ",
    locationEn: "Kathmandu Valley · 1,400m",
    locationNp: "काठमाडौँ उपत्यका · १४०० मिटर",
    descriptionEn:
      "A living museum of Newari craftsmanship. 14th-century wood carvings, terracotta courtyards, flickering butter lamps, and intimate royal dining pavilions.",
    descriptionNp:
      "नेवारी शिल्पकला र इतिहासको जीवन्त सङ्ग्रहालय। १४औँ शताब्दीको काष्ठकला, माटोका आँगन, परम्परागत दियो र शाही भोजन विश्राम।",
    image: "/kathmandu.png",
    stats: [
      { labelEn: "Heritage", labelNp: "सम्पदा", valueEn: "15th c. Craft", valueNp: "१५औँ शताब्दी" },
      { labelEn: "Courtyards", labelNp: "आँगनहरू", valueEn: "4 Atriums", valueNp: "४ प्राङ्गण" },
      { labelEn: "Experience", labelNp: "अनुभव", valueEn: "Krishnarpan Dining", valueNp: "कृष्णार्पण भोजन" },
    ],
    accentColor: "#B26B4A",
  },
  {
    id: "pavilions",
    tag: "02",
    eyebrowEn: "VALLEY & RIDGELINE",
    eyebrowNp: "पहाडी उपत्यका",
    nameEn: "THE PAVILIONS RETREAT",
    nameNp: "द पभिलियन्स रिट्रीट",
    locationEn: "Pokhara Valley · Annapurna Range",
    locationNp: "पोखरा उपत्यका · अन्नपूर्ण हिमशृङ्खला",
    descriptionEn:
      "Secluded villas surrounded by organic Himalayan farmland. Private terrace plunge pools, tranquil river songs, and morning panoramic vistas of sacred peaks.",
    descriptionNp:
      "अन्नपूर्णको काखमा जैविक खेतबारीले घेरिएका निजी भिलाहरू। हिमालको दृश्य, खुला पौडी पोखरी, र शान्त प्रकृतिको सानिध्य।",
    image: "/pokhara.png",
    stats: [
      { labelEn: "Landscape", labelNp: "प्रकृति", valueEn: "Organic Valley", valueNp: "जैविक उपत्यका" },
      { labelEn: "Villas", labelNp: "भिलाहरू", valueEn: "14 Eco Villas", valueNp: "१४ इको भिला" },
      { labelEn: "Wellness", labelNp: "आरोग्य", valueEn: "Ayurvedic Spa", valueNp: "आयुर्वेदिक स्पा" },
    ],
    accentColor: "#8E6E53",
  },
  {
    id: "mustang",
    tag: "03",
    eyebrowEn: "FORBIDDEN KINGDOM",
    eyebrowNp: "हिमाली रहस्य",
    nameEn: "SHINTA MANI WILD",
    nameNp: "शिन्ता मानी वाइल्ड",
    locationEn: "Jomsom · High Mustang · 2,800m",
    locationNp: "जोमसोम · मुस्ताङ · २८०० मिटर",
    descriptionEn:
      "Dramatic Tibetan-inspired slate and timber lodge perched amidst the rugged gorges of Nilgiri. Open hearth fireplaces, rare foraged botanicals, and high-desert grandeur.",
    descriptionNp:
      "नीलगिरि र धौलागिरिको फेदीमा तिब्बती वास्तुकला र ढुङ्गाले सजिएको अद्वितीय लज। न्यानो आगोको अँगेठो र अनौठो हिमाली परिदृश्य।",
    image: "/mustang.png",
    stats: [
      { labelEn: "Elevation", labelNp: "उचाइ", valueEn: "2,800m Alpine", valueNp: "२,८०० मिटर" },
      { labelEn: "Sanctuary", labelNp: "संरचना", valueEn: "Bensley Stone Design", valueNp: "विशेष ढुङ्गे कला" },
      { labelEn: "Curated", labelNp: "विशेषाधिकार", valueEn: "Private Expeditions", valueNp: "निजी हिमाली यात्रा" },
    ],
    accentColor: "#9C5B3E",
  },
];

interface HotelShowcaseSectionProps {
  lang?: "en" | "np";
}

export default function HotelShowcaseSection({ lang = "en" }: HotelShowcaseSectionProps) {
  return (
    <section
      id="sanctuaries"
      className="relative w-full bg-[#F7F2EB] py-20 sm:py-28 lg:py-36 px-4 sm:px-8 lg:px-14 overflow-hidden border-t border-[#EAE1D5]"
    >
      <div className="max-w-7xl mx-auto space-y-24 sm:space-y-36 lg:space-y-44">
        {TOP_HOTELS.map((hotel, index) => {
          const isReversed = index % 2 === 1; // 0: Text/Photo, 1: Photo/Text, 2: Text/Photo

          return (
            <div
              key={hotel.id}
              className={`flex flex-col ${
                isReversed ? "lg:flex-row-reverse" : "lg:flex-row"
              } items-center justify-between gap-10 sm:gap-14 lg:gap-20`}
            >
              {/* EDITORIAL CONTENT SIDE */}
              <div className="w-full lg:w-1/2 flex flex-col justify-center text-left">
                <RevealOnScroll direction={isReversed ? "right" : "left"} delay={100}>
                  {/* CATEGORY & LOCATION TAG */}
                  <div className="flex items-center gap-3 mb-4 sm:mb-5">
                    <span className="text-[11px] font-mono tracking-widest text-[#B26B4A] uppercase bg-[#EFE6DB] px-2.5 py-0.5 rounded-full">
                      {hotel.tag}
                    </span>
                    <span className="text-xs sm:text-sm uppercase tracking-[0.22em] text-[#7A6A5E] font-medium">
                      {hotel.eyebrowEn}
                    </span>
                  </div>

                  {/* HOTEL TITLE IN ARCHITYPE STEDELIJK */}
                  <h2
                    className="font-stedelijk uppercase text-3xl sm:text-5xl lg:text-6xl text-[#221B18] tracking-wider leading-[1.08] drop-shadow-xs"
                    style={{ textTransform: "uppercase" }}
                  >
                    {hotel.nameEn}
                  </h2>

                  {/* GEOGRAPHIC CONTEXT */}
                  <p className="mt-2 text-xs sm:text-sm font-serif italic text-[#8B6E57] tracking-wide">
                    {hotel.locationEn}
                  </p>

                  {/* DESCRIPTION */}
                  <p className="mt-5 text-sm sm:text-base text-[#574B42] leading-relaxed max-w-xl font-normal">
                    {hotel.descriptionEn}
                  </p>

                  {/* 3-COLUMN ARCHITECTURAL HIGHLIGHTS (Replaces generic restaurant hours) */}
                  <div className="mt-8 pt-6 border-t border-[#E5D7CA] grid grid-cols-3 gap-4 max-w-lg">
                    {hotel.stats.map((stat, i) => (
                      <div key={i} className="flex flex-col">
                        <span className="text-[11px] uppercase tracking-wider text-[#9C897B] font-medium">
                          {stat.labelEn}
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-[#221B18] mt-0.5">
                          {stat.valueEn}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* ACTION PILL BUTTONS */}
                  <div className="mt-8 sm:mt-10 flex flex-wrap items-center gap-3 sm:gap-4">
                    <Link
                      href="/rooms"
                      className="px-6 sm:px-7 py-2.5 rounded-full border border-[#D5C6BA] bg-white hover:bg-[#FAF1E8] hover:border-[#B26B4A] hover:text-[#B26B4A] text-[#221B18] text-xs sm:text-sm font-medium tracking-wide transition-all duration-300 shadow-xs"
                    >
                      Explore
                    </Link>

                    <Link
                      href="/rooms"
                      className="px-6 sm:px-7 py-2.5 rounded-full border border-[#D5C6BA] bg-white hover:bg-[#FAF1E8] hover:border-[#B26B4A] hover:text-[#B26B4A] text-[#221B18] text-xs sm:text-sm font-medium tracking-wide transition-all duration-300 shadow-xs"
                    >
                      Suites
                    </Link>

                    <Link
                      href="/booking"
                      className="px-6 sm:px-7 py-2.5 rounded-full border border-transparent bg-[#B26B4A] hover:bg-[#975435] text-white text-xs sm:text-sm font-medium tracking-wide transition-all duration-300 shadow-sm"
                    >
                      Reserve stay
                    </Link>
                  </div>
                </RevealOnScroll>
              </div>

              {/* VERTICAL PORTRAIT PHOTOGRAPH SIDE */}
              <div className="w-full lg:w-1/2">
                <RevealOnScroll direction={isReversed ? "left" : "right"} delay={200}>
                  <div className="relative w-full aspect-4/3 sm:aspect-16/11 lg:aspect-4/5 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border border-white/60 group">
                    <Image
                      src={hotel.image}
                      alt={hotel.nameEn}
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-cover transition-transform duration-1000 group-hover:scale-105"
                      priority={index === 0}
                    />

                    {/* Subtle warm architectural sheen */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10 pointer-events-none" />

                    {/* Corner badge index */}
                    <div className="absolute top-4 right-4 z-10 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 text-white text-xs font-mono tracking-wider">
                      {hotel.tag} / 03
                    </div>
                  </div>
                </RevealOnScroll>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
