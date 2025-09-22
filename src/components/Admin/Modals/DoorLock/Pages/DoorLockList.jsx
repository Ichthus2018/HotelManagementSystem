// File: src/components/Admin/DoorLock/DoorLockList.jsx

import {
  TrashIcon,
  Battery50Icon,
  Battery100Icon,
  Battery0Icon,
} from "@heroicons/react/24/outline";

// Helper to get a visual battery indicator
const getBatteryInfo = (level) => {
  if (level === null || level === undefined) {
    return {
      Icon: Battery50Icon,
      color: "text-gray-400",
      text: "N/A",
    };
  }
  if (level > 50) {
    return { Icon: Battery100Icon, color: "text-green-500", text: `${level}%` };
  }
  if (level > 20) {
    return { Icon: Battery50Icon, color: "text-yellow-500", text: `${level}%` };
  }
  return { Icon: Battery0Icon, color: "text-red-500", text: `${level}%` };
};

const DoorLockList = ({ doorLocks, onDelete }) => {
  return (
    <div className="divide-y divide-gray-200">
      {doorLocks.map((lock) => {
        const battery = getBatteryInfo(lock.battery_level);
        return (
          <div
            key={lock.id}
            className="p-6 flex justify-between items-center hover:bg-gray-50"
          >
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {lock.name}
              </h3>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                <span>
                  Room:{" "}
                  <span className="font-medium text-gray-800">
                    {lock.rooms?.room_number || "Unassigned"}
                  </span>
                </span>
                <span
                  className="flex items-center gap-1"
                  title={`Battery: ${battery.text}`}
                >
                  <battery.Icon className={`h-5 w-5 ${battery.color}`} />
                  <span className={battery.color}>{battery.text}</span>
                </span>
                <span>
                  Gateway:{" "}
                  {lock.gateways?.name || (
                    <span className="italic text-gray-400">None</span>
                  )}
                </span>
              </div>
            </div>
            <div className="ml-4 flex-shrink-0">
              <button
                onClick={() => onDelete(lock)}
                className="p-2 text-gray-500 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors"
                title={`Delete Lock ${lock.name}`}
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DoorLockList;
