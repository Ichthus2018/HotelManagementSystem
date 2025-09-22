import {
  PencilSquareIcon,
  TrashIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";

const LocationList = ({ locations, onEdit, onDelete }) => {
  return (
    <ul role="list" className="divide-y divide-gray-200">
      {locations.map((location) => (
        <li
          key={location.id}
          className="group relative p-4 sm:p-6 transition-colors duration-200 hover:bg-green-50"
        >
          <div className="flex items-start gap-4 sm:gap-6">
            {/* A decorative icon to add visual interest */}
            <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-lg bg-green-100">
              <MapPinIcon className="h-6 w-6 text-green-600" />
            </div>

            {/* Location Details */}
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-gray-800 truncate">
                {location.name}
              </h3>
              <p className="mt-1 text-sm text-gray-600 line-clamp-3">
                {location.description || (
                  <span className="italic text-gray-400">
                    No description provided.
                  </span>
                )}
              </p>
            </div>

            {/* Action Buttons - Appear on Hover */}
            <div className="absolute top-4 right-4 flex-shrink-0 flex gap-2 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                onClick={() => onEdit(location)}
                className="p-2 text-gray-500 rounded-full bg-white/60 backdrop-blur-sm shadow-sm hover:bg-green-100 hover:text-green-600 transition-colors"
                title="Edit Location"
              >
                <PencilSquareIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => onDelete(location)}
                className="p-2 text-gray-500 rounded-full bg-white/60 backdrop-blur-sm shadow-sm hover:bg-red-100 hover:text-red-600 transition-colors"
                title="Delete Location"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default LocationList;
