export const statusOptions = [
  { value: "pending", label: "Pending", icon: "Clock", color: "yellow" },
  { value: "reserved", label: "Reserved", icon: "CheckCircle", color: "green" },
  {
    value: "checked_in",
    label: "Checked-In",
    icon: "UserCheck",
    color: "blue",
  },
  {
    value: "checked_out",
    label: "Checked-Out",
    icon: "DoorOpen",
    color: "purple",
  },
  { value: "cancelled", label: "Cancelled", icon: "XCircle", color: "red" },
  { value: "no_show", label: "No Show", icon: "AlertCircle", color: "orange" },
];

export const initialFormState = {
  // Guest Info
  guestMode: "new",
  selectedGuest: null,
  firstName: "",
  middleName: "",
  lastName: "",
  contactNo: "",
  email: "",
  idPhoto: null,
  idPhotoUrl: "",
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
  discount_type: "before_tax",
  paymentMethod: "cash",
  payments: [],
  charges: [],
};

export const steps = [
  { name: "Status" },
  { name: "Dates" },
  { name: "Guest" },
  { name: "Room" },
  { name: "Payment" },
];
