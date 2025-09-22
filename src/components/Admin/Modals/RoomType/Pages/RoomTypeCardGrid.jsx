import {
  PencilSquareIcon,
  TrashIcon,
  CurrencyDollarIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";

const RoomTypeCardGrid = ({ roomTypes, onEdit, onDelete, onViewDetails }) => {
  const navigate = useNavigate();

  const handleNavigateToRooms = (roomTypeId) => {
    navigate(`/admin/roomNumbers/${roomTypeId}`);
  };

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {roomTypes.map((roomType) => {
          return (
            <div
              key={roomType.id}
              className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-md "
            >
              {/* --- Image Section --- */}
              <div className="relative overflow-hidden">
                <img
                  src={
                    roomType.images && roomType.images.length > 0
                      ? roomType.images[0] // Use the first image in the array
                      : "https://placehold.co/600x400/EEE/31343C?text=No+Image" // Fallback placeholder
                  }
                  alt={`Image of ${roomType.title}`}
                  className="w-full h-48 object-cover rounded-t-lg bg-gray-100" // bg-gray-100 provides a background while the image loads
                />
              </div>

              {/* --- Content Section --- */}
              <div className="p-5 flex flex-col flex-grow">
                <h3 className="font-bold text-xl text-gray-900 truncate mb-2">
                  {roomType.title}
                </h3>

                {/* Info Snippets */}
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center">
                    <CurrencyDollarIcon className="h-5 w-5 mr-2 text-gray-400" />
                    <span>
                      Base Rate:{" "}
                      <strong className="font-semibold text-gray-800">
                        ₱
                        {Number(roomType.base_rate).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </strong>
                    </span>
                  </div>
                  <div className="flex items-center">
                    <UsersIcon className="h-5 w-5 mr-2 text-gray-400" />
                    <span>
                      Max Guests:{" "}
                      <strong className="font-semibold text-gray-800">
                        {roomType.guests_maximum}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Amenities Preview (Matches the screenshot style) */}
                <div className="flex flex-wrap gap-2 mb-5">
                  {roomType.amenities && roomType.amenities.length > 0 ? (
                    <>
                      {roomType.amenities.slice(0, 3).map((amenity, index) => (
                        <span
                          key={index}
                          className="bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1 rounded-md"
                        >
                          {amenity}
                        </span>
                      ))}
                      {roomType.amenities.length > 3 && (
                        <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-md">
                          +{roomType.amenities.length - 3} more
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-xs text-gray-500 italic">
                      No amenities listed.
                    </span>
                  )}
                </div>

                {/* --- Footer Actions --- */}
                <div className="mt-auto pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => onEdit(roomType)}
                        className="p-2 text-gray-500 rounded-full hover:bg-gray-100 hover:text-blue-500 transition-colors"
                        title="Edit Room Type"
                      >
                        <PencilSquareIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => onDelete(roomType)}
                        className="p-2 text-gray-500 rounded-full hover:bg-red-100 hover:text-blue-600 transition-colors"
                        title="Delete Room Type"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                    <button
                      onClick={() => handleNavigateToRooms(roomType.id)}
                      className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      View Rooms
                      <span aria-hidden="true" className="ml-1 font-bold">
                        →
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RoomTypeCardGrid;
