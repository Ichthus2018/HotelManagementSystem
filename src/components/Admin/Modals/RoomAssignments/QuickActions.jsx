import React from "react";

const QuickActions = ({ onBulkAssign, selectedRooms }) => {
  return (
    <div className="flex items-center gap-3">
      {selectedRooms.length > 0 && (
        <span className="text-sm text-gray-600">
          {selectedRooms.length} selected
        </span>
      )}
      <button
        onClick={onBulkAssign}
        disabled={selectedRooms.length === 0}
        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        Bulk Assign
      </button>
    </div>
  );
};

export default QuickActions;
