import { useState, useEffect } from "react";
import { FaRegClock } from "react-icons/fa"; // Using an icon for style

const TimeSelector = ({ label, name, value, onChange, required }) => {
  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = ["00", "15", "30", "45"];
  const periods = ["AM", "PM"];

  // Simplified internal state
  const [time, setTime] = useState({ hour: "", minute: "", period: "" });

  // Effect to parse the initial value from the parent
  useEffect(() => {
    if (value) {
      const [timePart, periodPart] = value.split(" ");
      const [hourPart, minutePart] = timePart.split(":");
      setTime({
        hour: hourPart || "",
        minute: minutePart || "",
        period: periodPart || "",
      });
    } else {
      setTime({ hour: "", minute: "", period: "" });
    }
  }, [value]);

  // Handle changes to any part and notify the parent
  const handlePartChange = (part, partValue) => {
    const newTime = { ...time, [part]: partValue };
    setTime(newTime);

    // Only call parent's onChange when all parts are selected
    if (newTime.hour && newTime.minute && newTime.period) {
      const formattedTime = `${newTime.hour}:${newTime.minute} ${newTime.period}`;
      onChange({ target: { name, value: formattedTime } });
    } else {
      // Clear parent state if incomplete
      onChange({ target: { name, value: "" } });
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
      {/* Main wrapper for the custom input look */}
      <div className="flex items-center w-full rounded-lg border border-gray-300 bg-white shadow-sm transition-all focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500">
        <div className="pl-3 pr-2 text-gray-400">
          <FaRegClock />
        </div>

        {/* Hour Select */}
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

        {/* Minute Select */}
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

        {/* Divider */}
        <div className="border-l border-gray-200 h-6"></div>

        {/* AM/PM Select */}
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
