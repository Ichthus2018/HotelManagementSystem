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

// Define your API base URL for the locks service
import { API_BASE_URL } from "../../../../services/api";

const AddRoomModal = ({
  isOpen,
  onClose,
  onSuccess,
  preselectedRoomTypeId,
}) => {
  // Form state
  const [roomNumber, setRoomNumber] = useState("");
  const [status, setStatus] = useState("available");
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [selectedLockId, setSelectedLockId] = useState("");

  // Data for dropdowns
  const [roomTypes, setRoomTypes] = useState([]);
  const [locations, setLocations] = useState([]);
  const [availableLocks, setAvailableLocks] = useState([]); // State for filtered locks

  // Control state
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Fetch related data for dropdowns when the modal opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError("");
      try {
        // Fetch locations, all locks from API, and assigned locks from Supabase concurrently
        const [locationsRes, locksRes, assignedLocksRes] = await Promise.all([
          supabase.from("locations").select("id, name"),
          axios.get(`${API_BASE_URL}/locks`),
          supabase.from("rooms").select("lock_id").not("lock_id", "is", null),
        ]);

        // Handle errors
        if (locationsRes.error) throw locationsRes.error;
        if (assignedLocksRes.error) throw assignedLocksRes.error;

        // Process data
        setLocations(locationsRes.data || []);

        // ** LOCK FILTERING LOGIC FOR ADD MODAL **
        // 1. Get all locks from the external API
        const allLocks = locksRes.data.list || [];
        // 2. Get all lock_ids that are already in use from Supabase
        const assignedLockIds = new Set(
          assignedLocksRes.data.map((room) => room.lock_id)
        );
        // 3. Filter the first list, removing any used locks
        const filteredLocks = allLocks.filter(
          (lock) => !assignedLockIds.has(lock.lockId)
        );
        setAvailableLocks(filteredLocks);

        // Handle pre-selected or all room types
        if (preselectedRoomTypeId) {
          setSelectedRoomTypeId(preselectedRoomTypeId);
          const { data: typeData, error: typeError } = await supabase
            .from("room_types")
            .select("title")
            .eq("id", preselectedRoomTypeId)
            .single();

          if (typeError) throw typeError;
          setRoomTypes([
            {
              id: preselectedRoomTypeId,
              title: typeData?.title || "Unknown Type",
            },
          ]);
        } else {
          const { data: typesData, error: typesError } = await supabase
            .from("room_types")
            .select("id, title");
          if (typesError) throw typesError;
          setRoomTypes(typesData || []);
        }
      } catch (err) {
        console.error("Failed to fetch modal data:", err);
        setError("Could not load necessary data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isOpen, preselectedRoomTypeId]);

  const resetForm = () => {
    setRoomNumber("");
    setStatus("available");
    setSelectedRoomTypeId("");
    setSelectedLocationId("");
    setSelectedLockId("");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!roomNumber.trim() || !selectedRoomTypeId) {
      setError("Room number and room type are required.");
      return;
    }
    setIsSubmitting(true);
    setError("");

    try {
      const { error: insertError } = await supabase.from("rooms").insert([
        {
          room_number: roomNumber,
          status: status,
          room_type_id: selectedRoomTypeId,
          location_id: selectedLocationId || null,
          lock_id: selectedLockId || null, // Add lock_id to the insert payload
        },
      ]);

      if (insertError) throw insertError;

      onSuccess();
      resetForm();
    } catch (err) {
      console.error("Error adding room:", err);
      if (err.message?.includes("duplicate key value")) {
        setError("A room with this number already exists.");
      } else {
        setError(err.message || "Failed to add room.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetForm();
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
                  Add New Room
                </DialogTitle>
                {isLoading ? (
                  <div className="mt-4 text-center">Loading form data...</div>
                ) : (
                  <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    {/* Room Number Input */}
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
                        className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        required
                      />
                    </div>
                    {/* Room Type Dropdown */}
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
                        disabled={!!preselectedRoomTypeId}
                        className={`mt-1 w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                          preselectedRoomTypeId &&
                          "bg-gray-100 text-gray-600 cursor-not-allowed"
                        }`}
                      >
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
                        Select a Lock (Optional)
                      </label>
                      <select
                        id="lock"
                        value={selectedLockId}
                        onChange={(e) => setSelectedLockId(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="">None</option>
                        {availableLocks.map((lock) => (
                          <option key={lock.lockId} value={lock.lockId}>
                            {lock.lockAlias} (ID: {lock.lockId})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Other fields... */}
                    <div>
                      <label
                        htmlFor="location"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Location (Optional)
                      </label>
                      <select
                        id="location"
                        value={selectedLocationId}
                        onChange={(e) => setSelectedLocationId(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="">None</option>
                        {locations.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name}
                          </option>
                        ))}
                      </select>
                    </div>
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
                        className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-orange-500 capitalize"
                      >
                        {roomStatusOptions.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt.replace("_", " ")}
                          </option>
                        ))}
                      </select>
                    </div>

                    {error && <p className="text-sm text-red-600">{error}</p>}

                    <div className="mt-6 flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex justify-center rounded-md border border-transparent bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:bg-orange-300"
                      >
                        {isSubmitting ? "Adding..." : "Add Room"}
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

export default AddRoomModal;
