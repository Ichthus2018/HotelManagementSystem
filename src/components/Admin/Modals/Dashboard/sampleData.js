// src/sampleData.js

// --- Room Inventory and Status ---
const roomInventory = [
  { roomNumber: 101, type: "Standard Queen", status: "available", price: 150 },
  { roomNumber: 102, type: "Standard Queen", status: "occupied", price: 150 },
  { roomNumber: 103, type: "Deluxe King", status: "cleaning", price: 220 },
  { roomNumber: 104, type: "Standard Queen", status: "available", price: 150 },
  { roomNumber: 105, type: "Suite", status: "occupied", price: 350 },
  { roomNumber: 201, type: "Deluxe King", status: "maintenance", price: 220 },
  { roomNumber: 202, type: "Standard Queen", status: "dirty", price: 150 },
  { roomNumber: 203, type: "Suite", status: "available", price: 350 },
  { roomNumber: 204, type: "Deluxe King", status: "occupied", price: 220 },
  { roomNumber: 205, type: "Standard Queen", status: "occupied", price: 150 },
  { roomNumber: 301, type: "Suite", status: "out_of_order", price: 350 },
  { roomNumber: 302, type: "Deluxe King", status: "cleaning", price: 220 },
  { roomNumber: 303, type: "Standard Queen", status: "available", price: 150 },
  { roomNumber: 304, type: "Standard Queen", status: "occupied", price: 150 },
  { roomNumber: 305, type: "Deluxe King", status: "available", price: 220 },
  // Adding more rooms for a total of 50
  ...Array.from({ length: 35 }, (_, i) => ({
    roomNumber: 401 + i,
    type:
      i % 5 === 0 ? "Suite" : i % 3 === 0 ? "Deluxe King" : "Standard Queen",
    status: ["available", "occupied", "dirty"][Math.floor(Math.random() * 3)],
    price: i % 5 === 0 ? 350 : i % 3 === 0 ? 220 : 150,
  })),
];

// --- Booking Data ---
export const recentBookings = [
  {
    bookingId: "BK1234",
    guestName: "John Doe",
    roomType: "Deluxe King",
    checkIn: "2023-10-26",
    status: "Checked-in",
  },
  {
    bookingId: "BK1235",
    guestName: "Jane Smith",
    roomType: "Suite",
    checkIn: "2023-10-27",
    status: "Confirmed",
  },
  {
    bookingId: "BK1236",
    guestName: "Peter Jones",
    roomType: "Standard Queen",
    checkIn: "2023-10-26",
    status: "Checked-in",
  },
  {
    bookingId: "BK1237",
    guestName: "Mary Williams",
    roomType: "Standard Queen",
    checkIn: "2023-10-28",
    status: "Confirmed",
  },
];

// --- Data for Charts and Summaries ---

// Function to calculate room status counts from inventory
export const getRoomStatusData = () => {
  const counts = roomInventory.reduce((acc, room) => {
    acc[room.status] = (acc[room.status] || 0) + 1;
    return acc;
  }, {});

  return [
    {
      status: "Available",
      count: counts.available || 0,
      color: "bg-green-500",
    },
    { status: "Occupied", count: counts.occupied || 0, color: "bg-blue-500" },
    { status: "Cleaning", count: counts.cleaning || 0, color: "bg-yellow-500" },
    { status: "Dirty", count: counts.dirty || 0, color: "bg-orange-500" },
    {
      status: "Maintenance",
      count: counts.maintenance || 0,
      color: "bg-red-500",
    },
    {
      status: "Out of Order",
      count: counts.out_of_order || 0,
      color: "bg-gray-600",
    },
  ];
};

export const dailySummary = {
  revenue: { value: 4520, change: 8 },
  occupancy: { value: 72, change: -1.5 }, // as percentage
  checkIns: { value: 12, change: 10 },
  checkOuts: { value: 8, change: -5 },
};

export const weeklyOccupancy = [
  { day: "Mon", online: 15, offline: 12 },
  { day: "Tue", online: 18, offline: 10 },
  { day: "Wed", online: 22, offline: 5 },
  { day: "Thu", online: 16, offline: 8 },
  { day: "Fri", online: 25, offline: 11 },
  { day: "Sat", online: 30, offline: 14 },
  { day: "Sun", online: 28, offline: 10 },
];

export const bookingTrends = [
  { name: "Jan", "New Guests": 280, "Returning Guests": 120 },
  { name: "Feb", "New Guests": 250, "Returning Guests": 150 },
  { name: "Mar", "New Guests": 310, "Returning Guests": 180 },
  { name: "Apr", "New Guests": 290, "Returning Guests": 210 },
  { name: "May", "New Guests": 350, "Returning Guests": 200 },
  { name: "Jun", "New Guests": 380, "Returning Guests": 220 },
  { name: "Jul", "New Guests": 400, "Returning Guests": 250 },
];

export const popularRoomTypes = [
  { id: 1, name: "Deluxe King", popularity: 45, color: "bg-blue-400" },
  { id: 2, name: "Standard Queen", popularity: 29, color: "bg-green-400" },
  { id: 3, name: "Suite", popularity: 18, color: "bg-purple-400" },
  { id: 4, name: "Family Room", popularity: 8, color: "bg-orange-400" },
];
