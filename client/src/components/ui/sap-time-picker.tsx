import * as React from "react";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface SapTimePickerProps {
  value?: string; // "HH:mm" 24h format
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: boolean;
}

function to12Hour(h24: number): { hour: number; period: "AM" | "PM" } {
  if (h24 === 0) return { hour: 12, period: "AM" };
  if (h24 < 12) return { hour: h24, period: "AM" };
  if (h24 === 12) return { hour: 12, period: "PM" };
  return { hour: h24 - 12, period: "PM" };
}

function to24Hour(hour: number, period: "AM" | "PM"): number {
  if (period === "AM") return hour === 12 ? 0 : hour;
  return hour === 12 ? 12 : hour + 12;
}

function formatTimeDisplay(val: string): string {
  if (!val) return "";
  const [hStr, mStr] = val.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(h) || isNaN(m)) return val;
  const { hour, period } = to12Hour(h);
  return `${hour}:${m.toString().padStart(2, "0")} ${period}`;
}

type Mode = "hours" | "minutes";

function SapTimePicker({
  value,
  onChange,
  placeholder = "Select time",
  disabled = false,
  className,
  error,
}: SapTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Parse initial value
  const parsed = useMemo(() => {
    if (!value) return { hour: 12, minute: 0, period: "PM" as const };
    const [hStr, mStr] = value.split(":");
    const h24 = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    if (isNaN(h24) || isNaN(m)) return { hour: 12, minute: 0, period: "PM" as const };
    const { hour, period } = to12Hour(h24);
    return { hour, minute: m, period };
  }, [value]);

  const [selectedHour, setSelectedHour] = useState(parsed.hour);
  const [selectedMinute, setSelectedMinute] = useState(parsed.minute);
  const [selectedPeriod, setSelectedPeriod] = useState<"AM" | "PM">(parsed.period);
  const [mode, setMode] = useState<Mode>("hours");

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      setSelectedHour(parsed.hour);
      setSelectedMinute(parsed.minute);
      setSelectedPeriod(parsed.period);
      setMode("hours");
    }
  }, [isOpen, parsed.hour, parsed.minute, parsed.period]);

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

  const handleOk = () => {
    const h24 = to24Hour(selectedHour, selectedPeriod);
    const hh = h24.toString().padStart(2, "0");
    const mm = selectedMinute.toString().padStart(2, "0");
    onChange(`${hh}:${mm}`);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  // Clock face geometry
  const clockRadius = 110;
  const centerX = 130;
  const centerY = 130;
  const numberRadius = 85;
  const dotRadius = 105;

  const hours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const minuteMarks = Array.from({ length: 60 }, (_, i) => i);

  const getPosition = (index: number, total: number, radius: number) => {
    const angle = (index * 360) / total - 90;
    const rad = (angle * Math.PI) / 180;
    return {
      x: centerX + radius * Math.cos(rad),
      y: centerY + radius * Math.sin(rad),
    };
  };

  // Handle click on clock face
  const handleClockClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - centerX;
    const y = e.clientY - rect.top - centerY;
    
    let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;

    if (mode === "hours") {
      let hour = Math.round(angle / 30);
      if (hour === 0) hour = 12;
      if (hour > 12) hour = 12;
      setSelectedHour(hour);
      // Auto-switch to minutes after selecting hour
      setTimeout(() => setMode("minutes"), 200);
    } else {
      let minute = Math.round(angle / 6);
      if (minute === 60) minute = 0;
      setSelectedMinute(minute);
    }
  }, [mode]);

  // Current selection angle for the hand
  const handAngle = mode === "hours"
    ? ((selectedHour % 12) * 30) - 90
    : (selectedMinute * 6) - 90;

  const handRad = (handAngle * Math.PI) / 180;
  const handLength = mode === "hours" ? 70 : 85;
  const handEndX = centerX + handLength * Math.cos(handRad);
  const handEndY = centerY + handLength * Math.sin(handRad);

  const displayTime = `${selectedHour}:${selectedMinute.toString().padStart(2, "0")} ${selectedPeriod}`;

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
          {value ? formatTimeDisplay(value) : placeholder}
        </span>
        <Clock className="h-4 w-4 text-[#6B6B6B] shrink-0 ml-2" />
      </button>

      {/* Clock dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 bg-white border border-[#D4D4D4] rounded-lg shadow-lg w-[280px]"
          style={{ left: 0 }}
        >
          {/* Time display header */}
          <div className="flex items-center justify-center gap-1 py-3 border-b border-[#E8E8E8]">
            <button
              type="button"
              onClick={() => setMode("hours")}
              className={cn(
                "px-2.5 py-1 rounded text-lg font-semibold transition-colors",
                mode === "hours" ? "bg-[#4A90D9] text-white" : "text-[#2C2C2C] hover:bg-[#F0F0F0]"
              )}
            >
              {selectedHour}
            </button>
            <span className="text-lg font-semibold text-[#2C2C2C]">:</span>
            <button
              type="button"
              onClick={() => setMode("minutes")}
              className={cn(
                "px-2.5 py-1 rounded text-lg font-semibold transition-colors",
                mode === "minutes" ? "bg-[#4A90D9] text-white" : "text-[#2C2C2C] hover:bg-[#F0F0F0]"
              )}
            >
              {selectedMinute.toString().padStart(2, "0")}
            </button>
            <div className="flex flex-col ml-2 gap-0.5">
              <button
                type="button"
                onClick={() => setSelectedPeriod("AM")}
                className={cn(
                  "px-2 py-0.5 rounded text-xs font-semibold transition-colors",
                  selectedPeriod === "AM" ? "bg-[#4A90D9] text-white" : "text-[#6B6B6B] hover:bg-[#F0F0F0]"
                )}
              >
                AM
              </button>
              <button
                type="button"
                onClick={() => setSelectedPeriod("PM")}
                className={cn(
                  "px-2 py-0.5 rounded text-xs font-semibold transition-colors",
                  selectedPeriod === "PM" ? "bg-[#4A90D9] text-white" : "text-[#6B6B6B] hover:bg-[#F0F0F0]"
                )}
              >
                PM
              </button>
            </div>
          </div>

          {/* Clock face */}
          <div className="flex items-center justify-center py-3">
            <div
              ref={canvasRef}
              className="relative cursor-pointer"
              style={{ width: 260, height: 260 }}
              onClick={handleClockClick}
            >
              {/* Clock circle background */}
              <div
                className="absolute rounded-full bg-[#F5F7FA]"
                style={{
                  width: clockRadius * 2,
                  height: clockRadius * 2,
                  left: centerX - clockRadius,
                  top: centerY - clockRadius,
                }}
              />

              {/* Center dot */}
              <div
                className="absolute w-2 h-2 rounded-full bg-[#4A90D9]"
                style={{ left: centerX - 4, top: centerY - 4 }}
              />

              {/* Clock hand */}
              <svg
                className="absolute inset-0 pointer-events-none"
                width={260}
                height={260}
              >
                <line
                  x1={centerX}
                  y1={centerY}
                  x2={handEndX}
                  y2={handEndY}
                  stroke="#4A90D9"
                  strokeWidth={2}
                />
                <circle cx={handEndX} cy={handEndY} r={4} fill="#4A90D9" />
              </svg>

              {mode === "hours" ? (
                // Hour numbers
                hours.map((h, i) => {
                  const pos = getPosition(i, 12, numberRadius);
                  const isSelected = selectedHour === h;
                  return (
                    <button
                      key={h}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedHour(h);
                        setTimeout(() => setMode("minutes"), 200);
                      }}
                      className={cn(
                        "absolute w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-colors",
                        isSelected
                          ? "bg-[#4A90D9] text-white"
                          : "text-[#2C2C2C] hover:bg-[#E8F0FE]"
                      )}
                      style={{
                        left: pos.x - 16,
                        top: pos.y - 16,
                      }}
                    >
                      {h}
                    </button>
                  );
                })
              ) : (
                // Minute marks
                <>
                  {minuteMarks.map((m) => {
                    const isMajor = m % 5 === 0;
                    const pos = getPosition(m, 60, dotRadius);
                    const isSelected = selectedMinute === m;

                    if (isMajor) {
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMinute(m);
                          }}
                          className={cn(
                            "absolute w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-colors",
                            isSelected
                              ? "bg-[#4A90D9] text-white"
                              : "text-[#2C2C2C] hover:bg-[#E8F0FE]"
                          )}
                          style={{
                            left: pos.x - 16,
                            top: pos.y - 16,
                          }}
                        >
                          {m.toString().padStart(2, "0")}
                        </button>
                      );
                    }

                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMinute(m);
                        }}
                        className="absolute w-2 h-2 rounded-full bg-[#BDBDBD] hover:bg-[#4A90D9] transition-colors"
                        style={{
                          left: pos.x - 4,
                          top: pos.y - 4,
                        }}
                      />
                    );
                  })}
                </>
              )}

              {/* Mode label */}
              <div className="absolute text-xs text-[#9E9E9E] font-medium"
                style={{ left: centerX - 16, top: centerY + 20 }}
              >
                {mode === "hours" ? "Hours" : "Minutes"}
              </div>
            </div>
          </div>

          {/* OK / Cancel buttons */}
          <div className="flex items-center justify-end gap-2 px-3 py-2 border-t border-[#E8E8E8]">
            <button
              type="button"
              onClick={handleOk}
              className="px-4 py-1.5 bg-[#4A90D9] text-white text-sm font-semibold rounded-md hover:bg-[#3A7BC8] transition-colors"
            >
              OK
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-1.5 text-[#6B6B6B] text-sm font-medium hover:bg-[#F0F0F0] rounded-md transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export { SapTimePicker };
