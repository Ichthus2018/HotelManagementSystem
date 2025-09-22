// src/components/pages/roomtypes/RoomTypeDetails.jsx

import { useState } from "react";
import {
  ArrowLeftIcon,
  PencilSquareIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  UsersIcon,
  MoonIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

const RoomTypeDetails = ({ roomType, onBack, onEdit, onDelete }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images =
    roomType.images && roomType.images.length > 0
      ? roomType.images
      : ["https://placehold.co/800x600.png?text=No+Image"];

  const nextImage = () =>
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  const prevImage = () =>
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeftIcon className="h-6 w-6 text-gray-700" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Room Type Details
            </h2>
            <p className="text-sm text-gray-500">
              View and manage room information
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(roomType)}
            className="... button styles ..."
          >
            <PencilSquareIcon className="h-4 w-4" /> Edit
          </button>
          <button
            onClick={() => onDelete(roomType)}
            className="... button styles ..."
          >
            <TrashIcon className="h-4 w-4" /> Delete
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 sm:p-6">
        {/* Image Carousel */}
        <div className="relative w-full aspect-[16/10] rounded-lg overflow-hidden group mb-6">
          <img
            src={images[currentImageIndex]}
            alt={roomType.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Info Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{roomType.title}</h1>
          <p className="text-lg text-gray-600 mt-2">{roomType.description}</p>
        </div>

        {/* Key Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <InfoCard
            icon={CurrencyDollarIcon}
            title="Base Rate"
            value={`$${Number(roomType.base_rate).toFixed(2)}`}
          />
          <InfoCard
            icon={CurrencyDollarIcon}
            title="Weekend Rate"
            value={`$${Number(roomType.weekend_rate).toFixed(2)}`}
          />
          <InfoCard
            icon={UsersIcon}
            title="Max Guests"
            value={roomType.guests_maximum}
          />
          <InfoCard
            icon={MoonIcon}
            title="Min Stay"
            value={`${roomType.min_stay} nights`}
          />
        </div>

        {/* Amenities & House Rules */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <FeatureList title="Amenities" items={roomType.amenities} />
          <FeatureList title="House Rules" items={roomType.house_rules} />
        </div>
      </div>
    </div>
  );
};

// Helper components for cleaner JSX
const InfoCard = ({ icon: Icon, title, value }) => (
  <div className="p-4 bg-gray-50 rounded-lg flex items-center gap-4">
    <Icon className="h-8 w-8 text-orange-500 flex-shrink-0" />
    <div>
      <p className="text-xl font-semibold">{value || "N/A"}</p>
      <p className="text-sm text-gray-500">{title}</p>
    </div>
  </div>
);

const FeatureList = ({ title, items }) => (
  <div>
    <h3 className="text-xl font-semibold mb-4 border-b pb-2">{title}</h3>
    {items && items.length > 0 ? (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-gray-800 mt-4">
        {items.map((item) => (
          <div key={item} className="flex items-center gap-3">
            <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    ) : (
      <div className="mt-4 p-6 bg-gray-50 rounded-lg text-center text-sm text-gray-500">
        No {title.toLowerCase()} have been listed.
      </div>
    )}
  </div>
);

export default RoomTypeDetails;
