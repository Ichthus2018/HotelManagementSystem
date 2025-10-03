import { Fragment, useCallback, useEffect } from "react";
import {
  Dialog,
  Transition,
  TransitionChild,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { X, Check, Loader2 } from "lucide-react";

import { AddBookingProvider, useBookingContext } from "./AddBookingContext";
import { useBookingSubmit } from "./useBookingSubmit";
import { steps } from "./constants";
import BookingStatusStep from "./components/BookingStatusStep";
import DatesDurationStep from "./components/DatesDurationStep";
import GuestInfoStep from "./components/GuestInfoStep";
import RoomRequestsStep from "./components/RoomRequestsStep";
import PaymentStep from "./components/PaymentStep";

// A helper function to calculate nights, as suggested in the reference.
const calculateNights = (checkIn, checkOut) => {
  if (checkIn && checkOut) {
    const startDate = new Date(checkIn);
    const endDate = new Date(checkOut);
    if (endDate > startDate) {
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
  }
  return 0;
};

// Inner component that uses the context
const AddBookingModalContent = ({ initialData }) => {
  const {
    bookingForm,
    currentStep,
    isSubmitting,
    submissionError,
    isOpen,
    onClose,
    onSuccess,
    setCurrentStep,
    setIsSubmitting,
    setSubmissionError,
    resetForm,
    priceBreakdown,
    setPriceBreakdown,
    setBookingForm,
  } = useBookingContext();

  const isEditMode = !!initialData;

  const { submitBooking } = useBookingSubmit(initialData);

  const generateBookingReference = useCallback(() => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `BK-${timestamp}${random}`;
  }, []);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      await submitBooking(bookingForm, priceBreakdown, onSuccess);
      // Remove the onSuccess() call here since it's now handled in the hook
    } catch (error) {
      setSubmissionError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleNextStep = () =>
    setCurrentStep(Math.min(currentStep + 1, steps.length));
  const handlePreviousStep = () => setCurrentStep(Math.max(currentStep - 1, 1));

  // --- START OF CORRECTED CODE ---
  // This useEffect is updated based on the reference to correctly handle state
  // for both "add" and "edit" modes, preventing state leakage between them.
  useEffect(() => {
    if (isOpen) {
      if (isEditMode && initialData) {
        // --- FIX: Robust state population for EDIT mode ---
        const selectedRoomsData =
          initialData.booking_rooms && initialData.booking_rooms.length > 0
            ? initialData.booking_rooms.map((br) => ({
                // The room object must contain all necessary fields for display
                // in the AvailableRoomSelector. This is critical.
                room: {
                  id: br.rooms.id,
                  room_number: br.rooms.room_number,
                  room_types: br.rooms.room_types, // Pass room_types for capacity checks
                },
                // Use allocated_guests from your data, with a fallback
                allocatedGuests: br.allocated_guests || 1,
              }))
            : // If no rooms are associated, provide a default empty selection UI
              [{ room: null, allocatedGuests: 1 }];

        // ... inside the useEffect
        setBookingForm({
          // Booking Details
          id: initialData.id,
          bookingReference: initialData.booking_reference || initialData.id,
          bookingStatus: initialData.status,
          bookingStatus: initialData.status,
          checkIn: initialData.check_in_date,
          checkOut: initialData.check_out_date,
          nights: calculateNights(
            initialData.check_in_date,
            initialData.check_out_date
          ),
          adults: initialData.num_adults,
          children: initialData.num_children,
          specialRequests: initialData.notes || "",
          discount_type: initialData.discount_type,
          discount: initialData.discount,

          // --- START OF FIX ---
          // Guest Information (fully populated from initialData.guests)
          guestMode: "existing",
          selectedGuest: initialData.guests,
          firstName: initialData.guests?.first_name || "",
          middleName: initialData.guests?.middle_name || "", // Add middle name
          lastName: initialData.guests?.last_name || "",
          contactNo: initialData.guests?.contact_no || "", // Add contact number
          email: initialData.guests?.email || "", // Add email

          // Address Information
          region: initialData.guests?.region || "",
          province: initialData.guests?.province || "",
          cityMunicipality: initialData.guests?.city_municipality || "", // Correct property name
          barangay: initialData.guests?.barangay || "",
          streetAddress: initialData.guests?.street_address || "",
          // --- END OF FIX ---

          // Room, Charge, and Payment Information
          selectedRooms: selectedRoomsData,
          charges:
            initialData.booking_charges?.map((bc) => ({
              charge_item_id: bc.charge_items.id,
              name: bc.charge_items.name, // Also add the name for consistency in the UI
              quantity: bc.quantity,
              unit_price: bc.unit_price_at_booking,
              charge_type: bc.charge_type_at_booking, // <-- THE CRUCIAL FIX
              // You can also add other relevant fields here if needed, like is_vatable
            })) || [],
          payments:
            initialData.payments?.map((p) => ({
              amount: p.amount,
              method: p.method,
            })) || [],
        });
      } else {
        // --- This is the ADD mode logic, which resets the form correctly ---
        resetForm(generateBookingReference());
      }
      // Reset step and submission status for both modes on open
      setCurrentStep(1);
      setIsSubmitting(false);
      setSubmissionError(null);
      setPriceBreakdown(null);
    }
  }, [
    isOpen,
    isEditMode,
    initialData,
    generateBookingReference,
    resetForm,
    setCurrentStep,
    setIsSubmitting,
    setSubmissionError,
    setPriceBreakdown,
    setBookingForm,
  ]);
  // --- END OF CORRECTED CODE ---

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return !!bookingForm.bookingStatus;
      case 2:
        return (
          !!bookingForm.checkIn &&
          !!bookingForm.checkOut &&
          new Date(bookingForm.checkOut) > new Date(bookingForm.checkIn)
        );
      case 3:
        if (isEditMode) return !!bookingForm.selectedGuest;
        return bookingForm.guestMode === "existing"
          ? !!bookingForm.selectedGuest
          : !!bookingForm.firstName && !!bookingForm.lastName;
      case 4:
        return (
          bookingForm.selectedRooms.length > 0 &&
          bookingForm.selectedRooms.every(
            (roomSelection) => !!roomSelection.room
          )
        );
      case 5:
        return true;
      default:
        return false;
    }
  };

  const isNextDisabled = !isStepValid();

  const renderStepContent = () => {
    const stepProps = { bookingForm, isEditMode, initialData };

    switch (currentStep) {
      case 1:
        return <BookingStatusStep {...stepProps} />;
      case 2:
        return <DatesDurationStep {...stepProps} />;
      case 3:
        return <GuestInfoStep {...stepProps} />;
      case 4:
        return <RoomRequestsStep {...stepProps} />;
      case 5:
        return <PaymentStep {...stepProps} priceBreakdown={priceBreakdown} />;
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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
              <DialogPanel className="w-full max-w-4xl transform rounded-2xl bg-white text-left align-middle shadow-xl transition-all flex flex-col max-h-[90vh]">
                <div className="flex-shrink-0 flex justify-between items-start p-6 border-b border-slate-200">
                  <div>
                    <DialogTitle
                      as="h2"
                      className="text-xl font-bold text-slate-800"
                    >
                      {isEditMode ? "Edit Booking" : "Create New Booking"}
                    </DialogTitle>
                    <p className="text-xs text-slate-500 font-mono mt-1.5 bg-slate-100 px-2 py-1 rounded">
                      Ref: {bookingForm.bookingReference}
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 -m-2 text-slate-400 hover:bg-slate-100 rounded-full"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex-shrink-0 p-6 border-b border-slate-200">
                  <nav aria-label="Progress">
                    <ol role="list" className="flex items-center">
                      {steps.map((step, index) => {
                        const stepIndex = index + 1;
                        const isCompleted = currentStep > stepIndex;
                        const isCurrent = currentStep === stepIndex;
                        return (
                          <li
                            key={step.name}
                            className="relative flex-1 last:flex-none flex items-center"
                          >
                            <div
                              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                                isCompleted
                                  ? "bg-blue-600 text-white"
                                  : isCurrent
                                  ? "bg-blue-600 text-white ring-4 ring-blue-100"
                                  : "bg-slate-100 text-slate-500 border"
                              }`}
                            >
                              {isCompleted ? (
                                <Check className="h-5 w-5" />
                              ) : (
                                stepIndex
                              )}
                            </div>
                            <span
                              className={`hidden md:inline-block text-sm font-medium ml-3 ${
                                isCurrent ? "text-blue-600" : "text-slate-500"
                              }`}
                            >
                              {step.name}
                            </span>
                            {stepIndex < steps.length && (
                              <div
                                className={`flex-1 h-0.5 mx-4 ${
                                  isCompleted ? "bg-blue-600" : "bg-slate-200"
                                }`}
                              />
                            )}
                          </li>
                        );
                      })}
                    </ol>
                  </nav>
                </div>

                <div className="flex-grow p-6 lg:p-8 overflow-y-auto">
                  {renderStepContent()}
                </div>

                {submissionError && (
                  <div className="p-4 bg-red-50 text-red-700 text-sm rounded-b-lg">
                    <strong>Error:</strong> {submissionError}
                  </div>
                )}

                <div className="flex-shrink-0 flex flex-col-reverse sm:flex-row justify-end items-center gap-4 p-5 border-t border-slate-200 bg-slate-50/75 rounded-b-2xl">
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    {currentStep > 1 && (
                      <button
                        type="button"
                        onClick={handlePreviousStep}
                        disabled={isSubmitting}
                        className="w-full px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                      >
                        Previous
                      </button>
                    )}
                    {currentStep < steps.length ? (
                      <button
                        type="button"
                        onClick={handleNextStep}
                        disabled={isNextDisabled || isSubmitting}
                        className="w-full px-5 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm disabled:bg-blue-300 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="w-full px-5 py-2.5 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm flex items-center justify-center gap-2 disabled:bg-emerald-300"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="animate-spin h-4 w-4" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4" />
                            {isEditMode ? "Save Changes" : "Create Booking"}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

// Outer provider wrapper
const AddBookingModal = ({ isOpen, onClose, onSuccess, initialData }) => {
  return (
    <AddBookingProvider isOpen={isOpen} onClose={onClose} onSuccess={onSuccess}>
      <AddBookingModalContent initialData={initialData} />
    </AddBookingProvider>
  );
};

export default AddBookingModal;
