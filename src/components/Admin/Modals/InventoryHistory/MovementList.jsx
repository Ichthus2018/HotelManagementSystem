import React from "react";

const MovementList = ({ movements }) => {
  const formatActionType = (type) => {
    return type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getActionColor = (quantity) => {
    if (quantity > 0) return "text-green-600";
    if (quantity < 0) return "text-red-600";
    return "text-gray-600";
  };

  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Item
          </th>
          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
            Date & Time
          </th>
          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
            Action
          </th>
          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
            Quantity Change
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Reason / Notes
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {movements.map((move) => (
          <tr key={move.id} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="text-sm font-semibold text-gray-900">
                {move.item?.item_name || "N/A"}
              </div>
              <div className="text-xs text-gray-500">
                {move.item?.item_code || "Deleted Item"}
              </div>
            </td>
            <td className="px-4 py-4 text-center text-sm text-gray-600">
              {new Date(move.created_at).toLocaleString()}
            </td>
            <td className="px-4 py-4 text-center">
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                {formatActionType(move.action_type)}
              </span>
            </td>
            <td
              className={`px-4 py-4 text-center text-lg font-bold ${getActionColor(
                move.quantity_change
              )}`}
            >
              {move.quantity_change}
            </td>
            <td className="px-6 py-4 text-sm text-gray-600">
              {move.reason || "-"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default MovementList;
