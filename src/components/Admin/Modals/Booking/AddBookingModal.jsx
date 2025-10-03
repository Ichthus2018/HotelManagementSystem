import { Fragment, useState, useEffect, useMemo, useCallback } from "react";
import {
  Dialog,
  Transition,
  Combobox,
  ComboboxOptions,
  ComboboxOption,
  ComboboxInput,
  ComboboxButton,
  DialogPanel,
  DialogTitle,
  TransitionChild,
} from "@headlessui/react";
import {
  X,
  Check,
  CheckCircle,
  Clock,
  UserCheck,
  UserX,
  XCircle,
  Calendar,
  Moon,
  User,
  Phone,
  Mail,
  Camera,
  FileImage,
  Home,
  Info,
  AlertTriangle,
  Users,
  PlusCircle,
  CreditCard,
  ChevronUp,
  Search,
  UserPlus,
  Loader2,
  MinusCircle,
  XCircle as XCircleIcon,
  DoorOpen,
  AlertCircle,
  ChevronsUpDown,
  Receipt,
  BedDouble,
  ListPlus,
  Tag,
  Wallet,
  TrendingUp,
  ChevronDown,
} from "lucide-react";
import supabase from "../../../../services/supabaseClient";
import { AvailableRoomSelector } from "./AvailableRoomSelector";
import {
  regions,
  provinces,
  cities,
  barangays,
} from "select-philippines-address";
import { useDebouncedSupabaseSearch } from "../../../../hooks/Admin/useDebouncedSupabaseSearch";
import Card from "../../../ui/common/Card";
import ReceiptLine from "../../../ui/common/ReceiptLine";

const statusOptions = [
  { value: "pending", label: "Pending", icon: Clock, color: "yellow" },
  { value: "reserved", label: "Reserved", icon: CheckCircle, color: "green" },
  { value: "checked_in", label: "Checked-In", icon: UserCheck, color: "blue" },
  {
    value: "checked_out",
    label: "Checked-Out",
    icon: DoorOpen,
    color: "purple",
  },
  { value: "cancelled", label: "Cancelled", icon: XCircle, color: "red" },
  { value: "no_show", label: "No Show", icon: AlertCircle, color: "orange" }, // added
];

const initialFormState = {
  // Guest Info
  guestMode: "new", // 'new' or 'existing'
  selectedGuest: null,
  firstName: "",
  middleName: "",
  lastName: "",
  contactNo: "",
  email: "",
  idPhoto: null,
  idPhotoUrl: "",
  // ---- ADD THESE NEW FIELDS ----
  streetAddress: "",
  region: "",
  province: "",
  cityMunicipality: "",
  barangay: "",
  // Dates & Guests
  checkIn: "",
  checkOut: "",
  nights: 1,
  adults: 1,
  children: 0,
  // Rooms
  selectedRooms: [],
  hasCapacityViolations: false,
  // Status
  bookingReference: "",
  bookingStatus: "pending",
  paymentStatus: "unpaid",
  specialRequests: "",
  // Financials
  subtotal: 0,
  discount: 0,
  discount_type: "before_tax", // This ensures discount logic is consistent
  paymentMethod: "cash",
  payments: [],
  charges: [],
};

