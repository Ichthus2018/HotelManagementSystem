// File: src/components/Admin/Gateway/GatewayList.jsx

import { TrashIcon } from "@heroicons/react/24/outline";
import { formatDistanceToNow } from "date-fns";

// A small helper to format the timestamp in a user-friendly way
const formatLastSeen = (timestamp) => {
  if (!timestamp) {
    return "Never";
  }
  return `${formatDistanceToNow(new Date(timestamp), { addSuffix: true })}`;
};

const GatewayList = ({ gateways, onDelete }) => {
  return (
    <div className="divide-y divide-gray-200">
      {gateways.map((gateway) => (
        <div
          key={gateway.id}
          className="p-6 flex justify-between items-center hover:bg-gray-50"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {gateway.name || `Gateway #${gateway.ttlock_gateway_id}`}
              </h3>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  gateway.is_online
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {gateway.is_online ? "Online" : "Offline"}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              ID: {gateway.ttlock_gateway_id} &bull; Last Seen:{" "}
              <span className="font-medium text-gray-700">
                {formatLastSeen(gateway.last_seen)}
              </span>
            </p>
          </div>
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={() => onDelete(gateway)}
              className="p-2 text-gray-500 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors"
              title="Delete Gateway"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default GatewayList;
