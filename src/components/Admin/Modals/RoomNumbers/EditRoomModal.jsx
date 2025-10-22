import { useState, useEffect, Fragment } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { IoIosCloseCircleOutline } from "react-icons/io";
import supabase from "../../../../services/supabaseClient";
import axios from "axios";

// 👇 THIS IS THE FIX
// 1. REMOVE the hardcoded constant below
// const API_BASE_URL = "http://localhost:5000/api";

// 2. ADD this import to use the same URL as the AddRoomModal
import { API_BASE_URL } from "../../../../services/api";

const EditRoomModal = ({ isOpen, onClose, onSuccess, roomToEdit }) => {
  // Form state
  const [roomNumber, setRoomNumber] = useState("");
  const [status, setStatus] = useState("available");
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [selectedLockId, setSelectedLockId] = useState("");

  // Data for dropdowns
  const [roomTypes, setRoomTypes] = useState([]);
  const [locations, setLocations] = useState([]);
  const [availableLocks, setAvailableLocks] = useState([]);

  // Control state
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Effect to pre-populate the form
  useEffect(() => {
    if (roomToEdit) {
      setRoomNumber(roomToEdit.room_number || "");
      setStatus(roomToEdit.status || "available");
      setSelectedRoomTypeId(roomToEdit.room_types?.id || "");
      setSelectedLocationId(roomToEdit.locations?.id || "");
      setSelectedLockId(roomToEdit.lock_id || "");
      setError("");
    }
  }, [roomToEdit]);

  // Fetch related data and filter locks when the modal opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError("");
      try {
        // 1. Fetch all necessary data concurrently
        const [roomTypesRes, locationsRes, allLocksRes, assignedLocksRes] =
          await Promise.all([
            supabase.from("room_types").select("id, title"),
            supabase.from("locations").select("id, name"),
            // This call will now use the correct, imported API_BASE_URL
            axios.get(`${API_BASE_URL}/locks`),
            supabase.from("rooms").select("lock_id").not("lock_id", "is", null),
          ]);

        if (roomTypesRes.error) throw roomTypesRes.error;
        if (locationsRes.error) throw locationsRes.error;
        if (assignedLocksRes.error) throw assignedLocksRes.error;

        setRoomTypes(roomTypesRes.data || []);
        setLocations(locationsRes.data || []);

        // --- LOCK FILTERING LOGIC ---
        const allLocks = allLocksRes.data.list || [];
        const assignedLockIds = new Set(
          assignedLocksRes.data.map((room) => room.lock_id)
        );
        const currentRoomLockId = roomToEdit?.lock_id;

        const filteredLocks = allLocks.filter(
          (lock) =>
            !assignedLockIds.has(lock.lockId) ||
            lock.lockId === currentRoomLockId
        );

        setAvailableLocks(filteredLocks);
      } catch (err) {
        console.error("Failed to fetch modal data:", err);
        setError("Could not load necessary data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isOpen, roomToEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!roomNumber.trim() || !selectedRoomTypeId || !roomToEdit) {
      setError("Room number and room type are required.");
      return;
    }
    setIsSubmitting(true);
    setError("");

    try {
      const { error: updateError } = await supabase
        .from("rooms")
        .update({
          room_number: roomNumber,
          status: status,
          room_type_id: selectedRoomTypeId,
          location_id: selectedLocationId || null,
          lock_id: selectedLockId || null,
        })
        .eq("id", roomToEdit.id);

      if (updateError) throw updateError;
      onSuccess();
    } catch (err) {
      console.error("Error updating room:", err);
      if (err.message?.includes("duplicate key value")) {
        setError("A room with this number already exists.");
      } else {
        setError(err.message || "Failed to update room.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const roomStatusOptions = [
    "available",
    "occupied",
    "cleaning",
    "out_of_order",
    "maintenance",
    "dirty",
  ];

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
                  className="absolute top-4 right-4 text-3xl text-gray-400 hover:text-gray-600 focus:outline-none"
                  aria-label="Close"
                >
                  <IoIosCloseCircleOutline />
                </button>
                <DialogTitle
                  as="h3"
                  className="text-lg font-semibold leading-6 text-gray-900"
                >
                  Edit Room "{roomToEdit?.room_number}"
                </DialogTitle>
                {isLoading ? (
                  <div className="mt-4 text-center">Loading form data...</div>
                ) : error ? ( // Added this to explicitly show the error message
                  <div className="mt-4 p-4 text-center text-red-600 bg-red-100 rounded-lg">
                    {error}
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    {/* Room Number */}
                    <div>
                      <label
                        htmlFor="roomNumber"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Room Number*
                      </label>
                      <input
                        type="text"
                        id="roomNumber"
                        value={roomNumber}
                        onChange={(e) => setRoomNumber(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    {/* Room Type */}
                    <div>
                      <label
                        htmlFor="roomType"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Room Type*
                      </label>
                      <select
                        id="roomType"
                        value={selectedRoomTypeId}
                        onChange={(e) => setSelectedRoomTypeId(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="" disabled>
                          Select a room type
                        </option>
                        {roomTypes.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.title}
                          </option>
                        ))}
                      </select>
                    </div>
                    {/* Lock Dropdown */}
                    <div>
                      <label
                        htmlFor="lock"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Select a Lock
                      </label>
                      <select
                        id="lock"
                        value={selectedLockId}
                        onChange={(e) => setSelectedLockId(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">None</option>
                        {availableLocks.map((lock) => (
                          <option key={lock.lockId} value={lock.lockId}>
                            {lock.lockAlias} (ID: {lock.lockId})
                          </option>
                        ))}
                      </select>
                    </div>
                    {/* Location */}
                    <div>
                      <label
                        htmlFor="location"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Location
                      </label>
                      <select
                        id="location"
                        value={selectedLocationId}
                        onChange={(e) => setSelectedLocationId(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">None</option>
                        {locations.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    {/* Status */}
                    <div>
                      <label
                        htmlFor="status"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Status
                      </label>
                      <select
                        id="status"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 capitalize"
                      >
                        {roomStatusOptions.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt.replace("_", " ")}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="mt-6 flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300"
                      >
                        {isSubmitting ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </form>
                )}
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default EditRoomModal;
