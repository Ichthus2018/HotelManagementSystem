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

const ManageRoomTypeAmenitiesModal = ({
  isOpen,
  onClose,
  roomType,
  onSuccess,
}) => {
  const [amenityData, setAmenityData] = useState([]);
  const [selectedAmenityIds, setSelectedAmenityIds] = useState(new Set());
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
          // 1. Fetch all ACTIVE amenities from the master list
          // --- THIS IS THE FIX ---
          const { data: allAmenities, error: amenitiesError } = await supabase
            .from("checklist_amenities")
            .select(`*`)
            .eq("status", true) // Only get amenities with status = true
            .order("amenity_name", { ascending: true });

          if (amenitiesError) throw amenitiesError;

          // 2. Fetch the IDs of amenities already linked to this specific room type
          const { data: linkedAmenities, error: linkedError } = await supabase
            .from("room_type_amenities")
            .select("checklist_amenity_id")
            .eq("room_type_id", roomType.id);

          if (linkedError) throw linkedError;

          const linkedIds = new Set(
            linkedAmenities.map((item) => item.checklist_amenity_id)
          );

          setAmenityData(allAmenities);
          setSelectedAmenityIds(linkedIds);
          setInitialSelectedIds(linkedIds);
        } catch (err) {
          console.error("Error fetching amenity data:", err);
          setError("Failed to load amenity data. Please try again.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }
  }, [isOpen, roomType]);

  const handleCheckboxChange = (amenityId) => {
    setSelectedAmenityIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(amenityId)) {
        newSet.delete(amenityId);
      } else {
        newSet.add(amenityId);
      }
      return newSet;
    });
  };

  const handleSave = async () => {
    if (!roomType) return;
    setIsSaving(true);
    setError(null);

    const itemsToAdd = [...selectedAmenityIds].filter(
      (id) => !initialSelectedIds.has(id)
    );
    const itemsToRemove = [...initialSelectedIds].filter(
      (id) => !selectedAmenityIds.has(id)
    );

    try {
      const promises = [];

      if (itemsToRemove.length > 0) {
        promises.push(
          supabase
            .from("room_type_amenities")
            .delete()
            .eq("room_type_id", roomType.id)
            .in("checklist_amenity_id", itemsToRemove)
        );
      }

      if (itemsToAdd.length > 0) {
        const newLinks = itemsToAdd.map((amenityId) => ({
          room_type_id: roomType.id,
          checklist_amenity_id: amenityId,
        }));
        promises.push(supabase.from("room_type_amenities").insert(newLinks));
      }

      const results = await Promise.all(promises);

      for (const result of results) {
        if (result.error) throw result.error;
      }

      onSuccess();
    } catch (err) {
      console.error("Error saving amenities:", err);
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
    if (!amenityData || amenityData.length === 0)
      return (
        <div className="text-center text-gray-500 p-4">
          No active amenities have been created yet.
        </div>
      );

    return (
      <div className="space-y-2">
        {amenityData.map((item) => (
          <label
            key={item.id}
            className="flex items-center space-x-3 cursor-pointer p-2 rounded-md hover:bg-gray-50"
          >
            <input
              type="checkbox"
              className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              checked={selectedAmenityIds.has(item.id)}
              onChange={() => handleCheckboxChange(item.id)}
            />
            <span className="text-gray-700">{item.amenity_name}</span>
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
                  Manage Amenities for{" "}
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

export default ManageRoomTypeAmenitiesModal;
