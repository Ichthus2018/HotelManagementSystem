import { useState, useEffect } from "react";
import {
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  UsersIcon,
  MoonIcon,
} from "@heroicons/react/24/outline";

// Helper components for cleaner JSX (No changes here)
const InfoCard = ({ icon: Icon, title, value, unit }) => (
  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg flex items-center gap-4">
    <div className="flex-shrink-0 bg-blue-100 p-2 rounded-full">
      <Icon className="h-6 w-6 text-blue-600" />
    </div>
    <div>
      <p className="text-xl font-bold text-gray-800">
        {value || "N/A"}
        {value && unit && (
          <span className="text-base font-medium text-gray-500 ml-1">
            {unit}
          </span>
        )}
      </p>
      <p className="text-sm text-gray-500">{title}</p>
    </div>
  </div>
);

const FeatureList = ({ title, items }) => (
  <div>
    <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
    {items && items.length > 0 ? (
      <ul className="space-y-3 text-gray-700">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-3">
            <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    ) : (
      <div className="mt-4 p-4 border border-dashed rounded-lg text-center text-sm text-gray-500">
        No {title.toLowerCase()} have been listed.
      </div>
    )}
  </div>
);

const RoomTypeDetails = ({ isOpen, onClose, roomType, onEdit, onDelete }) => {
  // HOOK 1: Called on every render
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // HOOK 2: Called on every render
  // Reset image index when roomType changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentImageIndex(0);
    }
  }, [isOpen, roomType]);

  // HOOK 3: Called on every render
  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    // Cleanup function runs when component unmounts or dependency changes
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]); // Dependency array ensures this runs only when `isOpen` changes

  // EARLY RETURN: Now placed AFTER all hooks have been called. This is safe.
  if (!isOpen || !roomType) {
    return null;
  }

  // The rest of the component logic only runs when we are sure to render JSX
  const images =
    roomType.images && roomType.images.length > 0
      ? roomType.images
      : ["https://placehold.co/1280x800/e2e8f0/334155?text=No+Image"];

  const nextImage = () =>
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  const prevImage = () =>
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);

  return (
    // Modal Wrapper & Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ease-in-out opacity-100"
      onClick={onClose} // Click outside to close
    >
      <div className="absolute inset-0 bg-black/60" />

      {/* Modal Panel */}
      <div
        className="relative w-full max-w-5xl bg-white rounded-2xl shadow-xl flex flex-col max-h-[95vh] transform transition-all duration-300 ease-in-out scale-100 opacity-100"
        onClick={(e) => e.stopPropagation()} // Prevent click inside modal from closing it
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {roomType.title}
            </h2>
            <p className="text-sm text-gray-500">Room Type Details</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
            title="Close"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="p-6 overflow-y-auto space-y-8">
          {/* Image Carousel */}
          <div className="relative w-full aspect-video rounded-lg overflow-hidden group bg-gray-100">
            <img
              src={images[currentImageIndex]}
              alt={roomType.title}
              className="w-full h-full object-cover transition-transform duration-500"
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronLeftIcon className="h-6 w-6" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronRightIcon className="h-6 w-6" />
                </button>
                <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs font-semibold px-2 py-1 rounded-full">
                  {currentImageIndex + 1} / {images.length}
                </div>
              </>
            )}
          </div>

          {/* Description */}
          <p className="text-base text-gray-600">{roomType.description}</p>

          {/* Key Info Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <InfoCard
              icon={CurrencyDollarIcon}
              title="Base Rate"
              value={`₱${Number(roomType.base_rate).toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}`}
            />
            <InfoCard
              icon={CurrencyDollarIcon}
              title="Weekend Rate"
              value={`₱${Number(roomType.weekend_rate).toLocaleString(
                undefined,
                { minimumFractionDigits: 2 }
              )}`}
            />
            <InfoCard
              icon={UsersIcon}
              title="Max Guests"
              value={roomType.guests_maximum}
            />
            <InfoCard
              icon={MoonIcon}
              title="Min Stay"
              value={roomType.min_stay}
              unit="nights"
            />
          </div>

          {/* Amenities & House Rules */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t">
            <FeatureList title="Amenities" items={roomType.amenities} />
            <FeatureList title="House Rules" items={roomType.house_rules} />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end items-center gap-4 p-5 border-t border-gray-200 bg-gray-50 rounded-b-2xl flex-shrink-0">
          <button
            onClick={() => onEdit(roomType)}
            className="inline-flex items-center gap-2 justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
          >
            <PencilSquareIcon className="h-4 w-4" /> Edit
          </button>
          <button
            onClick={() => onDelete(roomType)}
            className="inline-flex items-center gap-2 justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 transition-colors"
          >
            <TrashIcon className="h-4 w-4" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomTypeDetails;
