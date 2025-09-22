import React from "react";

const BreakdownItem = ({
  label,
  value,
  icon,
  isSubItem = false,
  colorClass = "text-gray-600",
}) => (
  <div className="flex justify-between items-center text-sm">
    <div
      className={`flex items-center gap-2 ${colorClass} ${
        isSubItem ? "pl-6" : ""
      }`}
    >
      {icon}
      <span>{label}</span>
    </div>
    <span className={`font-mono ${colorClass}`}>{value}</span>
  </div>
);

export default BreakdownItem;
