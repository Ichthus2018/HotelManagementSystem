// File: src/components/Admin/CardKey/AddCardKeyModal.jsx

import { useState, useEffect, Fragment } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import supabase from "../../../../services/supabaseClient"; // Adjust path

const AddCardKeyModal = ({ isOpen, onClose, onSuccess }) => {
  // Form state
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [type, setType] = useState("PASSCODE");
  const [value, setValue] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");

  // Data for dropdown
  const [bookings, setBookings] = useState([]);

  // Control state
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      const fetchBookings = async () => {
        setIsLoading(true);
        try {
          // Fetch bookings to populate the dropdown
          const { data, error } = await supabase
            .from("bookings")
            .select("id, check_in_date, guests(first_name, last_name)")
            .order("check_in_date", { ascending: true });

          if (error) throw error;
          setBookings(data);
        } catch (err) {
          console.error("Failed to fetch bookings:", err);
          setError("Could not load bookings. Please try again.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchBookings();
    }
  }, [isOpen]);

  const resetForm = () => {
    setSelectedBookingId("");
    setType("PASSCODE");
    setValue("");
    setValidFrom("");
    setValidUntil("");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBookingId || !type || !validFrom || !validUntil) {
      setError("Booking, type, and validity dates are required.");
      return;
    }
    setIsSubmitting(true);
    setError("");

    try {
      const { error: insertError } = await supabase.from("card_keys").insert([
        {
          booking_id: selectedBookingId,
          type,
          value: value || null,
          valid_from: new Date(validFrom).toISOString(),
          valid_until: new Date(validUntil).toISOString(),
        },
      ]);

      if (insertError) throw insertError;
      onSuccess();
      resetForm();
    } catch (err) {
      console.error("Error adding card key:", err);
      setError(err.message || "Failed to add key.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetForm();
    onClose();
  };

  const keyTypeOptions = ["PASSCODE", "IC_CARD", "EKEY"];

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        {/* ... Overlay is identical ... */}
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
                  Add New Card Key / Passcode
                </DialogTitle>
                {isLoading ? (
                  <div className="mt-4 text-center py-8">
                    Loading bookings...
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    <div>
                      <label
                        htmlFor="booking"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Booking*
                      </label>
                      <select
                        id="booking"
                        value={selectedBookingId}
                        onChange={(e) => setSelectedBookingId(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                        required
                      >
                        <option value="" disabled>
                          Select a booking
                        </option>
                        {bookings.map((b) => (
                          <option key={b.id} value={b.id}>
                            {`Booking for ${b.guests?.first_name || ""} ${
                              b.guests?.last_name || ""
                            } (Check-in: ${new Date(
                              b.check_in_date
                            ).toLocaleDateString()})`}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="type"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Type*
                        </label>
                        <select
                          id="type"
                          value={type}
                          onChange={(e) => setType(e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                          required
                        >
                          {keyTypeOptions.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label
                          htmlFor="value"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Value (Passcode/Card #)
                        </label>
                        <input
                          type="text"
                          id="value"
                          value={value}
                          onChange={(e) => setValue(e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="validFrom"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Valid From*
                        </label>
                        <input
                          type="datetime-local"
                          id="validFrom"
                          value={validFrom}
                          onChange={(e) => setValidFrom(e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="validUntil"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Valid Until*
                        </label>
                        <input
                          type="datetime-local"
                          id="validUntil"
                          value={validUntil}
                          onChange={(e) => setValidUntil(e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm"
                          required
                        />
                      </div>
                    </div>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <div className="mt-6 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex justify-center rounded-md border border-transparent bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700 disabled:bg-orange-300"
                      >
                        {isSubmitting ? "Adding..." : "Add Key"}
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

export default AddCardKeyModal;
