// src/components/Admin/Modals/Dashboard/BookingTrendsChart.jsx
import React from "react";
import { bookingTrends } from "./sampleData";

const createCurvedPath = (data, key, width, height) => {
  const maxVal =
    Math.max(
      ...data.map((d) => Math.max(d["New Guests"], d["Returning Guests"]))
    ) * 1.1;

  const points = data.map((point, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - (point[key] / maxVal) * height;
    return { x, y };
  });

  let path = `M ${points[0].x},${points[0].y}`;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const controlX = (prev.x + curr.x) / 2;
    path += ` C ${controlX},${prev.y} ${controlX},${curr.y} ${curr.x},${curr.y}`;
  }

  return path;
};

const BookingTrendsChart = () => {
  const width = 600;
  const height = 250;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-lg text-gray-800">Visitor Insights</h3>
        <div className="flex space-x-2">
          <button className="px-3 py-1 text-xs bg-blue-100 text-blue-600 rounded-lg font-medium">
            Weekly
          </button>
          <button className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded-lg font-medium">
            Monthly
          </button>
        </div>
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-64">
          {/* Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <line
              key={ratio}
              x1="0"
              y1={height * ratio}
              x2={width}
              y2={height * ratio}
              stroke="#f3f4f6"
              strokeWidth="1"
            />
          ))}

          {/* New Guests Line */}
          <path
            d={createCurvedPath(bookingTrends, "New Guests", width, height)}
            fill="none"
            stroke="url(#newGuentsGradient)"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Returning Guests Line */}
          <path
            d={createCurvedPath(
              bookingTrends,
              "Returning Guests",
              width,
              height
            )}
            fill="none"
            stroke="url(#returningGuestsGradient)"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Gradient Definitions */}
          <defs>
            <linearGradient
              id="newGuentsGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
            <linearGradient
              id="returningGuestsGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
          </defs>

          {/* Data Points */}
          {bookingTrends.map((point, i) => {
            const x = (i / (bookingTrends.length - 1)) * width;
            const maxVal = 450;
            const newY = height - (point["New Guests"] / maxVal) * height;
            const returnY =
              height - (point["Returning Guests"] / maxVal) * height;

            return (
              <g key={i}>
                <circle cx={x} cy={newY} r="4" fill="#3b82f6" />
                <circle cx={x} cy={returnY} r="4" fill="#10b981" />
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex justify-center mt-6 space-x-8">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-blue-700 rounded-full mr-2"></div>
          <span className="text-sm font-medium text-gray-700">New Guests</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-emerald-700 rounded-full mr-2"></div>
          <span className="text-sm font-medium text-gray-700">
            Returning Guests
          </span>
        </div>
      </div>
    </div>
  );
};

export default BookingTrendsChart;
