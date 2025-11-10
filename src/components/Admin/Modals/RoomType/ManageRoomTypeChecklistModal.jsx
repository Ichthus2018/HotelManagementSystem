// src/components/Admin/Modals/RoomType/ManageRoomTypeChecklistModal.js

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

const ManageRoomTypeChecklistModal = ({ isOpen, onClose, roomType }) => {
  const [checklistData, setChecklistData] = useState([]);
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
          // 1. Fetch all room areas with their checklist items
          const { data: areasWithItems, error: areasError } = await supabase
            .from("room_areas")
            .select(`*, checklist_items (*)`)
            .order("name", { ascending: true });

          if (areasError) throw areasError;

          // 2. Fetch the IDs of items already linked to this room type
          const { data: linkedItems, error: linkedItemsError } = await supabase
            .from("room_type_checklists")
            .select("checklist_item_id")
            .eq("room_type_id", roomType.id);

          if (linkedItemsError) throw linkedItemsError;

          const linkedIds = new Set(
            linkedItems.map((item) => item.checklist_item_id)
          );

          setChecklistData(areasWithItems);
          setSelectedItemIds(linkedIds);
          setInitialSelectedIds(linkedIds); // Store the initial state for comparison on save
        } catch (err) {
          console.error("Error fetching checklist data:", err);
          setError("Failed to load checklist data. Please try again.");
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
    setIsSaving(true);
    setError(null);

    const itemsToAdd = [...selectedItemIds].filter(
      (id) => !initialSelectedIds.has(id)
    );
    const itemsToRemove = [...initialSelectedIds].filter(
      (id) => !selectedItemIds.has(id)
    );

    try {
      // Remove unchecked items
      if (itemsToRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from("room_type_checklists")
          .delete()
          .eq("room_type_id", roomType.id)
          .in("checklist_item_id", itemsToRemove);
        if (deleteError) throw deleteError;
      }

      // Add newly checked items
      if (itemsToAdd.length > 0) {
        const newLinks = itemsToAdd.map((itemId) => ({
          room_type_id: roomType.id,
          checklist_item_id: itemId,
        }));
        const { error: insertError } = await supabase
          .from("room_type_checklists")
          .insert(newLinks);
        if (insertError) throw insertError;
      }

      onClose(); // Close modal on success
    } catch (err) {
      console.error("Error saving checklist:", err);
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
    if (checklistData.length === 0)
      return (
        <div className="text-center text-gray-500 p-4">
          No checklist items have been created yet.
        </div>
      );

    return checklistData.map((area) => (
      <div key={area.id} className="mb-6">
        <h4 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-3">
          {area.name}
        </h4>
        <div className="space-y-2">
          {area.checklist_items.map((item) => (
            <label
              key={item.id}
              className="flex items-center space-x-3 cursor-pointer p-2 rounded-md hover:bg-gray-50"
            >
              <input
                type="checkbox"
                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={selectedItemIds.has(item.id)}
                onChange={() => handleCheckboxChange(item.id)}
              />
              <span className="text-gray-700">{item.name}</span>
            </label>
          ))}
        </div>
      </div>
    ));
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Modal structure (Backdrop, Panel, Title, etc.) */}
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
                  Manage Checklist for{" "}
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

export default ManageRoomTypeChecklistModal;
