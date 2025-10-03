// src/components/Admin/Modals/Hotel/Pages/HotelList.jsx

import { useState } from "react";
import {
  TrashIcon,
  PencilSquareIcon,
  BuildingOfficeIcon,
  StarIcon,
  EnvelopeIcon,
  PhoneIcon,
  GlobeAltIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";

// Star Rating Component
const StarRating = ({ rating }) => {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <StarIcon
          key={star}
          className={`h-5 w-5 ${
            star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"
          }`}
        />
      ))}
      <span className="ml-2 text-sm font-medium text-gray-700">
        {rating} Star{rating !== 1 ? "s" : ""}
      </span>
    </div>
  );
};

// Social Media Links Component
const SocialMediaLinks = ({ links }) => {
  if (!links) return null;

  const socialPlatforms = {
    facebook: { name: "Facebook", color: "text-blue-600" },
    instagram: { name: "Instagram", color: "text-pink-600" },
    twitter: { name: "Twitter", color: "text-blue-400" },
    linkedin: { name: "LinkedIn", color: "text-blue-700" },
    youtube: { name: "YouTube", color: "text-red-600" },
  };

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {Object.entries(links).map(([platform, url]) => (
        <a
          key={platform}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
            socialPlatforms[platform]?.color || "text-gray-600"
          } bg-gray-100 hover:bg-gray-200`}
        >
          {socialPlatforms[platform]?.name || platform}
        </a>
      ))}
    </div>
  );
};

const HotelList = ({ hotels, onDelete, onEdit }) => {
  const formatAddress = (hotel) => {
    const addressParts = [
      hotel.address_line_1,
      hotel.address_line_2,
      hotel.city,
      hotel.province,
      hotel.region,
      hotel.country,
      hotel.postal_code,
    ].filter(Boolean);

    if (addressParts.length === 0) {
      return <span className="italic text-gray-400">No address provided.</span>;
    }
    return addressParts.join(", ");
  };

  return (
    <ul role="list" className="divide-y divide-gray-200">
      {hotels.map((hotel) => (
        <li
          key={hotel.id}
          className="group relative p-6 transition-colors duration-200 hover:bg-sky-50"
        >
          <div className="flex flex-col lg:flex-row items-start gap-6">
            {/* Hotel Icon and Basic Info */}
            <div className="flex-shrink-0">
              <div className="w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
                <BuildingOfficeIcon className="h-8 w-8 text-white" />
              </div>
            </div>

            {/* Hotel Details */}
            <div className="flex-1 min-w-0 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h3 className="text-2xl font-bold text-gray-900">
                  {hotel.hotel_name}
                </h3>
                {hotel.star_rating && <StarRating rating={hotel.star_rating} />}
              </div>

              {/* Contact & Address Info */}
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex flex-wrap gap-4">
                  {hotel.phone_number && (
                    <div className="flex items-center gap-2">
                      <PhoneIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span>{hotel.phone_number}</span>
                    </div>
                  )}
                  {hotel.email && (
                    <div className="flex items-center gap-2">
                      <EnvelopeIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{hotel.email}</span>
                    </div>
                  )}
                  {hotel.website && (
                    <div className="flex items-center gap-2">
                      <GlobeAltIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <a
                        href={hotel.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline truncate"
                      >
                        {hotel.website.replace(/^https?:\/\//, "")}
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex items-start gap-2">
                  <MapPinIcon className="h-4 w-4 mt-0.5 text-gray-400 flex-shrink-0" />
                  <p className="leading-tight">{formatAddress(hotel)}</p>
                </div>

                {hotel.tin_number && (
                  <div className="text-xs text-gray-500">
                    TIN: {hotel.tin_number}
                  </div>
                )}

                <SocialMediaLinks links={hotel.social_media_links} />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex-shrink-0 flex gap-2 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                onClick={() => onEdit(hotel)}
                className="p-2 text-gray-500 rounded-full bg-white/60 backdrop-blur-sm shadow-sm hover:bg-sky-100 hover:text-sky-600 transition-colors"
                title="Edit Hotel"
              >
                <PencilSquareIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => onDelete(hotel)}
                className="p-2 text-gray-500 rounded-full bg-white/60 backdrop-blur-sm shadow-sm hover:bg-red-100 hover:text-red-600 transition-colors"
                title="Delete Hotel"
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

export default HotelList;
