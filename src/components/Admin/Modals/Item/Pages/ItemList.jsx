import { useState } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { TrashIcon, PencilSquareIcon } from "@heroicons/react/24/outline"; // ADDED PencilSquareIcon
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

const ItemList = ({ items, onEdit, onDelete }) => {
  // State to track the ID of the currently expanded row
  const [expandedRowId, setExpandedRowId] = useState(null);

  const handleToggleRow = (itemId) => {
    // If the clicked row is already expanded, collapse it. Otherwise, expand it.
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
                {/* --- Simplified Headers --- */}
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
                  Code
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Type
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
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
                const categories = getItemCategories(item);

                return (
                  // Use React Fragment to return multiple sibling elements
                  <Fragment key={item.id}>
                    {/* --- Main, always visible row --- */}
                    <tr className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {item.item_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.item_code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.item_type?.item_type_name || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
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
                      <tr className="bg-slate-50">
                        <td colSpan="5" className="px-6 py-4">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {/* Batch Info */}
                            <div className="text-sm">
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

                            {/* Categories Info */}
                            <div className="sm:col-span-2 text-sm">
                              <p className="font-semibold text-gray-700 mb-1">
                                Categories
                              </p>
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
                                <p className="text-gray-500">
                                  No categories assigned.
                                </p>
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
        {items.map((item) => {
          const categories = getItemCategories(item);
          return (
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
                  <span className="text-gray-500 font-medium">Type:</span>
                  <span className="text-gray-800">
                    {item.item_type?.item_type_name || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Batch:</span>
                  <span className="text-gray-800">
                    {item.batch ? "Yes" : "No"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 font-medium">Categories:</span>
                  {categories.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mt-1">
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
                    <span className="text-gray-800 ml-2">N/A</span>
                  )}
                </div>
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
          );
        })}
      </div>
    </div>
  );
};

// You need to import React.Fragment
import { Fragment } from "react";
export default ItemList;
