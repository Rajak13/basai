"use client";

import { useState } from "react";

export default function BookingCheckoutPage() {
  const [selectedGateway, setSelectedGateway] = useState("ESEWA");
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const toggleAddon = (name: string) => {
    setSelectedAddons((prev) =>
      prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name]
    );
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold">Booking Engine & Checkout</h1>
        <p className="text-sm text-neutral-500">
          Complete your reservation at Basai with instant confirmation
        </p>
      </div>

      {isSubmitted ? (
        /* SECTION: INSTANT BOOKING CONFIRMATION */
        <div className="border rounded p-6 bg-green-50 border-green-200 space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✓</span>
            <div>
              <h2 className="text-lg font-bold text-green-900">Reservation Confirmed!</h2>
              <p className="text-xs text-green-700">Booking Reference: DHR-2026-8A39F</p>
            </div>
          </div>
          <p className="text-sm text-green-800">
            A confirmation voucher has been generated. Confirmation details have been scheduled via SMS & WhatsApp.
          </p>
          <div className="flex gap-3 pt-2 text-xs">
            <button className="px-4 py-2 bg-neutral-900 text-white rounded">Download PDF Itinerary</button>
            <a href="/guest-portal" className="px-4 py-2 border border-neutral-400 rounded">Go to Express Check-in</a>
          </div>
        </div>
      ) : (
        <form onSubmit={handleBookingSubmit} className="space-y-8">
          {/* STEP 1: ROOM & DATE SELECTION */}
          <section className="border rounded p-4 space-y-3">
            <h2 className="text-lg font-semibold">1. Stay Dates & Room Selection</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div>
                <label className="text-xs text-neutral-500 block">Check-in Date</label>
                <input type="date" defaultValue="2026-09-25" className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="text-xs text-neutral-500 block">Check-out Date</label>
                <input type="date" defaultValue="2026-09-27" className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="text-xs text-neutral-500 block">Room Category</label>
                <select className="w-full border p-2 rounded">
                  <option>Deluxe Mountain View (NPR 5,500/night)</option>
                  <option>Executive City Suite (NPR 8,500/night)</option>
                  <option>Standard Queen (NPR 3,800/night)</option>
                </select>
              </div>
            </div>
          </section>

          {/* STEP 2: GUEST INFORMATION */}
          <section className="border rounded p-4 space-y-3">
            <h2 className="text-lg font-semibold">2. Guest Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <label className="text-xs text-neutral-500 block">Full Name</label>
                <input type="text" placeholder="e.g. Ramesh Karki" required className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="text-xs text-neutral-500 block">Mobile / WhatsApp Number (Nepal / Intl)</label>
                <input type="tel" placeholder="+977 98XXXXXXXX" required className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="text-xs text-neutral-500 block">Email Address</label>
                <input type="email" placeholder="ramesh@example.com" className="w-full border p-2 rounded" />
              </div>
              <div>
                <label className="text-xs text-neutral-500 block">Special Requests (Optional)</label>
                <input type="text" placeholder="High floor, quiet room, late check-in" className="w-full border p-2 rounded" />
              </div>
            </div>
          </section>

          {/* STEP 3: ADD-ONS & EXPERIENCES UPSELLING */}
          <section className="border rounded p-4 space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">3. Enhance Your Stay (Add-ons & Experiences)</h2>
              <span className="text-xs text-neutral-400">[Section: Add-on Upselling]</span>
            </div>
            <div className="space-y-2 text-sm">
              <label className="flex items-center gap-3 p-3 border rounded cursor-pointer hover:bg-neutral-50">
                <input
                  type="checkbox"
                  checked={selectedAddons.includes("airport")}
                  onChange={() => toggleAddon("airport")}
                />
                <div className="flex-1">
                  <span className="font-medium">Biratnagar Airport Pickup (Private AC Car)</span>
                  <p className="text-xs text-neutral-500">Pick-up directly outside Biratnagar arrival terminal to Dharan hotel</p>
                </div>
                <span className="font-semibold text-xs">NPR 2,500</span>
              </label>

              <label className="flex items-center gap-3 p-3 border rounded cursor-pointer hover:bg-neutral-50">
                <input
                  type="checkbox"
                  checked={selectedAddons.includes("bhedetar")}
                  onChange={() => toggleAddon("bhedetar")}
                />
                <div className="flex-1">
                  <span className="font-medium">Bhedetar & Namaste Jharna Half-Day Excursion</span>
                  <p className="text-xs text-neutral-500">Scenic hill station viewpoint & eastern waterfall visit</p>
                </div>
                <span className="font-semibold text-xs">NPR 3,500</span>
              </label>

              <label className="flex items-center gap-3 p-3 border rounded cursor-pointer hover:bg-neutral-50">
                <input
                  type="checkbox"
                  checked={selectedAddons.includes("dinner")}
                  onChange={() => toggleAddon("dinner")}
                />
                <div className="flex-1">
                  <span className="font-medium">Special Eastern Nepali Dinner for Two</span>
                  <p className="text-xs text-neutral-500">Multi-course local thali dinner with traditional drinks</p>
                </div>
                <span className="font-semibold text-xs">NPR 1,200</span>
              </label>
            </div>
          </section>

          {/* STEP 4: PAYMENT GATEWAY INTEGRATION (NEPAL & INTERNATIONAL) */}
          <section className="border rounded p-4 space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">4. Select Payment Method</h2>
              <span className="text-xs text-neutral-400">[Section: Localized Payment Integration]</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setSelectedGateway("ESEWA")}
                className={`p-3 border rounded font-medium text-center ${
                  selectedGateway === "ESEWA" ? "border-green-600 bg-green-50 text-green-900" : "bg-white"
                }`}
              >
                eSewa (ePay v2)
              </button>
              <button
                type="button"
                onClick={() => setSelectedGateway("KHALTI")}
                className={`p-3 border rounded font-medium text-center ${
                  selectedGateway === "KHALTI" ? "border-purple-600 bg-purple-50 text-purple-900" : "bg-white"
                }`}
              >
                Khalti Wallet
              </button>
              <button
                type="button"
                onClick={() => setSelectedGateway("FONEPAY")}
                className={`p-3 border rounded font-medium text-center ${
                  selectedGateway === "FONEPAY" ? "border-red-600 bg-red-50 text-red-900" : "bg-white"
                }`}
              >
                Fonepay QR
              </button>
              <button
                type="button"
                onClick={() => setSelectedGateway("STRIPE")}
                className={`p-3 border rounded font-medium text-center ${
                  selectedGateway === "STRIPE" ? "border-blue-600 bg-blue-50 text-blue-900" : "bg-white"
                }`}
              >
                Cards / Stripe
              </button>
              <button
                type="button"
                onClick={() => setSelectedGateway("CASH")}
                className={`p-3 border rounded font-medium text-center ${
                  selectedGateway === "CASH" ? "border-neutral-900 bg-neutral-100 text-neutral-900" : "bg-white"
                }`}
              >
                Pay on Arrival
              </button>
            </div>
            <p className="text-xs text-neutral-500">
              Selected: <strong className="text-neutral-800">{selectedGateway}</strong>
            </p>
          </section>

          {/* BILL SUMMARY & SUBMIT */}
          <div className="border rounded p-4 bg-neutral-50 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <p className="text-xs text-neutral-500">Estimated Total (Includes 13% Nepal VAT & Service)</p>
              <p className="text-xl font-bold">NPR 11,000</p>
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-8 py-3 bg-neutral-900 text-white rounded font-medium text-sm hover:bg-neutral-800"
            >
              Confirm Reservation & Pay
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
