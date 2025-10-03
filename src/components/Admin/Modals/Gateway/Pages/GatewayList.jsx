import {
  TrashIcon,
  WifiIcon,
  SignalSlashIcon,
  ChevronRightIcon,
  PencilSquareIcon, // <-- 1. Import new icon
} from "@heroicons/react/24/outline";

const GatewayList = ({ gateways, onDelete, onViewLocks, onRename }) => {
  // <-- 2. Accept onRename prop
  return (
    <div className="divide-y divide-gray-200">
      {gateways.map((gateway) => (
        <div
          key={gateway.id}
          onClick={() => onViewLocks(gateway)}
          className="group p-4 sm:p-6 flex justify-between items-center hover:bg-orange-50/75 transition-colors duration-150 cursor-pointer"
        >
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* Status Icon */}
            <div
              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                gateway.is_online
                  ? "bg-green-100 text-green-600"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {gateway.is_online ? (
                <WifiIcon className="h-6 w-6" />
              ) : (
                <SignalSlashIcon className="h-6 w-6" />
              )}
            </div>

            {/* Gateway Details */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
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
              <p className="mt-1 text-sm text-gray-500">
                ID: {gateway.ttlock_gateway_id} &bull; MAC:{" "}
                <span className="font-medium text-gray-700 font-mono tracking-wider">
                  {gateway.gatewayMac}
                </span>
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="ml-4 flex-shrink-0 flex items-center gap-2">
            {/* 3. Add Rename button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRename(gateway);
              }}
              className="p-2 text-gray-500 rounded-full hover:bg-blue-100 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              title="Rename Gateway"
            >
              <PencilSquareIcon className="h-5 w-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(gateway);
              }}
              className="p-2 text-gray-500 rounded-full hover:bg-red-100 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
              title="Delete Gateway"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
            <ChevronRightIcon className="h-6 w-6 text-gray-400 group-hover:text-orange-600 transition-colors" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default GatewayList;
