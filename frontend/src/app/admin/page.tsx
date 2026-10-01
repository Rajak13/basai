import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold">Operations Dashboard</h1>
          <p className="text-xs text-neutral-500">Live property metrics for Basai</p>
        </div>
        <div className="flex gap-2 text-xs">
          <Link href="/admin/calendar" className="bg-neutral-900 text-white px-3 py-2 rounded font-medium">
            + Walk-In Booking
          </Link>
          <Link href="/admin/housekeeping" className="border border-neutral-400 bg-white px-3 py-2 rounded font-medium">
            Room Status
          </Link>
        </div>
      </div>

      {/* SECTION: OCCUPANCY & REVENUE METRICS (ADR, RevPAR) */}
      <section className="space-y-2">
        <p className="text-xs uppercase font-semibold text-neutral-400">[Section: 3.4 Key Hospitality Metrics]</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="border bg-white p-4 rounded space-y-1">
            <span className="text-xs text-neutral-500">Occupancy Rate</span>
            <p className="text-2xl font-bold">78.5%</p>
            <span className="text-xs text-green-700 font-medium">↑ 12% vs last week</span>
          </div>
          <div className="border bg-white p-4 rounded space-y-1">
            <span className="text-xs text-neutral-500">ADR (Avg Daily Rate)</span>
            <p className="text-2xl font-bold">NPR 5,420</p>
            <span className="text-xs text-neutral-400">Target: NPR 5,000</span>
          </div>
          <div className="border bg-white p-4 rounded space-y-1">
            <span className="text-xs text-neutral-500">RevPAR</span>
            <p className="text-2xl font-bold">NPR 4,254</p>
            <span className="text-xs text-green-700 font-medium">Healthy yield</span>
          </div>
          <div className="border bg-white p-4 rounded space-y-1">
            <span className="text-xs text-neutral-500">Today's Revenue</span>
            <p className="text-2xl font-bold">NPR 68,500</p>
            <span className="text-xs text-neutral-400">14 rooms active</span>
          </div>
        </div>
      </section>

      {/* SECTION: TODAY'S OPERATIONAL FRONT DESK RUN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border bg-white p-4 rounded space-y-3">
          <div className="flex justify-between items-center border-b pb-2">
            <h2 className="font-semibold text-sm">Today's Arrivals (Expected Check-ins)</h2>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">4 Guests</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="p-2 border rounded flex justify-between items-center">
              <div>
                <p className="font-semibold">Subash Tamang</p>
                <p className="text-neutral-500">Deluxe Mountain View • Ref: DHR-2026-8A39F</p>
              </div>
              <button className="bg-neutral-900 text-white px-3 py-1 rounded">Check-In</button>
            </div>
            <div className="p-2 border rounded flex justify-between items-center">
              <div>
                <p className="font-semibold">Anjali Sharma</p>
                <p className="text-neutral-500">Standard Queen • Ref: DHR-2026-1F42B</p>
              </div>
              <button className="bg-neutral-900 text-white px-3 py-1 rounded">Check-In</button>
            </div>
          </div>
        </div>

        <div className="border bg-white p-4 rounded space-y-3">
          <div className="flex justify-between items-center border-b pb-2">
            <h2 className="font-semibold text-sm">Today's Departures (Folio Releases)</h2>
            <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">3 Guests</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="p-2 border rounded flex justify-between items-center">
              <div>
                <p className="font-semibold">Dr. K. Pradhan (BPKIHS visit)</p>
                <p className="text-neutral-500">Room 201 • Balance: NPR 0 (Settled)</p>
              </div>
              <button className="border border-neutral-400 px-3 py-1 rounded">Release & Check-Out</button>
            </div>
            <div className="p-2 border rounded flex justify-between items-center">
              <div>
                <p className="font-semibold">Bikash Gurung</p>
                <p className="text-neutral-500">Room 301 • Balance: NPR 1,200 due</p>
              </div>
              <button className="bg-amber-600 text-white px-3 py-1 rounded">Settle Folio</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
