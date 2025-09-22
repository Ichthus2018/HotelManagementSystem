import { TrashIcon, PencilSquareIcon } from "@heroicons/react/24/outline"; // ADDED PencilSquareIcon

// Helper to provide styling for different room statuses
const statusStyles = {
  available: "bg-green-100 text-green-800",
  occupied: "bg-yellow-100 text-yellow-800",
  cleaning: "bg-blue-100 text-blue-800",
  maintenance: "bg-purple-100 text-purple-800",
  out_of_order: "bg-red-100 text-red-800",
};

// MODIFIED: Added 'onEdit' prop
const RoomList = ({ rooms, onEdit, onDelete }) => {
  return (
    <div className="divide-y divide-gray-200">
      {rooms.map((room) => (
        <div
          key={room.id}
          className="p-6 flex justify-between items-center hover:bg-gray-50"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {room.room_number}
              </h3>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                  statusStyles[room.status] || "bg-gray-100 text-gray-800"
                }`}
              >
                {room.status.replace("_", " ")}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-600 truncate">
              <span className="font-medium text-gray-800">
                {room.room_types?.title || "Unknown Type"}
              </span>{" "}
              &bull; Location:{" "}
              {room.locations?.name || (
                <span className="italic text-gray-400">Not assigned</span>
              )}
            </p>
          </div>
          {/* MODIFIED: Added a container for buttons */}
          <div className="ml-4 flex-shrink-0 flex items-center gap-2">
            {/* ADDED: Edit button */}
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
      ))}
    </div>
  );
};

export default RoomList;
