import { TrashIcon, PencilSquareIcon } from "@heroicons/react/24/outline";
import { format } from "date-fns";

// Helper to format the timestamp range
const formatValidity = (startTimestamp, endTimestamp) => {
  if (!startTimestamp || startTimestamp === 0) return "Permanent";

  const startDate = new Date(startTimestamp);
  const endDate = new Date(endTimestamp);
  const startFormatted = format(startDate, "MMM d, yyyy 'at' h:mm a");
  const endFormatted = format(endDate, "MMM d, yyyy 'at' h:mm a");

  return `${startFormatted} to ${endFormatted}`;
};

const CardList = ({ cards, onEdit, onDelete }) => {
  return (
    <div className="divide-y divide-gray-200">
      {cards.map((card) => (
        <div
          key={card.cardId}
          className="p-6 grid grid-cols-1 md:grid-cols-3 items-center gap-4 hover:bg-gray-50"
        >
          {/* Card Info */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {card.cardName}
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Card Number:{" "}
              <span className="font-mono text-gray-800">{card.cardNumber}</span>
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Valid: {formatValidity(card.startDate, card.endDate)}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-start md:justify-end gap-2">
            <button
              onClick={() => onEdit(card)}
              className="p-2 text-gray-500 rounded-full hover:bg-blue-100 hover:text-blue-600 transition-colors"
              title="Edit Validity"
            >
              <PencilSquareIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => onDelete(card)}
              className="p-2 text-gray-500 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors"
              title="Delete Card"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CardList;
