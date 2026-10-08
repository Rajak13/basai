"use client";

import Link from "next/link";
import { useState } from "react";
import RolesManualModal from "@/components/public/RolesManualModal";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isManualOpen, setIsManualOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-neutral-100 text-neutral-900">
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 bg-white border-r p-4 flex flex-col justify-between">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/admin" className="font-bold text-lg block tracking-wide">
                HOTEL OPS
              </Link>
              <span className="text-xs text-neutral-400">Dharan Staff Dashboard</span>
            </div>

            {/* MANUAL '?' BUTTON */}
            <button
              type="button"
              onClick={() => setIsManualOpen(true)}
              title="System Manual & Roles Guide"
              className="w-8 h-8 rounded-full border border-neutral-300 hover:border-neutral-900 bg-neutral-50 hover:bg-neutral-100 text-neutral-800 flex items-center justify-center font-mono text-xs font-bold transition cursor-pointer shadow-2xs"
            >
              ?
            </button>
          </div>

          <nav className="space-y-1 text-sm font-medium">
            <Link
              href="/admin"
              className="block px-3 py-2 rounded hover:bg-neutral-100 text-neutral-700"
            >
              Dashboard Overview
            </Link>
            <Link
              href="/admin/calendar"
              className="block px-3 py-2 rounded hover:bg-neutral-100 text-neutral-700"
            >
              Booking Calendar Grid
            </Link>
            <Link
              href="/admin/rooms"
              className="block px-3 py-2 rounded hover:bg-neutral-100 text-neutral-700"
            >
              Room Inventory & Rates
            </Link>
            <Link
              href="/admin/housekeeping"
              className="block px-3 py-2 rounded hover:bg-neutral-100 text-neutral-700"
            >
              Housekeeping & Tasks
            </Link>
            <Link
              href="/admin/reports"
              className="block px-3 py-2 rounded hover:bg-neutral-100 text-neutral-700"
            >
              Reports & Revenue (ADR)
            </Link>
          </nav>
        </div>

        <div className="pt-4 border-t text-xs text-neutral-500 space-y-2">
          <p>
            Logged in: <strong>General Manager</strong>
          </p>
          <div className="flex gap-2">
            <Link href="/" className="underline">
              View Public Site
            </Link>
            <span>•</span>
            <button
              onClick={() => setIsManualOpen(true)}
              className="underline text-amber-700 font-semibold cursor-pointer"
            >
              System Guide (?)
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">{children}</main>

      {/* ROLES & SYSTEM ARCHITECTURE MANUAL MODAL */}
      <RolesManualModal
        isOpen={isManualOpen}
        onClose={() => setIsManualOpen(false)}
      />
    </div>
  );
}
