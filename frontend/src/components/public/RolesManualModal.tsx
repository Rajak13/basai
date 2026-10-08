"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface RolesManualModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type RoleTab = "superadmin" | "owner" | "frontdesk" | "housekeeping" | "guest" | "deployment";

interface RoleDetails {
  id: RoleTab;
  title: string;
  badge: string;
  icon: string;
  summary: string;
  primaryUrl: string;
  urlLabel: string;
  authMethod: string;
  verificationMethod: string;
  permissions: string[];
  testSteps: string[];
}

const ROLES_DATA: RoleDetails[] = [
  {
    id: "superadmin",
    title: "Platform Superadmin",
    badge: "GLOBAL GOVERNANCE",
    icon: "👑",
    summary:
      "Global platform overseer with cross-tenant authority. Audits new hotel registrations, inspects government IRD PAN/VAT certificates, activates hotel subdomains, and monitors cross-estate revenue.",
    primaryUrl: "/admin",
    urlLabel: "Open Operations Center",
    authMethod: "Django Superuser + JWT token (is_platform_admin = True, is_superuser = True)",
    verificationMethod:
      "Provisioned securely via environment variables (DJANGO_SUPERUSER_EMAIL) during deployment using 'python manage.py init_admin'.",
    permissions: [
      "Review & verify pending hotel applications (apps/tenants/admin_views.py)",
      "Activate or suspend hotel subdomains and database schemas",
      "Inspect submitted IRD VAT certificates and Tourism Board licenses",
      "Global cross-tenant analytics and audit trail inspection",
      "Full access to Django Admin at /admin/ on the backend API",
    ],
    testSteps: [
      "Deploy backend with environment variable DJANGO_SUPERUSER_PASSWORD",
      "Run 'python manage.py init_admin' to auto-generate the superadmin",
      "Visit /admin on frontend to monitor live occupancy and arrivals",
      "Visit https://your-backend.onrender.com/admin/ for root Django administration",
    ],
  },
  {
    id: "owner",
    title: "Hotel Owner / General Manager",
    badge: "PROPERTY SOVEREIGN",
    icon: "🏨",
    summary:
      "Proprietor of an individual sanctuary estate. Responsible for commissioning the property, establishing suite rates, setting up Nepal payment gateways (eSewa/Khalti), and viewing revenue yield.",
    primaryUrl: "/onboarding",
    urlLabel: "Launch Onboarding Studio",
    authMethod: "Email + Master Password set during Step 1 of /onboarding (Role: OWNER)",
    verificationMethod:
      "Two-tier verification: Hotelier signs up via 6-step studio, uploads official PAN/VAT certificate. Platform superadmin audits and marks application verified.",
    permissions: [
      "Complete property commissioning at /onboarding",
      "Manage room categories, suite floorplans, and nightly pricing (/admin/rooms)",
      "Configure Nepal payment rails: eSewa Merchant ID, Khalti Secret Key, Fonepay QR",
      "Access Revenue Intelligence reports: ADR, RevPAR, Occupancy rate (/admin/reports)",
      "Invite and manage staff members via /api/tenants/staff/invite/",
    ],
    testSteps: [
      "Navigate to /onboarding on the live site",
      "Complete the 6-step setup with property details and suite rates",
      "Observe the real-time sanctuary preview updating in the right pane",
      "Click through to /admin/reports to view financial yield metrics",
    ],
  },
  {
    id: "frontdesk",
    title: "Front Desk & Concierge",
    badge: "GUEST OPERATIONS",
    icon: "🛎️",
    summary:
      "Handles daily arrivals, guest check-in/out, room tape chart scheduling, walk-in reservations, and bespoke butler coordination for arriving guests.",
    primaryUrl: "/admin/calendar",
    urlLabel: "Open Booking Grid Tape Chart",
    authMethod: "Cryptographic invitation token via email from GM (Role: FRONT_DESK)",
    verificationMethod:
      "Owner sends invitation email. Staff member clicks single-use token link, sets their password, and binds directly to that hotel's database.",
    permissions: [
      "Visual room tape chart calendar (/admin/calendar)",
      "Log walk-in bookings and assign available suites",
      "Process guest check-in and check-out workflows",
      "Record butler requests (dietary notes, helicopter airfield pick-up)",
      "Issue guest folios and print invoices",
    ],
    testSteps: [
      "Navigate to /admin/calendar to view the real-time room grid",
      "Review expected arrivals and departure lists on /admin",
      "Simulate a direct walk-in reservation",
    ],
  },
  {
    id: "housekeeping",
    title: "Housekeeping & Maintenance",
    badge: "SANCTUARY READINESS",
    icon: "🧹",
    summary:
      "Ensures suites maintain pristine Himalayan luxury standards. Dispatches room cleaning statuses, reports maintenance issues (e.g., heated floors, beaten-copper tubs), and verifies suite inspections.",
    primaryUrl: "/admin/housekeeping",
    urlLabel: "Open Housekeeping Board",
    authMethod: "Role-scoped staff login (Role: HOUSEKEEPING)",
    verificationMethod:
      "Assigned by hotel management. Role permissions restricted exclusively to suite readiness and maintenance ticketing.",
    permissions: [
      "Toggle suite status: Clean, Inspecting, Turnover Needed, Out of Order",
      "Log maintenance tickets for urgent repairs with priority flags",
      "Assign staff members to specific floor wings or villas",
      "Track turnaround times between guest departure and arrival",
    ],
    testSteps: [
      "Visit /admin/housekeeping",
      "Toggle room statuses (Dirty -> In Progress -> Ready)",
      "Create a sample maintenance ticket for a suite",
    ],
  },
  {
    id: "guest",
    title: "Guest / Customer",
    badge: "SANCTUARY RESIDENT",
    icon: "🏔️",
    summary:
      "Discovers Himalayan retreats, books luxury suites with curated add-ons (Sherpa trail guide, sound meditation, air transfer), and accesses self-service digital keys and folios.",
    primaryUrl: "/rooms",
    urlLabel: "Explore Sanctuaries & Suites",
    authMethod: "Booking Reference + Mobile/Email or Guest Account (Role: GUEST)",
    verificationMethod:
      "Instant email and SMS/WhatsApp confirmation code issued upon completing direct reservation at /booking.",
    permissions: [
      "Explore curated suites catalog with custom dual-month calendar (/rooms)",
      "Deep dive into suite specifications, lightbox gallery & floorplans (/rooms/[slug])",
      "Reserve suites with bespoke Himalayan add-ons and payment selection (/booking)",
      "Access Self-Check-in, Concierge Chat, and Room Folio (/guest-portal)",
      "Compare up to 3 suites side-by-side (/compare)",
    ],
    testSteps: [
      "Visit /rooms and filter by sanctuary (Kathmandu, Pokhara, Mustang, Dharan)",
      "Click into any suite (e.g. Royal Newari Heritage Suite) to view blueprint and specs",
      "Click 'Book Suite' to go through /booking",
      "Visit /guest-portal to test the digital key and folio screen",
    ],
  },
];

