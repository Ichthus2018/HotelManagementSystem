import React from "react";

const ChecklistTabs = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 focus:outline-none
              ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }
            `}
            aria-current={activeTab === tab.id ? "page" : undefined}
          >
            {tab.name}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default ChecklistTabs;
