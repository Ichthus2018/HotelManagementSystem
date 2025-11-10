// src/components/Admin/Modals/RoomAmenities/AddAmenityFromListModal.jsx

import { useState, useEffect, Fragment, useMemo } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import supabase from "../../../../services/supabaseClient";
import { IoIosCloseCircleOutline } from "react-icons/io";
import Loader from "../../../ui/common/Loader";

const AddAmenityFromListModal = ({ isOpen, onClose, onSuccess, room }) => {
  const [allItems, setAllItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (isOpen) {
      const fetchAllItems = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("items")
          .select("id, item_name")
          .order("item_name");
        if (error) {
          console.error("Error fetching items:", error);
          setError("Could not load amenities list.");
        } else {
          setAllItems(data);
        }
        setIsLoading(false);
      };
      fetchAllItems();
    }
  }, [isOpen]);

  // Filter out items already in the room and items that don't match the search
  const availableItems = useMemo(() => {
    if (!room) return [];
    const existingAmenityIds = new Set(room.amenities.map((a) => a.id));
    return allItems
      .filter((item) => !existingAmenityIds.has(item.id))
      .filter((item) =>
        item.item_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [allItems, room, searchTerm]);

  const handleSelectAmenity = async (itemId) => {
    setIsSubmitting(true);
    setError("");
    try {
      const { error: insertError } = await supabase
        .from("checklist_amenities")
        .insert([{ room_area_id: room.id, item_id: itemId }]);

      if (insertError) throw insertError;
      onSuccess(); // This will trigger a refetch on the parent and close the modal
    } catch (err) {
      console.error("Error linking amenity:", err);
      setError(
        err.code === "23505" // Unique constraint violation code
          ? "This amenity is already in the room."
          : "Failed to add amenity."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSearchTerm("");
    setError("");
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
          <div className="flex min-h-full items-center justify-center p-4">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="relative w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <button
                  type="button"
                  onClick={handleClose}
                  className="absolute top-4 right-4 text-3xl text-gray-400 hover:text-gray-600"
                >
                  <IoIosCloseCircleOutline />
                </button>
                <DialogTitle
                  as="h3"
                  className="text-lg font-semibold leading-6 text-gray-900"
                >
                  Add Amenity to "{room?.name}"
                </DialogTitle>
                <div className="mt-4">
                  <input
                    type="text"
                    placeholder="Search amenities..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="mt-4 max-h-80 overflow-y-auto">
                  {isLoading ? (
                    <Loader />
                  ) : (
                    <ul className="space-y-1">
                      {availableItems.map((item) => (
                        <li key={item.id}>
                          <button
                            onClick={() => handleSelectAmenity(item.id)}
                            disabled={isSubmitting}
                            className="w-full text-left p-3 rounded-lg hover:bg-blue-50 disabled:opacity-50"
                          >
                            {item.item_name}
                          </button>
                        </li>
                      ))}
                      {availableItems.length === 0 && !isLoading && (
                        <p className="text-center text-gray-500 p-4">
                          No available amenities found.
                        </p>
                      )}
                    </ul>
                  )}
                </div>
                {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default AddAmenityFromListModal;
