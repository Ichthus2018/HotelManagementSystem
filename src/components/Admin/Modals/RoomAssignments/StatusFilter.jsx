import { useState } from "react";

const statusOptions = [
  { value: "all", label: "All Statuses", color: "gray" },
  { value: "Dirty", label: "Dirty", color: "red" },
  { value: "For Cleaning", label: "For Cleaning", color: "yellow" },
  { value: "For Inspection", label: "For Inspection", color: "blue" },
  { value: "Clean", label: "Clean", color: "green" },
];

const StatusFilter = ({ currentFilter, onFilterChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const currentOption =
    statusOptions.find((opt) => opt.value === currentFilter) ||
    statusOptions[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 min-w-[150px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <span
          className={`w-2 h-2 rounded-full ${
            currentOption.color === "red"
              ? "bg-red-500"
              : currentOption.color === "yellow"
              ? "bg-yellow-500"
              : currentOption.color === "blue"
              ? "bg-blue-500"
              : currentOption.color === "green"
              ? "bg-green-500"
              : "bg-gray-500"
          }`}
        />
        {currentOption.label}
        <svg
          className="h-4 w-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-10">
          <div className="py-1">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onFilterChange(option.value);
                  setIsOpen(false);
                }}
                className={`flex items-center gap-3 w-full px-4 py-2 text-sm text-left hover:bg-gray-50 ${
                  currentFilter === option.value
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    option.color === "red"
                      ? "bg-red-500"
                      : option.color === "yellow"
                      ? "bg-yellow-500"
                      : option.color === "blue"
                      ? "bg-blue-500"
                      : option.color === "green"
                      ? "bg-green-500"
                      : "bg-gray-500"
                  }`}
                />
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusFilter;