// --- THE MODAL COMPONENT ---
export default function AddBookingModal({ isOpen, onClose, onSuccess }) {
  const [bookingForm, setBookingForm] = useState(initialFormState);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState(null);
  // ============================ FIX START ============================
  // 1. LIFT STATE UP: The price breakdown state now lives in the parent component.
  const [priceBreakdown, setPriceBreakdown] = useState(null);
  // ============================= FIX END =============================

  const steps = [
    { name: "Status" },
    { name: "Dates" },
    { name: "Guest" },
    { name: "Room" },
    { name: "Payment" },
  ];

  const generateBookingReference = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `BK-${timestamp}${random}`;
  };

  const handleFormChange = useCallback((field, value) => {
    setBookingForm((prev) => {
      const updated = { ...prev, [field]: value };

      if (field === "checkIn" || field === "checkOut") {
        const checkIn = field === "checkIn" ? value : updated.checkIn;
        const checkOut = field === "checkOut" ? value : updated.checkOut;
        if (checkIn && checkOut) {
          const startDate = new Date(checkIn);
          const endDate = new Date(checkOut);
          if (endDate > startDate) {
            const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
            updated.nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          } else {
            updated.nights = 0;
          }
        }
      }
      if (field === "selectedGuest") {
        if (value) {
          // --- MODIFIED BLOCK ---
          updated.firstName = value.first_name || "";
          updated.middleName = value.middle_name || ""; // Added
          updated.lastName = value.last_name || "";
          updated.email = value.email || "";
          updated.contactNo = value.contact_no || "";

          // Populate address fields from the selected existing guest
          updated.streetAddress = value.street_address || "";
          updated.region = value.region || "";
          updated.province = value.province || "";
          updated.cityMunicipality = value.city_municipality || "";
          updated.barangay = value.barangay || "";
        } else {
          // Clear all fields when deselecting a guest
          updated.firstName = "";
          updated.middleName = ""; // Added
          updated.lastName = "";
          updated.email = "";
          updated.contactNo = "";
          updated.streetAddress = "";
          updated.region = "";
          updated.province = "";
          updated.cityMunicipality = "";
          updated.barangay = "";
        }
      }

      if (field === "guestMode" && value === "new") {
        updated.selectedGuest = null;
        updated.firstName = "";
        updated.middleName = ""; // --- ADD THIS ---
        updated.lastName = "";
        updated.email = "";
        updated.contactNo = "";
      }
      return updated;
    });
  }, []);

  const handleRoomAllocationChange = useCallback((roomIndex, field, value) => {
    setBookingForm((prev) => {
      const updatedRooms = [...prev.selectedRooms];
      updatedRooms[roomIndex] = { ...updatedRooms[roomIndex], [field]: value };
      return { ...prev, selectedRooms: updatedRooms };
    });
  }, []);

  const handleAddRoom = useCallback(() => {
    setBookingForm((prev) => ({
      ...prev,
      selectedRooms: [
        ...prev.selectedRooms,
        { room: null, allocatedGuests: 1 },
      ],
    }));
  }, []);

  const handleRemoveRoom = useCallback((index) => {
    setBookingForm((prev) => {
      const updatedRooms = prev.selectedRooms.filter((_, i) => i !== index);
      return { ...prev, selectedRooms: updatedRooms };
    });
  }, []);

  useEffect(() => {
    if (isOpen) {
      setBookingForm({
        ...initialFormState,
        bookingReference: generateBookingReference(),
        selectedRooms: [{ room: null, allocatedGuests: 1 }],
      });
      setCurrentStep(1);
      setIsSubmitting(false);
      setSubmissionError(null);
      // ============================ FIX START ============================
      // 2. Reset the state when the modal is opened to clear old data.
      setPriceBreakdown(null);
      // ============================= FIX END =============================
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmissionError(null);

    let finalProfileImageUrl = "";
    let guestDataForPayload = null;
    let guestIdForBooking =
      bookingForm.guestMode === "existing"
        ? bookingForm.selectedGuest?.id
        : null;

    // 1. Handle photo upload and new guest data preparation
    if (bookingForm.guestMode === "new") {
      // Handle photo upload if a file is selected
      if (bookingForm.idPhoto) {
        const file = bookingForm.idPhoto;
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}_${Math.random()
          .toString(36)
          .substring(2)}.${fileExt}`;
        const filePath = `public/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("guest-photos")
          .upload(filePath, file);

        if (uploadError) {
          setSubmissionError(
            `Failed to upload ID photo: ${uploadError.message}`
          );
          setIsSubmitting(false);
          return;
        }

        const { data: urlData } = supabase.storage
          .from("guest-photos")
          .getPublicUrl(filePath);
        finalProfileImageUrl = urlData.publicUrl;
      }

      guestDataForPayload = {
        first_name: bookingForm.firstName,
        middle_name: bookingForm.middleName || null,
        last_name: bookingForm.lastName,
        contact_no: bookingForm.contactNo || null,
        email: bookingForm.email || null,
        profile_image_url: finalProfileImageUrl || null,
        street_address: bookingForm.streetAddress || null,
        region: bookingForm.region || null,
        province: bookingForm.province || null,
        city_municipality: bookingForm.cityMunicipality || null,
        barangay: bookingForm.barangay || null,
      };
    }

    // 2. Perform final financial calculations (using the shared priceBreakdown state)
    const roomAndGuestTotal =
      (priceBreakdown?.room_subtotal || 0) +
      (priceBreakdown?.extra_guest_total || 0);

    let vatableChargesSubtotal = 0;
    let nonVatableChargesSubtotal = 0;
    bookingForm.charges.forEach((charge) => {
      let totalChargeAmount = 0;
      if (charge.charge_type === "percentage") {
        totalChargeAmount = roomAndGuestTotal * (charge.unit_price / 100);
      } else {
        totalChargeAmount = charge.unit_price * charge.quantity;
      }
      if (charge.is_vatable) {
        vatableChargesSubtotal += totalChargeAmount;
      } else {
        nonVatableChargesSubtotal += totalChargeAmount;
      }
    });

    const discount = Number(bookingForm.discount) || 0;
    const chargesSubtotal = vatableChargesSubtotal + nonVatableChargesSubtotal;
    const totalVatableAmount = roomAndGuestTotal + vatableChargesSubtotal;
    let vatBase, vatAmount, grandTotal;

    if (bookingForm.discount_type === "before_tax") {
      vatBase = Math.max(0, totalVatableAmount - discount);
      vatAmount = vatBase * 0.12; // Assuming 12% VAT
      grandTotal = vatBase + vatAmount + nonVatableChargesSubtotal;
    } else {
      // after_tax
      vatBase = totalVatableAmount;
      vatAmount = vatBase * 0.12;
      const subtotalBeforeDiscount =
        vatBase + vatAmount + nonVatableChargesSubtotal;
      grandTotal = Math.max(0, subtotalBeforeDiscount - discount);
    }

    const bookingDataForPayload = {
      guest_id: guestIdForBooking,
      check_in_date: bookingForm.checkIn,
      check_out_date: bookingForm.checkOut,
      num_adults: bookingForm.adults,
      num_children: bookingForm.children,
      status: bookingForm.bookingStatus,
      notes: bookingForm.specialRequests || null,
      room_subtotal: roomAndGuestTotal,
      charges_subtotal: chargesSubtotal,
      discount: discount,
      discount_type: bookingForm.discount_type,
      vat_amount: vatAmount,
      grand_total: grandTotal,
    };

    // 4. Prepare relational data
    const roomsDataForPayload = bookingForm.selectedRooms
      .filter((r) => r.room?.id)
      .map((selectedRoom) => {
        const roomNightlyData = priceBreakdown?.nightly_breakdown?.find(
          (night) => night.room_number === selectedRoom.room.room_number
        );
        const priceAtBooking = roomNightlyData?.room_rate || 0;

        return {
          id: selectedRoom.room.id,
          price_at_booking: priceAtBooking,
          num_nights: bookingForm.nights,
          allocated_guests: selectedRoom.allocatedGuests,
        };
      });

    const chargesDataForPayload = bookingForm.charges;
    const paymentsDataForPayload = bookingForm.payments;

    // 5. Assemble the final payload
    const finalPayload = {
      p_booking_data: bookingDataForPayload,
      p_guest_data: guestDataForPayload,
      p_rooms_data: roomsDataForPayload,
      p_charges_data: chargesDataForPayload,
      p_payments_data: paymentsDataForPayload,
    };

    // 6. Call the Supabase RPC function
    const { data, error: rpcError } = await supabase.rpc(
      "create_full_booking",
      finalPayload
    );

    if (rpcError) {
      console.error("RPC Error creating full booking:", rpcError);
      setSubmissionError(
        rpcError.message || "An unknown error occurred during booking creation."
      );
      setIsSubmitting(false);
    } else {
      console.log("Booking created successfully:", data);
      onSuccess();
    }
  };

  const handleNextStep = () =>
    setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  const handlePreviousStep = () =>
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  const isStepValid = () => {
    return true;
  };
  const isNextDisabled = !isStepValid();

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <BookingStatusStep
            bookingForm={bookingForm}
            handleFormChange={handleFormChange}
          />
        );
      case 2:
        return (
          <DatesDurationStep
            bookingForm={bookingForm}
            handleFormChange={handleFormChange}
          />
        );
      case 3:
        return (
          <GuestInfoStep
            bookingForm={bookingForm}
            handleFormChange={handleFormChange}
          />
        );
      case 4:
        return (
          <RoomRequestsStep
            bookingForm={bookingForm}
            handleFormChange={handleFormChange}
            handleAddRoom={handleAddRoom}
            handleRemoveRoom={handleRemoveRoom}
          />
        );
      case 5:
        return (
          // ============================ FIX START ============================
          // 3. Pass both the state and the setter function to the child component.
          <PaymentStep
            bookingForm={bookingForm}
            handleFormChange={handleFormChange}
            priceBreakdown={priceBreakdown}
            setPriceBreakdown={setPriceBreakdown}
          />
          // ============================= FIX END =============================
        );
      default:
        return null;
    }
  };

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
                      Create New Booking
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
                        className="w-full px-5 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm disabled:bg-blue-300"
                      >
                        Next
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isNextDisabled || isSubmitting}
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
                            Create Booking
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
}

