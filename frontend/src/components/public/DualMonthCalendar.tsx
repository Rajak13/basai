"use client";

import { useState } from "react";

interface DualMonthCalendarProps {
  checkIn: string;
  checkOut: string;
  activeSelection: "checkIn" | "checkOut";
  onSelectCheckIn: (dateStr: string) => void;
  onSelectCheckOut: (dateStr: string) => void;
  onClose?: () => void;
}

const MONTH_NAMES = [
  "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
  "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
];

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function DualMonthCalendar({
  checkIn,
  checkOut,
  activeSelection,
  onSelectCheckIn,
  onSelectCheckOut,
  onClose,
}: DualMonthCalendarProps) {
  // Base month starting in September 2026 (matching reference)
  const [baseDate, setBaseDate] = useState(() => new Date(2026, 8, 1)); // 8 = September
  const [hoverDate, setHoverDate] = useState<string | null>(null);

  const prevMonth = () => {
    setBaseDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setBaseDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Month 1 and Month 2
  const month1Year = baseDate.getFullYear();
  const month1Month = baseDate.getMonth();

  const month2Date = new Date(month1Year, month1Month + 1, 1);
  const month2Year = month2Date.getFullYear();
  const month2Month = month2Date.getMonth();

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfWeek = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const formatDateStr = (year: number, month: number, day: number) => {
    const m = (month + 1).toString().padStart(2, "0");
    const d = day.toString().padStart(2, "0");
    return `${year}-${m}-${d}`;
  };

  const handleDateClick = (dateStr: string) => {
    if (activeSelection === "checkIn") {
      onSelectCheckIn(dateStr);
      // If check-in is set after current check-out, bump check-out
      if (checkOut && dateStr >= checkOut) {
        const next = new Date(dateStr);
        next.setDate(next.getDate() + 1);
        const [y, m, d] = next.toISOString().split("T")[0].split("-");
        onSelectCheckOut(`${y}-${m}-${d}`);
      }
    } else {
      if (dateStr <= checkIn) {
        onSelectCheckIn(dateStr);
      } else {
        onSelectCheckOut(dateStr);
        onClose?.();
      }
    }
  };

  const renderMonthGrid = (year: number, month: number) => {
    const daysCount = getDaysInMonth(year, month);
    const startDay = getFirstDayOfWeek(year, month);
    const cells = [];

    // Empty cells before first day
    for (let i = 0; i < startDay; i++) {
      cells.push(<div key={`empty-${i}`} className="w-8 h-8 sm:w-9 sm:h-9" />);
    }

    // Days in month
    for (let day = 1; day <= daysCount; day++) {
      const dateStr = formatDateStr(year, month, day);
      const isPast = dateStr < "2026-09-01";
      const isCheckIn = dateStr === checkIn;
      const isCheckOut = dateStr === checkOut;
      const isInRange = checkIn && checkOut && dateStr > checkIn && dateStr < checkOut;
      const isHoverRange =
        activeSelection === "checkOut" &&
        hoverDate &&
        checkIn &&
        dateStr > checkIn &&
        dateStr <= hoverDate;

      // In the reference image: September 1-29 are faded muted. 30 is check-in with peach block and underline!
      const isMuted = dateStr < "2026-09-30" && !isCheckIn;

      let cellStyle = "text-[#2C231E] hover:bg-[#FAF1E8]";
      let bgStyle = "";

      if (isCheckIn) {
        bgStyle = "bg-[#E8A88A] text-[#2C231E] rounded-l-xl font-semibold shadow-xs";
      } else if (isCheckOut) {
        bgStyle = "bg-[#E8A88A] text-[#2C231E] rounded-r-xl font-semibold shadow-xs";
      } else if (isInRange || isHoverRange) {
        bgStyle = "bg-[#FAF1E8] text-[#2C231E]";
      } else if (isMuted || isPast) {
        cellStyle = "text-neutral-300 font-normal hover:bg-transparent cursor-default";
      }

      cells.push(
        <button
          key={dateStr}
          type="button"
          disabled={isPast}
          onClick={() => handleDateClick(dateStr)}
          onMouseEnter={() => setHoverDate(dateStr)}
          onMouseLeave={() => setHoverDate(null)}
          className={`w-8 h-8 sm:w-9 sm:h-9 text-xs sm:text-[13px] flex items-center justify-center transition-all cursor-pointer relative shrink-0 ${cellStyle} ${bgStyle}`}
        >
          <span className={isCheckIn ? "underline underline-offset-4 decoration-2" : ""}>
            {day}
          </span>
        </button>
      );
    }

    return cells;
  };

  return (
    <div className="relative bg-white text-[#2C231E] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.35)] p-5 sm:p-7 border border-[#EBDCD0] z-50 w-full max-w-[340px] sm:max-w-[620px] select-none">
      {/* HEADER WITH ARROWS AND MONTH TITLES */}
      <div className="flex items-center justify-between pb-4 border-b border-[#F0E6DD]">
        {/* PREV MONTH BUTTON */}
        <button
          type="button"
          onClick={prevMonth}
          aria-label="Previous month"
          className="w-8 h-8 rounded-full flex items-center justify-center text-[#2C231E] hover:bg-[#FAF1E8] transition cursor-pointer text-sm"
        >
          ◀
        </button>

        {/* DUAL MONTH TITLES (ARCHITYPE STEDELIJK) */}
        <div className="flex-1 flex justify-around text-center px-2">
          <span
            className="font-stedelijk text-sm sm:text-base tracking-[0.14em] font-normal uppercase text-[#141416]"
            style={{ textTransform: "uppercase" }}
          >
            {MONTH_NAMES[month1Month]} {month1Year}
          </span>
          <span
            className="hidden sm:inline-block font-stedelijk text-sm sm:text-base tracking-[0.14em] font-normal uppercase text-[#141416]"
            style={{ textTransform: "uppercase" }}
          >
            {MONTH_NAMES[month2Month]} {month2Year}
          </span>
        </div>

        {/* NEXT MONTH BUTTON */}
        <button
          type="button"
          onClick={nextMonth}
          aria-label="Next month"
          className="w-8 h-8 rounded-full flex items-center justify-center text-[#2C231E] hover:bg-[#FAF1E8] transition cursor-pointer text-sm"
        >
          ▶
        </button>
      </div>

      {/* CALENDARS: 1 MONTH ON SMALL SCREENS, 2 MONTHS ON TABLET/DESKTOP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 pt-4">
        {/* MONTH 1 */}
        <div className="w-full">
          {/* DAY NAMES */}
          <div className="grid grid-cols-7 text-center mb-2">
            {DAYS_OF_WEEK.map((d) => (
              <span key={`m1-${d}`} className="text-[11px] sm:text-[12px] font-medium text-[#695C53]">
                {d}
              </span>
            ))}
          </div>
          {/* GRID */}
          <div className="grid grid-cols-7 gap-y-1 justify-items-center">
            {renderMonthGrid(month1Year, month1Month)}
          </div>
        </div>

        {/* MONTH 2 (HIDDEN ON VERY SMALL PHONES, VISIBLE ON SM+) */}
        <div className="hidden sm:block w-full">
          {/* DAY NAMES */}
          <div className="grid grid-cols-7 text-center mb-2">
            {DAYS_OF_WEEK.map((d) => (
              <span key={`m2-${d}`} className="text-[11px] sm:text-[12px] font-medium text-[#695C53]">
                {d}
              </span>
            ))}
          </div>
          {/* GRID */}
          <div className="grid grid-cols-7 gap-y-1 justify-items-center">
            {renderMonthGrid(month2Year, month2Month)}
          </div>
        </div>
      </div>

      {/* MOBILE CLOSE HELPER */}
      <div className="mt-4 pt-3 border-t border-[#F0E6DD] flex items-center justify-between sm:hidden text-xs">
        <span className="text-[#695C53]">
          Selecting: <strong className="text-[#B26B4A]">{activeSelection === "checkIn" ? "Check-in" : "Check-out"}</strong>
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-medium text-[#2C231E] px-3 py-1 bg-[#FAF1E8] rounded-md"
        >
          Done
        </button>
      </div>
    </div>
  );
}
