// src/components/pages/roomtypes/RoomTypeCardGrid.jsx

import {
  PencilSquareIcon,
  TrashIcon,
  CurrencyDollarIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";

const RoomTypeCardGrid = ({ roomTypes, onEdit, onDelete, onViewDetails }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {roomTypes.map((roomType) => {
        return (
          <div
            key={roomType.id}
            className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
          >
            {/* --- Image Section --- */}
            <div className="relative">
              <img
                src={
                  roomType.images && roomType.images.length > 0
                    ? roomType.images[0]
                    : "https://placehold.co/800x600.png?text=No+Image"
                }
                alt={roomType.title}
                className="w-full h-52 object-cover aspect-video transition-transform duration-300 group-hover:scale-105"
              />
            </div>

            {/* --- Content Section --- */}
            <div className="p-5 flex flex-col flex-grow">
              <h3 className="font-bold text-lg text-gray-800 truncate mb-2">
                {roomType.title}
              </h3>

              {/* Info Snippets */}
              <div className="space-y-1 text-sm text-gray-600 mb-4">
                <div className="flex items-center">
                  <CurrencyDollarIcon className="h-4 w-4 mr-2 text-gray-400" />
                  <span>
                    Base Rate:{" "}
                    <strong>${Number(roomType.base_rate).toFixed(2)}</strong>
                  </span>
                </div>
                <div className="flex items-center">
                  <UsersIcon className="h-4 w-4 mr-2 text-gray-400" />
                  <span>
                    Max Guests: <strong>{roomType.guests_maximum}</strong>
                  </span>
                </div>
              </div>

              {/* Amenities Preview */}
              <div className="flex flex-wrap gap-2 mb-4">
                {roomType.amenities && roomType.amenities.length > 0 ? (
                  <>
                    {roomType.amenities.slice(0, 3).map((amenity, index) => (
                      <span
                        key={index}
                        className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-1 rounded-full"
                      >
                        {amenity}
                      </span>
                    ))}
                    {roomType.amenities.length > 3 && (
                      <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2.5 py-1 rounded-full">
                        + {roomType.amenities.length - 3} more
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-xs text-gray-500">
                    No amenities listed.
                  </span>
                )}
              </div>

              {/* --- Footer Actions --- */}
              <div className="mt-auto pt-5">
                <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onEdit(roomType)}
                      className="p-2 text-gray-500 rounded-full hover:bg-gray-100 hover:text-orange-600 transition-colors"
                      title="Edit"
                    >
                      <PencilSquareIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => onDelete(roomType)}
                      className="p-2 text-gray-500 rounded-full hover:bg-gray-100 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                  <button
                    onClick={() => onViewDetails(roomType)}
                    className="text-sm font-semibold text-orange-600 hover:text-orange-800 transition-colors"
                  >
                    View Details →
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RoomTypeCardGrid;
