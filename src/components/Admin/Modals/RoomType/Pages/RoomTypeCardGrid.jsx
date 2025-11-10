import {
  PencilSquareIcon,
  TrashIcon,
  CurrencyDollarIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { FaClipboardList, FaSwimmingPool, FaWifi } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const RoomTypeCardGrid = ({
  roomTypes,
  onEdit,
  onDelete,
  onViewDetails,
  onManageChecklist,
  onManageAmenities,
}) => {
  const navigate = useNavigate();

  const handleNavigateToRooms = (roomTypeId) => {
    navigate(`/admin/roomNumbers/${roomTypeId}`);
  };

  return (
    <div className="p-6 min-h-screen">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {roomTypes.map((roomType) => {
          return (
            <div
              key={roomType.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 hover:translate-y-[-2px] group"
            >
              {/* --- Image Section --- */}
              <div className="relative overflow-hidden rounded-t-xl">
                <img
                  src={
                    roomType.images && roomType.images.length > 0
                      ? roomType.images[0]
                      : "https://placehold.co/600x400/f8fafc/94a3b8?text=No+Image&font=inter"
                  }
                  alt={`Image of ${roomType.title}`}
                  className="w-full h-48 object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
                  onClick={() => onViewDetails(roomType)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Room count badge */}
                <div className="absolute top-3 right-3">
                  <span className="bg-white/95 backdrop-blur-sm text-gray-700 px-2.5 py-1 rounded-lg text-sm font-medium shadow-sm border border-gray-200">
                    {roomType.rooms?.[0]?.count || 0} rooms
                  </span>
                </div>

                {/* Quick action overlay */}
                <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button
                    onClick={() => onViewDetails(roomType)}
                    className="bg-white/95 backdrop-blur-sm text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm border border-gray-200 hover:bg-white hover:shadow-md transition-all"
                  >
                    Quick view
                  </button>
                </div>
              </div>

              {/* --- Content Section --- */}
              <div className="p-5 flex flex-col flex-grow">
                {/* Header with title and category */}
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-semibold text-lg text-gray-900 line-clamp-1 flex-1 mr-3">
                    {roomType.title}
                  </h3>
                </div>

                {/* Key metrics */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <div className="flex items-center mb-1">
                      <CurrencyDollarIcon className="h-4 w-4 mr-1.5 text-green-600" />
                      <span className="text-sm font-medium text-gray-700">
                        Rate
                      </span>
                    </div>
                    <div className="text-lg font-bold text-gray-900">
                      ₱
                      {Number(roomType.base_rate).toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <div className="flex items-center mb-1">
                      <UsersIcon className="h-4 w-4 mr-1.5 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">
                        Guests
                      </span>
                    </div>
                    <div className="text-lg font-bold text-gray-900">
                      {roomType.guests_maximum}
                    </div>
                  </div>
                </div>

                {/* Amenities Preview */}
                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    <FaWifi className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">
                      Amenities
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {roomType.amenities && roomType.amenities.length > 0 ? (
                      <>
                        {roomType.amenities
                          .slice(0, 3)
                          .map((amenity, index) => (
                            <span
                              key={index}
                              className="bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-md border border-gray-200"
                            >
                              {amenity}
                            </span>
                          ))}
                        {roomType.amenities.length > 3 && (
                          <span className="bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-md border border-blue-200">
                            +{roomType.amenities.length - 3}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-gray-500 italic">
                        No amenities
                      </span>
                    )}
                  </div>
                </div>

                {/* --- Action Buttons --- */}
                <div className="mt-auto pt-4 border-t border-gray-100">
                  {/* Primary Actions Row */}
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => onEdit(roomType)}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                        title="Edit Room Type"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDelete(roomType)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                        title="Delete Room Type"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Updated: Make the main button pop */}
                    <button
                      onClick={() => handleNavigateToRooms(roomType.id)}
                      className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center"
                    >
                      View Rooms
                      <span className="ml-1.5 font-bold transition-transform duration-200 group-hover:translate-x-0.5">
                        →
                      </span>
                    </button>
                  </div>

                  {/* Secondary Actions Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onManageChecklist(roomType)}
                      className="flex items-center justify-center gap-1.5 py-2 text-xs text-gray-600 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200 font-medium border border-gray-200"
                      title="Manage Checklist"
                    >
                      <FaClipboardList className="h-3.5 w-3.5 text-blue-600" />
                      Checklist
                    </button>
                    <button
                      onClick={() => onManageAmenities(roomType)}
                      className="flex items-center justify-center gap-1.5 py-2 text-xs text-gray-600 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200 font-medium border border-gray-200"
                      title="Manage Amenities"
                    >
                      <FaSwimmingPool className="h-3.5 w-3.5 text-green-600" />
                      Amenities
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
