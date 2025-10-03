// src/components/WeeklyOccupancyChart.jsx
import React from "react";
import { weeklyOccupancy } from "./sampleData";

const WeeklyOccupancyChart = () => {
  const maxVal =
    Math.max(...weeklyOccupancy.flatMap((d) => [d.online, d.offline])) + 5;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm col-span-1 lg:col-span-2">
      <h3 className="font-bold text-lg text-gray-800">Weekly Occupancy</h3>
      <div className="mt-4 h-64 flex justify-between items-end space-x-2">
        {weeklyOccupancy.map((dayData) => (
          <div
            key={dayData.day}
            className="flex-1 flex flex-col items-center justify-end"
          >
            <div
              className="w-full flex justify-center items-end gap-1"
              style={{ height: "100%" }}
            >
              <div
                className="w-1/2 bg-blue-400 rounded-t-sm"
                style={{ height: `${(dayData.online / maxVal) * 100}%` }}
              ></div>
              <div
                className="w-1/2 bg-teal-300 rounded-t-sm"
                style={{ height: `${(dayData.offline / maxVal) * 100}%` }}
              ></div>
            </div>
            <span className="text-xs text-gray-500 mt-2">{dayData.day}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-center mt-4 space-x-4 text-xs">
        <div className="flex items-center">
          <span className="w-3 h-3 bg-blue-400 rounded-sm mr-2"></span>Online
          Bookings
        </div>
        <div className="flex items-center">
          <span className="w-3 h-3 bg-teal-300 rounded-sm mr-2"></span>Offline
          Sales
        </div>
      </div>
    </div>
  );
};

export default WeeklyOccupancyChart;
