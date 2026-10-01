"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  // The room availability & booking pages have their own bespoke immersive heroes and do not need the generic navbar/footer
  const isImmersiveFlow = pathname.startsWith("/rooms") || pathname === "/booking";

  return (
    <div className="flex flex-col min-h-screen">
      {!isHomePage && !isImmersiveFlow && <Navbar />}
      <main className="flex-1">{children}</main>
      {!isHomePage && !isImmersiveFlow && <Footer />}
    </div>
  );
}
