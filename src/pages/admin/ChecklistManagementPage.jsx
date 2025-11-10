import React, { useState } from "react";

// The new reusable tab component
import ChecklistTabs from "../../components/ui/common/ChecklistTabs";
import ChecklistItems from "./ChecklistItems";
import CleaningChecklistPage from "./CleaningChecklistPage";

// Define the tabs we want to display
const tabs = [
  { id: "cleaning", name: "Cleaning Checklist" },
  { id: "inventory", name: "Inventory Checklist" },
];

const ChecklistManagementPage = () => {
  // State to keep track of the currently active tab
  const [activeTab, setActiveTab] = useState("inventory"); // Default to 'inventory'

  return (
    <div className="min-h-screen w-full mx-auto p-4 pt-8 md:p-8 max-w-7xl">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">
        Checklist Management
      </h1>
      <p className="text-lg text-gray-600 mb-8">
        Switch between inventory and cleaning checklists.
      </p>

      {/* Render the Tab component */}
      <ChecklistTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Conditionally render the content based on the active tab */}
      <div className="mt-8">
        {activeTab === "cleaning" && <CleaningChecklistPage />}
        {activeTab === "inventory" && <ChecklistItems />}
      </div>
    </div>
  );
};

export default ChecklistManagementPage;
