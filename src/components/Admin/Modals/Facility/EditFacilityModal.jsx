// src/components/Admin/Modals/Facility/EditFacilityModal.jsx
import { useState, Fragment, useEffect, useRef } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import supabase from "../../../../services/supabaseClient";
import {
  FileImage,
  X,
  RefreshCcw,
  LoaderCircle,
  Plus,
  Minus,
} from "lucide-react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { IoMdCloseCircle } from "react-icons/io";
import TimeSelector from "../../../ui/common/TimeSelector";

const EditFacilityModal = ({ isOpen, onClose, onSuccess, facilityData }) => {
  const inputStyles =
    "mt-1 w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-orange-500";
  const labelStyles = "block text-sm font-medium text-gray-700";

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [check_in, setCheckIn] = useState("14:00");
  const [check_out, setCheckOut] = useState("11:00");
  const [capacity, setCapacity] = useState("");
  const [location, setLocation] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState([""]);

  // Image states
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const fileInputRef = useRef(null);

  // Submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && facilityData) {
      setName(facilityData.name || "");
      setDescription(facilityData.description || "");
      setCheckIn(facilityData.check_in || "14:00");
      setCheckOut(facilityData.check_out || "11:00");
      setCapacity(facilityData.capacity || "");
      setLocation(facilityData.location || "");
      // Ensure additionalInfo is an array, even if it's null or empty
      setAdditionalInfo(
        facilityData.additionalInfo && facilityData.additionalInfo.length > 0
          ? facilityData.additionalInfo
          : [""]
      );
      setImagePreview(facilityData.image || null);
      setImageFile(null);
      setError("");
    }
  }, [isOpen, facilityData]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setIsProcessingImage(true);
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setIsProcessingImage(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const addInfoField = () => {
    setAdditionalInfo([...additionalInfo, ""]);
  };

  const removeInfoField = (index) => {
    if (additionalInfo.length > 1) {
      setAdditionalInfo(additionalInfo.filter((_, i) => i !== index));
    }
  };

  const updateInfoField = (index, value) => {
    const updatedInfo = [...additionalInfo];
    updatedInfo[index] = value;
    setAdditionalInfo(updatedInfo);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Facility name is required.");
      return;
    }
    if (!facilityData?.id) {
      setError("Facility ID is missing. Cannot update.");
      return;
    }
    setIsSubmitting(true);
    setError("");

    try {
      let finalImageUrl = imagePreview;
      if (imageFile) {
        // Upload new image
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `facility_${facilityData.id}_${Date.now()}.${fileExt}`;
        const filePath = `public/facilities/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("facility-images")
          .upload(filePath, imageFile, { upsert: true });
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("facility-images")
          .getPublicUrl(filePath);
        finalImageUrl = urlData.publicUrl;
      } else if (imagePreview === null && facilityData.image !== null) {
        // Image was removed
        finalImageUrl = null;
      }

      // Filter out empty additional info
      const filteredAdditionalInfo = additionalInfo.filter(
        (info) => info.trim() !== ""
      );

      const updates = {
        name,
        description: description || null,
        image: finalImageUrl,
        check_in: check_in || null,
        check_out: check_out || null,
        capacity: capacity || null,
        location: location || null,
        additionalInfo:
          filteredAdditionalInfo.length > 0 ? filteredAdditionalInfo : null,
        updated_at: new Date().toISOString(),
      };

      const { data, error: updateError } = await supabase
        .from("facilities")
        .update(updates)
        .eq("id", facilityData.id)
        .select();
      if (updateError) throw updateError;

      onSuccess(data[0]);
      handleClose();
    } catch (err) {
      console.error("Error updating facility:", err);
      setError(err.message || "Failed to update facility.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60" />
        </TransitionChild>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 sm:p-8 text-left align-middle shadow-xl transition-all">
                <button
                  type="button"
                  onClick={handleClose}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 rounded-full"
                >
                  <span className="sr-only">Close</span>
                  <IoMdCloseCircle className="h-7 w-7" />
                </button>
                <DialogTitle
                  as="h3"
                  className="text-xl font-bold leading-6 text-gray-900"
                >
                  Edit Facility
                </DialogTitle>

                <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                  {/* Image Upload */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">
                      Facility Image
                    </h4>
                    <div className="flex flex-col items-center justify-center w-full">
                      {isProcessingImage && (
                        <div className="w-full h-40 flex flex-col items-center justify-center text-center bg-white p-4 border-2 border-dashed border-gray-300 rounded-lg">
                          <LoaderCircle className="h-10 w-10 text-purple-600 animate-spin" />
                          <p className="mt-3 text-sm font-semibold text-gray-700">
                            Processing your image...
                          </p>
                        </div>
                      )}
                      {!isProcessingImage && imagePreview && (
                        <div className="p-2 border border-dashed border-gray-300 rounded-lg inline-block bg-white">
                          <div className="relative w-full max-w-sm rounded-md overflow-hidden group shadow-md">
                            <img
                              src={imagePreview}
                              alt="Facility Preview"
                              className="w-full h-40 object-cover cursor-pointer"
                              onClick={() => setIsLightboxOpen(true)}
                            />
                            <button
                              type="button"
                              onClick={triggerFileUpload}
                              className="absolute top-2 left-2 bg-white/80 backdrop-blur-sm rounded-full p-2 text-gray-800 hover:bg-white hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white transition-all shadow-lg"
                            >
                              <RefreshCcw className="h-5 w-5" />
                            </button>
                            <button
                              type="button"
                              onClick={handleRemoveImage}
                              className="absolute top-2 right-2 bg-black/40 backdrop-blur-sm rounded-full p-1.5 text-white hover:bg-black/60 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white transition-all shadow-lg"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      )}
                      {!isProcessingImage && !imagePreview && (
                        <div
                          className="w-full h-40 flex flex-col items-center justify-center text-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 hover:border-blue-500 transition-colors"
                          onClick={triggerFileUpload}
                        >
                          <FileImage className="h-12 w-12 text-gray-400" />
                          <p className="mt-2 text-sm text-gray-600">
                            <span className="font-semibold text-blue-600">
                              Click to upload
                            </span>{" "}
                            or drag and drop
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Max. File Size: 15MB
                          </p>
                        </div>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="sr-only"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </div>
                  </div>

                  {isLightboxOpen && imagePreview && (
                    <Lightbox
                      open={isLightboxOpen}
                      close={() => setIsLightboxOpen(false)}
                      slides={[{ src: imagePreview }]}
                    />
                  )}

                  {/* Basic Information */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">
                      Basic Information
                    </h4>
                    {/* --- START OF COMPLETED SECTION --- */}
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="edit-name" className={labelStyles}>
                          Facility Name*
                        </label>
                        <input
                          type="text"
                          id="edit-name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className={inputStyles}
                          required
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="edit-description"
                          className={labelStyles}
                        >
                          Description
                        </label>
                        <textarea
                          id="edit-description"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className={inputStyles}
                          rows={3}
                          placeholder="Describe the facility and its features..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">
                      Facility Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <TimeSelector
                        label="Check-in Time"
                        name="check_in"
                        value={check_in}
                        onChange={(time) => setCheckIn(time)}
                      />
                      <TimeSelector
                        label="Check-out Time"
                        name="check_out"
                        value={check_out}
                        onChange={(time) => setCheckOut(time)}
                      />
                      <div>
                        <label htmlFor="edit-capacity" className={labelStyles}>
                          Capacity
                        </label>
                        <input
                          type="text"
                          id="edit-capacity"
                          value={capacity}
                          onChange={(e) => setCapacity(e.target.value)}
                          className={inputStyles}
                          placeholder="e.g., 50 people"
                        />
                      </div>
                      <div>
                        <label htmlFor="edit-location" className={labelStyles}>
                          Location
                        </label>
                        <input
                          type="text"
                          id="edit-location"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          className={inputStyles}
                          placeholder="e.g., Ground Floor"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">
                      Additional Features
                    </h4>
                    <div className="space-y-2">
                      {additionalInfo.map((info, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={info}
                            onChange={(e) =>
                              updateInfoField(index, e.target.value)
                            }
                            className="flex-1 rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="Enter a feature (e.g., Kids' pool included)"
                          />
                          <button
                            type="button"
                            onClick={() => removeInfoField(index)}
                            className="p-2 text-red-500 hover:bg-red-100 rounded-full transition-colors"
                            disabled={additionalInfo.length === 1}
                          >
                            <Minus className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addInfoField}
                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 mt-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add another feature
                      </button>
                    </div>
                  </div>

                  {error && <p className="text-sm text-red-600">{error}</p>}

                  <div className="mt-8 flex justify-end gap-x-4 border-t pt-6">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex justify-center rounded-md border border-transparent bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:bg-orange-300"
                    >
                      {isSubmitting ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                  {/* --- END OF COMPLETED SECTION --- */}
                </form>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default EditFacilityModal;
