import type { Metadata, Viewport } from "next";
import CookieConsentBanner from "@/components/public/CookieConsentBanner";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#1E1B19",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://basai.com.np"),
  title: {
    default: "BASAI | Boutique Hospitality & Mountain Sanctuaries in Nepal",
    template: "%s | BASAI Hospitality",
  },
  description:
    "Discover the world of Basai. Curated architectural sanctuaries, heritage suites, organic highland cuisine at Chuli, and slow luxury stays across Nepal.",
  keywords: [
    "Basai",
    "Boutique hotels Nepal",
    "Luxury stays Kathmandu",
    "Dwarika's Heritage",
    "The Pavilions Pokhara",
    "Shinta Mani Mustang",
    "Himalayan sanctuaries",
    "Nepal luxury resort",
    "Chuli dining",
    "Hotel booking Nepal",
  ],
  authors: [{ name: "Basai Hospitality Group" }],
  creator: "Basai",
  publisher: "Basai Hospitality Group",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon", type: "image/png", sizes: "32x32" },
    ],
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://basai.com.np",
    siteName: "BASAI",
    title: "BASAI | Boutique Hospitality & Mountain Sanctuaries in Nepal",
    description:
      "Curated architectural sanctuaries, heritage suites, organic highland cuisine at Chuli, and slow luxury stays across Nepal.",
    images: [
      {
        url: "/hero.png",
        width: 1920,
        height: 1080,
        alt: "Basai Mountain Sanctuaries & Architectural Hospitality",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BASAI | Boutique Hospitality & Mountain Sanctuaries in Nepal",
    description:
      "Curated architectural sanctuaries, heritage suites, and slow luxury stays across Nepal.",
    images: ["/hero.png"],
    creator: "@basai_hospitality",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Structured Schema markup for Luxury Hotel Brand
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Hotel",
    name: "Basai Sanctuaries & Boutique Hospitality",
    description:
      "Architectural sanctuaries rooted in the Himalayas. Curated heritage stays, organic highland cuisine, and slow living across Nepal.",
    url: "https://basai.com.np",
    logo: "https://basai.com.np/favicon.svg",
    image: "https://basai.com.np/hero.png",
    priceRange: "$$$$",
    address: {
      "@type": "PostalAddress",
      addressCountry: "NP",
    },
  };

  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="stylesheet" href="/fonts/fonts.css" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col antialiased text-neutral-900 bg-[#1E1B19]">
        {children}
        <CookieConsentBanner />
      </body>
    </html>
  );
}
