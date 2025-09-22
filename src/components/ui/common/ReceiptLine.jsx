import React from "react";

const ReceiptLine = ({ label, value, isNegative = false, className = "" }) => (
  <div className={`flex justify-between items-center text-sm ${className}`}>
    <span className="text-slate-600">{label}</span>
    <span className="font-mono font-medium text-slate-800">
      {isNegative && "- "}
      {value}
    </span>
  </div>
);

export default ReceiptLine;
