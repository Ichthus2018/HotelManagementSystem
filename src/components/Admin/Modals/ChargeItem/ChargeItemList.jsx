import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";

const ChargeItemList = ({ chargeItems, onEdit, onDelete }) => {
  const formatValue = (item) => {
    if (item.charge_type === "percentage") {
      return `${item.value}%`;
    }
    // Default to fixed amount for backward compatibility or other cases
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(item.value);
  };

  return (
    <div className="divide-y divide-gray-200">
      {chargeItems.map((item) => (
        <div
          key={item.id}
          className="p-6 flex justify-between items-start gap-4 hover:bg-gray-50"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {item.name}
              </h3>
              {item.is_default && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Default
                </span>
              )}
              {!item.is_vatable && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  No VAT
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-600 line-clamp-3">
              {item.description || (
                <span className="italic text-gray-400">
                  No description provided.
                </span>
              )}
            </p>
            <p className="mt-2 text-lg font-medium text-orange-600">
              {formatValue(item)}
            </p>
          </div>
          <div className="flex-shrink-0 flex items-center space-x-2">
            <button
              onClick={() => onEdit(item)}
              className="p-2 text-gray-500 rounded-full hover:bg-gray-200 hover:text-orange-500 transition-colors"
              title="Edit Charge Item"
            >
              <PencilSquareIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => onDelete(item)}
              className="p-2 text-gray-500 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors"
              title="Delete Charge Item"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChargeItemList;
