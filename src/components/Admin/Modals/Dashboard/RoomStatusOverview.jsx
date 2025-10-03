import React from "react";
import { getRoomStatusData } from "./sampleData";

const RoomStatusOverview = ({ className = "" }) => {
  const roomData = getRoomStatusData();

  return (
    <div
      className={`bg-white p-6 rounded-2xl shadow-lg border border-gray-100 ${className}`}
    >
      <h3 className="font-semibold text-lg text-gray-900 mb-5 tracking-tight">
        Room Status Overview
      </h3>
      <ul className="space-y-3">
        {roomData.map((item) => (
          <li
            key={item.status}
            className="flex items-center justify-between text-sm sm:text-base px-3 py-2 rounded-xl hover:bg-gray-50 transition"
          >
            <div className="flex items-center">
              <span
                className={`w-3.5 h-3.5 rounded-full mr-3 ${item.color}`}
              ></span>
              <span className="text-gray-700 font-medium">{item.status}</span>
            </div>
            <span className="font-semibold text-gray-900">{item.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RoomStatusOverview;
