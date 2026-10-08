import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Multi-Tenant Routing Middleware
 *
 * Handles both:
 * 1. Subdomain multi-tenancy (e.g., mustang.basai.com.np or mustang.localhost:3000)
 *    when custom domains with wildcard DNS are configured.
 * 2. Fallback to path-based routing (e.g., basai-np.vercel.app/sanctuaries/mustang)
 *    which works 100% free on Vercel without wildcard domains.
 */
export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get("host") || "";

  // Bypass static files, internal Next.js assets, and APIs
  if (
    url.pathname.startsWith("/_next") ||
    url.pathname.startsWith("/api") ||
    url.pathname.startsWith("/fonts") ||
    url.pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Clean host (strip port number if local)
  const currentHost = hostname.split(":")[0].toLowerCase();

  // Known central platform hosts
  const isPlatformHost =
    currentHost === "localhost" ||
    currentHost === "127.0.0.1" ||
    currentHost === "basai-np.vercel.app" ||
    currentHost === "basai.com.np" ||
    currentHost === "www.basai.com.np" ||
    currentHost.endsWith(".vercel.app");

  // If accessed via a custom subdomain (e.g., mustang.basai.com.np or dharan.localhost)
  if (!isPlatformHost) {
    const parts = currentHost.split(".");
    // e.g. ["mustang", "basai", "com", "np"] or ["mustang", "localhost"]
    if (parts.length >= 2) {
      const subdomain = parts[0];

      // Ignore common non-tenant subdomains
      if (!["www", "admin", "api", "app", "platform", "mail"].includes(subdomain)) {
        // Rewrite root to the dedicated sanctuary route for that tenant
        if (url.pathname === "/") {
          const rewriteUrl = new URL(`/sanctuaries/${subdomain}`, request.url);
          return NextResponse.rewrite(rewriteUrl);
        }

        // Attach tenant header for API or server components
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set("x-tenant-slug", subdomain);

        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, images, icons
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
