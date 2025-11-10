import { useState, useEffect, Fragment } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import supabase from "../../../../services/supabaseClient";
import Loader from "../../../ui/common/Loader";
import { IoIosCloseCircleOutline } from "react-icons/io";

// The component name is already perfect!
const ManageRoomTypeItemsModal = ({ isOpen, onClose, roomType, onSuccess }) => {
  const [itemData, setItemData] = useState([]);
  const [selectedItemIds, setSelectedItemIds] = useState(new Set());
  const [initialSelectedIds, setInitialSelectedIds] = useState(new Set());

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && roomType) {
      const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
          // 1. Fetch all active items (this logic was already correct)
          const { data: allItems, error: itemsError } = await supabase
            .from("items")
            .select(`id, item_name`) // Select only what's needed
            .eq("status", true)
            .order("created_at", { ascending: true });

          if (itemsError) throw itemsError;

          // 2. Fetch the IDs of items already linked to this room type
          // --- CHANGED: Using the new 'room_type_items' table ---
          const { data: linkedItems, error: linkedError } = await supabase
            .from("room_type_items") // CHANGED: from 'room_type_amenities'
            .select("item_id") // CHANGED: from 'checklist_amenity_id'
            .eq("room_type_id", roomType.id);

          if (linkedError) throw linkedError;

          // --- CHANGED: Mapping the correct column ---
          const linkedIds = new Set(
            linkedItems.map((link) => link.item_id) // CHANGED: from 'checklist_amenity_id'
          );

          setItemData(allItems);
          setSelectedItemIds(linkedIds);
          setInitialSelectedIds(linkedIds);
        } catch (err) {
          console.error("Error fetching item data:", err);
          setError("Failed to load item data. Please try again.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }
  }, [isOpen, roomType]);

  const handleCheckboxChange = (itemId) => {
    setSelectedItemIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleSave = async () => {
    if (!roomType) return;
    setIsSaving(true);
    setError(null);

    // This comparison logic is still valid
    const itemsToAdd = [...selectedItemIds].filter(
      (id) => !initialSelectedIds.has(id)
    );
    const itemsToRemove = [...initialSelectedIds].filter(
      (id) => !selectedItemIds.has(id)
    );

    try {
      const promises = [];

      // --- CHANGED: Deleting from the new 'room_type_items' table ---
      if (itemsToRemove.length > 0) {
        promises.push(
          supabase
            .from("room_type_items") // CHANGED: from 'room_type_amenities'
            .delete()
            .eq("room_type_id", roomType.id)
            .in("item_id", itemsToRemove) // CHANGED: from 'checklist_amenity_id'
        );
      }

      // --- CHANGED: Inserting into the new 'room_type_items' table ---
      if (itemsToAdd.length > 0) {
        const newLinks = itemsToAdd.map((itemId) => ({
          room_type_id: roomType.id,
          item_id: itemId, // CHANGED: from 'checklist_amenity_id'
        }));
        promises.push(supabase.from("room_type_items").insert(newLinks)); // CHANGED
      }

      const results = await Promise.all(promises);

      for (const result of results) {
        if (result.error) throw result.error;
      }

      onSuccess(); // Close modal and refresh data on parent
    } catch (err) {
      console.error("Error saving items:", err);
      setError("Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const renderContent = () => {
    if (isLoading)
      return (
        <div className="flex justify-center items-center h-64">
          <Loader />
        </div>
      );
    if (error)
      return <div className="text-center text-red-500 p-4">{error}</div>;

    // --- CHANGED: Check for itemData ---
    if (!itemData || itemData.length === 0)
      return (
        <div className="text-center text-gray-500 p-4">
          No active items have been created yet.
        </div>
      );

    return (
      <div className="space-y-2">
        {/* --- CHANGED: Map over itemData --- */}
        {itemData.map((item) => (
          <label
            key={item.id}
            className="flex items-center space-x-3 cursor-pointer p-2 rounded-md hover:bg-gray-50"
          >
            <input
              type="checkbox"
              className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              checked={selectedItemIds.has(item.id)} // CHANGED
              onChange={() => handleCheckboxChange(item.id)}
            />
            <span className="text-gray-700">{item.item_name}</span>
          </label>
        ))}
      </div>
    );
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 bg-black/60" aria-hidden="true" />
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
              <DialogPanel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute top-4 right-4 text-3xl text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  <IoIosCloseCircleOutline />
                </button>
                <DialogTitle
                  as="h3"
                  className="text-xl font-bold leading-6 text-gray-900"
                >
                  {/* --- CHANGED: UI Text --- */}
                  Manage Items for{" "}
                  <span className="text-blue-600">{roomType?.title}</span>
                </DialogTitle>

                <div className="mt-4 max-h-[60vh] overflow-y-auto pr-2">
                  {renderContent()}
                </div>

                {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

                <div className="mt-6 flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving || isLoading}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-blue-300"
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ManageRoomTypeItemsModal;
