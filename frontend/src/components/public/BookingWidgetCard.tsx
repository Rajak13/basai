"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import DualMonthCalendar from "./DualMonthCalendar";
import MobileCalendarDrawer from "./MobileCalendarDrawer";

interface BookingWidgetCardProps {
  onDiscoverClick?: () => void;
  lang?: "en" | "np";
}

const PROPERTIES = [
  { id: "all", name: "All Basai Properties" },
  { id: "basai-boutique", name: "Basai Boutique (Dharan)" },
  { id: "basai-foothills", name: "Basai Foothills Retreat (Bhedetar)" },
  { id: "basai-mountain", name: "Basai Mountain Lodge (Namje)" },
  { id: "basai-riverside", name: "Basai Riverside Sanctuary (Koshi)" },
];

export default function BookingWidgetCard({
  onDiscoverClick,
  lang = "en",
}: BookingWidgetCardProps) {
  const router = useRouter();

  // Initial dates matching reference (September 30, 2026 & October 1, 2026)
  const [selectedHotel, setSelectedHotel] = useState(PROPERTIES[0]);
  const [isHotelOpen, setIsHotelOpen] = useState(false);
  const [checkIn, setCheckIn] = useState("2026-09-30");
  const [checkOut, setCheckOut] = useState("2026-10-01");
  const [guests, setGuests] = useState(2);
  const [showMultiRooms, setShowMultiRooms] = useState(false);
  const [roomsCount, setRoomsCount] = useState(1);

  // Calendar popover state
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarTarget, setCalendarTarget] = useState<"checkIn" | "checkOut">("checkIn");
  const cardRef = useRef<HTMLDivElement>(null);

  // Close desktop calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const targetNode = e.target as Node;
      if (cardRef.current && !cardRef.current.contains(targetNode)) {
        setIsCalendarOpen(false);
        setIsHotelOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const parseDate = (dateStr: string) => {
    const [yearStr, monthStr, dayStr] = dateStr.split("-");
    const date = new Date(parseInt(yearStr), parseInt(monthStr) - 1, parseInt(dayStr));
    const day = date.getDate();
    const month = date.toLocaleDateString("en-US", { month: "long" });
    const year = date.getFullYear();
    return { day, month, year };
  };

  const checkInParsed = parseDate(checkIn);
  const checkOutParsed = parseDate(checkOut);

  const handleOpenCheckInCalendar = () => {
    if (isCalendarOpen && calendarTarget === "checkIn") {
      setIsCalendarOpen(false);
    } else {
      setCalendarTarget("checkIn");
      setIsCalendarOpen(true);
      setIsHotelOpen(false);
    }
  };

  const handleOpenCheckOutCalendar = () => {
    if (isCalendarOpen && calendarTarget === "checkOut") {
      setIsCalendarOpen(false);
    } else {
      setCalendarTarget("checkOut");
      setIsCalendarOpen(true);
      setIsHotelOpen(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams({
      checkIn,
      checkOut,
      guests: guests.toString(),
      rooms: roomsCount.toString(),
      hotel: selectedHotel.id,
    });
    router.push(`/rooms?${params.toString()}`);
  };

  return (
    <div
      ref={cardRef}
      className="relative bg-[#FAF1E8] text-[#2C231E] rounded-2xl p-5 sm:p-6 shadow-2xl w-full max-w-[340px] sm:max-w-[360px] border border-[#EBDCD0]/80 backdrop-blur-xs select-none"
    >
      {/* =========================================================
          DESKTOP CALENDAR (lg+: Left-docked 600px dual-month card)
          ========================================================= */}
      {isCalendarOpen && (
        <div className="hidden lg:block absolute right-full top-0 mr-4 w-[600px] z-50">
          <DualMonthCalendar
            checkIn={checkIn}
            checkOut={checkOut}
            activeSelection={calendarTarget}
            onSelectCheckIn={(dateStr) => {
              setCheckIn(dateStr);
              setCalendarTarget("checkOut");
            }}
            onSelectCheckOut={(dateStr) => {
              setCheckOut(dateStr);
              setIsCalendarOpen(false);
            }}
            onClose={() => setIsCalendarOpen(false)}
          />
        </div>
      )}

      {/* =========================================================
          MOBILE & TABLET CALENDAR (< lg: Dedicated touch bottom drawer)
          ========================================================= */}
      {isCalendarOpen && (
        <div className="lg:hidden">
          <MobileCalendarDrawer
            checkIn={checkIn}
            checkOut={checkOut}
            activeSelection={calendarTarget}
            onSelectCheckIn={(dateStr) => {
              setCheckIn(dateStr);
              setCalendarTarget("checkOut");
            }}
            onSelectCheckOut={(dateStr) => {
              setCheckOut(dateStr);
            }}
            onClose={() => setIsCalendarOpen(false)}
            lang={lang}
          />
        </div>
      )}

      <form onSubmit={handleSearch}>
        {/* HOTEL SELECTION DROPDOWN */}
        <div className="relative mb-4">
          <button
            type="button"
            onClick={() => {
              setIsHotelOpen(!isHotelOpen);
              setIsCalendarOpen(false);
            }}
            className="w-full bg-white rounded-lg border border-[#E5DACF] px-4 py-3 flex items-center justify-between text-left cursor-pointer hover:border-[#DE9977] transition shadow-2xs"
          >
            <span className="text-[14px] font-medium text-[#2C231E] truncate pr-2">
              {selectedHotel.name}
            </span>
            <span className="text-[9px] text-[#2C231E] shrink-0">▼</span>
          </button>

          {isHotelOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg border border-[#E5DACF] shadow-lg z-50 py-1 overflow-hidden">
              {PROPERTIES.map((prop) => (
                <button
                  key={prop.id}
                  type="button"
                  onClick={() => {
                    setSelectedHotel(prop);
                    setIsHotelOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-xs sm:text-[13px] hover:bg-[#FAF1E8] transition flex items-center justify-between ${
                    selectedHotel.id === prop.id
                      ? "font-semibold text-[#B26B4A] bg-[#FAF1E8]/50"
                      : "text-[#2C231E]"
                  }`}
                >
                  <span>{prop.name}</span>
                  {selectedHotel.id === prop.id && (
                    <span className="text-[#B26B4A] text-xs">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* CHECK-IN & CHECK-OUT DATE PICKER CARDS */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Check-in Card */}
          <div>
            <span className="block text-[12px] text-[#695C53] font-normal mb-1">
              Check-in date
            </span>
            <button
              type="button"
              onClick={handleOpenCheckInCalendar}
              className={`w-full relative rounded-lg border py-3 px-2 flex flex-col items-center justify-center text-center cursor-pointer transition shadow-2xs group min-h-[105px] ${
                isCalendarOpen && calendarTarget === "checkIn"
                  ? "bg-[#F0D5C7] border-[#DE9977] ring-1 ring-[#DE9977]"
                  : "bg-white border-[#E5DACF] hover:border-[#DE9977]"
              }`}
            >
              <span className="text-3xl sm:text-4xl font-semibold text-[#2C231E] tracking-tight leading-none">
                {checkInParsed.day}.
              </span>
              <span className="text-[11px] text-[#52463E] mt-1 leading-tight font-medium">
                {checkInParsed.month}
              </span>
              <span className="text-[11px] text-[#52463E] leading-tight font-medium">
                {checkInParsed.year}
              </span>
              <span className="text-[8px] text-[#2C231E] mt-1.5 group-hover:translate-y-0.5 transition-transform">
                ▼
              </span>
            </button>
          </div>

          {/* Check-out Card */}
          <div>
            <span className="block text-[12px] text-[#695C53] font-normal mb-1">
              Check-out date
            </span>
            <button
              type="button"
              onClick={handleOpenCheckOutCalendar}
              className={`w-full relative rounded-lg border py-3 px-2 flex flex-col items-center justify-center text-center cursor-pointer transition shadow-2xs group min-h-[105px] ${
                isCalendarOpen && calendarTarget === "checkOut"
                  ? "bg-[#F0D5C7] border-[#DE9977] ring-1 ring-[#DE9977]"
                  : "bg-white border-[#E5DACF] hover:border-[#DE9977]"
              }`}
            >
              <span className="text-3xl sm:text-4xl font-semibold text-[#2C231E] tracking-tight leading-none">
                {checkOutParsed.day}.
              </span>
              <span className="text-[11px] text-[#52463E] mt-1 leading-tight font-medium">
                {checkOutParsed.month}
              </span>
              <span className="text-[11px] text-[#52463E] leading-tight font-medium">
                {checkOutParsed.year}
              </span>
              <span className="text-[8px] text-[#2C231E] mt-1.5 group-hover:translate-y-0.5 transition-transform">
                ▼
              </span>
            </button>
          </div>
        </div>

        {/* GUESTS PER ROOM */}
        <div className="flex items-center justify-between mb-2 pt-1">
          <span className="text-[13px] sm:text-[14px] font-normal text-[#2C231E]">
            Guests per room
          </span>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setGuests(Math.max(1, guests - 1))}
              className="w-7 h-7 rounded-full border border-[#D5C6BA] flex items-center justify-center text-[#2C231E] text-base hover:bg-[#EFE4DA] active:scale-95 transition cursor-pointer select-none"
              aria-label="Decrease guests"
            >
              −
            </button>
            <span className="text-[14px] font-semibold text-[#2C231E] min-w-[18px] text-center">
              {guests}
            </span>
            <button
              type="button"
              onClick={() => setGuests(Math.min(10, guests + 1))}
              className="w-7 h-7 rounded-full border border-[#D5C6BA] flex items-center justify-center text-[#2C231E] text-base hover:bg-[#EFE4DA] active:scale-95 transition cursor-pointer select-none"
              aria-label="Increase guests"
            >
              +
            </button>
          </div>
        </div>

        {/* MULTIPLE ROOMS LINK */}
        <div className="mb-5 text-left">
          <button
            type="button"
            onClick={() => setShowMultiRooms(!showMultiRooms)}
            className="text-[11px] sm:text-[12px] text-[#2C231E] underline hover:text-[#B26B4A] transition cursor-pointer"
          >
            Multiple rooms?
          </button>

          {showMultiRooms && (
            <div className="mt-2 p-2.5 bg-white rounded-md border border-[#E5DACF] text-xs flex items-center justify-between">
              <span className="text-[#695C53]">
                Number of rooms:
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRoomsCount(Math.max(1, roomsCount - 1))}
                  className="w-6 h-6 rounded-full border border-[#D5C6BA] flex items-center justify-center text-xs hover:bg-[#FAF1E8]"
                >
                  −
                </button>
                <span className="font-semibold text-xs min-w-[14px] text-center">
                  {roomsCount}
                </span>
                <button
                  type="button"
                  onClick={() => setRoomsCount(Math.min(5, roomsCount + 1))}
                  className="w-6 h-6 rounded-full border border-[#D5C6BA] flex items-center justify-center text-xs hover:bg-[#FAF1E8]"
                >
                  +
                </button>
              </div>
            </div>
          )}
        </div>

        {/* VIEW ROOMS AND PRICES CTA BUTTON */}
        <button
          type="submit"
          className="w-full bg-[#E8A88A] hover:bg-[#DE9977] active:bg-[#D58C6B] text-[#2C231E] font-medium text-[13px] sm:text-[14px] py-3.5 px-4 rounded-lg flex items-center justify-center gap-2 shadow-2xs hover:shadow transition-all duration-200 cursor-pointer"
        >
          <span>View rooms and prices</span>
          <svg
            className="w-3 h-3 fill-current ml-0.5 inline-block shrink-0"
            viewBox="0 0 24 24"
          >
            <path d="M5 3l14 9-14 9V3z" />
          </svg>
        </button>
      </form>
    </div>
  );
}
