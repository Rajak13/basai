"use client";

import { useState } from "react";

interface MobileCalendarDrawerProps {
  checkIn: string;
  checkOut: string;
  activeSelection: "checkIn" | "checkOut";
  onSelectCheckIn: (dateStr: string) => void;
  onSelectCheckOut: (dateStr: string) => void;
  onClose: () => void;
  lang?: "en" | "np";
}

const MONTH_NAMES = [
  "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
  "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
];

const MONTH_NAMES_NP = [
  "जनवरी", "फेब्रुअरी", "मार्च", "अप्रिल", "मे", "जुन",
  "जुलाई", "अगस्ट", "सेप्टेम्बर", "अक्टोबर", "नोभेम्बर", "डिसेम्बर"
];

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAYS_OF_WEEK_NP = ["आइत", "सोम", "मङ्गल", "बुध", "बिही", "शुक्र", "शनि"];

export default function MobileCalendarDrawer({
  checkIn,
  checkOut,
  activeSelection,
  onSelectCheckIn,
  onSelectCheckOut,
  onClose,
  lang = "en",
}: MobileCalendarDrawerProps) {
  // Mobile single-month focus starting in September 2026
  const [currentDate, setCurrentDate] = useState(() => new Date(2026, 8, 1)); // Sep 2026
  const [selectionTarget, setSelectionTarget] = useState<"checkIn" | "checkOut">(activeSelection);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const getDaysInMonth = (y: number, m: number) => {
    return new Date(y, m + 1, 0).getDate();
  };

  const getFirstDayOfWeek = (y: number, m: number) => {
    return new Date(y, m, 1).getDay();
  };

  const formatDateStr = (y: number, m: number, d: number) => {
    const mo = (m + 1).toString().padStart(2, "0");
    const da = d.toString().padStart(2, "0");
    return `${y}-${mo}-${da}`;
  };

  const handleDateClick = (dateStr: string) => {
    if (selectionTarget === "checkIn") {
      onSelectCheckIn(dateStr);
      setSelectionTarget("checkOut");
      // If check-in is after or equal to checkout, push checkout by 1 day
      if (checkOut && dateStr >= checkOut) {
        const next = new Date(dateStr);
        next.setDate(next.getDate() + 1);
        const [ny, nm, nd] = next.toISOString().split("T")[0].split("-");
        onSelectCheckOut(`${ny}-${nm}-${nd}`);
      }
    } else {
      if (dateStr <= checkIn) {
        onSelectCheckIn(dateStr);
        setSelectionTarget("checkOut");
      } else {
        onSelectCheckOut(dateStr);
      }
    }
  };

  const renderGrid = () => {
    const daysCount = getDaysInMonth(year, month);
    const startDay = getFirstDayOfWeek(year, month);
    const cells = [];

    // Empty cells
    for (let i = 0; i < startDay; i++) {
      cells.push(<div key={`empty-${i}`} className="w-10 h-10" />);
    }

    // Month days
    for (let day = 1; day <= daysCount; day++) {
      const dateStr = formatDateStr(year, month, day);
      const isPast = dateStr < "2026-09-01";
      const isCheckIn = dateStr === checkIn;
      const isCheckOut = dateStr === checkOut;
      const isInRange = checkIn && checkOut && dateStr > checkIn && dateStr < checkOut;
      const isMuted = dateStr < "2026-09-30" && !isCheckIn;

      let style = "text-[#2C231E] hover:bg-[#FAF1E8]";
      let bg = "";

      if (isCheckIn) {
        bg = "bg-[#E8A88A] text-[#2C231E] font-bold rounded-l-full shadow-xs";
      } else if (isCheckOut) {
        bg = "bg-[#E8A88A] text-[#2C231E] font-bold rounded-r-full shadow-xs";
      } else if (isInRange) {
        bg = "bg-[#FAF1E8] text-[#2C231E] font-medium";
      } else if (isMuted || isPast) {
        style = "text-neutral-300 font-normal hover:bg-transparent";
      }

      cells.push(
        <button
          key={dateStr}
          type="button"
          disabled={isPast}
          onClick={() => handleDateClick(dateStr)}
          className={`w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center text-sm transition-all cursor-pointer select-none shrink-0 ${style} ${bg}`}
        >
          <span className={isCheckIn ? "underline underline-offset-4 decoration-2" : ""}>
            {day}
          </span>
        </button>
      );
    }

    return cells;
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return "Select date";
    const [y, m, d] = dateStr.split("-");
    const dt = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Select stay dates"
      className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center bg-black/75 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200 select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm sm:max-w-md bg-white text-[#2C231E] rounded-t-3xl sm:rounded-2xl shadow-2xl p-5 sm:p-6 pb-8 border border-[#EBDCD0]">
        {/* TOP BAR: TITLE + CLOSE */}
        <div className="flex items-center justify-between pb-3 border-b border-[#F0E6DD]">
          <div>
            <span className="font-stedelijk uppercase text-base sm:text-lg text-[#141416] tracking-wider block">
              Select Stay Dates
            </span>
            <span className="text-[11px] text-[#8C7A6E]">
              Tap check-in then check-out date
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close calendar"
            className="w-8 h-8 rounded-full bg-[#FAF1E8] hover:bg-[#EBDCD0] text-[#2C231E] flex items-center justify-center text-sm font-semibold transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* DATE SUMMARY SELECTOR TABS */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#FAF1E8] rounded-xl my-3">
          {/* Check-In Tab */}
          <button
            type="button"
            onClick={() => setSelectionTarget("checkIn")}
            className={`py-2 px-3 rounded-lg text-left transition cursor-pointer ${
              selectionTarget === "checkIn"
                ? "bg-white shadow-xs text-[#2C231E] font-semibold ring-1 ring-[#DE9977]"
                : "text-[#695C53]"
            }`}
          >
            <span className="block text-[10px] uppercase tracking-wider text-[#8C7A6E]">
              Check-In
            </span>
            <span className="text-xs sm:text-[13px] text-[#2C231E] truncate block">
              {formatDisplayDate(checkIn)}
            </span>
          </button>

          {/* Check-Out Tab */}
          <button
            type="button"
            onClick={() => setSelectionTarget("checkOut")}
            className={`py-2 px-3 rounded-lg text-left transition cursor-pointer ${
              selectionTarget === "checkOut"
                ? "bg-white shadow-xs text-[#2C231E] font-semibold ring-1 ring-[#DE9977]"
                : "text-[#695C53]"
            }`}
          >
            <span className="block text-[10px] uppercase tracking-wider text-[#8C7A6E]">
              Check-Out
            </span>
            <span className="text-xs sm:text-[13px] text-[#2C231E] truncate block">
              {formatDisplayDate(checkOut)}
            </span>
          </button>
        </div>

        {/* MONTH HEADER WITH CONTROLS */}
        <div className="flex items-center justify-between py-2 px-1">
          <button
            type="button"
            onClick={prevMonth}
            aria-label="Previous month"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#2C231E] hover:bg-[#FAF1E8] transition cursor-pointer text-sm"
          >
            ◀
          </button>

          <span
            className="font-stedelijk uppercase text-sm sm:text-base tracking-[0.14em] text-[#141416]"
            style={{ textTransform: "uppercase" }}
          >
            {MONTH_NAMES[month]} {year}
          </span>

          <button
            type="button"
            onClick={nextMonth}
            aria-label="Next month"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#2C231E] hover:bg-[#FAF1E8] transition cursor-pointer text-sm"
          >
            ▶
          </button>
        </div>

        {/* DAYS OF WEEK */}
        <div className="grid grid-cols-7 text-center my-1.5">
          {DAYS_OF_WEEK.map((d) => (
            <span key={d} className="text-xs font-medium text-[#8C7A6E]">
              {d}
            </span>
          ))}
        </div>

        {/* DAYS GRID */}
        <div className="grid grid-cols-7 gap-y-1 justify-items-center my-1">
          {renderGrid()}
        </div>

        {/* BOTTOM SAVE BUTTON */}
        <div className="mt-4 pt-3 border-t border-[#F0E6DD]">
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-[#E8A88A] hover:bg-[#DE9977] text-[#2C231E] font-medium text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
          >
            <span>Confirm Dates</span>
            <svg className="w-3 h-3 fill-current ml-0.5" viewBox="0 0 24 24">
              <path d="M5 3l14 9-14 9V3z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