export default function RolesManualModal({ isOpen, onClose }: RolesManualModalProps) {
  const [activeTab, setActiveTab] = useState<RoleTab>("superadmin");

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentRole = ROLES_DATA.find((r) => r.id === activeTab);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl max-h-[90vh] bg-[#1E1B19] border border-[#D4AF37]/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-[#FAF1E8] font-times"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-[#24211E]/80">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/50 flex items-center justify-center text-sm font-mono text-[#D4AF37] font-bold">
              ?
            </span>
            <div>
              <h2
                className="font-stedelijk uppercase text-lg sm:text-xl text-[#FAF1E8] tracking-wider"
                style={{ textTransform: "uppercase" }}
              >
                BASAI SYSTEM MANUAL // ROLES & DEPLOYMENT
              </h2>
              <p className="text-xs text-white/60 font-mono">
                Interactive architecture guide & user verification handbook
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer text-sm font-mono"
            aria-label="Close manual"
          >
            ✕
          </button>
        </div>

        {/* NAVIGATION ROLE TABS */}
        <div className="flex overflow-x-auto no-scrollbar border-b border-white/10 bg-[#1A1816] px-4 gap-2 py-2 text-xs font-mono uppercase tracking-wider">
          {ROLES_DATA.map((role) => (
            <button
              key={role.id}
              onClick={() => setActiveTab(role.id)}
              className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === role.id
                  ? "bg-[#D4AF37] text-[#1E1B19] font-semibold shadow-xs"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <span>{role.icon}</span>
              <span>{role.title}</span>
            </button>
          ))}

          {/* DEPLOYMENT TAB */}
          <button
            onClick={() => setActiveTab("deployment")}
            className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "deployment"
                ? "bg-[#E4AA8B] text-[#1E1B19] font-semibold shadow-xs"
                : "text-[#E4AA8B]/80 hover:text-[#E4AA8B] hover:bg-white/5"
            }`}
          >
            <span>🚀</span>
            <span>Zero-Touch Deployment Guide</span>
          </button>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 text-sm">
          {activeTab === "deployment" ? (
            /* DEPLOYMENT MANUAL VIEW */
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border border-[#E4AA8B]/30 bg-[#251E1A] p-5 rounded-2xl space-y-2">
                <span className="text-[11px] font-mono uppercase text-[#E4AA8B] tracking-widest block">
                  ★ AUTOMATED PRODUCTION SUPERADMIN
                </span>
                <h3 className="font-stedelijk uppercase text-xl text-white">
                  HOW TO CREATE THE PRODUCTION ADMIN ON RENDER / CLOUD
                </h3>
                <p className="text-white/70 text-xs leading-relaxed">
                  We added an idempotent Django command:{" "}
                  <code className="text-[#E4AA8B] font-mono px-1 py-0.5 bg-black/40 rounded">
                    python manage.py init_admin
                  </code>
                  . When deployed to Render or Koyeb, it automatically reads your environment variables and creates the superadmin without requiring an interactive SSH terminal.
                </p>
              </div>

              <div className="space-y-4 font-mono text-xs">
                <div className="bg-[#24211E] border border-white/10 p-4 rounded-xl space-y-2">
                  <span className="text-[#D4AF37] block font-semibold uppercase">
                    Step 1: Set Environment Variables in Cloud Dashboard
                  </span>
                  <div className="bg-black/40 p-3 rounded-lg text-white/80 space-y-1">
                    <p>DJANGO_SUPERUSER_EMAIL = admin@basai.com.np</p>
                    <p>DJANGO_SUPERUSER_PASSWORD = YourStrongPassword2026!</p>
                    <p>DJANGO_SUPERUSER_USERNAME = admin</p>
                  </div>
                </div>

                <div className="bg-[#24211E] border border-white/10 p-4 rounded-xl space-y-2">
                  <span className="text-[#D4AF37] block font-semibold uppercase">
                    Step 2: Use This Exact Build Command on Render
                  </span>
                  <div className="bg-black/40 p-3 rounded-lg text-[#E4AA8B]">
                    pip install -r requirements.txt && python manage.py migrate && python manage.py init_admin && python manage.py collectstatic --noinput
                  </div>
                </div>

                <div className="bg-[#24211E] border border-white/10 p-4 rounded-xl space-y-2">
                  <span className="text-[#D4AF37] block font-semibold uppercase">
                    Step 3: Access Root Django Admin
                  </span>
                  <p className="text-white/70 font-times text-xs">
                    Once the build finishes, open:{" "}
                    <code className="text-white font-mono">https://your-backend.onrender.com/admin/</code>{" "}
                    and log in with the email & password configured above!
                  </p>
                </div>
              </div>
            </div>
          ) : currentRole ? (
            /* ROLE DETAILS VIEW */
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* ROLE HEADER */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl p-2 bg-white/5 rounded-2xl border border-white/10">
                    {currentRole.icon}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-[#D4AF37]">
                        {currentRole.badge}
                      </span>
                    </div>
                    <h3
                      className="font-stedelijk uppercase text-2xl text-white tracking-wide"
                      style={{ textTransform: "uppercase" }}
                    >
                      {currentRole.title}
                    </h3>
                  </div>
                </div>

                <Link
                  href={currentRole.primaryUrl}
                  onClick={onClose}
                  className="inline-flex items-center justify-center gap-2 bg-[#D4AF37] text-[#1E1B19] px-5 py-2.5 rounded-full font-mono text-xs uppercase tracking-wider font-semibold hover:bg-[#FAF1E8] transition-colors shadow-sm"
                >
                  <span>{currentRole.urlLabel}</span>
                  <span>→</span>
                </Link>
              </div>

              {/* SUMMARY */}
              <p className="text-white/80 text-base leading-relaxed">
                {currentRole.summary}
              </p>

              {/* TWO COLUMN GRID: AUTH & VERIFICATION */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#24211E] border border-white/10 p-5 rounded-2xl space-y-2">
                  <span className="text-[10px] font-mono uppercase text-[#E4AA8B] block tracking-wider">
                    🔐 Authentication Mechanism
                  </span>
                  <p className="text-xs text-white/80 leading-relaxed">
                    {currentRole.authMethod}
                  </p>
                </div>

                <div className="bg-[#24211E] border border-white/10 p-5 rounded-2xl space-y-2">
                  <span className="text-[10px] font-mono uppercase text-[#E4AA8B] block tracking-wider">
                    🛡️ User Verification Procedure
                  </span>
                  <p className="text-xs text-white/80 leading-relaxed">
                    {currentRole.verificationMethod}
                  </p>
                </div>
              </div>

              {/* SCOPED CAPABILITIES & PERMISSIONS */}
              <div className="space-y-3">
                <span className="text-[11px] font-mono uppercase tracking-widest text-white/50 block">
                  SYSTEM CAPABILITIES & RESPONSIBILITIES
                </span>
                <ul className="space-y-2 text-xs">
                  {currentRole.permissions.map((perm, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2.5 bg-white/5 border border-white/5 p-3 rounded-xl"
                    >
                      <span className="text-[#D4AF37] font-bold">✓</span>
                      <span className="text-white/85">{perm}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* HOW TO TEST THIS ROLE */}
              <div className="bg-[#251D17] border border-[#D4AF37]/30 p-5 rounded-2xl space-y-2">
                <span className="text-[10px] font-mono uppercase text-[#D4AF37] tracking-widest block">
                  ✦ HOW TO TEST THIS ROLE RIGHT NOW
                </span>
                <ol className="list-decimal list-inside space-y-1.5 text-xs text-white/70">
                  {currentRole.testSteps.map((step, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          ) : null}
        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-4 border-t border-white/10 bg-[#1A1816] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-white/50">
          <div>
            <span>Basai Mountain Sanctuaries Multi-Tenant Operating System</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              onClick={onClose}
              className="text-[#D4AF37] hover:underline"
            >
              Operations Dashboard (/admin)
            </Link>
            <span>•</span>
            <Link
              href="/onboarding"
              onClick={onClose}
              className="text-[#E4AA8B] hover:underline"
            >
              Hotelier Studio (/onboarding)
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
