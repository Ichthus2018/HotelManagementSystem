// File: src/components/Admin/DoorLock/AddDoorLockModal.jsx

import { useState, useEffect, Fragment } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import supabase from "../../../../services/supabaseClient"; // Adjust path as needed

const AddDoorLockModal = ({ isOpen, onClose, onSuccess }) => {
  // Form state
  const [name, setName] = useState("");
  const [ttlockLockId, setTtlockLockId] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [selectedGatewayId, setSelectedGatewayId] = useState("");

  // Data for dropdowns
  const [availableRooms, setAvailableRooms] = useState([]);
  const [gateways, setGateways] = useState([]);

  // Control state
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Fetch related data for dropdowns when the modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        setIsLoading(true);
        setError("");
        try {
          // Fetch rooms that are NOT already linked to a lock
          const { data: roomsData, error: roomsError } = await supabase
            .from("rooms")
            .select("id, room_number, door_locks!left(id)")
            .is("door_locks.id", null);

          if (roomsError) throw roomsError;
          setAvailableRooms(roomsData);

          // Fetch all gateways
          const { data: gatewaysData, error: gatewaysError } = await supabase
            .from("gateways")
            .select("id, name");

          if (gatewaysError) throw gatewaysError;
          setGateways(gatewaysData);
        } catch (err) {
          console.error("Failed to fetch data for modal:", err);
          setError("Could not load form data. Please try again.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }
  }, [isOpen]);

  const resetForm = () => {
    setName("");
    setTtlockLockId("");
    setSelectedRoomId("");
    setSelectedGatewayId("");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !ttlockLockId.trim() || !selectedRoomId) {
      setError("Lock name, TTLock ID, and Room are required.");
      return;
    }
    setIsSubmitting(true);
    setError("");

    try {
      const { error: insertError } = await supabase.from("door_locks").insert([
        {
          name,
          ttlock_lock_id: parseInt(ttlockLockId, 10),
          room_id: selectedRoomId,
          gateway_id: selectedGatewayId || null,
        },
      ]);

      if (insertError) throw insertError;

      onSuccess();
      resetForm();
    } catch (err) {
      console.error("Error adding door lock:", err);
      if (err.message?.includes("duplicate key value")) {
        setError(
          "A lock with this TTLock ID or assigned to this Room already exists."
        );
      } else {
        setError(err.message || "Failed to add door lock.");
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

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        {/* ... (Overlay is identical) ... */}
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
              <DialogPanel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <DialogTitle
                  as="h3"
                  className="text-lg font-semibold leading-6 text-gray-900"
                >
                  Add New Door Lock
                </DialogTitle>
                {isLoading ? (
                  <div className="mt-4 text-center py-8">
                    Loading available rooms...
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    <div>
                      <label
                        htmlFor="lockName"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Lock Name / Alias*
                      </label>
                      <input
                        type="text"
                        id="lockName"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="ttlockLockId"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Lock ID*
                      </label>
                      <input
                        type="number"
                        id="ttlockLockId"
                        value={ttlockLockId}
                        onChange={(e) => setTtlockLockId(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="room"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Assign to Room*
                      </label>
                      <select
                        id="room"
                        value={selectedRoomId}
                        onChange={(e) => setSelectedRoomId(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                        required
                      >
                        <option value="" disabled>
                          Select an available room
                        </option>
                        {availableRooms.length > 0 ? (
                          availableRooms.map((room) => (
                            <option key={room.id} value={room.id}>
                              Room {room.room_number}
                            </option>
                          ))
                        ) : (
                          <option disabled>No available rooms</option>
                        )}
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor="gateway"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Assign to Gateway
                      </label>
                      <select
                        id="gateway"
                        value={selectedGatewayId}
                        onChange={(e) => setSelectedGatewayId(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                      >
                        <option value="">None</option>
                        {gateways.map((gw) => (
                          <option key={gw.id} value={gw.id}>
                            {gw.name || `Gateway #${gw.ttlock_gateway_id}`}
                          </option>
                        ))}
                      </select>
                    </div>

                    {error && <p className="text-sm text-red-600">{error}</p>}

                    <div className="mt-6 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex justify-center rounded-md border border-transparent bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:bg-orange-300"
                      >
                        {isSubmitting ? "Adding..." : "Add Lock"}
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

export default AddDoorLockModal;
