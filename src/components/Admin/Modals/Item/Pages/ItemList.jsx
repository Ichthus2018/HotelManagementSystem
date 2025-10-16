import { useState, Fragment } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { TrashIcon, PencilSquareIcon } from "@heroicons/react/24/outline";

// Helper function to consolidate category data into a clean array
const getItemCategories = (item) => {
  const categories = [];
  if (item.categories_1?.category_1_name)
    categories.push({
      name: "Cat 1",
      value: item.categories_1.category_1_name,
    });
  if (item.categories_2?.category_2_name)
    categories.push({
      name: "Cat 2",
      value: item.categories_2.category_2_name,
    });
  if (item.categories_3?.category_3_name)
    categories.push({
      name: "Cat 3",
      value: item.categories_3.category_3_name,
    });
  if (item.categories_4?.category_4_name)
    categories.push({
      name: "Cat 4",
      value: item.categories_4.category_4_name,
    });
  if (item.categories_5?.category_5_name)
    categories.push({
      name: "Cat 5",
      value: item.categories_5.category_5_name,
    });
  return categories;
};

// Helper component to render bundle components cleanly
const BundleComponents = ({ item }) => {
  const components = item.boms?.[0]?.bom_components || [];

  return (
    <div className="text-sm">
      <p className="font-semibold text-gray-700 mb-2">Bundle Components</p>
      {components.length > 0 ? (
        <ul className="space-y-2">
          {components.map((comp) => (
            <li
              key={comp.component_item.id}
              className="flex justify-between items-center bg-white p-2 rounded-md border"
            >
              <div>
                <span className="font-medium text-gray-800">
                  {comp.component_item.item_name}
                </span>
                <span className="text-xs text-gray-500 ml-2">
                  ({comp.component_item.item_code})
                </span>
              </div>
              <span className="text-sm font-mono bg-gray-100 px-2 py-0.5 rounded">
                Qty: {comp.quantity_required}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No components assigned to this bundle.</p>
      )}
    </div>
  );
};

// Helper component to render raw material categories
const RawMaterialCategories = ({ item }) => {
  const categories = getItemCategories(item);
  return (
    <div className="text-sm">
      <p className="font-semibold text-gray-700 mb-1">Categories</p>
      {categories.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {categories.map((cat, index) => (
            <span
              key={index}
              className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full"
            >
              {cat.value}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No categories assigned.</p>
      )}
    </div>
  );
};

// Helper component to render detailed stock counts
const StockDetails = ({ item }) => (
  <div className="text-sm">
    <p className="font-semibold text-gray-700 mb-2">Stock Breakdown</p>
    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
      <div className="flex justify-between">
        <span className="text-gray-500">In Use:</span>
        <span className="font-mono text-gray-800">
          {item.stock_in_use ?? 0}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-500">Dirty:</span>
        <span className="font-mono text-gray-800">{item.stock_dirty ?? 0}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-500">In Laundry:</span>
        <span className="font-mono text-gray-800">
          {item.stock_in_laundry ?? 0}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-500">Maintenance:</span>
        <span className="font-mono text-gray-800">
          {item.stock_under_maintenance ?? 0}
        </span>
      </div>
    </div>
  </div>
);

const ItemList = ({ items, onEdit, onDelete }) => {
  const [expandedRowId, setExpandedRowId] = useState(null);

  const handleToggleRow = (itemId) => {
    setExpandedRowId(expandedRowId === itemId ? null : itemId);
  };

  return (
    <div className="w-full">
      {/* =================================================== */}
      {/* Table view for larger screens (md and up)           */}
      {/* =================================================== */}
      <div className="hidden md:block">
        <div className="shadow-sm border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Class
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Lifecycle
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Available Stock
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item) => {
                const isExpanded = expandedRowId === item.id;

                return (
                  <Fragment key={item.id}>
                    {/* --- Main, always visible row --- */}
                    <tr className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {item.item_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.item_code}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            item.item_class === "Raw Material"
                              ? "bg-sky-100 text-sky-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {item.item_class}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {item.item_lifecycle_types?.lifecycle_name || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-gray-800">
                        {item.item_class === "Raw Material"
                          ? item.stock_available ?? 0
                          : "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            item.status
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {item.status ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => onEdit(item)}
                            className="p-2 rounded-full text-gray-400 hover:text-blue-600 hover:bg-gray-100 transition"
                          >
                            <PencilSquareIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDelete(item)}
                            className="p-2 rounded-full text-gray-400 hover:text-red-600 hover:bg-gray-100 transition"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleRow(item.id)}
                            className="p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                          >
                            {isExpanded ? (
                              <FaChevronUp className="w-4 h-4" />
                            ) : (
                              <FaChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* --- Expandable row with details, hidden by default --- */}
                    {isExpanded && (
                      <tr className="bg-slate-50/70">
                        <td colSpan="6" className="px-6 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6">
                            {/* General Info */}
                            <div className="text-sm space-y-3">
                              <div>
                                <p className="font-semibold text-gray-700 mb-1">
                                  Batch Enabled
                                </p>
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    item.batch
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-gray-100 text-gray-600"
                                  }`}
                                >
                                  {item.batch ? "Yes" : "No"}
                                </span>
                              </div>
                              {item.item_class === "Raw Material" && (
                                <div>
                                  <p className="font-semibold text-gray-700 mb-1">
                                    Item Type
                                  </p>
                                  <p className="text-gray-600">
                                    {item.item_type?.item_type_name || "N/A"}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Conditional Display for Details */}
                            <div className="lg:col-span-2">
                              {item.item_class === "Bundle" ? (
                                <BundleComponents item={item} />
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                  <RawMaterialCategories item={item} />
                                  <StockDetails item={item} />
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* =================================================== */}
      {/* Card view for smaller screens (up to md)            */}
      {/* =================================================== */}
      <div className="md:hidden space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white shadow rounded-lg p-4 border border-gray-100"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  {item.item_name}
                </h3>
                <p className="text-xs text-gray-500">{item.item_code}</p>
              </div>
              <span
                className={`flex-shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  item.status
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {item.status ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="border-t border-gray-100 my-3"></div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Class:</span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    item.item_class === "Raw Material"
                      ? "bg-sky-100 text-sky-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {item.item_class}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Batch:</span>
                <span className="text-gray-800">
                  {item.batch ? "Yes" : "No"}
                </span>
              </div>
              {item.item_class === "Raw Material" && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">Type:</span>
                    <span className="text-gray-800">
                      {item.item_type?.item_type_name || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">
                      Lifecycle:
                    </span>
                    <span className="text-gray-800">
                      {item.item_lifecycle_types?.lifecycle_name || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium">
                      Available Stock:
                    </span>
                    <span className="font-bold text-gray-900 text-base">
                      {item.stock_available ?? 0}
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="border-t border-gray-100 my-3 pt-3">
              {item.item_class === "Bundle" ? (
                <BundleComponents item={item} />
              ) : (
                <div className="space-y-4">
                  <RawMaterialCategories item={item} />
                  <StockDetails item={item} />
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 mt-3 pt-3 flex justify-end space-x-2">
              <button
                onClick={() => onEdit(item)}
                className="p-2 rounded-full text-gray-400 hover:text-blue-600 hover:bg-gray-100 transition"
              >
                <PencilSquareIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(item)}
                className="p-2 rounded-full text-gray-400 hover:text-red-600 hover:bg-gray-100 transition"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ItemList;
