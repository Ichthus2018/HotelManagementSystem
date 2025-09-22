import { useState, Fragment, useCallback } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { v4 as uuidv4 } from "uuid"; // ADDED: Import UUID

import supabase from "../../../../services/supabaseClient";
import { IoIosCloseCircleOutline } from "react-icons/io";
import TagInputManager from "../../../ui/common/TagInputManager";

import "react-datepicker/dist/react-datepicker.css";
import TimeSelector from "../../../ui/common/TimeSelector";
import ImageUploader from "../../../ui/common/ImageUploader";

const initialFormState = {
  title: "",
  description: "",
  base_rate: "",
  weekend_rate: "",
  min_stay: 1,
  max_stay: 365,
  guests_base: 2,
  guests_maximum: 4,
  extra_guest_fee: "",
  check_in: "",
  check_out: "",
  amenities: [],
  house_rules: [],
};

const AddRoomTypeModal = ({ isOpen, onClose, onSuccess }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState(initialFormState);
  const [useWeekendRate, setUseWeekendRate] = useState(false);

  const [imageFiles, setImageFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // FIXED: Track upload progress to preserve it between page navigation
  const [uploadProgress, setUploadProgress] = useState({});

  // FIXED: Use useCallback to prevent unnecessary re-renders
  const nextPage = useCallback(() => setCurrentPage((prev) => prev + 1), []);
  const prevPage = useCallback(() => setCurrentPage((prev) => prev - 1), []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // FIXED: Use useCallback to prevent unnecessary re-renders
  const handleFilesChange = useCallback((files) => {
    setImageFiles(files);
  }, []);

  // FIXED: Add handler to update progress from ImageUploader
  const handleProgressUpdate = useCallback((progressData) => {
    setUploadProgress(progressData);
  }, []);

  // FIXED: Proper time change handler
  const handleTimeChange = useCallback((name, timeString) => {
    setFormData((prev) => ({ ...prev, [name]: timeString }));
  }, []);

  // --- Amenity Handlers ---
  const handleAddAmenity = (amenity) => {
    if (amenity && !formData.amenities.includes(amenity)) {
      setFormData((prev) => ({
        ...prev,
        amenities: [...prev.amenities, amenity],
      }));
    }
  };

  const handleRemoveAmenity = (amenityToRemove) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.filter(
        (amenity) => amenity !== amenityToRemove
      ),
    }));
  };

  // --- House Rule Handlers ---
  const handleAddRule = (rule) => {
    if (rule && !formData.house_rules.includes(rule)) {
      setFormData((prev) => ({
        ...prev,
        house_rules: [...prev.house_rules, rule],
      }));
    }
  };

  const handleRemoveRule = (ruleToRemove) => {
    setFormData((prev) => ({
      ...prev,
      house_rules: prev.house_rules.filter((rule) => rule !== ruleToRemove),
    }));
  };

  // FIXED: Proper image upload function with UUID
  const uploadImages = async () => {
    const uploadedUrls = [];
    for (const file of imageFiles) {
      const fileName = `${uuidv4()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from("room_type_images")
        .upload(fileName, file);

      if (error) {
        console.error("Error uploading image:", error);
        throw new Error("Image upload failed.");
      }

      const { data: publicUrlData } = supabase.storage
        .from("room_type_images")
        .getPublicUrl(data.path);

      uploadedUrls.push(publicUrlData.publicUrl);
    }
    return uploadedUrls;
  };

  const validatePage = () => {
    switch (currentPage) {
      case 1:
        return formData.title.trim() !== "";
      case 2:
        if (useWeekendRate) {
          return formData.base_rate !== "" && formData.weekend_rate !== "";
        } else {
          return formData.base_rate !== "";
        }
      case 3:
        return (
          formData.min_stay !== "" &&
          formData.max_stay !== "" &&
          formData.guests_base !== ""
        );
      case 5:
        return formData.check_in !== "" && formData.check_out !== "";
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validatePage()) {
      setCurrentPage((prev) => prev + 1);
      setError("");
    } else {
      setError("Please fill in all required fields to proceed.");
    }
  };

  const isFormValid = () => {
    const isPage1Valid = formData.title.trim() !== "";
    const isPage2Valid = useWeekendRate
      ? formData.base_rate !== "" && formData.weekend_rate !== ""
      : formData.base_rate !== "";
    const isPage3Valid =
      formData.min_stay !== "" &&
      formData.max_stay !== "" &&
      formData.guests_base !== "";
    const isPage5Valid = formData.check_in !== "" && formData.check_out !== "";

    return isPage1Valid && isPage2Valid && isPage3Valid && isPage5Valid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.base_rate) {
      setError("Title and Base Rate are required.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    let uploadedImageUrls = [];
    try {
      if (imageFiles.length > 0) {
        setIsUploading(true);
        uploadedImageUrls = await uploadImages();
        setIsUploading(false);
      }

      const roomTypeData = {
        ...formData,
        extra_guest_fee: formData.extra_guest_fee || null,
        guests_maximum: formData.guests_maximum || null,
        weekend_rate: useWeekendRate ? formData.weekend_rate || null : null,
        amenities: formData.amenities,
        house_rules: formData.house_rules,
        check_in: formData.check_in,
        check_out: formData.check_out,
        images: uploadedImageUrls,
      };

      const { error: insertError } = await supabase
        .from("room_types")
        .insert([roomTypeData]);

      if (insertError) throw insertError;

      onSuccess();
      setFormData(initialFormState);
      setImageFiles([]);
      setUploadProgress({});
      setCurrentPage(1);
      setUseWeekendRate(false);
      onClose();
    } catch (err) {
      console.error("Error adding room type:", err);
      setError(err.message || "Failed to add room type. Please try again.");
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-6 text-center fixed inset-0 bg-black/60 backdrop-blur-sm">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="relative w-full max-w-2xl transform overflow-hidden rounded-3xl bg-white p-8 text-left align-middle shadow-2xl transition-all">
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute top-6 right-6 text-3xl text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
                  aria-label="Close"
                >
                  <IoIosCloseCircleOutline />
                </button>

                <DialogTitle
                  as="h3"
                  className="text-xl font-semibold leading-6 text-gray-900"
                >
                  Add New Room Type
                </DialogTitle>

                <form onSubmit={handleSubmit}>
                  <div className="mt-6 space-y-6 max-h-[70vh] overflow-y-auto pr-4">
                    {/* --- Page 1: Details --- */}
                    {currentPage === 1 && (
                      <div className="space-y-6">
                        <div>
                          {/* FIXED: Pass current files and progress to prevent reset on navigation */}
                          <ImageUploader
                            onFilesChange={handleFilesChange}
                            onProgressUpdate={handleProgressUpdate}
                            initialFiles={imageFiles}
                            initialProgress={uploadProgress}
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="title"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Title*
                          </label>
                          <input
                            type="text"
                            name="title"
                            id="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            required
                            className="mt-1 border border-gray-300 p-2 rounded-lg text-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-blue-300 w-full"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="description"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Description
                          </label>
                          <textarea
                            name="description"
                            id="description"
                            rows="4"
                            value={formData.description}
                            onChange={handleInputChange}
                            className="mt-1 border border-gray-300 p-2 rounded-lg text-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-blue-300 w-full"
                          ></textarea>
                        </div>
                      </div>
                    )}

                    {/* --- Page 2: Pricing --- */}
                    {currentPage === 2 && (
                      <div className="space-y-4">
                        <div>
                          <label
                            htmlFor="base_rate"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Base Rate*
                          </label>
                          <input
                            type="number"
                            name="base_rate"
                            id="base_rate"
                            value={formData.base_rate}
                            onChange={handleInputChange}
                            required
                            step="0.01"
                            className="border border-gray-300 p-2 rounded-lg text-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-blue-300 w-full"
                          />
                        </div>
                        <div className="relative flex items-start">
                          <div className="flex h-6 items-center">
                            <input
                              id="useWeekendRate"
                              name="useWeekendRate"
                              type="checkbox"
                              checked={useWeekendRate}
                              onChange={(e) =>
                                setUseWeekendRate(e.target.checked)
                              }
                              className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-blue-600"
                            />
                          </div>
                          <div className="ml-3 text-sm leading-6">
                            <label
                              htmlFor="useWeekendRate"
                              className="font-medium text-gray-900"
                            >
                              Set a different price for weekends (Friday,
                              Saturday)
                            </label>
                          </div>
                        </div>
                        {useWeekendRate && (
                          <div>
                            <label
                              htmlFor="weekend_rate"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Weekend Rate
                            </label>
                            <input
                              type="number"
                              name="weekend_rate"
                              id="weekend_rate"
                              step="0.01"
                              value={formData.weekend_rate}
                              onChange={handleInputChange}
                              className="border border-gray-300 p-2 rounded-lg text-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-blue-300 w-full"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* --- Page 3: Availability & Guests --- */}
                    {currentPage === 3 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label
                            htmlFor="min_stay"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Min Stay*
                          </label>
                          <input
                            type="number"
                            name="min_stay"
                            id="min_stay"
                            value={formData.min_stay}
                            onChange={handleInputChange}
                            required
                            className="border border-gray-300 p-2 rounded-lg text-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-blue-300 w-full"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="max_stay"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Max Stay*
                          </label>
                          <input
                            type="number"
                            name="max_stay"
                            id="max_stay"
                            value={formData.max_stay}
                            onChange={handleInputChange}
                            required
                            className="border border-gray-300 p-2 rounded-lg text-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-blue-300 w-full"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="guests_base"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Base Guests*
                          </label>
                          <input
                            type="number"
                            name="guests_base"
                            id="guests_base"
                            value={formData.guests_base}
                            onChange={handleInputChange}
                            required
                            className="border border-gray-300 p-2 rounded-lg text-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-blue-300 w-full"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="guests_maximum"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Max Guests
                          </label>
                          <input
                            type="number"
                            name="guests_maximum"
                            id="guests_maximum"
                            value={formData.guests_maximum}
                            onChange={handleInputChange}
                            className="border border-gray-300 p-2 rounded-lg text-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-blue-300 w-full"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label
                            htmlFor="extra_guest_fee"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Extra Guest Fee
                          </label>
                          <input
                            type="number"
                            name="extra_guest_fee"
                            id="extra_guest_fee"
                            step="0.01"
                            value={formData.extra_guest_fee}
                            onChange={handleInputChange}
                            className="border border-gray-300 p-2 rounded-lg text-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-blue-300 w-full"
                          />
                        </div>
                      </div>
                    )}

                    {/* --- Page 4: Amenities --- */}
                    {currentPage === 4 && (
                      <TagInputManager
                        title="Amenities"
                        selectedItems={formData.amenities}
                        onAddItem={handleAddAmenity}
                        onRemoveItem={handleRemoveAmenity}
                        suggestedItems={[
                          "Wi-Fi",
                          "Air Conditioning",
                          "TV",
                          "Mini Bar",
                          "Hair Dryer",
                          "Room Service",
                          "Breakfast Included",
                          "Swimming Pool",
                          "Gym",
                          "Free Parking",
                        ]}
                        placeholder="Add a custom amenity"
                      />
                    )}

                    {/* --- Page 5: Rules --- */}
                    {currentPage === 5 && (
                      <div className="space-y-6 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* FIXED: Use proper time change handler */}
                          <TimeSelector
                            label="Check-in Time*"
                            name="check_in"
                            value={formData.check_in}
                            onChange={(time) =>
                              handleTimeChange("check_in", time)
                            }
                            required
                          />
                          <TimeSelector
                            label="Check-out Time*"
                            name="check_out"
                            value={formData.check_out}
                            onChange={(time) =>
                              handleTimeChange("check_out", time)
                            }
                            required
                          />
                        </div>
                        <TagInputManager
                          title="House Rules"
                          selectedItems={formData.house_rules}
                          onAddItem={handleAddRule}
                          onRemoveItem={handleRemoveRule}
                          suggestedItems={[
                            "No Smoking",
                            "No Pets",
                            "No Parties or Events",
                            "Quiet Hours after 10 PM",
                          ]}
                          placeholder="Add a custom rule"
                        />
                      </div>
                    )}
                  </div>

                  {error && (
                    <p className="mt-4 text-sm text-red-600 font-medium">
                      {error}
                    </p>
                  )}

                  {/* --- Navigation Buttons --- */}
                  <div className="flex justify-between items-center pt-6 mt-6 border-t border-gray-200">
                    <div>
                      <span className="text-sm font-medium text-gray-500">
                        Step {currentPage} of 5
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {currentPage > 1 && (
                        <button
                          type="button"
                          onClick={prevPage}
                          className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          Back
                        </button>
                      )}
                      {currentPage < 5 ? (
                        <button
                          type="button"
                          onClick={handleNext}
                          disabled={
                            !validatePage() || isSubmitting || isUploading
                          }
                          className=" disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          Next
                        </button>
                      ) : (
                        <button
                          type="submit"
                          disabled={
                            isSubmitting || !isFormValid() || isUploading
                          }
                          className=" inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? "Adding..." : "Add Room Type"}
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default AddRoomTypeModal;
