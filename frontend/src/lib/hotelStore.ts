"use client";

import { SuiteItem, BASAI_SUITES } from "@/data/suites";

export interface OnboardedHotel {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  location: string;
  elevation: string;
  vibe: string;
  heroImage: string;
  primaryCurrency: "NPR" | "USD";
  taxRate: number;
  serviceCharge: number;
  panNumber: string;
  tradeLicenseName: string;
  restaurantName: string;
  paymentGateways: {
    esewa: boolean;
    khalti: boolean;
    fonepay: boolean;
    stripe: boolean;
    payOnArrival: boolean;
  };
  suites: SuiteItem[];
  createdAt: string;
  status: "ACTIVE" | "PENDING_VERIFICATION";
}

const STORAGE_KEY = "basai_active_sanctuary";

export const hotelStore = {
  // Get active hotel or null if clean slate
  getActiveHotel(): OnboardedHotel | null {
    if (typeof window === "undefined") return null;
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  // Save onboarded hotel
  saveHotel(hotel: OnboardedHotel): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(hotel));
      // Dispatch storage event so other components update reactively
      window.dispatchEvent(new Event("basai-hotel-changed"));
    } catch (e) {
      console.error("Failed to save hotel to storage", e);
    }
  },

  // Clear / Reset to default sample sanctuaries
  resetToDefaults(): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new Event("basai-hotel-changed"));
    } catch (e) {
      console.error("Failed to reset hotel storage", e);
    }
  },

  // Convert onboarded drafts to full SuiteItems
  createSuitesFromDrafts(
    hotelName: string,
    hotelSlug: string,
    location: string,
    heroImage: string,
    drafts: Array<{
      name: string;
      basePriceNpr: number;
      bedType: string;
      maxGuests: number;
      view: string;
      amenities?: string[];
      sqFt?: number;
    }>
  ): SuiteItem[] {
    return drafts.map((draft, idx) => {
      const suiteSlug = `${hotelSlug}-${draft.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}`;
      return {
        id: `suite-${hotelSlug}-${idx + 1}`,
        slug: suiteSlug,
        title: draft.name,
        sanctuary: hotelName,
        sanctuaryId: "kathmandu", // fallback ID
        location: location,
        tagline: `${draft.bedType} with ${draft.view}`,
        description: `Individually commissioned living space at ${hotelName}. Meticulously styled with local organic textures, bespoke artisan furniture, and uninterrupted vistas of ${draft.view}.`,
        priceNpr: draft.basePriceNpr,
        priceUsd: Math.round(draft.basePriceNpr / 133),
        rating: 4.98,
        reviewsCount: 12,
        badge: idx === 0 ? "SIGNATURE SUITE" : "SANCTUARY RETREAT",
        remainingSuites: 3,
        specs: {
          sqFt: draft.sqFt || 650,
          sqM: Math.round((draft.sqFt || 650) * 0.0929),
          bed: draft.bedType,
          maxGuests: draft.maxGuests,
          view: draft.view,
          floor: `${idx + 1}st Floor Private Pavilion`,
        },
        amenities: draft.amenities && draft.amenities.length > 0 ? draft.amenities : [
          "Bespoke Copper Bath Fixtures",
          "Private Panoramic Veranda",
          "Artisanal Morning Breakfast",
          "Personal Estate Butler",
          "High-speed Fiber WiFi",
          "Sonos Acoustic Environment",
        ],
        images: [
          heroImage || "/hero.png",
          "/kathmandu.png",
          "/pokhara.png",
          "/mustang.png",
        ],
        highlights: [
          `${draft.bedType} with handwoven Himalayan organic textiles`,
          `Panoramic vistas overlooking ${draft.view}`,
          "Private terrace with heated teak daybeds",
          "Bespoke turn-down ritual with native mountain tisanes",
        ],
      };
    });
  },
};
