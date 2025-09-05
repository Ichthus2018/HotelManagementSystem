import { useState, useEffect, Fragment } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { v4 as uuidv4 } from "uuid";
import supabase from "../../../../services/supabaseClient";
import { XCircleIcon } from "@heroicons/react/20/solid";

// This is a simplified version of the Add modal's form logic
// In a real app, you might abstract this into a shared component or hook.

const EditRoomTypeModal = ({ isOpen, onClose, onSuccess, roomType }) => {
  const [formData, setFormData] = useState({});
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (roomType) {
      setFormData({
        title: roomType.title || "",
        guests_base: roomType.guests_base || 0,
        extra_guest_fee: roomType.extra_guest_fee || "",
        guests_maximum: roomType.guests_maximum || "",
        base_rate: roomType.base_rate || "",
        weekend_rate: roomType.weekend_rate || "",
        min_stay: roomType.min_stay || 0,
        max_stay: roomType.max_stay || 0,
        check_in: roomType.check_in || "",
        check_out: roomType.check_out || "",
        description: roomType.description || "",
        amenities: (roomType.amenities || []).join(", "),
        house_rules: (roomType.house_rules || []).join(", "),
      });
      setExistingImages(roomType.images || []);
      // Reset states for new modal instance
      setNewImageFiles([]);
      setImagesToDelete([]);
      setError("");
    }
  }, [roomType]);

  // ... (handleInputChange and handleImageChange are same as Add Modal)

  const handleRemoveExistingImage = (imageUrl) => {
    setExistingImages((prev) => prev.filter((url) => url !== imageUrl));
    setImagesToDelete((prev) => [...prev, imageUrl]);
  };

  const uploadNewImages = async () => {
    // ... (Identical to uploadImages in Add Modal)
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      // 1. Delete marked images from storage
      if (imagesToDelete.length > 0) {
        const filePaths = imagesToDelete.map((url) => url.split("/").pop());
        const { error: deleteError } = await supabase.storage
          .from("room_type_images")
          .remove(filePaths);
        if (deleteError)
          console.error("Could not delete images:", deleteError.message);
      }

      // 2. Upload new images
      let newImageUrls = [];
      if (newImageFiles.length > 0) {
        // ... Call a function identical to `uploadImages` from the Add modal
      }

      // 3. Prepare data for update
      const finalImageUrls = [...existingImages, ...newImageUrls];
      const updatedData = {
        ...formData,
        // ... (convert number/json fields like in Add Modal)
        images: finalImageUrls,
      };

      // 4. Update the database record
      const { error: updateError } = await supabase
        .from("room_types")
        .update(updatedData)
        .eq("id", roomType.id);

      if (updateError) throw updateError;

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Error updating room type:", err);
      setError(err.message || "Failed to update room type.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* ... (Dialog backdrop) ... */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-6 text-center">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-2xl transform overflow-hidden rounded-3xl bg-white p-8 text-left align-middle shadow-2xl transition-all">
                <DialogTitle
                  as="h3"
                  className="text-xl font-semibold leading-6 text-gray-900"
                >
                  Edit Room Type
                </DialogTitle>
                <form
                  onSubmit={handleSubmit}
                  className="mt-6 space-y-4 max-h-[70vh] overflow-y-auto pr-4"
                >
                  {/* ... (All the form fields from the Add Modal, populated with formData) ... */}

                  {/* Existing Images */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Existing Images
                    </label>
                    <div className="grid grid-cols-3 gap-4 mt-2">
                      {existingImages.map((url) => (
                        <div key={url} className="relative">
                          <img
                            src={url}
                            alt="Existing room"
                            className="h-24 w-full object-cover rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveExistingImage(url)}
                            className="absolute top-1 right-1 bg-white rounded-full p-0.5"
                          >
                            <XCircleIcon className="h-5 w-5 text-red-600" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Add New Images */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Add New Images (Max 5MB)
                    </label>
                    {/* ... (input type=file like Add Modal) ... */}
                  </div>

                  {error && (
                    <p className="text-sm text-red-600 font-medium">{error}</p>
                  )}

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button type="button" onClick={onClose}>
                      Cancel
                    </button>
                    <button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Saving..." : "Save Changes"}
                    </button>
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

export default EditRoomTypeModal;
