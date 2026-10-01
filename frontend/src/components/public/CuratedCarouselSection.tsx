"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";

interface CuratedItem {
  id: string;
  tag: string;
  badge: string;
  title: string;
  nepaliTitle?: string;
  description: string;
  image: string;
  fallback: string;
  href: string;
  actionText: string;
}

const CURATED_ITEMS: CuratedItem[] = [
  {
    id: "hotels",
    tag: "01",
    badge: "SANCTUARIES",
    title: "OUR HOTELS",
    nepaliTitle: "हाम्रा होटलहरू",
    description: "Four boutique mountain and riverside sanctuaries across Dharan, Bhedetar, Namje & Koshi.",
    image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format&fit=crop&q=80",
    fallback: "/hero.png",
    href: "/rooms",
    actionText: "Explore",
  },
  {
    id: "dining",
    tag: "02",
    badge: "CULINARY",
    title: "FOOD AND DRINK",
    nepaliTitle: "खानपान र स्वाद",
    description: "Indigenous eastern Nepali flavors, organic highland foraging, and rooftop fireside dining.",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80",
    fallback: "/hero.png",
    href: "#dining",
    actionText: "Explore",
  },
  {
    id: "pool",
    tag: "03",
    badge: "WELLNESS",
    title: "SWIMMING POOL",
    nepaliTitle: "पौडी तथा आराम",
    description: "Heated indoor & infinity waters mirroring the mist and contours of the Himalayan foothills.",
    image: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800&auto=format&fit=crop&q=80",
    fallback: "/hero.png",
    href: "#wellness",
    actionText: "Explore",
  },
  {
    id: "offers",
    tag: "04",
    badge: "PRIVILEGE",
    title: "OFFERS",
    nepaliTitle: "विशेष अफरहरू",
    description: "Exclusive weekend retreats, seasonal mountain packages, and direct booking benefits.",
    image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&auto=format&fit=crop&q=80",
    fallback: "/hero.png",
    href: "/rooms?filter=offers",
    actionText: "Explore",
  },
  {
    id: "meetings",
    tag: "05",
    badge: "BUSINESS",
    title: "MEETING ROOMS",
    nepaliTitle: "सभा तथा बैठक",
    description: "High-bandwidth boardroom retreats and executive pavilions tailored for creative clarity.",
    image: "https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=800&auto=format&fit=crop&q=80",
    fallback: "/hero.png",
    href: "#meetings",
    actionText: "Explore",
  },
  {
    id: "events",
    tag: "06",
    badge: "CELEBRATION",
    title: "EVENTS AND WEDDINGS",
    nepaliTitle: "उत्सव तथा विवाह",
    description: "Bespoke banquet spaces and open-air lawns for unforgettable celebrations in the hills.",
    image: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&auto=format&fit=crop&q=80",
    fallback: "/hero.png",
    href: "#events",
    actionText: "Explore",
  },
  {
    id: "experiences",
    tag: "07",
    badge: "EXPEDITION",
    title: "EXPERIENCES",
    nepaliTitle: "अनुभूति र यात्रा",
    description: "Koshi river safaris, paragliding over Dharan, and guided trails to sacred hilltops.",
    image: "https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=800&auto=format&fit=crop&q=80",
    fallback: "/hero.png",
    href: "#experiences",
    actionText: "Explore",
  },
  {
    id: "about",
    tag: "08",
    badge: "HERITAGE",
    title: "ABOUT BASAI",
    nepaliTitle: "बसाइको बारेमा",
    description: "Rooted in authentic Nepali hospitality, crafted for the traveler seeking serene luxury.",
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80",
    fallback: "/hero.png",
    href: "#about",
    actionText: "Explore",
  },
];

interface CuratedCarouselSectionProps {
  lang?: "en" | "np";
}

