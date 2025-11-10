// src/components/Inspector/InspectorRoomCard.js

import {
  CheckCircleIcon,
  ShieldCheckIcon,
  ArrowUturnLeftIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { useRoomActions } from "../../../../hooks/Admin/useRoomActions";

const statusConfig = {
  Dirty: {
    color: "bg-red-100 text-red-800",
    label: "Dirty",
    icon: ExclamationTriangleIcon,
  },
  "For Cleaning": {
    color: "bg-yellow-100 text-yellow-800",
    label: "Cleaning",
    icon: ClockIcon,
  },
  "For Inspection": {
    color: "bg-blue-100 text-blue-800",
    label: "Pending Inspection",
    icon: ShieldCheckIcon,
  },
  Clean: {
    color: "bg-green-100 text-green-800",
    label: "Clean & Ready",
    icon: CheckCircleIcon,
  },
};

const InspectorRoomCard = ({ room, currentUser }) => {
  const { updateStatus, isProcessing } = useRoomActions();

  // --- SIMPLIFIED: Data is flat from the view, no complex getters needed ---
  const status = room.status || "Dirty";
  const config = statusConfig[status] || statusConfig.Dirty;
  const StatusIcon = config.icon;

  const isAssignedToMe = room.inspector === currentUser?.id;

  const renderHousekeepers = () => {
    if (!room.housekeeper_details?.length) return "Unassigned";
    return room.housekeeper_details
      .map((hk) => `${hk.first_name} ${hk.last_name}`)
      .join(", ");
  };

  const renderActionButtons = () => {
    const baseBtn =
      "w-full flex items-center justify-center gap-1.5 rounded-md text-xs font-semibold text-white shadow transition-all";

    if (status !== "For Inspection") {
      return (
        <p className="text-center text-[11px] text-gray-500">
          No action required at this time.
        </p>
      );
    }

    if (isAssignedToMe) {
      return (
        <div className="flex gap-2">
          <button
            onClick={() =>
              updateStatus({ roomId: room.id, newStatus: "For Cleaning" })
            }
            disabled={isProcessing}
            className={`${baseBtn} flex-1 bg-red-600 hover:bg-red-700 py-2 disabled:opacity-60`}
          >
            <ArrowUturnLeftIcon className="h-4 w-4" />
            Reject
          </button>
          <button
            onClick={() =>
              updateStatus({ roomId: room.id, newStatus: "Clean" })
            }
            disabled={isProcessing}
            className={`${baseBtn} flex-1 bg-emerald-600 hover:bg-emerald-700 py-2 disabled:opacity-60`}
          >
            <CheckCircleIcon className="h-4 w-4" />
            Approve
          </button>
        </div>
      );
    }

    // This case should be rare since the view is filtered, but it's a good fallback.
    return (
      <p className="text-center text-[11px] text-gray-500">
        Assigned to another inspector.
      </p>
    );
  };

  return (
    <div className="group flex flex-col bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md">
      <div className="p-3 flex-grow space-y-3">
        <div>
          <h3 className="text-lg font-bold text-gray-800">
            {room.room_number}
          </h3>
          <p className="text-xs text-gray-600">
            {room.room_type_title || "Standard Room"}
          </p>
          {room.location_name && (
            <p className="text-[10px] text-gray-500">{room.location_name}</p>
          )}
        </div>

        <div
          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${config.color}`}
        >
          <StatusIcon className={`h-3.5 w-3.5`} />
          <span>{config.label}</span>
        </div>

        <div className="space-y-1.5 text-xs text-gray-600 pt-2 border-t">
          <div className="flex justify-between items-start">
            <span>Housekeeper:</span>
            <span className="font-semibold text-gray-800 text-right max-w-[60%]">
              {renderHousekeepers()}
            </span>
          </div>
          {room.updated_at && (
            <p className="text-[10px] text-gray-500 pt-1">
              Last Update:{" "}
              {new Date(room.updated_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </div>
      </div>
      <div className="p-3 border-t bg-gray-50/70 rounded-b-xl">
        {renderActionButtons()}
      </div>
    </div>
  );
};

export default InspectorRoomCard;
