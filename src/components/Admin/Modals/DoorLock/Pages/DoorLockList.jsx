import {
  TrashIcon,
  Battery50Icon,
  Battery100Icon,
  Battery0Icon,
  WifiIcon,
  DevicePhoneMobileIcon,
  ChevronRightIcon, // <-- 1. Import new icons
  PencilSquareIcon,
} from "@heroicons/react/24/outline";

// Helper to get a visual battery indicator (no changes needed here)
const getBatteryInfo = (level) => {
  if (level === null || level === undefined) {
    return { Icon: Battery50Icon, color: "text-gray-400", text: "N/A" };
  }
  if (level > 50) {
    return { Icon: Battery100Icon, color: "text-green-500", text: `${level}%` };
  }
  if (level > 20) {
    return { Icon: Battery50Icon, color: "text-yellow-500", text: `${level}%` };
  }
  return { Icon: Battery0Icon, color: "text-red-500", text: `${level}%` };
};

// --- Refactored DoorLockList Component ---
const DoorLockList = ({ doorLocks, onDelete, onRename, onViewDetails }) => {
  // <-- 2. Accept new props
  return (
    <div className="divide-y divide-gray-200">
      {doorLocks.map((lock) => {
        const battery = getBatteryInfo(lock.battery_level);
        const isGateway = lock.hasGateway;

        return (
          <div
            key={lock.id}
            onClick={() => onViewDetails(lock)} // <-- Entire row is clickable
            className="group p-4 sm:p-6 flex justify-between items-center hover:bg-orange-50/75 transition-colors duration-150 cursor-pointer"
          >
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* Status Icon (imitating GatewayList) */}
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  isGateway
                    ? "bg-blue-100 text-blue-600"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {isGateway ? (
                  <WifiIcon className="h-6 w-6" />
                ) : (
                  <DevicePhoneMobileIcon className="h-6 w-6" />
                )}
              </div>

              {/* Lock Details */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                    {lock.name}
                  </h3>
                  {/* Status Badge */}
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      isGateway
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {isGateway ? "Gateway" : "Bluetooth"}
                  </span>
                </div>
                {/* Secondary Info Line */}
                <div className="mt-1 text-sm text-gray-500 flex items-center gap-x-4">
                  <span>
                    MAC:{" "}
                    <span className="font-medium text-gray-700 font-mono tracking-wider">
                      {lock.lockMac}
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <battery.Icon className={`h-4 w-4 ${battery.color}`} />
                    <span className={battery.color}>{battery.text}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
          </div>
        );
      })}
    </div>
  );
};

export default DoorLockList;