// --- STEP COMPONENTS ---

const BookingStatusStep = ({ bookingForm, handleFormChange }) => {
  // Split statusOptions into chunks of 3
  const chunkedStatus = [];
  for (let i = 0; i < statusOptions.length; i += 3) {
    chunkedStatus.push(statusOptions.slice(i, i + 3));
  }

  const colorClasses = {
    yellow: "border-yellow-500 bg-yellow-50 text-yellow-700",
    green: "border-green-500 bg-green-50 text-green-700",
    blue: "border-blue-500 bg-blue-50 text-blue-700",
    purple: "border-purple-500 bg-purple-50 text-purple-700",
    red: "border-red-500 bg-red-50 text-red-700",
    orange: "border-orange-500 bg-orange-50 text-orange-700",
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800">
        Step 1: Booking Status
      </h3>

      {chunkedStatus.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className={`grid gap-4 ${
            row.length === 3 ? "grid-cols-3" : "grid-cols-2"
          }`}
        >
          {row.map((status) => {
            const IconComponent = status.icon;
            const isSelected = bookingForm.bookingStatus === status.value;

            return (
              <label
                key={status.value}
                className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  isSelected
                    ? colorClasses[status.color]
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  value={status.value}
                  checked={isSelected}
                  onChange={(e) =>
                    handleFormChange("bookingStatus", e.target.value)
                  }
                  className="sr-only"
                />
                <IconComponent
                  className={`h-6 w-6 mr-3 ${
                    isSelected ? "" : "text-gray-400"
                  }`}
                />
                <span className="text-sm font-medium">{status.label}</span>
              </label>
            );
          })}
        </div>
      ))}
    </div>
  );
};

