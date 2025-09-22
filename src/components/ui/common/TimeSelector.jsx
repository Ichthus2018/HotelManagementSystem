import { useState, useEffect } from "react";
import { FaRegClock } from "react-icons/fa";

const TimeSelector = ({ label, name, value, onChange, required }) => {
  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) =>
    i.toString().padStart(2, "0")
  ); // Generates "00" to "59"
  const periods = ["AM", "PM"];

  const [time, setTime] = useState({ hour: "", minute: "", period: "" });

  // This useEffect now correctly handles a 24-hour format string (e.g., "14:30")
  // coming from the database and sets the 12-hour UI dropdowns.
  useEffect(() => {
    if (value && value.includes(":")) {
      try {
        const [hourPart, minutePart] = value.split(":");
        const hour24 = parseInt(hourPart, 10);

        const period = hour24 >= 12 ? "PM" : "AM";
        let hour12 = hour24 % 12;
        if (hour12 === 0) {
          hour12 = 12; // 12 PM or 12 AM
        }

        setTime({
          hour: hour12.toString(),
          minute: minutePart,
          period: period,
        });
      } catch (error) {
        console.error("Error parsing 24-hour time value:", error);
        setTime({ hour: "", minute: "", period: "" });
      }
    } else {
      setTime({ hour: "", minute: "", period: "" });
    }
  }, [value]);

  // This function now converts the 12-hour UI state to a 24-hour format string
  // before calling the parent's onChange handler.
  const handlePartChange = (part, partValue) => {
    const newTime = { ...time, [part]: partValue };
    setTime(newTime);

    if (newTime.hour && newTime.minute && newTime.period) {
      // --- Conversion Logic ---
      let hour24 = parseInt(newTime.hour, 10);
      if (newTime.period === "PM" && hour24 < 12) {
        hour24 += 12; // e.g., 2 PM becomes 14
      }
      if (newTime.period === "AM" && hour24 === 12) {
        hour24 = 0; // 12 AM becomes 00
      }

      const formattedHour = hour24.toString().padStart(2, "0");
      const dbTimeFormat = `${formattedHour}:${newTime.minute}`; // e.g., "14:00"

      onChange(dbTimeFormat); // Send the correct format to the parent
    } else {
      onChange(""); // Clear if incomplete
    }
  };

  return (
    <div>
      <label
        htmlFor={`${name}-hour`}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
      </label>

      <div className="flex items-center w-full rounded-lg border border-gray-300 bg-white shadow-sm transition-all focus-within:ring-2 focus-within:ring-blue-300 focus-within:border-blue-300">
        <div className="pl-3 pr-2 text-gray-400">
          <FaRegClock />
        </div>

        <select
          id={`${name}-hour`}
          value={time.hour}
          onChange={(e) => handlePartChange("hour", e.target.value)}
          required={required}
          className="flex-grow bg-transparent p-2 text-sm text-gray-800 border-0 focus:ring-0 appearance-none"
        >
          <option value="" disabled>
            Hour
          </option>
          {hours.map((h) => (
            <option key={h} value={h}>
              {h.toString().padStart(2, "0")}
            </option>
          ))}
        </select>

        <span className="text-gray-400 font-bold">:</span>

        <select
          id={`${name}-minute`}
          value={time.minute}
          onChange={(e) => handlePartChange("minute", e.target.value)}
          required={required}
          className="flex-grow bg-transparent p-2 text-sm text-gray-800 border-0 focus:ring-0 appearance-none"
        >
          <option value="" disabled>
            Min
          </option>
          {minutes.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        <div className="border-l border-gray-200 h-6"></div>

        <select
          id={`${name}-period`}
          value={time.period}
          onChange={(e) => handlePartChange("period", e.target.value)}
          required={required}
          className="bg-transparent p-2 pr-3 text-sm font-medium text-gray-800 border-0 focus:ring-0 appearance-none"
        >
          <option value="" disabled>
            AM/PM
          </option>
          {periods.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default TimeSelector;
