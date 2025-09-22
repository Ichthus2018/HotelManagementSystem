import { useState } from "react";
import {
  TrashIcon,
  PencilSquareIcon,
  UserCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  MagnifyingGlassPlusIcon,
} from "@heroicons/react/24/outline";

// Import the Lightbox component and its styles
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

const GuestList = ({ guests, onDelete, onEdit }) => {
  // State to manage the lightbox
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");

  const openLightbox = (imageSrc) => {
    setSelectedImage(imageSrc);
    setIsLightboxOpen(true);
  };

  // Helper functions (no changes needed)
  const formatFullName = (guest) => {
    return [guest.first_name, guest.middle_name, guest.last_name]
      .filter(Boolean)
      .join(" ");
  };

  const formatAddress = (guest) => {
    const addressParts = [
      guest.street_address,
      guest.barangay,
      guest.city_municipality,
      guest.province,
      guest.region,
    ].filter(Boolean);

    if (addressParts.length === 0) {
      return <span className="italic text-gray-400">No address provided.</span>;
    }
    return addressParts.join(", ");
  };

  return (
    <>
      <ul role="list" className="divide-y divide-gray-200">
        {guests.map((guest) => (
          <li
            key={guest.id}
            className="group relative p-4 sm:p-6 transition-colors duration-200 hover:bg-sky-50"
          >
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
              {/* Guest Photo with Lightbox Trigger */}
              <div className="flex-shrink-0">
                {guest.profile_image_url ? (
                  <button
                    type="button"
                    onClick={() => openLightbox(guest.profile_image_url)}
                    className="relative block w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
                  >
                    <img
                      src={guest.profile_image_url}
                      alt={formatFullName(guest)}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <MagnifyingGlassPlusIcon className="h-8 w-8 text-white" />
                    </div>
                  </button>
                ) : (
                  <div className="w-20 h-20 flex items-center justify-center rounded-full bg-gray-100">
                    <UserCircleIcon className="h-full w-full text-gray-300" />
                  </div>
                )}
              </div>

              {/* Guest Details */}
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-gray-800">
                  {formatFullName(guest)}
                </h3>

                {/* Contact & Address Info */}
                <div className="mt-2 flex flex-col space-y-2 text-sm text-gray-700">
                  {guest.email && (
                    <div className="flex items-center gap-2">
                      <EnvelopeIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{guest.email}</span>
                    </div>
                  )}
                  {guest.contact_no && (
                    <div className="flex items-center gap-2">
                      <PhoneIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span>{guest.contact_no}</span>
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <MapPinIcon className="h-4 w-4 mt-0.5 text-gray-400 flex-shrink-0" />
                    <p className="leading-tight">{formatAddress(guest)}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons - Appear on Hover */}
              <div className="absolute top-4 right-4 flex-shrink-0 flex gap-2 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={() => onEdit(guest)}
                  className="p-2 text-gray-500 rounded-full bg-white/60 backdrop-blur-sm shadow-sm hover:bg-sky-100 hover:text-sky-600 transition-colors"
                  title="Edit Guest"
                >
                  <PencilSquareIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => onDelete(guest)}
                  className="p-2 text-gray-500 rounded-full bg-white/60 backdrop-blur-sm shadow-sm hover:bg-red-100 hover:text-red-600 transition-colors"
                  title="Delete Guest"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* The Lightbox Component */}
      <Lightbox
        open={isLightboxOpen}
        close={() => setIsLightboxOpen(false)}
        slides={[{ src: selectedImage }]}
        styles={{ container: { backgroundColor: "rgba(0, 0, 0, .9)" } }}
      />
    </>
  );
};

export default GuestList;
