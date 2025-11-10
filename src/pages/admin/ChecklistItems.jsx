import React, { useState, Fragment } from "react";
// --- ( 1 ) IMPORT ReactPaginate ---
import ReactPaginate from "react-paginate";
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Portal,
  Transition,
} from "@headlessui/react";
import {
  ChevronDownIcon,
  CubeIcon,
  ArchiveBoxXMarkIcon,
  ArrowDownCircleIcon,
  ArrowDownTrayIcon,
  TruckIcon,
  ArrowPathIcon,
  WrenchScrewdriverIcon,
  ArrowTopRightOnSquareIcon,
  ArrowUturnLeftIcon,
  // --- (MODIFICATION) ADDED ICONS FOR THE NEW STATUS INDICATOR ---
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid";

import { useInventoryOverview } from "../../hooks/Admin/useInventoryOverview";
import PageHeader from "../../components/ui/common/PageHeader";
import StockActionModal from "../../components/Admin/Modals/InventoryHistory/StockActionModal";
import Loader from "../../components/ui/common/Loader";
import EmptyState from "../../components/ui/common/EmptyState";
import SearchInput from "../../components/ui/common/SearchInput";

// StatusBadge for stock levels
const StatusBadge = ({ value, label, theme }) => {
  const themes = {
    green: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    yellow: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    blue: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
    gray: "bg-gray-50 text-gray-600 ring-1 ring-gray-200",
  };
  const themeClasses = themes[theme] || themes.gray;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${themeClasses} backdrop-blur-sm`}
    >
      <span className="font-bold text-base">{value}</span>
      <span className="text-xs font-normal">{label}</span>
    </span>
  );
};

// --- (NEW COMPONENT) REDESIGNED STATUS INDICATOR ---
// This component displays the active/inactive status of an item.
// It will be RED and prominent when the item is inactive.
const ItemStatusIndicator = ({ status }) => {
  const isActive = status;

  const baseClasses =
    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold";
  const activeClasses = "bg-green-100 text-green-800";
  const inactiveClasses = "bg-red-100 text-red-800 font-bold";

  const Icon = isActive ? CheckCircleIcon : XCircleIcon;
  const label = isActive ? "Active" : "Inactive";
  const themeClasses = isActive ? activeClasses : inactiveClasses;

  return (
    <span className={`${baseClasses} ${themeClasses}`}>
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </span>
  );
};

// Main Checklist Component
const ChecklistItems = () => {
  const { inventoryData, isLoading, error, mutate } = useInventoryOverview();

  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearchTerm, setActiveSearchTerm] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  const handleSearch = (e) => {
    e.preventDefault();
    setActiveSearchTerm(searchTerm);
    setCurrentPage(1);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setActiveSearchTerm("");
    setCurrentPage(1);
  };

  const handlePageClick = (event) => {
    setCurrentPage(event.selected + 1);
  };

  const handleActionClick = (item, actionType) => {
    setSelectedItem(item);
    setCurrentAction(actionType);
    setIsModalOpen(true);
  };

  const calculateBundleStock = (item) => {
    if (
      item.item_class !== "Bundle" ||
      !item.components ||
      item.components.length === 0
    ) {
      return item.stock_available;
    }
    const possibleKits = item.components.map((comp) =>
      Math.floor(comp.stock_on_hand / comp.quantity_required)
    );
    return Math.min(...possibleKits);
  };

  const renderContent = () => {
    if (isLoading) return <Loader />;
    if (error)
      return (
        <div className="flex items-center justify-center p-12">
          {/* ... error state content ... */}
        </div>
      );
    if (!inventoryData || inventoryData.length === 0) {
      return (
        <EmptyState
          title="No Inventory Items Found"
          description="Add items to your inventory to see them listed here."
        />
      );
    }

    const filteredData = activeSearchTerm
      ? inventoryData.filter(
          (item) =>
            item.item_name
              .toLowerCase()
              .includes(activeSearchTerm.toLowerCase()) ||
            item.item_code
              .toLowerCase()
              .includes(activeSearchTerm.toLowerCase())
        )
      : inventoryData;

    if (filteredData.length === 0) {
      return (
        <EmptyState
          title="No Results Found"
          description={`Your search for "${activeSearchTerm}" did not match any inventory items.`}
          actionButton={
            <button
              onClick={clearSearch}
              className="mt-4 px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-md hover:bg-gray-700"
            >
              Clear Search
            </button>
          }
        />
      );
    }

    const pageCount = Math.ceil(filteredData.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

    return (
      <>
        <div className=" backdrop-blur-sm shadow-xl ring-1 ring-black/5 rounded-2xl overflow-hidden">
          <div className="divide-y divide-gray-100">
            {currentItems.map((item, index) => (
              <div
                key={item.id}
                className="p-6 flex justify-between items-start gap-6 hover:bg-gray-50/80 transition-all duration-200 group"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* --- (MODIFICATION) REDESIGNED ITEM INFO SECTION --- */}
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      {/* Flex container for Name + Status */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1.5">
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-gray-700 transition-colors truncate">
                          {item.item_name}
                        </h3>
                        {/* USE THE NEW STATUS INDICATOR COMPONENT */}
                        <ItemStatusIndicator status={item.status} />
                      </div>

                      <p className="text-sm text-blue-500 font-mono bg-gray-50 px-2 py-1 rounded-md inline-block">
                        {item.item_code}
                      </p>
                      {/* REMOVED: {item.status ? "True" : "False"} */}
                    </div>
                  </div>

                  {/* Stock Level Status Badges Grid */}
                  <div className="flex flex-wrap gap-2">
                    {item.item_class === "Bundle" ? (
                      <StatusBadge
                        value={calculateBundleStock(item)}
                        label="Kits Available"
                        theme="green"
                      />
                    ) : (
                      <StatusBadge
                        value={item.stock_available}
                        label="Available"
                        theme="green"
                      />
                    )}

                    {item.lifecycle_name === "Cyclical" && (
                      <>
                        <StatusBadge
                          value={item.stock_dirty}
                          label="In Use"
                          theme="yellow"
                        />
                        <StatusBadge
                          value={item.stock_in_laundry}
                          label="In Laundry"
                          theme="blue"
                        />
                      </>
                    )}
                    {item.lifecycle_name === "Tracked Asset" && (
                      <>
                        <StatusBadge
                          value={item.stock_in_use}
                          label="Deployed"
                          theme="yellow"
                        />
                        <StatusBadge
                          value={item.stock_under_maintenance}
                          label="Maintenance"
                          theme="blue"
                        />
                      </>
                    )}
                  </div>
                </div>

                {/* Right Side: Action Menu */}
                <div className="flex-shrink-0">
                  <ActionMenu item={item} onActionClick={handleActionClick} />
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Pagination Component */}
        {pageCount > 1 && (
          <div className="p-6 bg-white border-t border-gray-200 rounded-b-2xl mt-[-1px]">
            <ReactPaginate
              breakLabel="..."
              nextLabel="›"
              onPageChange={handlePageClick}
              pageRangeDisplayed={3}
              pageCount={pageCount}
              previousLabel="‹"
              renderOnZeroPageCount={null}
              forcePage={currentPage - 1} // react-paginate is 0-indexed
              containerClassName="flex items-center justify-center gap-2 text-sm font-medium"
              pageLinkClassName="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-300 text-gray-900 hover:bg-gray-100 transition duration-200 cursor-pointer"
              activeLinkClassName="bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
              previousLinkClassName="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-300 text-gray-900 hover:bg-gray-100 transition duration-200 cursor-pointer"
              nextLinkClassName="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-300 text-gray-900 hover:bg-gray-100 transition duration-200 cursor-pointer"
              disabledClassName="opacity-50 cursor-not-allowed"
            />
          </div>
        )}
      </>
    );
  };

  return (
    <>
      <div className="min-h-screen w-full mx-auto p-4 pt-8 md:p-8 max-w-7xl">
        <PageHeader
          title="Inventory Checklist"
          description="Monitor stock levels and manage inventory actions in real-time"
          className="mb-8"
        />

        <div className="mb-6">
          <SearchInput
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            activeSearchTerm={activeSearchTerm}
            onSearch={handleSearch}
            onClear={clearSearch}
            placeholder="Search by item name or code..."
          />
        </div>

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

// --- No changes to ActionMenu component ---
const ActionMenu = ({ item, onActionClick }) => {
  const getActions = () => {
    if (item.item_class === "Bundle") {
      return [{ key: "CONSUME_BUNDLE", label: "Use Bundle", icon: CubeIcon }];
    }

    switch (item.lifecycle_name) {
      case "Consumable":
        return [
          { key: "CONSUME", label: "Use Stock", icon: ArrowDownCircleIcon },
          { key: "WRITE_OFF", label: "Stock Out", icon: ArchiveBoxXMarkIcon },
        ];
      case "Cyclical":
        return [
          {
            key: "MOVE_TO_DIRTY",
            label: "Mark as Used",
            icon: ArrowDownTrayIcon,
          },
          { key: "MOVE_TO_LAUNDRY", label: "Send to Laundry", icon: TruckIcon },
          {
            key: "RETURN_FROM_LAUNDRY",
            label: "Receive from Laundry",
            icon: ArrowPathIcon,
          },
          {
            key: "WRITE_OFF",
            label: "Write-off Damaged",
            icon: ArchiveBoxXMarkIcon,
          },
        ];
      case "Tracked Asset":
        return [
          {
            key: "DEPLOY_ASSET",
            label: "Deploy Asset",
            icon: ArrowTopRightOnSquareIcon,
          },
          {
            key: "SEND_FOR_MAINTENANCE",
            label: "Send for Maintenance",
            icon: WrenchScrewdriverIcon,
          },
          {
            key: "RETURN_TO_STORAGE",
            label: "Return to Storage",
            icon: ArrowUturnLeftIcon,
          },
          { key: "WRITE_OFF", label: "Write-off", icon: ArchiveBoxXMarkIcon },
        ];
      default:
        return [];
    }
  };

  const actions = getActions();

  if (actions.length === 0) {
    return (
      <span className="text-gray-400 italic text-sm px-3 py-2 border border-gray-200 rounded-lg bg-white/50">
        No actions
      </span>
    );
  }

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <MenuButton className="inline-flex w-full justify-center gap-x-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-lg ring-1 ring-gray-200 hover:shadow-xl hover:ring-gray-300 transition-all duration-200 hover:bg-gradient-to-br hover:from-white hover:to-gray-50">
          Actions
          <ChevronDownIcon
            className="-mr-1 h-5 w-5 text-gray-400 group-hover:text-gray-600"
            aria-hidden="true"
          />
        </MenuButton>
      </div>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-150"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Portal>
          <MenuItems
            anchor="bottom end"
            className="absolute right-0 z-50 mt-2 w-64 origin-top-right rounded-xl bg-white/95 backdrop-blur-sm shadow-2xl ring-1 ring-black/5 focus:outline-none overflow-hidden"
          >
            <div className="py-2">
              {actions.map((action) => (
                <MenuItem key={action.key}>
                  {({ active }) => (
                    <button
                      onClick={() => onActionClick(item, action.key)}
                      className={`${
                        active
                          ? "bg-gradient-to-r from-blue-50 to-purple-50 text-gray-900"
                          : "text-gray-700"
                      } group flex items-center w-full px-4 py-3 text-sm transition-all duration-150 border-l-4 border-transparent hover:border-blue-500`}
                    >
                      <action.icon
                        className="mr-3 h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors"
                        aria-hidden="true"
                      />
                      <span className="font-medium">{action.label}</span>
                    </button>
                  )}
                </MenuItem>
              ))}
            </div>
          </MenuItems>
        </Portal>
      </Transition>
    </Menu>
  );
};

export default ChecklistItems;
