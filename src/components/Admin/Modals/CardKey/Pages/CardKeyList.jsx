// File: src/components/Admin/CardKey/CardKeyList.jsx

import { TrashIcon } from "@heroicons/react/24/outline";
import { format } from "date-fns";

// Helper to format the timestamp range
const formatValidity = (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const startFormatted = format(startDate, "MMM d, yyyy 'at' h:mm a");
  const endFormatted = format(endDate, "MMM d, yyyy 'at' h:mm a");
  return `${startFormatted} to ${endFormatted}`;
};

// Helper to style the key type
const typeStyles = {
  PASSCODE: "bg-blue-100 text-blue-800",
  IC_CARD: "bg-indigo-100 text-indigo-800",
  EKEY: "bg-purple-100 text-purple-800",
};

const CardKeyList = ({ cardKeys, onDelete }) => {
  return (
    <div className="divide-y divide-gray-200">
      {cardKeys.map((key) => {
        const guestName = [
          key.bookings?.guests?.first_name,
          key.bookings?.guests?.last_name,
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <div
            key={key.id}
            className="p-6 flex justify-between items-center hover:bg-gray-50"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {key.value || "No Value"}
                </h3>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    typeStyles[key.type] || "bg-gray-100 text-gray-800"
                  }`}
                >
                  {key.type}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-600">
                For Booking:{" "}
                <span className="font-medium text-gray-800">
                  {guestName || `ID ${key.bookings?.id.substring(0, 8)}...`}
                </span>
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Valid: {formatValidity(key.valid_from, key.valid_until)}
              </p>
            </div>
            <div className="ml-4 flex-shrink-0">
              <button
                onClick={() => onDelete(key)}
                className="p-2 text-gray-500 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors"
                title={`Delete ${key.type}`}
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CardKeyList;
