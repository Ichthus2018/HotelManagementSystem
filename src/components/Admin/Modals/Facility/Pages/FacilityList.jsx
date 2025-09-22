import { useState } from "react";
import {
  TrashIcon,
  PencilSquareIcon,
  PhotoIcon,
  ClockIcon,
  UsersIcon,
  MapPinIcon,
  MagnifyingGlassPlusIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";

// Import the Lightbox component and its styles
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

const FacilityList = ({ facilities, onDelete, onEdit }) => {
  // State to manage the lightbox
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");

  const openLightbox = (imageSrc) => {
    setSelectedImage(imageSrc);
    setIsLightboxOpen(true);
  };

  return (
    <>
      <ul role="list" className="divide-y divide-gray-200">
        {facilities.map((facility) => (
          <li
            key={facility.id}
            className="group relative p-4 sm:p-6 transition-colors duration-200 hover:bg-indigo-50"
          >
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
              {/* Facility Image with Lightbox Trigger */}
              <div className="flex-shrink-0 relative">
                {facility.image ? (
                  <button
                    type="button"
                    onClick={() => openLightbox(facility.image)}
                    className="block w-24 h-24 rounded-xl overflow-hidden border-2 border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <img
                      src={facility.image}
                      alt={facility.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <MagnifyingGlassPlusIcon className="h-8 w-8 text-white" />
                    </div>
                  </button>
                ) : (
                  <div className="w-24 h-24 flex items-center justify-center bg-gray-100 rounded-xl border">
                    <PhotoIcon className="h-10 w-10 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Facility Details */}
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-gray-800">
                  {facility.name}
                </h3>

                <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                  {facility.description}
                </p>

                {/* Metadata Info */}
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-700">
                  {(facility.check_in || facility.check_out) && (
                    <div className="flex items-center gap-1.5">
                      <ClockIcon className="h-4 w-4 text-gray-400" />
                      <span>
                        {facility.check_in?.substring(0, 5)} -{" "}
                        {facility.check_out?.substring(0, 5)}
                      </span>
                    </div>
                  )}
                  {facility.capacity && (
                    <div className="flex items-center gap-1.5">
                      <UsersIcon className="h-4 w-4 text-gray-400" />
                      <span>{facility.capacity}</span>
                    </div>
                  )}
                  {facility.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPinIcon className="h-4 w-4 text-gray-400" />
                      <span>{facility.location}</span>
                    </div>
                  )}
                </div>

                {/* Additional Info "Features" */}
                {facility.additionalInfo &&
                  facility.additionalInfo.length > 0 && (
                    <div className="mt-3">
                      <div className="flex flex-wrap gap-2">
                        {facility.additionalInfo.map((info, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-800"
                          >
                            <CheckIcon className="h-3.5 w-3.5" />
                            {info}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
              </div>

              {/* Action Buttons - Appear on Hover */}
              <div className="absolute top-4 right-4 flex-shrink-0 flex gap-2 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={() => onEdit(facility)}
                  className="p-2 text-gray-500 rounded-full bg-white/60 backdrop-blur-sm shadow-sm hover:bg-indigo-100 hover:text-indigo-600 transition-colors"
                  title="Edit Facility"
                >
                  <PencilSquareIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => onDelete(facility)}
                  className="p-2 text-gray-500 rounded-full bg-white/60 backdrop-blur-sm shadow-sm hover:bg-red-100 hover:text-red-600 transition-colors"
                  title="Delete Facility"
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

export default FacilityList;
