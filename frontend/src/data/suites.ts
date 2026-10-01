export interface SuiteItem {
  id: string;
  slug: string;
  title: string;
  sanctuary: string;
  sanctuaryId: "kathmandu" | "pokhara" | "mustang" | "dharan";
  location: string;
  tagline: string;
  description: string;
  priceNpr: number;
  priceUsd: number;
  rating: number;
  reviewsCount: number;
  badge?: string;
  remainingSuites: number;
  specs: {
    sqFt: number;
    sqM: number;
    bed: string;
    maxGuests: number;
    view: string;
    floor: string;
  };
  amenities: string[];
  images: string[];
  highlights: string[];
}

export const BASAI_SUITES: SuiteItem[] = [
  {
    id: "suite-1",
    slug: "dwarikas-royal-heritage-suite",
    title: "Royal Newari Heritage Suite",
    sanctuary: "Dwarika's Heritage Sanctuary",
    sanctuaryId: "kathmandu",
    location: "Kathmandu Valley · 1,400m",
    tagline: "Handcrafted 14th-century wood carvings & private terracotta courtyard",
    description:
      "A tribute to historical Malla architecture. Hand-hewn Sal timber columns, bespoke Newari brass fixtures, a freestanding beaten-copper soaking tub, and custom organic Himalayan linen. Every detail preserves living artisanal museum heritage.",
    priceNpr: 32500,
    priceUsd: 245,
    rating: 4.96,
    reviewsCount: 38,
    badge: "HERITAGE MASTERPIECE",
    remainingSuites: 2,
    specs: {
      sqFt: 720,
      sqM: 67,
      bed: "Super King Bed",
      maxGuests: 3,
      view: "Heritage Courtyard & Temple Shrines",
      floor: "2nd Floor (Old Palace Wing)",
    },
    amenities: [
      "Freestanding Copper Soaking Tub",
      "Private Terracotta Balcony",
      "Organic Newari Breakfast at Krishnarpan",
      "Personal Himalayan Butler",
      "High-speed Fiber WiFi",
      "Sonos Ambient Audio",
      "Artisanal Tea & French Press Coffee",
      "Heated Clay Tile Flooring",
    ],
    images: [
      "/kathmandu.png",
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=1200&auto=format&fit=crop&q=80",
    ],
    highlights: [
      "Direct courtyard views of 14th-century restored terracotta carvings",
      "Private courtyard tea ceremony included every afternoon",
      "Pre-booked heritage temple walking escort with local historian",
    ],
  },
  {
    id: "suite-2",
    slug: "annapurna-mountain-panorama-villa",
    title: "Annapurna Mountain Panorama Villa",
    sanctuary: "The Pavilions Mountain Sanctuary",
    sanctuaryId: "pokhara",
    location: "Pokhara Foothills · 820m",
    tagline: "Floor-to-ceiling glass pavilions framing the snow-crested Machapuchare",
    description:
      "Perched on an organic farm terrace overlooking the tranquil Phewa valley. Featuring expansive floor-to-ceiling glass panels, an outdoor daybed deck, private sunken fireplace, and an open-concept cedar bathroom overlooking forested ridges.",
    priceNpr: 28000,
    priceUsd: 210,
    rating: 4.98,
    reviewsCount: 52,
    badge: "ANNAPURNA PANORAMA",
    remainingSuites: 1,
    specs: {
      sqFt: 840,
      sqM: 78,
      bed: "King Bed + Outdoor Daybed",
      maxGuests: 4,
      view: "Machapuchare & Valley Ridge",
      floor: "Standalone Private Villa",
    },
    amenities: [
      "Infinity Pool Access (Solar-Heated)",
      "Sunken Living Fireplace",
      "Farm-to-Table Breakfast Included",
      "Private Wrap-around Sun Deck",
      "Aromatherapy Herbal Spa Kit",
      "High-speed Fiber WiFi",
      "Bespoke Yoga Pavilion Mats",
      "Sub-zero Minibar & Local Gin",
    ],
    images: [
      "/pokhara.png",
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1200&auto=format&fit=crop&q=80",
    ],
    highlights: [
      "180° unobstructed sunrise views over Fish Tail (Machapuchare)",
      "Private farm foraging walk with the executive chef",
      "Complimentary mountain bikes and private rowing access on Phewa Lake",
    ],
  },
  {
    id: "suite-3",
    slug: "shinta-mani-highland-stone-suite",
    title: "Shinta Mani Highland Stone Suite",
    sanctuary: "Shinta Mani High Sanctuary",
    sanctuaryId: "mustang",
    location: "Mustang Highlands · 2,800m",
    tagline: "High-altitude Tibetan aesthetic with Nilgiri stone & cashmere warmth",
    description:
      "A high-altitude sanctuary designed by Bill Bensley. Built with local Nilgiri slate, antique Tibetan hand-painted cabinets, deep cashmere throws, and a wood-pellet hearth. Wake up to dramatic wind-carved canyon vistas and sacred Himalayan peaks.",
    priceNpr: 45000,
    priceUsd: 340,
    rating: 4.99,
    reviewsCount: 29,
    badge: "ULTRA-LUXURY RETREAT",
    remainingSuites: 2,
    specs: {
      sqFt: 920,
      sqM: 85,
      bed: "Super King Bed",
      maxGuests: 2,
      view: "Nilgiri Peak & Kali Gandaki Gorge",
      floor: "Upper Sanctuary Ridge",
    },
    amenities: [
      "Pellet Fire Hearth with Unlimited Wood",
      "Custom Cashmere Bedding & Robes",
      "Highland Foraged Multi-course Dining",
      "Private Heated Plunge Tub",
      "Tibetan Herbal Bath Soak",
      "Personal High-Altitude Trekking Guide",
      "Curated Book & Himalayan Archive",
      "Satellite High-speed Starlink WiFi",
    ],
    images: [
      "/mustang.png",
      "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=1200&auto=format&fit=crop&q=80",
    ],
    highlights: [
      "Direct panoramic view of Nilgiri South and Dhaulagiri peaks",
      "Daily guided monastery meditation session at sunrise",
      "All-inclusive mountain foraging meals and fine regional wines",
    ],
  },
  {
    id: "suite-4",
    slug: "chuli-ridge-hearth-penthouse",
    title: "Chuli Ridge Hearth Penthouse",
    sanctuary: "Basai Foothill Haven",
    sanctuaryId: "dharan",
    location: "Bhedetar Ridge & Dharan · 1,420m",
    tagline: "Panoramic cloud terrace overlooking the Koshi plains & Chuli Hearth",
    description:
      "Located above our signature Chuli Restaurant and Hearth. This exclusive rooftop penthouse features a private firepit terrace, floor-to-ceiling glass looking toward the tea gardens, and priority fireside table access each evening.",
    priceNpr: 21500,
    priceUsd: 160,
    rating: 4.92,
    reviewsCount: 44,
    badge: "PRIVATE FIREPIT TERRACE",
    remainingSuites: 3,
    specs: {
      sqFt: 620,
      sqM: 58,
      bed: "King Bed",
      maxGuests: 2,
      view: "Rolling Tea Terraces & Koshi Plain",
      floor: "Top Floor Penthouse",
    },
    amenities: [
      "Private Open-Air Terrace Firepit",
      "Priority Dining at Chuli Restaurant",
      "Terrazzo Rainforest Shower",
      "Highland Organic Breakfast",
      "Fiber WiFi & Smart Streaming",
      "Artisanal Coffee Grinder & Single-Origin Beans",
      "Custom Wool Blankets & Firewood Refill",
      "Sunset Cocktail Service Included",
    ],
    images: [
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200&auto=format&fit=crop&q=80",
      "/hero.png",
      "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=1200&auto=format&fit=crop&q=80",
    ],
    highlights: [
      "Rooftop firepit lit nightly by our hearth master",
      "Walking access to Bhedetar Charles Point & pine ridge trails",
      "Complimentary tasting flight of Eastern Nepali indigenous spirits",
    ],
  },
  {
    id: "suite-5",
    slug: "patan-courtyard-junior-suite",
    title: "Patan Courtyard Junior Suite",
    sanctuary: "Dwarika's Heritage Sanctuary",
    sanctuaryId: "kathmandu",
    location: "Kathmandu Valley · 1,400m",
    tagline: "Serene carved bay windows looking onto sacred quiet courtyards",
    description:
      "An intimate sanctuary designed for slow readers and heritage seekers. Features an authentic Newari Jhyal (carved bay window seat), natural terracotta tiles, brass bedside lanterns, and a walk-in slate shower.",
    priceNpr: 24000,
    priceUsd: 180,
    rating: 4.94,
    reviewsCount: 31,
    badge: "COURTYARD SERENITY",
    remainingSuites: 4,
    specs: {
      sqFt: 480,
      sqM: 45,
      bed: "Queen Bed",
      maxGuests: 2,
      view: "Inner Lotus Courtyard",
      floor: "1st Floor (Garden Wing)",
    },
    amenities: [
      "Authentic Carved Bay Window Seat",
      "Slate Rainforest Shower",
      "Organic Himalayan Herbal Toiletries",
      "Breakfast in the Lotus Garden",
      "High-speed Fiber WiFi",
      "Handcrafted Clay Kettle & Herbal Teas",
      "Silent Air Conditioning & Heating",
      "Daily Turndown with Mountain Honey",
    ],
    images: [
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&auto=format&fit=crop&q=80",
      "/kathmandu.png",
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200&auto=format&fit=crop&q=80",
    ],
    highlights: [
      "Private reading niche in traditional carved wooden window frame",
      "Direct stepping-stone access to the lotus meditation pool",
      "Quiet courtyard ambiance free from city noise",
    ],
  },
  {
    id: "suite-6",
    slug: "koshi-river-luxury-wilderness-tent",
    title: "Koshi River Wilderness Pavilion",
    sanctuary: "Basai Foothill Haven",
    sanctuaryId: "dharan",
    location: "Koshi River Sanctuary · 210m",
    tagline: "Expansive safari canvas suite with teakwood floors on riverbanks",
    description:
      "A seasonal luxury wilderness pavilion stationed at the edge of the Koshi Tappu nature reserve. Hand-stitched canvas, polished teakwood decking, private open-air outdoor copper tub, and nighttime stargazing under unpolluted Himalayan skies.",
    priceNpr: 19500,
    priceUsd: 145,
    rating: 4.95,
    reviewsCount: 22,
    badge: "RIVER SAFARI VIBES",
    remainingSuites: 2,
    specs: {
      sqFt: 550,
      sqM: 51,
      bed: "King Bed",
      maxGuests: 2,
      view: "Koshi River Sandbanks & Wetlands",
      floor: "Elevated Teak Platform",
    },
    amenities: [
      "Private Open-Air Copper Tub",
      "Riverbank Sundowner Deck",
      "Guided Dawn Birdwatching Safari",
      "Campfire Dining & Live Grill",
      "Starlink Satellite WiFi",
      "Solar Water Heating & Fans",
      "All-Natural Mosquito Repellents & Linens",
      "Binoculars & Field Spotting Scopes",
    ],
    images: [
      "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1200&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&auto=format&fit=crop&q=80",
      "/pokhara.png",
    ],
    highlights: [
      "Private naturalist escort for early morning wetland bird spotting",
      "Private riverbank dinner under the stars with candle lanterns",
      "Soothing sounds of water flowing from the foothills into the plains",
    ],
  },
];
