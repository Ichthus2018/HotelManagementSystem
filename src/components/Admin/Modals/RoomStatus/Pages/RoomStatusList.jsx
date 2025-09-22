// File: src/components/Admin/Modals/RoomStatus.jsx/Pages/RoomStatusList.jsx

import { TrashIcon, PencilSquareIcon } from "@heroicons/react/24/outline";

// Helper to provide styling for different room statuses
const statusStyles = {
  available: "bg-green-100 text-green-800",
  occupied: "bg-yellow-100 text-yellow-800",
  cleaning: "bg-blue-100 text-blue-800",
  maintenance: "bg-purple-100 text-purple-800",
  out_of_order: "bg-red-100 text-red-800",
};

const RoomStatusList = ({ rooms, onEdit, onDelete }) => {
  return (
    // Main container changed to a responsive grid with gaps
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 py-6">
      {rooms.map((room) => (
        <div
          key={room.id}
          className="flex flex-col bg-white border border-gray-200 rounded-lg shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
        >
          {/* Main content area of the card */}
          <div className="p-5 flex-grow">
            <h3 className="text-2xl font-bold text-gray-800 tracking-tight">
              {room.room_number}
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              <span className="font-medium text-gray-700">
                {room.room_types?.title || "Unknown Type"}
              </span>
              <span className="mx-2">&bull;</span>
              {room.locations?.name || (
                <span className="italic text-gray-400">No Location</span>
              )}
            </p>
          </div>

          {/* Footer area for status and action buttons */}
          <div className="mt-auto p-5 pt-4 border-t border-gray-100 flex items-center justify-between">
            {/* Status Badge */}
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                statusStyles[room.status] || "bg-gray-100 text-gray-800"
              }`}
            >
              {room.status.replace("_", " ")}
            </span>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onEdit(room)}
                className="p-2 text-gray-500 rounded-full hover:bg-blue-100 hover:text-blue-600 transition-colors"
                title={`Edit Room ${room.room_number}`}
              >
                <PencilSquareIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => onDelete(room)}
                className="p-2 text-gray-500 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors"
                title={`Delete Room ${room.room_number}`}
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RoomStatusList;
