// src/components/Admin/Modals/Dashboard/RecentBookings.jsx
import React from "react";
import { recentBookings } from "./sampleData";

const statusStyles = {
  "Checked-in": "bg-green-100 text-green-700 border border-green-200",
  Confirmed: "bg-blue-100 text-blue-700 border border-blue-200",
  Pending: "bg-yellow-100 text-yellow-700 border border-yellow-200",
  "Checked-out": "bg-gray-100 text-gray-700 border border-gray-200",
};

const RecentBookings = () => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-lg text-gray-800">Recent Bookings</h3>
        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1">
          <span>View All</span>
          <span>→</span>
        </button>
      </div>

      <div className="space-y-3">
        {/* Header */}
        <div className="grid grid-cols-12 gap-4 text-xs text-gray-500 font-semibold uppercase px-2">
          <div className="col-span-4">Guest</div>
          <div className="col-span-3">Room Type</div>
          <div className="col-span-3">Check-in</div>
          <div className="col-span-2 text-center">Status</div>
        </div>

        {/* Booking Items */}
        <div className="space-y-2">
          {recentBookings.map((booking) => (
            <div
              key={booking.bookingId}
              className="grid grid-cols-12 gap-4 items-center p-3 rounded-xl hover:bg-blue-50 transition-all duration-200 group border border-transparent hover:border-blue-100"
            >
              <div className="col-span-4">
                <div className="font-semibold text-gray-800 group-hover:text-blue-600">
                  {booking.guestName}
                </div>
                <div className="text-xs text-gray-500">
                  #{booking.bookingId}
                </div>
              </div>
              <div className="col-span-3 text-gray-600 font-medium">
                {booking.roomType}
              </div>
              <div className="col-span-3">
                <div className="text-gray-600">{booking.checkIn}</div>
                <div className="text-xs text-gray-400">{booking.duration}</div>
              </div>
              <div className="col-span-2 flex justify-center">
                <span
                  className={`px-3 py-1.5 text-xs font-bold rounded-full ${
                    statusStyles[booking.status]
                  }`}
                >
                  {booking.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecentBookings;
