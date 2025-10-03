// src/components/Admin/Modals/Dashboard/StatCard.jsx
import React from "react";

const StatCard = ({
  icon,
  title,
  value,
  change,
  bgColor,
  iconColor,
  unit = "",
}) => {
  const isPositive = change >= 0;

  return (
    <div className="group relative">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-200"></div>
      <div className="relative bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500 mb-2">{title}</p>
            <p className="text-2xl font-bold text-gray-800 mb-1">
              {value}
              {unit && (
                <span className="text-lg font-semibold ml-1">{unit}</span>
              )}
            </p>
            <p
              className={`text-xs flex items-center font-medium ${
                isPositive ? "text-green-500" : "text-red-500"
              }`}
            >
              <span
                className={`mr-1 ${
                  isPositive ? "text-green-500" : "text-red-500"
                }`}
              >
                {isPositive ? "↗" : "↘"}
              </span>
              {Math.abs(change)}% from yesterday
            </p>
          </div>
          <div className={`rounded-2xl p-3 ${bgColor} ${iconColor} shadow-md`}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatCard;
