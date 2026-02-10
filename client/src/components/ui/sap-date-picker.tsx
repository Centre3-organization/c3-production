import * as React from "react";
import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SapDatePickerProps {
  value?: string; // YYYY-MM-DD format
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
  error?: boolean;
}

const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  // 0=Sunday, convert to Mon=0
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function isSameDay(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}

function isDateDisabled(date: Date, minDate?: Date, maxDate?: Date): boolean {
  if (minDate) {
    const min = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
    if (date < min) return true;
  }
  if (maxDate) {
    const max = new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate());
    if (date > max) return true;
  }
  return false;
}

function SapDatePicker({
  value,
  onChange,
  placeholder = "e.g. Dec 31, 2023",
  disabled = false,
  minDate,
  maxDate,
  className,
  error,
}: SapDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse value to get initial view month
  const selectedDate = useMemo(() => {
    if (!value) return null;
    const d = new Date(value + "T00:00:00");
    return isNaN(d.getTime()) ? null : d;
  }, [value]);

  const [viewYear, setViewYear] = useState(() => selectedDate?.getFullYear() ?? new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => selectedDate?.getMonth() ?? new Date().getMonth());

  // Update view when value changes externally
  useEffect(() => {
    if (selectedDate) {
      setViewYear(selectedDate.getFullYear());
      setViewMonth(selectedDate.getMonth());
    }
  }, [selectedDate]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleDayClick = (day: number, month: number, year: number) => {
    const date = new Date(year, month, day);
    if (isDateDisabled(date, minDate, maxDate)) return;
    const yyyy = year.toString().padStart(4, "0");
    const mm = (month + 1).toString().padStart(2, "0");
    const dd = day.toString().padStart(2, "0");
    onChange(`${yyyy}-${mm}-${dd}`);
    setIsOpen(false);
  };

  // Build calendar grid
  const calendarGrid = useMemo(() => {
    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
    const daysInPrevMonth = getDaysInMonth(viewYear, viewMonth === 0 ? 11 : viewMonth - 1);
    const prevMonthYear = viewMonth === 0 ? viewYear - 1 : viewYear;
    const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1;
    const nextMonthYear = viewMonth === 11 ? viewYear + 1 : viewYear;
    const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;

    const rows: Array<Array<{ day: number; month: number; year: number; isCurrentMonth: boolean }>> = [];
    let currentRow: Array<{ day: number; month: number; year: number; isCurrentMonth: boolean }> = [];

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      currentRow.push({
        day: daysInPrevMonth - i,
        month: prevMonth,
        year: prevMonthYear,
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      currentRow.push({ day: d, month: viewMonth, year: viewYear, isCurrentMonth: true });
      if (currentRow.length === 7) {
        rows.push(currentRow);
        currentRow = [];
      }
    }

    // Next month days
    if (currentRow.length > 0) {
      let nextDay = 1;
      while (currentRow.length < 7) {
        currentRow.push({ day: nextDay++, month: nextMonth, year: nextMonthYear, isCurrentMonth: false });
      }
      rows.push(currentRow);
    }

    // Ensure 6 rows for consistent height
    while (rows.length < 6) {
      const lastRow = rows[rows.length - 1];
      const lastCell = lastRow[lastRow.length - 1];
      let nextDay = lastCell.day + 1;
      let nm = lastCell.month;
      let ny = lastCell.year;
      const daysInLastMonth = getDaysInMonth(ny, nm);
      if (nextDay > daysInLastMonth) {
        nextDay = 1;
        if (nm === 11) { nm = 0; ny++; } else { nm++; }
      }
      const newRow: typeof currentRow = [];
      for (let i = 0; i < 7; i++) {
        newRow.push({ day: nextDay, month: nm, year: ny, isCurrentMonth: false });
        nextDay++;
        if (nextDay > getDaysInMonth(ny, nm)) {
          nextDay = 1;
          if (nm === 11) { nm = 0; ny++; } else { nm++; }
        }
      }
      rows.push(newRow);
    }

    return rows;
  }, [viewYear, viewMonth]);

  // Get week number (ISO 8601)
  const getWeekNumber = (year: number, month: number, day: number): number => {
    const d = new Date(year, month, day);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    const week1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  };

  const today = new Date();

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Input trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border bg-white px-3 py-2 text-sm",
          "hover:border-[#4A90D9] focus:outline-none focus:ring-2 focus:ring-[#4A90D9]/30 focus:border-[#4A90D9]",
          "transition-colors duration-150",
          disabled && "opacity-50 cursor-not-allowed bg-[#F5F5F5]",
          error ? "border-[#FF6B6B]" : "border-[#D4D4D4]",
          isOpen && "border-[#4A90D9] ring-2 ring-[#4A90D9]/30"
        )}
      >
        <span className={cn("truncate", !value && "text-[#9E9E9E]")}>
          {value ? formatDateDisplay(value) : placeholder}
        </span>
        <CalendarIcon className="h-4 w-4 text-[#6B6B6B] shrink-0 ml-2" />
      </button>

      {/* Calendar dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 bg-white border border-[#D4D4D4] rounded-lg shadow-lg p-3 w-[320px]"
          style={{ left: 0 }}
        >
          {/* Month/Year navigation */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={goToPrevMonth}
              className="p-1.5 rounded-md hover:bg-[#F0F0F0] transition-colors"
            >
              <ChevronLeftIcon className="h-4 w-4 text-[#4A90D9]" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[#2C2C2C]">
                {MONTHS[viewMonth]}
              </span>
              <span className="text-sm font-semibold text-[#4A90D9]">
                {viewYear}
              </span>
            </div>
            <button
              type="button"
              onClick={goToNextMonth}
              className="p-1.5 rounded-md hover:bg-[#F0F0F0] transition-colors"
            >
              <ChevronRightIcon className="h-4 w-4 text-[#4A90D9]" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-[32px_repeat(7,1fr)] gap-0 mb-1">
            <div className="text-[10px] text-[#9E9E9E] text-center py-1"></div>
            {DAYS_SHORT.map((d) => (
              <div key={d} className="text-[11px] font-medium text-[#6B6B6B] text-center py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          {calendarGrid.map((row, rowIdx) => {
            const firstCell = row[0];
            const weekNum = getWeekNumber(firstCell.year, firstCell.month, firstCell.day);
            return (
              <div key={rowIdx} className="grid grid-cols-[32px_repeat(7,1fr)] gap-0">
                {/* Week number */}
                <div className="text-[10px] text-[#BDBDBD] flex items-center justify-center h-[36px]">
                  {weekNum}
                </div>
                {row.map((cell, cellIdx) => {
                  const cellDate = new Date(cell.year, cell.month, cell.day);
                  const isToday = isSameDay(cellDate, today);
                  const isSelected = selectedDate && isSameDay(cellDate, selectedDate);
                  const isDisabled = isDateDisabled(cellDate, minDate, maxDate);
                  const isWeekend = cellIdx >= 5; // Sat, Sun

                  return (
                    <button
                      key={cellIdx}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => handleDayClick(cell.day, cell.month, cell.year)}
                      className={cn(
                        "h-[36px] w-full flex items-center justify-center text-sm rounded-md transition-colors",
                        // Base styles
                        cell.isCurrentMonth ? "text-[#2C2C2C]" : "text-[#BDBDBD]",
                        // Weekend coloring
                        isWeekend && cell.isCurrentMonth && !isSelected && "text-[#4A90D9]",
                        // Hover
                        !isDisabled && !isSelected && "hover:bg-[#E8F0FE]",
                        // Today
                        isToday && !isSelected && "border border-[#4A90D9] font-semibold",
                        // Selected
                        isSelected && "bg-[#4A90D9] text-white font-semibold hover:bg-[#3A7BC8]",
                        // Disabled
                        isDisabled && "text-[#D4D4D4] cursor-not-allowed hover:bg-transparent"
                      )}
                    >
                      {cell.day}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export { SapDatePicker };
