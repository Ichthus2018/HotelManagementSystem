import { useState } from "react";

const TagInputManager = ({
  title,
  selectedItems,
  onAddItem,
  onRemoveItem,
  suggestedItems,
  placeholder,
}) => {
  const [customItem, setCustomItem] = useState("");

  const handleAdd = () => {
    if (customItem.trim()) {
      onAddItem(customItem.trim());
      setCustomItem("");
    }
  };

  return (
    <div>
      <h4 className="text-md font-semibold text-gray-800">{title}</h4>

      {/* Selected Items */}
      <div className="mt-2">
        <label className="block text-sm font-medium text-gray-700">
          Selected {title}:
        </label>
        <div className="flex flex-wrap gap-2 mt-2 min-h-[2.5rem] items-center">
          {selectedItems.length === 0 ? (
            <p className="text-sm text-gray-500">
              No {title.toLowerCase()} added yet.
            </p>
          ) : (
            selectedItems.map((item) => (
              <span
                key={item}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
              >
                {item}
                <button
                  type="button"
                  onClick={() => onRemoveItem(item)}
                  className="ml-2 -mr-1 flex-shrink-0 h-5 w-5 rounded-full inline-flex items-center justify-center text-blue-500 hover:bg-blue-200 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <span className="sr-only">Remove {item}</span>
                  <svg
                    className="h-3 w-3"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 8 8"
                  >
                    <path
                      strokeLinecap="round"
                      strokeWidth="1.5"
                      d="M1 1l6 6m0-6L1 7"
                    />
                  </svg>
                </button>
              </span>
            ))
          )}
        </div>
      </div>

      {/* Custom Input */}
      <div className="mt-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={customItem}
            onChange={(e) => setCustomItem(e.target.value)}
            placeholder={placeholder}
            className="flex-grow block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAdd();
              }
            }}
          />
          <button
            type="button"
            onClick={handleAdd}
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Add
          </button>
        </div>
      </div>

      {/* Suggested Items */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700">
          Suggested {title}:
        </label>
        <div className="flex flex-wrap gap-2 mt-2">
          {suggestedItems.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onAddItem(item)}
              disabled={selectedItems.includes(item)}
              className="px-3 py-1 border border-gray-300 rounded-full text-sm text-gray-700 hover:bg-gray-100 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              + {item}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TagInputManager;