export default function CuratedCarouselSection({ lang = "en" }: CuratedCarouselSectionProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [totalSteps, setTotalSteps] = useState(5);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const checkScrollState = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const scrollLeft = el.scrollLeft;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(scrollLeft > 15);
    setCanScrollRight(scrollLeft < maxScroll - 15);

    // Compute visible cards dynamically
    const firstChild = el.firstElementChild as HTMLElement;
    const cardWidth = firstChild ? firstChild.clientWidth + 24 : 340;
    const visibleCards = Math.max(1, Math.round(el.clientWidth / cardWidth));
    const maxPages = Math.max(1, CURATED_ITEMS.length - visibleCards + 1); // e.g. 8 - 4 + 1 = 5 on desktop
    setTotalSteps(maxPages);

    if (scrollLeft >= maxScroll - 20) {
      setCurrentStep(maxPages);
    } else {
      const rawStep = Math.round(scrollLeft / cardWidth) + 1;
      setCurrentStep(Math.min(maxPages, Math.max(1, rawStep)));
    }
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScrollState, { passive: true });
    window.addEventListener("resize", checkScrollState);
    checkScrollState();
    return () => {
      el.removeEventListener("scroll", checkScrollState);
      window.removeEventListener("resize", checkScrollState);
    };
  }, [checkScrollState]);

  const scrollLeft = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const firstChild = el.firstElementChild as HTMLElement;
    const cardWidth = firstChild ? firstChild.clientWidth + 24 : 360;
    el.scrollBy({ left: -cardWidth, behavior: "smooth" });
  };

  const scrollRight = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const firstChild = el.firstElementChild as HTMLElement;
    const cardWidth = firstChild ? firstChild.clientWidth + 24 : 360;
    el.scrollBy({ left: cardWidth, behavior: "smooth" });
  };

  const handleImageError = (id: string) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <section id="experiences" className="relative w-full bg-[#F7F2EB] text-[#221B18] pt-16 sm:pt-24 pb-32 sm:pb-40 px-4 sm:px-8 lg:px-14 overflow-hidden border-t border-[#E5DACF]/80 select-none">
      {/* SECTION HEADER: TITLE & BESPOKE PAGINATION CONTROLS */}
      <div className="max-w-[1440px] mx-auto mb-10 sm:mb-14 flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div>
          {/* CATEGORY TELEMETRY BADGE */}
          <div className="flex items-center gap-2 mb-3 text-[11px] font-mono uppercase tracking-[0.22em] text-[#B26B4A]">
            <span className="w-2 h-2 rounded-full bg-[#B26B4A]" />
            <span>02 // EXPERIENCES & SANCTUARIES</span>
          </div>

          {/* MONUMENTAL HEADLINE IN ARCHITYPE STEDELIJK */}
          <h2
            className="font-stedelijk uppercase text-3xl sm:text-5xl lg:text-[56px] text-[#221B18] tracking-wider leading-[1.05]"
            style={{ textTransform: "uppercase" }}
          >
            THE WORLD OF BASAI
          </h2>

          <p className="mt-3 text-xs sm:text-sm text-[#695C53] max-w-xl font-normal leading-relaxed">
            Eight curated chapters of Himalayan stillness, indigenous culinary art, and mountain sanctuaries designed for quiet luxury.
          </p>
        </div>

        {/* CAROUSEL CONTROLS: STEP COUNTER (01 / 05) & ARROWS */}
        <div className="flex items-center gap-4 self-end md:self-auto">
          {/* INDEX COUNTER (PROPERLY REACHES 05 / 05 AT THE END) */}
          <div className="text-xs font-mono tracking-wider text-[#695C53]">
            <span className="text-[#B26B4A] font-semibold">
              {currentStep.toString().padStart(2, "0")}
            </span>
            <span className="mx-1 text-[#695C53]/40">/</span>
            <span className="font-semibold text-[#221B18]">
              {totalSteps.toString().padStart(2, "0")}
            </span>
          </div>

          {/* ARROWS (ARCHITECTURAL CIRCULAR CONTROLS ON LIGHT BACKGROUND) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={scrollLeft}
              disabled={!canScrollLeft}
              aria-label="Previous items"
              className={`w-10 sm:w-11 h-10 sm:h-11 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                canScrollLeft
                  ? "border-[#D5C6BA] text-[#221B18] bg-white hover:border-[#B26B4A] hover:text-[#B26B4A] hover:shadow-xs active:scale-95"
                  : "border-[#E5DACF] text-neutral-300 bg-white/50 cursor-not-allowed opacity-40"
              }`}
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
              </svg>
            </button>

            <button
              type="button"
              onClick={scrollRight}
              disabled={!canScrollRight}
              aria-label="Next items"
              className={`w-10 sm:w-11 h-10 sm:h-11 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                canScrollRight
                  ? "border-[#D5C6BA] text-[#221B18] bg-white hover:border-[#B26B4A] hover:text-[#B26B4A] hover:shadow-xs active:scale-95"
                  : "border-[#E5DACF] text-neutral-300 bg-white/50 cursor-not-allowed opacity-40"
              }`}
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* HORIZONTAL CAROUSEL SCROLLER */}
      <div
        ref={scrollContainerRef}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        className="max-w-[1440px] mx-auto flex gap-5 sm:gap-6 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory px-2 pb-6 [&::-webkit-scrollbar]:hidden"
      >
        {CURATED_ITEMS.map((item) => {
          const imgSrc = imageErrors[item.id] ? item.fallback : item.image;

          return (
            <div
              key={item.id}
              className="w-[280px] sm:w-[320px] lg:w-[340px] shrink-0 snap-start flex flex-col group cursor-pointer"
            >
              {/* IMAGE FRAME WITH WARM ALABASTER SHADOW & HOVER ACCENT */}
              <div className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden border border-[#EBDCD0] shadow-sm bg-neutral-200 group-hover:border-[#B26B4A]/60 group-hover:shadow-md transition-all duration-500">
                <Image
                  src={imgSrc}
                  alt={item.title}
                  fill
                  sizes="(max-width: 640px) 280px, (max-width: 1024px) 320px, 340px"
                  onError={() => handleImageError(item.id)}
                  className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                />

                {/* VIGNETTE GRADIENTS */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                {/* TOP CORNER BADGE */}
                <div className="absolute top-3.5 left-3.5 z-10">
                  <span className="text-[10px] font-mono tracking-wider uppercase bg-white/85 backdrop-blur-md text-[#221B18] border border-[#E5DACF] px-2.5 py-1 rounded-full shadow-xs">
                    {item.tag} // {item.badge}
                  </span>
                </div>
              </div>

              {/* CARD DETAILS BELOW IMAGE */}
              <div className="pt-4 flex flex-col items-center text-center">
                {/* TITLE IN ARCHITYPE STEDELIJK */}
                <h3
                  className="font-stedelijk uppercase text-lg sm:text-[22px] text-[#221B18] group-hover:text-[#B26B4A] transition-colors tracking-wide leading-snug"
                  style={{ textTransform: "uppercase" }}
                >
                  {item.title}
                </h3>

                {/* DESCRIPTION */}
                <p className="mt-1 text-xs text-[#695C53] line-clamp-2 leading-relaxed px-1 font-normal">
                  {item.description}
                </p>

                {/* ACTION CTA BUTTON */}
                <div className="mt-3.5">
                  <Link
                    href={item.href}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-[#D5C6BA] text-[#221B18] bg-white group-hover:border-[#B26B4A] group-hover:text-[#B26B4A] group-hover:bg-[#FAF1E8] text-xs font-medium tracking-wide transition-all duration-300 shadow-2xs hover:shadow-xs"
                  >
                    <span>Explore</span>
                    <svg className="w-2.5 h-2.5 fill-current ml-0.5" viewBox="0 0 24 24">
                      <path d="M5 3l14 9-14 9V3z" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
