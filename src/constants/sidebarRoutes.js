export const sidebarSections = {
  Manage: [
    { path: "/admin/dashboard", label: "Dashboard" },
    { path: "/admin/hotelInformation", label: "Hotel Information" },
    { path: "/admin/roomTypes", label: "Room" },
    { path: "/admin/personnel", label: "Personnel" },
    { path: "/admin/roomStatus", label: "Room Status" },
    { path: "/admin/roomLocations", label: "Room Locations" },
  ],
  Inventory: [
    { path: "/admin/item", label: "Items" },
    { path: "/admin/receivedItems", label: "Received Items" },
    { path: "/admin/inventoryOverview", label: "Inventory Overview" },
    { path: "/admin/inventoryActions", label: "Inventory Actions" },
  ],
  HouseKeeping: [
    // Add your HouseKeeping routes here if they are different
    // Example:
    // { path: "/admin/cleaning-schedule", label: "Cleaning Schedule" },
  ],
  Connections: [
    { path: "/admin/lockCardManager", label: "Lock Card Manager" },
    { path: "/admin/doorLocks", label: "Door Locks" },
    { path: "/admin/gateways", label: "Gateways" },
  ],
  "Item Maintenance": [
    { path: "/admin/categories1", label: "Categories 1" },
    { path: "/admin/categories2", label: "Categories 2" },
    { path: "/admin/categories3", label: "Categories 3" },
    { path: "/admin/categories4", label: "Categories 4" },
    { path: "/admin/categories5", label: "Categories 5" },
    { path: "/admin/itemType", label: "Item Type" },
  ],
  Operations: [
    { path: "/admin/guests", label: "Guests" },
    { path: "/admin/hotelfacilities", label: "Hotel Facilities" },
    { path: "/admin/chargeItems", label: "Charge Items" },
  ],
  Transactions: [{ path: "/admin/bookings", label: "Bookings" }],
};

export const allSidebarRoutes = Object.values(sidebarSections).flat();
