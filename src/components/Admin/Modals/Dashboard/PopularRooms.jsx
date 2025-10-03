// src/components/Admin/Modals/Dashboard/PopularRooms.jsx
import React from "react";
import { popularRoomTypes } from "./sampleData";

const PopularRooms = ({ className = "" }) => {
  const getGradientColor = (popularity) => {
    if (popularity >= 80) return "from-blue-500 to-blue-600";
    if (popularity >= 60) return "from-cyan-500 to-blue-500";
    if (popularity >= 40) return "from-indigo-400 to-blue-500";
    return "from-blue-400 to-cyan-400";
  };

  return (
    <div
      className={`bg-white p-6 rounded-2xl shadow-sm border border-gray-100 ${className}`}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-lg text-gray-800">Popular Room Types</h3>
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
      </div>
      <div className="space-y-5">
        {popularRoomTypes.map((room) => (
          <div key={room.id} className="group">
            <div className="flex justify-between items-center text-sm mb-2">
              <span className="font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                {room.name}
              </span>
              <span className="font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full text-xs">
                {room.popularity}%
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full bg-gradient-to-r ${getGradientColor(
                  room.popularity
                )} transition-all duration-1000 ease-out group-hover:shadow-lg`}
                style={{ width: `${room.popularity}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PopularRooms;
