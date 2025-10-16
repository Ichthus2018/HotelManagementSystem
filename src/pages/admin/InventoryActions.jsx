// src/pages/Admin/InventoryActions.jsx

import React, { useState, useEffect } from "react";
import PageHeader from "../../components/ui/common/PageHeader";
import ParentCombobox from "../../components/ui/common/ParentCombobox";
import StockActionModal from "../../components/Admin/Modals/InventoryHistory/StockActionModal";
import Loader from "../../components/ui/common/loader";
import EmptyState from "../../components/ui/common/EmptyState";
import { useInventoryOverview } from "../../hooks/Admin/useInventoryOverview";

// Import icons for visually intuitive buttons
import {
  ArrowDownTrayIcon,
  ArchiveBoxXMarkIcon,
  TruckIcon,
  ArrowUturnLeftIcon,
  WrenchScrewdriverIcon,
  CubeIcon,
  ArrowTopRightOnSquareIcon,
  ArrowPathIcon,
  ArrowDownCircleIcon,
} from "@heroicons/react/24/solid";

// A theme map for styling stat cards consistently
const statThemes = {
  green: {
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-700",
    value: "text-green-800",
  },
  yellow: {
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    text: "text-yellow-700",
    value: "text-yellow-800",
  },
  blue: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    value: "text-blue-800",
  },
  gray: {
    bg: "bg-gray-100",
    border: "border-gray-200",
    text: "text-gray-600",
    value: "text-gray-800",
  },
};

const StatCard = ({ label, value, theme }) => {
  const styles = statThemes[theme] || statThemes.gray;
  return (
    <div
      className={`p-4 rounded-lg border text-center ${styles.bg} ${styles.border}`}
    >
      <p className={`text-sm font-semibold ${styles.text}`}>{label}</p>
      <p className={`text-3xl font-bold ${styles.value}`}>{value}</p>
    </div>
  );
};

