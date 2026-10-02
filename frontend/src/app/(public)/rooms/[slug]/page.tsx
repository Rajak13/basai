import type { Metadata } from "next";
import { BASAI_SUITES } from "@/data/suites";
import SuiteDetailView from "@/components/public/SuiteDetailView";

interface RoomDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: RoomDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const suite = BASAI_SUITES.find((s) => s.slug === slug) || BASAI_SUITES[0];

  return {
    title: `${suite.title.toUpperCase()} | Basai Mountain Sanctuaries`,
    description: suite.description,
    openGraph: {
      title: `${suite.title} | ${suite.sanctuary}`,
      description: suite.tagline,
      images: [
        {
          url: suite.images[0],
          width: 1200,
          height: 800,
          alt: suite.title,
        },
      ],
    },
  };
}

export default async function RoomDetailPage({ params }: RoomDetailPageProps) {
  const { slug } = await params;
  return <SuiteDetailView slug={slug} />;
}
