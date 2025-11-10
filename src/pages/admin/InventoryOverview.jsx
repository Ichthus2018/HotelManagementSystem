import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom"; // <--- IMPORT Link
import { useInventoryOverview } from "../../hooks/Admin/useInventoryOverview";
import {
  FaBoxOpen,
  FaWarehouse,
  FaExclamationTriangle,
  FaHistory, // <--- IMPORT a new icon for the button
} from "react-icons/fa";

// UI Components
import PageHeader from "../../components/ui/common/PageHeader";
import SearchInput from "../../components/ui/common/SearchInput";
import EmptyState from "../../components/ui/common/EmptyState";
import Loader from "../../components/ui/common/Loader";

const getStockStatus = (item) => {
  // Available stock is either the direct value or the calculated bundle value
  const available =
    item.item_class === "Bundle"
      ? item.bundle_calculable_stock
      : item.stock_available;
  if (available <= 0) {
    return { text: "Out of Stock", color: "bg-red-100 text-red-800" };
  }
  if (available <= 10) {
    return { text: "Low Stock", color: "bg-yellow-100 text-yellow-800" };
  }
  return { text: "In Stock", color: "bg-green-100 text-green-800" };
};

const InventoryOverview = () => {
  const [filterClass, setFilterClass] = useState("All");
  const [filterStock, setFilterStock] = useState("All");

  // State management for search is now handled inside the component
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearchTerm, setActiveSearchTerm] = useState("");

  const handleSearch = (e) => {
    e?.preventDefault();
    setActiveSearchTerm(searchTerm);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setActiveSearchTerm("");
  };

  // Using the new, dedicated hook for fetching inventory data
  const { inventoryData, isLoading, error } = useInventoryOverview();

  // Client-side filtering logic
  const filteredInventory = useMemo(() => {
    if (!inventoryData) return [];

    return inventoryData
      .filter((item) => {
        if (filterClass === "All") return true;
        return item.item_class === filterClass;
      })
      .filter((item) => {
        if (filterStock === "All") return true;
        const status = getStockStatus(item).text;
        return status === filterStock;
      })
      .filter((item) => {
        if (!activeSearchTerm) return true;
        return item.item_name
          .toLowerCase()
          .includes(activeSearchTerm.toLowerCase());
      });
  }, [inventoryData, filterClass, filterStock, activeSearchTerm]);

  // Key Metrics Calculation
  const metrics = useMemo(() => {
    if (!inventoryData) return { totalItems: 0, lowStock: 0, outOfStock: 0 };

    let lowStockCount = 0;
    let outOfStockCount = 0;

    inventoryData.forEach((item) => {
      const available =
        item.item_class === "Bundle"
          ? item.bundle_calculable_stock
          : item.stock_available;
      if (available <= 0) {
        outOfStockCount++;
      } else if (available <= 10) {
        lowStockCount++;
      }
    });

    return {
      totalItems: inventoryData.length,
      lowStock: lowStockCount,
      outOfStock: outOfStockCount,
    };
  }, [inventoryData]);

  const renderContent = () => {
    if (isLoading) return <Loader />;
    if (error)
      return (
        <div className="text-center text-red-500 p-6">
          Error: {error.message}
        </div>
      );

    if (!filteredInventory || filteredInventory.length === 0) {
      return (
        <EmptyState
          title="No Inventory Found"
          description={
            activeSearchTerm || filterClass !== "All" || filterStock !== "All"
              ? "No items match your current search or filters."
              : "Your inventory is empty. Start by receiving stock for raw materials."
          }
        />
      );
    }

    return (
      <>
        {/* Desktop Table View */}
        <div className="hidden md:block shadow-sm border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Available
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dirty / In Use
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  In Process
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInventory.map((item) => {
                const stockStatus = getStockStatus(item);

                let dirtyOrInUse = 0;
                let inProcess = 0;
                if (item.lifecycle_name === "Cyclical") {
                  dirtyOrInUse = item.stock_dirty;
                  inProcess = item.stock_in_laundry;
                } else if (item.lifecycle_name === "Tracked Asset") {
                  dirtyOrInUse = item.stock_in_use;
                  inProcess = item.stock_under_maintenance;
                }

                const totalStock =
                  item.item_class !== "Bundle"
                    ? item.stock_available + dirtyOrInUse + inProcess
                    : "-";

                const availableStock =
                  item.item_class === "Bundle"
                    ? item.bundle_calculable_stock
                    : item.stock_available;

                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {item.item_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.item_code}
                      </div>
                      <div className="text-xs text-indigo-600 mt-1">
                        {item.lifecycle_name}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center text-lg font-bold text-gray-800">
                      {availableStock}
                    </td>
                    <td className="px-4 py-4 text-center text-sm text-gray-600">
                      {dirtyOrInUse > 0 ? dirtyOrInUse : "-"}
                    </td>
                    <td className="px-4 py-4 text-center text-sm text-gray-600">
                      {inProcess > 0 ? inProcess : "-"}
                    </td>
                    <td className="px-4 py-4 text-center text-sm font-semibold text-blue-700">
                      {totalStock}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.color}`}
                      >
                        {stockStatus.text}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {filteredInventory.map((item) => {
            const stockStatus = getStockStatus(item);
            const availableStock =
              item.item_class === "Bundle"
                ? item.bundle_calculable_stock
                : item.stock_available;

            return (
              <div
                key={item.id}
                className="bg-white shadow rounded-lg p-4 border border-gray-100"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">
                      {item.item_name}
                    </h3>
                    <p className="text-xs text-gray-500">{item.item_code}</p>
                    {item.lifecycle_name && (
                      <div className="text-xs text-indigo-600 mt-1">
                        {item.lifecycle_name}
                      </div>
                    )}
                  </div>
                  <span
                    className={`flex-shrink-0 px-2.5 py-1 text-xs font-semibold rounded-full ${stockStatus.color}`}
                  >
                    {stockStatus.text}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4 border-t pt-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Available</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {availableStock}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Class</p>
                    <p className="mt-1">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          item.item_class === "Raw Material"
                            ? "bg-sky-100 text-sky-800"
                            : "bg-indigo-100 text-indigo-800"
                        }`}
                      >
                        {item.item_class}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  };

  return (
    <div className="space-y-6 w-full mx-auto p-2 pt-10 md:p-6 max-w-[95rem] xl:px-12 min-h-screen">
      {/* --- MODIFICATION START --- */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <PageHeader
          title="Inventory Overview"
          description="A real-time snapshot of all your item stock levels."
        />
        <Link
          to="/admin/inventoryHistory" // Adjust this path to match your route
          className="inline-flex flex-shrink-0 items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <FaHistory className="h-4 w-4 text-gray-500" aria-hidden="true" />
          View History
        </Link>
      </div>
      {/* --- MODIFICATION END --- */}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border flex items-center gap-4">
          <FaWarehouse className="text-3xl text-blue-500" />
          <div>
            <p className="text-gray-500 text-sm">Total Items</p>
            <p className="text-2xl font-bold text-gray-800">
              {metrics.totalItems}
            </p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border flex items-center gap-4">
          <FaExclamationTriangle className="text-3xl text-yellow-500" />
          <div>
            <p className="text-gray-500 text-sm">Low Stock Items</p>
            <p className="text-2xl font-bold text-gray-800">
              {metrics.lowStock}
            </p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border flex items-center gap-4">
          <FaBoxOpen className="text-3xl text-red-500" />
          <div>
            <p className="text-gray-500 text-sm">Out of Stock</p>
            <p className="text-2xl font-bold text-gray-800">
              {metrics.outOfStock}
            </p>
          </div>
        </div>
      </div>

      {/* Controls: Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1">
          <SearchInput
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            activeSearchTerm={activeSearchTerm}
            onSearch={handleSearch}
            onClear={clearSearch}
            placeholder="Search by item name..."
          />
        </div>
        <div className="grid grid-cols-2 gap-4 md:col-span-2">
          <select
            onChange={(e) => setFilterClass(e.target.value)}
            value={filterClass}
            className="w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="All">All Classes</option>
            <option value="Raw Material">Raw Material</option>
            <option value="Bundle">Bundle</option>
          </select>
          <select
            onChange={(e) => setFilterStock(e.target.value)}
            value={filterStock}
            className="w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="All">All Stock Statuses</option>
            <option value="In Stock">In Stock</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>
        </div>
      </div>

      <div className=" ring-gray-900/5 rounded-lg ">{renderContent()}</div>
    </div>
  );
};

export default InventoryOverview;