// Reusable ActionButton component with updated color variants
const ActionButton = ({
  onClick,
  label,
  icon,
  variant = "primary",
  disabled = false,
}) => {
  const baseClasses =
    "inline-flex items-center gap-x-2 justify-center rounded-md px-4 py-2 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150";

  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary:
      "bg-white text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:ring-blue-500",
    success: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    // NEW: Warning variant for "Dirty" or "In Use" states
    warning:
      "bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500",
  };

  const IconComponent = React.cloneElement(icon, {
    className: "h-5 w-5 -ml-1",
  });

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]}`}
    >
      {IconComponent}
      {label}
    </button>
  );
};

const InventoryActions = () => {
  const {
    inventoryData: allItems,
    isLoading,
    error,
    mutate,
  } = useInventoryOverview();

  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);

  useEffect(() => {
    if (selectedItem) {
      const freshItemData = allItems.find(
        (item) => item.id === selectedItem.id
      );
      setSelectedItem(freshItemData || null);
    }
  }, [allItems, selectedItem]);

  const calculateBundleStock = (item) => {
    if (item.item_class !== "Bundle" || !item.components)
      return item.stock_available;
    if (item.components.length === 0) return 0;
    const possibleKits = item.components.map((comp) =>
      Math.floor(comp.stock_on_hand / comp.quantity_required)
    );
    return Math.min(...possibleKits);
  };

  const getStockStats = (item) => {
    if (!item) return [];
    const stats = [];
    const availableStock = calculateBundleStock(item);
    stats.push({
      label: item.item_class === "Bundle" ? "Kits Available" : "Available",
      value: availableStock,
      theme: "green",
    });

    switch (item.lifecycle_name) {
      case "Cyclical":
        stats.push({
          label: "Dirty",
          value: item.stock_dirty,
          theme: "yellow",
        });
        stats.push({
          label: "In Laundry",
          value: item.stock_in_laundry,
          theme: "blue",
        });
        break;
      case "Tracked Asset":
        stats.push({
          label: "Deployed",
          value: item.stock_in_use,
          theme: "yellow",
        });
        stats.push({
          label: "Under Maintenance",
          value: item.stock_under_maintenance,
          theme: "blue",
        });
        break;
      default:
        break;
    }

    if (item.item_class !== "Bundle") {
      const total =
        item.stock_available +
        item.stock_dirty +
        item.stock_in_use +
        item.stock_in_laundry +
        item.stock_under_maintenance;
      stats.push({ label: "Total On Hand", value: total, theme: "gray" });
    }
    return stats;
  };

  const handleActionClick = (actionType) => {
    setCurrentAction(actionType);
    setIsModalOpen(true);
  };

  // FULLY REVISED: Button variants now match the status cards
  const renderActionButtons = () => {
    if (!selectedItem) return null;

    if (selectedItem.item_class === "Bundle") {
      const canMakeBundle = calculateBundleStock(selectedItem) > 0;
      return (
        <>
          <ActionButton
            onClick={() => handleActionClick("CONSUME_BUNDLE")}
            label="Use Bundle"
            icon={<CubeIcon />}
            variant="primary"
            disabled={!canMakeBundle}
          />
          {!canMakeBundle && (
            <p className="text-sm text-yellow-700 self-center">
              Cannot use kit, component stock is too low.
            </p>
          )}
        </>
      );
    }

    switch (selectedItem.lifecycle_name) {
      case "Consumable":
        return (
          <>
            <ActionButton
              onClick={() => handleActionClick("CONSUME")}
              label="Use Stock"
              icon={<ArrowDownCircleIcon />}
              variant="primary"
            />
            <ActionButton
              onClick={() => handleActionClick("WRITE_OFF")}
              label="Stock Out"
              icon={<ArchiveBoxXMarkIcon />}
              variant="danger"
            />
          </>
        );
      case "Cyclical":
        return (
          <>
            <ActionButton
              onClick={() => handleActionClick("MOVE_TO_DIRTY")}
              label="Mark as Dirty"
              icon={<ArrowDownTrayIcon />}
              variant="warning"
            />
            <ActionButton
              onClick={() => handleActionClick("MOVE_TO_LAUNDRY")}
              label="Send to Laundry"
              icon={<TruckIcon />}
              variant="primary"
            />
            <ActionButton
              onClick={() => handleActionClick("RETURN_FROM_LAUNDRY")}
              label="Receive from Laundry"
              icon={<ArrowPathIcon />}
              variant="success"
            />
            <ActionButton
              onClick={() => handleActionClick("WRITE_OFF")}
              label="Write-off Damaged"
              icon={<ArchiveBoxXMarkIcon />}
              variant="danger"
            />
          </>
        );
      case "Tracked Asset":
        return (
          <>
            <ActionButton
              onClick={() => handleActionClick("DEPLOY_ASSET")}
              label="Deploy Asset"
              icon={<ArrowTopRightOnSquareIcon />}
              variant="warning"
            />
            <ActionButton
              onClick={() => handleActionClick("SEND_FOR_MAINTENANCE")}
              label="Send for Maintenance"
              icon={<WrenchScrewdriverIcon />}
              variant="primary"
            />
            <ActionButton
              onClick={() => handleActionClick("RETURN_TO_STORAGE")}
              label="Return to Storage"
              icon={<ArrowUturnLeftIcon />}
              variant="success"
            />
            <ActionButton
              onClick={() => handleActionClick("WRITE_OFF")}
              label="Write-off"
              icon={<ArchiveBoxXMarkIcon />}
              variant="danger"
            />
          </>
        );
      default:
        return (
          <p className="text-gray-500">This item has no defined actions.</p>
        );
    }
  };

  const renderContent = () => {
    if (isLoading) return <Loader />;
    if (error)
      return (
        <div className="text-center text-red-500 p-6">
          Failed to load inventory data: {error.message}
        </div>
      );
    if (!isLoading && allItems.length === 0) {
      return (
        <EmptyState
          title="No Inventory Items Found"
          description="Add items to your inventory before you can perform actions on them."
        />
      );
    }

    const stockStats = getStockStats(selectedItem);

    return (
      <>
        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            1. Select an Item
          </h3>
          <ParentCombobox
            label="Search for an item by name or code..."
            data={allItems}
            selected={selectedItem}
            setSelected={setSelectedItem}
            nameKey="item_name"
            codeKey="item_code"
          />
        </div>

        {selectedItem && (
          <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              2. Current Stock: {selectedItem.item_name}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {stockStats.map((stat) => (
                <StatCard key={stat.label} {...stat} />
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                3. Perform an Action
              </h3>
              <div className="flex flex-wrap items-center gap-4">
                {renderActionButtons()}
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <>
      <div className="space-y-6 w-full mx-auto p-4 pt-10 md:p-6 max-w-7xl">
        <PageHeader
          title="Inventory Actions"
          description="Record stock usage, state changes, and write-offs. This is the control hub for daily operations."
        />
        {renderContent()}
      </div>

      {selectedItem && (
        <StockActionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            mutate();
          }}
          item={selectedItem}
          actionType={currentAction}
        />
      )}
    </>
  );
};

export default InventoryActions;