const DatesDurationStep = ({ bookingForm, handleFormChange }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800 flex items-center">
        <Calendar className="h-5 w-5 mr-2 text-gray-600" />
        Step 2: Dates & Duration
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Check-In Date *
          </label>
          <input
            type="date"
            value={bookingForm.checkIn}
            onChange={(e) => handleFormChange("checkIn", e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Check-Out Date *
          </label>
          <input
            type="date"
            min={bookingForm.checkIn}
            value={bookingForm.checkOut}
            onChange={(e) => handleFormChange("checkOut", e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg"
            required
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
          <Moon className="h-4 w-4 mr-1 text-gray-500" />
          Number of Nights
        </label>
        <input
          type="number"
          min="0"
          value={bookingForm.nights}
          className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100"
          readOnly
        />
      </div>
    </div>
  );
};

const GuestInfoStep = ({ bookingForm, handleFormChange }) => {
  const {
    inputValue: query,
    setInputValue: setQuery,
    results: guests,
    isLoading: isSearching,
    clearInput,
  } = useDebouncedSupabaseSearch({
    tableName: "guests",
    // 1. CORRECT: selectQuery now fetches all necessary fields
    selectQuery:
      "id, first_name, middle_name, last_name, email, contact_no, profile_image_url, street_address, region, province, city_municipality, barangay",
    searchColumns: ["first_name", "last_name", "email"],
    initialOrderBy: { column: "created_at", ascending: false },
    limit: 15,
  });

  const [addressData, setAddressData] = useState({
    regions: [],
    provinces: [],
    cities: [],
    barangays: [],
  });
  const [addressLoading, setAddressLoading] = useState({
    regions: false,
    provinces: false,
    cities: false,
    barangays: false,
  });

  const [selectedAddress, setSelectedAddress] = useState({
    region: "",
    province: "",
    city: "",
    barangay: "",
  });

  useEffect(() => {
    if (bookingForm.guestMode === "new") {
      setAddressLoading((prev) => ({ ...prev, regions: true }));
      regions()
        .then((data) =>
          setAddressData((prev) => ({ ...prev, regions: data || [] }))
        )
        .finally(() =>
          setAddressLoading((prev) => ({ ...prev, regions: false }))
        );
    }
  }, [bookingForm.guestMode]); // Re-fetch regions if user switches back to 'new'

  const handleRegionChange = async (e) => {
    const regionCode = e.target.value;
    const selectedRegion = addressData.regions.find(
      (r) => r.region_code === regionCode
    );
    setSelectedAddress({
      region: regionCode,
      province: "",
      city: "",
      barangay: "",
    });
    handleFormChange(
      "region",
      selectedRegion ? selectedRegion.region_name : ""
    );
    handleFormChange("province", "");
    handleFormChange("cityMunicipality", "");
    handleFormChange("barangay", "");
    setAddressData((prev) => ({
      ...prev,
      provinces: [],
      cities: [],
      barangays: [],
    }));
    if (regionCode) {
      setAddressLoading((prev) => ({ ...prev, provinces: true }));
      const provinceData = await provinces(regionCode);
      setAddressData((prev) => ({ ...prev, provinces: provinceData || [] }));
      setAddressLoading((prev) => ({ ...prev, provinces: false }));
    }
  };

  const handleProvinceChange = async (e) => {
    const provinceCode = e.target.value;
    const selectedProvince = addressData.provinces.find(
      (p) => p.province_code === provinceCode
    );
    setSelectedAddress((prev) => ({
      ...prev,
      province: provinceCode,
      city: "",
      barangay: "",
    }));
    handleFormChange(
      "province",
      selectedProvince ? selectedProvince.province_name : ""
    );
    handleFormChange("cityMunicipality", "");
    handleFormChange("barangay", "");
    setAddressData((prev) => ({ ...prev, cities: [], barangays: [] }));
    if (provinceCode) {
      setAddressLoading((prev) => ({ ...prev, cities: true }));
      const cityData = await cities(provinceCode);
      setAddressData((prev) => ({ ...prev, cities: cityData || [] }));
      setAddressLoading((prev) => ({ ...prev, cities: false }));
    }
  };

  const handleCityChange = async (e) => {
    const cityCode = e.target.value;
    const selectedCity = addressData.cities.find(
      (c) => c.city_code === cityCode
    );
    setSelectedAddress((prev) => ({ ...prev, city: cityCode, barangay: "" }));
    handleFormChange(
      "cityMunicipality",
      selectedCity ? selectedCity.city_name : ""
    );
    handleFormChange("barangay", "");
    setAddressData((prev) => ({ ...prev, barangays: [] }));
    if (cityCode) {
      setAddressLoading((prev) => ({ ...prev, barangays: true }));
      const barangayData = await barangays(cityCode);
      setAddressData((prev) => ({ ...prev, barangays: barangayData || [] }));
      setAddressLoading((prev) => ({ ...prev, barangays: false }));
    }
  };

  const handleBarangayChange = (e) => {
    const barangayCode = e.target.value;
    const selectedBarangay = addressData.barangays.find(
      (b) => b.brgy_code === barangayCode
    );
    setSelectedAddress((prev) => ({ ...prev, barangay: barangayCode }));
    handleFormChange(
      "barangay",
      selectedBarangay ? selectedBarangay.brgy_name : ""
    );
  };

  const imageSrc = useMemo(() => {
    return bookingForm.idPhoto
      ? URL.createObjectURL(bookingForm.idPhoto)
      : null;
  }, [bookingForm.idPhoto]);

  const handleGuestModeChange = (mode) => {
    handleFormChange("guestMode", mode);
    setSelectedAddress({ region: "", province: "", city: "", barangay: "" });
    handleFormChange("region", "");
    handleFormChange("province", "");
    handleFormChange("cityMunicipality", "");
    handleFormChange("barangay", "");
    handleFormChange("streetAddress", "");
    handleFormChange("idPhoto", null);

    if (mode === "new") {
      handleFormChange("selectedGuest", null);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800">
        Step 3: Guest Information
      </h3>

      <div className="flex rounded-md shadow-sm">
        <button
          type="button"
          onClick={() => handleGuestModeChange("new")}
          className={`relative inline-flex items-center px-4 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
            bookingForm.guestMode === "new"
              ? "bg-blue-600 text-white border-blue-600 z-10"
              : "bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          <UserPlus className="h-5 w-5 mr-2" /> New Guest
        </button>
        <button
          type="button"
          onClick={() => handleGuestModeChange("existing")}
          className={`-ml-px relative inline-flex items-center px-4 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
            bookingForm.guestMode === "existing"
              ? "bg-blue-600 text-white border-blue-600 z-10"
              : "bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          <Search className="h-5 w-5 mr-2" /> Existing Guest
        </button>
      </div>

      {bookingForm.guestMode === "existing" && (
        <Combobox
          value={bookingForm.selectedGuest}
          onChange={(guest) => {
            handleFormChange("selectedGuest", guest);
            setQuery("");
          }}
        >
          <div className="relative">
            <div className="relative w-full cursor-default overflow-hidden rounded-md border border-gray-300 bg-white text-left shadow-sm focus-within:ring-1 focus-within:ring-blue-500">
              <ComboboxInput
                className="w-full border-none py-2 pl-3 pr-16 text-sm leading-5 text-gray-900 focus:ring-0"
                onChange={(event) => setQuery(event.target.value)}
                displayValue={(guest) =>
                  guest ? `${guest.first_name} ${guest.last_name}` : ""
                }
                placeholder="Search or select a guest..."
              />
              {query && (
                <button
                  type="button"
                  className="absolute inset-y-0 right-8 flex items-center p-2 text-gray-400 hover:text-gray-600"
                  onClick={() => {
                    clearInput();
                    handleFormChange("selectedGuest", null);
                  }}
                >
                  <XCircleIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              )}
              <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronsUpDown
                  className="h-5 w-5 text-gray-400"
                  aria-hidden="true"
                />
              </ComboboxButton>
            </div>
            <Transition
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
              afterLeave={() => {
                if (!bookingForm.selectedGuest) setQuery("");
              }}
            >
              <ComboboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-none">
                {isSearching && (
                  <div className="relative cursor-default select-none py-2 px-4 text-gray-700 flex items-center">
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Searching...
                  </div>
                )}
                {!isSearching && guests.length === 0 ? (
                  <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                    {query ? "Nothing found." : "No recent guests found."}
                  </div>
                ) : (
                  guests.map((guest) => (
                    <ComboboxOption
                      key={guest.id}
                      value={guest}
                      className={({ active }) =>
                        `relative cursor-default select-none py-2 pl-10 pr-4 ${
                          active ? "bg-blue-600 text-white" : "text-gray-900"
                        }`
                      }
                    >
                      {({ selected, active }) => (
                        <>
                          <div>
                            <span
                              className={`block truncate ${
                                selected ? "font-medium" : "font-normal"
                              }`}
                            >
                              {guest.first_name} {guest.last_name}
                            </span>
                            <span
                              className={`block truncate text-xs ${
                                active ? "text-blue-100" : "text-gray-500"
                              }`}
                            >
                              {guest.email || "No Email"}
                            </span>
                          </div>
                          {selected ? (
                            <span
                              className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                active ? "text-white" : "text-blue-600"
                              }`}
                            >
                              <Check className="h-5 w-5" aria-hidden="true" />
                            </span>
                          ) : null}
                        </>
                      )}
                    </ComboboxOption>
                  ))
                )}
              </ComboboxOptions>
            </Transition>
          </div>
        </Combobox>
      )}

      {/* 2. IMPROVED LAYOUT: Name fields in one row, contact info in another */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            First Name *
          </label>
          <input
            type="text"
            value={bookingForm.firstName}
            onChange={(e) => handleFormChange("firstName", e.target.value)}
            disabled={bookingForm.guestMode === "existing"}
            className="mt-1 w-full p-2 border border-gray-300 rounded-md disabled:bg-gray-100"
            required
          />
        </div>
        {/* 3. ADDED: Middle name input */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Middle Name
          </label>
          <input
            type="text"
            value={bookingForm.middleName}
            onChange={(e) => handleFormChange("middleName", e.target.value)}
            disabled={bookingForm.guestMode === "existing"}
            className="mt-1 w-full p-2 border border-gray-300 rounded-md disabled:bg-gray-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Last Name *
          </label>
          <input
            type="text"
            value={bookingForm.lastName}
            onChange={(e) => handleFormChange("lastName", e.target.value)}
            disabled={bookingForm.guestMode === "existing"}
            className="mt-1 w-full p-2 border border-gray-300 rounded-md disabled:bg-gray-100"
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Contact No.
          </label>
          <input
            type="tel"
            value={bookingForm.contactNo}
            onChange={(e) => handleFormChange("contactNo", e.target.value)}
            disabled={bookingForm.guestMode === "existing"}
            className="mt-1 w-full p-2 border border-gray-300 rounded-md disabled:bg-gray-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            value={bookingForm.email}
            onChange={(e) => handleFormChange("email", e.target.value)}
            disabled={bookingForm.guestMode === "existing"}
            className="mt-1 w-full p-2 border border-gray-300 rounded-md disabled:bg-gray-100"
          />
        </div>
      </div>

      <div className="pt-4 border-t">
        <h4 className="text-md font-semibold text-gray-700 mb-4">Address</h4>
        {bookingForm.guestMode === "existing" ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Region
                </label>
                <input
                  type="text"
                  value={bookingForm.region || "N/A"}
                  disabled
                  className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Province
                </label>
                <input
                  type="text"
                  value={bookingForm.province || "N/A"}
                  disabled
                  className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-gray-100"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  City / Municipality
                </label>
                <input
                  type="text"
                  value={bookingForm.cityMunicipality || "N/A"}
                  disabled
                  className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Barangay
                </label>
                <input
                  type="text"
                  value={bookingForm.barangay || "N/A"}
                  disabled
                  className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-gray-100"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Street Address
              </label>
              <input
                type="text"
                value={bookingForm.streetAddress || "N/A"}
                disabled
                className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-gray-100"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Region
                </label>
                <select
                  value={selectedAddress.region}
                  onChange={handleRegionChange}
                  disabled={addressLoading.regions}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-md disabled:bg-gray-100"
                >
                  <option value="">
                    {addressLoading.regions ? "Loading..." : "Select Region"}
                  </option>
                  {addressData.regions.map((region) => (
                    <option key={region.region_code} value={region.region_code}>
                      {region.region_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Province
                </label>
                <select
                  value={selectedAddress.province}
                  onChange={handleProvinceChange}
                  disabled={!selectedAddress.region || addressLoading.provinces}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-md disabled:bg-gray-100"
                >
                  <option value="">
                    {addressLoading.provinces
                      ? "Loading..."
                      : "Select Province"}
                  </option>
                  {addressData.provinces.map((province) => (
                    <option
                      key={province.province_code}
                      value={province.province_code}
                    >
                      {province.province_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  City / Municipality
                </label>
                <select
                  value={selectedAddress.city}
                  onChange={handleCityChange}
                  disabled={!selectedAddress.province || addressLoading.cities}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-md disabled:bg-gray-100"
                >
                  <option value="">
                    {addressLoading.cities
                      ? "Loading..."
                      : "Select City/Municipality"}
                  </option>
                  {addressData.cities.map((city) => (
                    <option key={city.city_code} value={city.city_code}>
                      {city.city_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Barangay
                </label>
                <select
                  value={selectedAddress.barangay}
                  onChange={handleBarangayChange}
                  disabled={!selectedAddress.city || addressLoading.barangays}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-md disabled:bg-gray-100"
                >
                  <option value="">
                    {addressLoading.barangays
                      ? "Loading..."
                      : "Select Barangay"}
                  </option>
                  {addressData.barangays.map((barangay) => (
                    <option key={barangay.brgy_code} value={barangay.brgy_code}>
                      {barangay.brgy_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Street Address
              </label>
              <input
                type="text"
                value={bookingForm.streetAddress}
                onChange={(e) =>
                  handleFormChange("streetAddress", e.target.value)
                }
                className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                placeholder="House No., Street Name"
              />
            </div>
          </div>
        )}
      </div>

      <div className="bg-gray-50 p-4 rounded-lg border">
        <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
          <Camera /> ID Photo{" "}
          <span className="text-gray-500 font-normal">(Optional)</span>
        </label>
        <div className="mt-2 flex items-center gap-4">
          <label
            htmlFor="file-upload"
            className={`relative cursor-pointer w-40 h-24 bg-gray-200 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-md overflow-hidden group ${
              bookingForm.guestMode === "existing"
                ? "cursor-not-allowed bg-gray-300"
                : "hover:border-blue-500"
            }`}
          >
            {imageSrc ? (
              <img
                src={imageSrc}
                alt="ID Preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="text-gray-400 text-center">
                <FileImage className="h-8 w-8 mx-auto" />
                <span className="text-xs mt-1 block">Click to upload</span>
              </div>
            )}
            <input
              id="file-upload"
              name="file-upload"
              type="file"
              className="sr-only"
              accept="image/*"
              disabled={bookingForm.guestMode === "existing"}
              onChange={(e) =>
                handleFormChange(
                  "idPhoto",
                  e.target.files ? e.target.files[0] : null
                )
              }
            />
          </label>
          {bookingForm.idPhoto && (
            <div>
              <p className="text-sm text-gray-600 truncate max-w-xs">
                {bookingForm.idPhoto.name}
              </p>
              <button
                type="button"
                onClick={() => handleFormChange("idPhoto", null)}
                className="text-sm text-red-600 hover:underline"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
// --- COMPLETED RoomRequestsStep ---

// By destructuring props, it's easier to see what this component depends on.
const RoomRequestsStep = ({
  bookingForm,
  handleFormChange,
  handleAddRoom,
  handleRemoveRoom,
}) => {
  // Helper to update a specific room in the array, for cleaner code
  const updateSelectedRoom = (index, field, value) => {
    const updatedRooms = [...bookingForm.selectedRooms];
    updatedRooms[index] = { ...updatedRooms[index], [field]: value };
    handleFormChange("selectedRooms", updatedRooms);
  };

  const totalBookingGuests = useMemo(
    () =>
      (Number(bookingForm.adults) || 0) + (Number(bookingForm.children) || 0),
    [bookingForm.adults, bookingForm.children]
  );

  const totalAllocatedGuests = useMemo(
    () =>
      bookingForm.selectedRooms.reduce(
        (sum, room) => sum + (Number(room.allocatedGuests) || 0),
        0
      ),
    [bookingForm.selectedRooms]
  );

  // Calculate the total capacity of all selected rooms
  const totalCapacity = useMemo(
    () =>
      bookingForm.selectedRooms.reduce(
        (sum, selectedRoom) =>
          sum + (selectedRoom.room?.room_types?.guests_maximum || 0),
        0
      ),
    [bookingForm.selectedRooms]
  );

  const isGuestCountMismatch = totalAllocatedGuests !== totalBookingGuests;

  // Check if the total guests for the booking exceed the capacity of the selected rooms
  const isCapacityExceeded =
    totalBookingGuests > 0 &&
    totalCapacity > 0 &&
    totalBookingGuests > totalCapacity;

  const selectedRoomIds = useMemo(
    () => bookingForm.selectedRooms.map((r) => r.room?.id).filter(Boolean),
    [bookingForm.selectedRooms]
  );

  return (
    <div className="space-y-8">
      <h3 className="text-lg font-semibold text-gray-800">
        Step 4: Room & Guest Allocation
      </h3>

      <div className="p-4 border border-indigo-200 rounded-lg bg-indigo-50/60">
        <h4 className="text-md font-semibold text-gray-800 flex items-center mb-4">
          <Users className="h-5 w-5 mr-2 text-indigo-600" />
          Number of Guests
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Adults</label>
            <input
              type="number"
              value={bookingForm.adults}
              onChange={(e) =>
                handleFormChange("adults", Number(e.target.value))
              }
              min="1"
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">
              Children
            </label>
            <input
              type="number"
              value={bookingForm.children}
              onChange={(e) =>
                handleFormChange("children", Number(e.target.value))
              }
              min="0"
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="flex items-center gap-3 pl-2 self-end">
            <div
              className={`h-10 w-10 text-white rounded-full flex items-center justify-center text-lg font-bold ${
                isGuestCountMismatch || isCapacityExceeded
                  ? "bg-red-500"
                  : "bg-indigo-600"
              }`}
            >
              {totalBookingGuests}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Total Guests</p>
              <p className="text-xs text-gray-500">
                {totalAllocatedGuests} allocated of {totalCapacity} capacity
              </p>
            </div>
          </div>
        </div>

        {(isGuestCountMismatch || isCapacityExceeded) && (
          <div className="mt-4 space-y-2">
            {isGuestCountMismatch && (
              <div className="flex items-center p-2 text-sm text-yellow-800 bg-yellow-100 rounded-md">
                <Info className="h-4 w-4 mr-2 flex-shrink-0" />
                Guest allocation does not match total guests.
              </div>
            )}
            {isCapacityExceeded && (
              <div className="flex items-center p-2 text-sm text-red-800 bg-red-100 rounded-md">
                <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                Capacity exceeded. Please add another room to accommodate all
                guests.
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h4 className="text-md font-semibold text-gray-700 flex items-center">
          <Home className="h-5 w-5 mr-2 text-gray-600" />
          Room Allocation
        </h4>
        {bookingForm.selectedRooms.map((selectedRoom, index) => {
          const maxGuestsForRoom =
            selectedRoom.room?.room_types?.guests_maximum;
          const isRoomOverfilled =
            maxGuestsForRoom && selectedRoom.allocatedGuests > maxGuestsForRoom;

          const minGuestsForRoom = selectedRoom.room?.room_types?.guests_base;
          return (
            <div
              key={index}
              className={`p-4 border rounded-lg bg-white shadow-sm space-y-4 ${
                isRoomOverfilled ? "border-red-400" : "border-gray-200"
              }`}
            >
              <div className="flex justify-between items-start">
                <h5 className="text-md font-semibold text-gray-800">
                  Room {index + 1}
                  {selectedRoom.room && (
                    <span className="text-xs font-normal text-gray-500 ml-2">
                      ( Base {minGuestsForRoom} / Max {maxGuestsForRoom} )
                    </span>
                  )}
                </h5>
                {bookingForm.selectedRooms.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveRoom(index)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-full"
                  >
                    <XCircleIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Available Room
                  </label>
                  <AvailableRoomSelector
                    startDate={bookingForm.checkIn}
                    endDate={bookingForm.checkOut}
                    value={selectedRoom.room}
                    onChange={(roomObject) => {
                      updateSelectedRoom(index, "room", roomObject);
                    }}
                    disabledRooms={selectedRoomIds}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Guests in Room
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={maxGuestsForRoom}
                    value={selectedRoom.allocatedGuests}
                    onChange={(e) =>
                      updateSelectedRoom(
                        index,
                        "allocatedGuests",
                        Number(e.target.value)
                      )
                    }
                    className={`w-full h-10 px-3 border rounded-md shadow-sm ${
                      isRoomOverfilled
                        ? "border-red-500 ring-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  {isRoomOverfilled && (
                    <p className="mt-1 text-xs text-red-600">
                      Exceeds this room's capacity of {maxGuestsForRoom}.
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <button
          type="button"
          onClick={handleAddRoom}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border-2 border-dashed border-blue-200 rounded-lg hover:bg-blue-100"
        >
          <PlusCircle className="h-5 w-5" />
          Add Another Room
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Special Requests
        </label>
        <textarea
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          value={bookingForm.specialRequests}
          onChange={(e) => handleFormChange("specialRequests", e.target.value)}
        />
      </div>
    </div>
  );
};

// --- NEW: PaymentStep ---
export const PaymentStep = ({
  bookingForm,
  handleFormChange,
  priceBreakdown,
  setPriceBreakdown, // Use the setter from props
}) => {
  const formatCurrency = (amount) => `₱${Number(amount || 0).toFixed(2)}`;
  const [isChargesLoading, setIsChargesLoading] = useState(true);
  const [availableCharges, setAvailableCharges] = useState([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState(null);
  const [newPayment, setNewPayment] = useState({ amount: "", method: "cash" });
  const [newCharge, setNewCharge] = useState({ id: "", quantity: 1 });

  const calculatePrice = useCallback(async () => {
    setPriceBreakdown(null);
    setCalculationError(null);
    const { checkIn, checkOut, selectedRooms } = bookingForm;
    if (
      !checkIn ||
      !checkOut ||
      new Date(checkOut) <= new Date(checkIn) ||
      selectedRooms.some((r) => !r.room)
    ) {
      return;
    }
    setIsCalculating(true);
    const payload = {
      p_check_in_date: checkIn,
      p_check_out_date: checkOut,
      p_selected_rooms: selectedRooms
        .filter((r) => r.room?.id)
        .map((r) => ({
          room_id: r.room.id,
          allocated_guests: r.allocatedGuests,
        })),
    };
    if (payload.p_selected_rooms.length === 0) {
      setIsCalculating(false);
      return;
    }
    const { data, error } = await supabase.rpc(
      "calculate_booking_price",
      payload
    );
    if (error) {
      console.error("Price calculation RPC error:", error);
      setCalculationError(
        "Could not calculate the price. Please check the booking details and try again."
      );
    } else {
      setPriceBreakdown(data);
    }
    setIsCalculating(false);
  }, [
    bookingForm.checkIn,
    bookingForm.checkOut,
    bookingForm.selectedRooms,
    setPriceBreakdown,
  ]);

  useEffect(() => {
    const handler = setTimeout(() => {
      calculatePrice();
    }, 500);
    return () => {
      clearTimeout(handler);
    };
  }, [calculatePrice]);

  useEffect(() => {
    const fetchChargeItems = async () => {
      setIsChargesLoading(true);
      const { data, error } = await supabase
        .from("charge_items")
        .select("id, name, value, charge_type, is_vatable, is_default");
      if (!error) {
        setAvailableCharges(data);
      } else {
        console.error("Error fetching charge items:", error);
      }
      setIsChargesLoading(false);
    };
    fetchChargeItems();
  }, []);

  // NEW: Automatically add default charges when the component loads
  useEffect(() => {
    // Only run if charges haven't been set yet and available charges have loaded
    if (bookingForm.charges.length === 0 && availableCharges.length > 0) {
      const defaultCharges = availableCharges
        .filter((charge) => charge.is_default)
        .map((charge) => ({
          charge_item_id: charge.id,
          name: charge.name,
          quantity: 1, // Default quantity is 1
          unit_price: charge.value,
          charge_type: charge.charge_type,
          is_vatable: charge.is_vatable,
          is_default: charge.is_default,
        }));

      if (defaultCharges.length > 0) {
        handleFormChange("charges", defaultCharges);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableCharges]); // This runs only when availableCharges is populated

  const handleAddCharge = () => {
    const chargeItem = availableCharges.find((c) => c.id === newCharge.id);
    if (!chargeItem) return;
    if (bookingForm.charges.some((c) => c.charge_item_id === chargeItem.id)) {
      alert(`${chargeItem.name} has already been added.`);
      return;
    }
    handleFormChange("charges", [
      ...bookingForm.charges,
      {
        charge_item_id: chargeItem.id,
        name: chargeItem.name,
        quantity: newCharge.quantity,
        unit_price: chargeItem.value,
        charge_type: chargeItem.charge_type,
        is_vatable: chargeItem.is_vatable,
        is_default: chargeItem.is_default,
      },
    ]);
    setNewCharge({ id: "", quantity: 1 });
  };

  const handleRemoveCharge = (index) => {
    const updatedCharges = bookingForm.charges.filter((_, i) => i !== index);
    handleFormChange("charges", updatedCharges);
  };

  const handleAddPayment = () => {
    const amount = parseFloat(newPayment.amount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid payment amount.");
      return;
    }
    handleFormChange("payments", [
      ...bookingForm.payments,
      { amount, method: newPayment.method },
    ]);
    setNewPayment({ amount: "", method: "cash" });
  };

  const handleRemovePayment = (index) => {
    const updatedPayments = bookingForm.payments.filter((_, i) => i !== index);
    handleFormChange("payments", updatedPayments);
  };

  const financials = useMemo(() => {
    const VAT_RATE = 0.12;

    const roomAndGuestTotal =
      (priceBreakdown?.room_subtotal || 0) +
      (priceBreakdown?.extra_guest_total || 0);

    let vatableChargesSubtotal = 0;
    let nonVatableChargesSubtotal = 0;
    const allVatableCharges = [];
    const allNonVatableCharges = [];

    bookingForm.charges.forEach((charge) => {
      let totalChargeAmount = 0;
      if (charge.charge_type === "percentage") {
        totalChargeAmount = roomAndGuestTotal * (charge.unit_price / 100);
      } else {
        totalChargeAmount = charge.unit_price * charge.quantity;
      }
      const chargeDetails = {
        name: charge.name,
        amount: totalChargeAmount,
        quantity: charge.quantity,
      };
      if (charge.is_vatable) {
        allVatableCharges.push(chargeDetails);
        vatableChargesSubtotal += totalChargeAmount;
      } else {
        allNonVatableCharges.push(chargeDetails);
        nonVatableChargesSubtotal += totalChargeAmount;
      }
    });

    const discount = Number(bookingForm.discount) || 0;
    const totalVatableAmount = roomAndGuestTotal + vatableChargesSubtotal;
    let vatBase, vatAmount, grandTotal;

    if (bookingForm.discount_type === "before_tax") {
      vatBase = Math.max(0, totalVatableAmount - discount);
      vatAmount = vatBase * VAT_RATE;
      grandTotal = vatBase + vatAmount + nonVatableChargesSubtotal;
    } else {
      vatBase = totalVatableAmount;
      vatAmount = vatBase * VAT_RATE;
      const subtotalBeforeDiscount =
        vatBase + vatAmount + nonVatableChargesSubtotal;
      grandTotal = Math.max(0, subtotalBeforeDiscount - discount);
    }

    const totalPaid = bookingForm.payments.reduce(
      (sum, p) => sum + p.amount,
      0
    );
    const balanceDue = Math.max(0, grandTotal - totalPaid);
    const changeDue = Math.max(0, totalPaid - grandTotal);

    return {
      roomSubtotal: roomAndGuestTotal,
      discount,
      vatBase,
      vatAmount,
      grandTotal,
      totalPaid,
      balanceDue,
      changeDue,
      vatableCharges: allVatableCharges,
      nonVatableCharges: allNonVatableCharges,
    };
  }, [
    priceBreakdown,
    bookingForm.charges,
    bookingForm.payments,
    bookingForm.discount,
    bookingForm.discount_type,
  ]);

  return (
    <div className="space-y-8">
      {/* PAGE HEADER */}
      <div>
        <h3 className="text-2xl font-bold text-slate-900">
          Step 5: Payment & Charges
        </h3>
        <p className="text-slate-500 mt-1">
          Review the financial summary and record payments or additional
          services.
        </p>
      </div>

      {/* MAIN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-5 lg:gap-12">
        {/* LEFT COLUMN: ACTIONS & FORMS */}
        <div className="lg:col-span-3 space-y-8">
          {/* --- Alerts --- */}
          {isCalculating && !priceBreakdown && (
            <div className="flex items-center p-4 bg-blue-50 text-blue-800 rounded-lg">
              <Loader2 className="h-5 w-5 animate-spin mr-3" />
              Calculating price and checking rules...
            </div>
          )}
          {calculationError && (
            <div className="p-4 bg-red-50 text-red-800 rounded-lg">
              <strong>Error:</strong> {calculationError}
            </div>
          )}

          {/* --- Discount Card --- */}
          <Card title="Discount">
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Apply Discount
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="discount_type"
                    value="before_tax"
                    checked={bookingForm.discount_type === "before_tax"}
                    onChange={(e) =>
                      handleFormChange("discount_type", e.target.value)
                    }
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-slate-600">
                    Before Tax (Standard)
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="discount_type"
                    value="after_tax"
                    checked={bookingForm.discount_type === "after_tax"}
                    onChange={(e) =>
                      handleFormChange("discount_type", e.target.value)
                    }
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-slate-600">
                    After Tax (On Total Bill)
                  </span>
                </label>
              </div>
            </div>

            <label
              htmlFor="discount"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Discount Amount
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                ₱
              </span>
              <input
                id="discount"
                type="number"
                min="0"
                value={bookingForm.discount || ""}
                onChange={(e) =>
                  handleFormChange("discount", Number(e.target.value))
                }
                className="w-full p-2 pl-7 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>
          </Card>

          {/* --- Additional Charges Card --- */}
          <Card title="Additional Charges & Services">
            <div className="space-y-3">
              {bookingForm.charges.length > 0 ? (
                <div className="space-y-2 border-b border-slate-200 pb-4 mb-4">
                  {bookingForm.charges.map((charge, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-3 border border-slate-200 rounded-lg"
                    >
                      <div>
                        <span className="font-medium text-slate-800">
                          {charge.name}
                        </span>
                        <span className="text-slate-500 ml-2">
                          ({charge.quantity}x)
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-slate-700">
                          {formatCurrency(charge.unit_price * charge.quantity)}
                        </span>
                        <button
                          onClick={() => handleRemoveCharge(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <MinusCircle size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 pb-4 text-center">
                  No additional charges added.
                </p>
              )}
              {/* Add Charge Form */}
              <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                <div className="md:col-span-3">
                  <label className="text-xs font-medium text-slate-600">
                    Charge Item
                  </label>
                  <select
                    value={newCharge.id}
                    onChange={(e) =>
                      setNewCharge({ ...newCharge, id: e.target.value })
                    }
                    className="w-full p-2 mt-1 border border-slate-300 rounded-lg"
                    disabled={isChargesLoading}
                  >
                    <option value="">
                      {isChargesLoading ? "Loading..." : "Select a charge"}
                    </option>
                    {availableCharges.map((charge) => (
                      <option key={charge.id} value={charge.id}>
                        {charge.name} (
                        {charge.charge_type === "fixed"
                          ? formatCurrency(charge.value)
                          : `${charge.value}%`}
                        )
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-1">
                  <label className="text-xs font-medium text-slate-600">
                    Qty
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newCharge.quantity}
                    onChange={(e) =>
                      setNewCharge({
                        ...newCharge,
                        quantity: Number(e.target.value),
                      })
                    }
                    className="w-full p-2 mt-1 border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="md:col-span-2">
                  <button
                    onClick={handleAddCharge}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  >
                    <PlusCircle size={16} /> Add
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* --- Payments Card --- */}
          <Card title="Record Payments">
            <div className="space-y-3">
              {bookingForm.payments.length > 0 ? (
                <div className="space-y-2 border-b border-slate-200 pb-4 mb-4">
                  {bookingForm.payments.map((payment, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-3 border border-emerald-200 bg-emerald-50 rounded-lg"
                    >
                      <div className="capitalize font-medium text-emerald-800">
                        {payment.method.replace("_", " ")}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-emerald-900 font-semibold">
                          {formatCurrency(payment.amount)}
                        </span>
                        <button
                          onClick={() => handleRemovePayment(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <MinusCircle size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 pb-4 text-center">
                  No payments recorded yet.
                </p>
              )}
              {/* Add Payment Form */}
              <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-slate-600">
                    Amount
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newPayment.amount}
                    onChange={(e) =>
                      setNewPayment({ ...newPayment, amount: e.target.value })
                    }
                    className="w-full p-2 mt-1 border border-slate-300 rounded-lg"
                    placeholder="0.00"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-slate-600">
                    Method
                  </label>
                  <select
                    value={newPayment.method}
                    onChange={(e) =>
                      setNewPayment({ ...newPayment, method: e.target.value })
                    }
                    className="w-full p-2 mt-1 border border-slate-300 rounded-lg"
                  >
                    <option value="cash">Cash</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="online_wallet">Online Wallet</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <button
                    onClick={handleAddPayment}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                  >
                    <PlusCircle size={16} /> Record
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: BOOKING RECEIPT */}
        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-8 bg-white p-6 rounded-xl shadow-lg border border-slate-200 mt-8 lg:mt-0">
            {/* Header */}
            <div className="text-center border-b border-slate-200 pb-4 mb-4">
              <h2 className="text-xl font-bold text-slate-900">
                Booking Receipt
              </h2>
              <p className="text-sm text-slate-500">
                Thank you for your reservation!
              </p>
            </div>

            {/* Nightly Breakdown (Collapsible) */}
            {priceBreakdown?.nightly_breakdown && (
              <details className="group mb-4">
                <summary className="list-none flex justify-between items-center cursor-pointer text-sm font-semibold text-slate-700 hover:text-slate-900">
                  Nightly Breakdown
                  <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
                </summary>
                <div className="mt-3 space-y-2 text-xs border-t border-slate-200 pt-3">
                  {priceBreakdown.nightly_breakdown.map((night, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-4 gap-2 items-center"
                    >
                      <span className="font-bold">
                        Room {night.room_number}
                      </span>

                      <span className="text-slate-500 col-span-2">
                        {new Date(night.date).toLocaleDateString()} (
                        {night.rate_type})
                      </span>

                      <div className="text-right font-mono">
                        <div>{formatCurrency(night.room_rate)}</div>
                        <div className="text-[0.7rem] text-slate-500">
                          +{formatCurrency(night.extra_guest_fee)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            )}

            {/* Financial Summary */}
            <div className="space-y-2">
              <ReceiptLine
                label="Room Rate & Fees"
                value={formatCurrency(financials.roomSubtotal)}
              />
              {financials.vatableCharges.map((charge, index) => (
                <div key={`vat-charge-${index}`} className="pl-4">
                  <ReceiptLine
                    label={charge.name}
                    value={formatCurrency(charge.amount)}
                  />
                </div>
              ))}
              <ReceiptLine
                label="Discount"
                value={formatCurrency(financials.discount)}
                isNegative={true}
                className="text-red-600"
              />
            </div>

            <hr className="my-3 border-slate-200" />

            <div className="space-y-2">
              <ReceiptLine
                label="VATable Sale"
                value={formatCurrency(financials.vatBase)}
              />
              <ReceiptLine
                label="VAT (12%)"
                value={formatCurrency(financials.vatAmount)}
              />
              {financials.nonVatableCharges.map((charge, index) => (
                <ReceiptLine
                  key={`nonvat-charge-${index}`}
                  label={`${charge.name} (VAT-Exempt)`}
                  value={formatCurrency(charge.amount)}
                />
              ))}
            </div>

            <hr className="my-3 border-slate-300 border-dashed" />

            {/* Grand Total */}
            <div className="flex justify-between items-center font-bold text-lg">
              <span>Grand Total</span>
              <span className="font-mono">
                {formatCurrency(financials.grandTotal)}
              </span>
            </div>

            {/* Payment Status Section */}
            <div className="mt-6 space-y-2">
              <div className="flex justify-between items-center bg-emerald-100 text-emerald-800 p-3 rounded-lg font-semibold">
                <span>Total Paid</span>
                <span className="font-mono">
                  {formatCurrency(financials.totalPaid)}
                </span>
              </div>
              <div className="flex justify-between items-center bg-red-100 text-red-800 p-3 rounded-lg font-bold text-lg">
                <span>Balance Due</span>
                <span className="font-mono">
                  {formatCurrency(financials.balanceDue)}
                </span>
              </div>
              {financials.changeDue > 0 && (
                <div className="flex justify-between items-center bg-blue-100 text-blue-800 p-3 rounded-lg font-semibold">
                  <span>Change Due</span>
                  <span className="font-mono">
                    {formatCurrency(financials.changeDue)}
                  </span>
                </div>
              )}
            </div>
            {/* Footer */}
            <div className="text-center text-xs text-slate-400 mt-6 pt-4 border-t border-slate-200">
              <p>
                Ichthus Hotel & Suites &bull; Official Receipt -{" "}
                {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
