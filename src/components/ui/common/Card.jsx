import React from "react";

const Card = ({ title, children, className = "" }) => (
  <div
    className={`bg-white rounded-xl shadow-md border border-slate-200 ${className}`}
  >
    <div className="p-6">
      <h4 className="text-lg font-bold text-slate-800 mb-4">{title}</h4>
      {children}
    </div>
  </div>
);

export default Card;
