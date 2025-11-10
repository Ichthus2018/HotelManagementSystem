// src/components/Housekeeping/HousekeepingRoomCard.js

import { useState } from "react";
import {
  SparklesIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentCheckIcon,
} from "@heroicons/react/24/outline";
import { useRoomActions } from "../../../../hooks/Admin/useRoomActions";
import CleaningSessionModal from "./CleaningSessionModal";

const statusConfig = {
  Dirty: {
    color: "bg-red-100 text-red-800",
    label: "Dirty",
    icon: ExclamationTriangleIcon,
  },
  "For Cleaning": {
    color: "bg-yellow-100 text-yellow-800",
    label: "Cleaning in Progress",
    icon: ClockIcon,
  },
  "For Inspection": {
    color: "bg-blue-100 text-blue-800",
    label: "Pending Inspection",
    icon: ClockIcon,
  },
  Clean: {
    color: "bg-green-100 text-green-800",
    label: "Clean & Ready",
    icon: SparklesIcon,
  },
};

const HousekeepingRoomCard = ({ room, currentUser }) => {
  const { tagSelf, updateStatus, isProcessing } = useRoomActions();
  const [isCleaningModalOpen, setIsCleaningModalOpen] = useState(false);

  const status = room.status || "Dirty";
  const config = statusConfig[status] || statusConfig.Dirty;
  const StatusIcon = config.icon;

  const isAssignedToMe = room.housekeepers?.includes(currentUser?.id);
  const isUnassigned = !room.housekeepers || room.housekeepers.length === 0;

  const renderHousekeepers = () => {
    if (!room.housekeeper_details?.length) return "Unassigned";
    return room.housekeeper_details
      .map((hk) => `${hk.first_name} ${hk.last_name}`)
      .join(", ");
  };

  const renderInspector = () => {
    if (!room.requires_inspection)
      return <span className="text-gray-500">Not Required</span>;
    if (!room.inspector_details) return "Unassigned";
    return `${room.inspector_details.first_name} ${room.inspector_details.last_name}`;
  };

  const renderActionButtons = () => {
    if (!currentUser) return null;

    const baseBtn =
      "w-full flex items-center justify-center gap-1.5 rounded-md px-4 py-2 text-xs font-semibold text-white shadow transition-all";

    switch (status) {
      case "Dirty":
        if (isUnassigned || isAssignedToMe) {
          return (
            <button
              onClick={() =>
                tagSelf({ userId: currentUser.id, roomId: room.id })
              }
              disabled={isProcessing}
              className={`${baseBtn} bg-green-600 hover:bg-green-700 disabled:opacity-60`}
            >
              <SparklesIcon className="h-4 w-4" />
              {isProcessing ? "Assigning..." : "Start Cleaning"}
            </button>
          );
        }
        return (
          <p className="text-center text-[11px] text-gray-500">
            Assigned to another housekeeper.
          </p>
        );

      case "For Cleaning":
        if (isAssignedToMe) {
          return (
            <button
              onClick={() => setIsCleaningModalOpen(true)}
              className={`${baseBtn} bg-blue-600 hover:bg-blue-700`}
            >
              <ClipboardDocumentCheckIcon className="h-4 w-4" />
              Complete Checklist
            </button>
          );
        }
        return (
          <p className="text-center text-[11px] text-gray-500">
            Not assigned to you.
          </p>
        );

      case "For Inspection":
        return (
          <p className="text-center text-[11px] text-gray-500">
            Pending inspection.
          </p>
        );

      case "Clean":
        return (
          <p className="text-center text-[11px] text-gray-500">
            Room is clean and ready.
          </p>
        );

      default:
        return (
          <p className="text-center text-[11px] text-gray-500">
            No actions available.
          </p>
        );
    }
  };

  return (
    <>
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
            <StatusIcon className="h-3.5 w-3.5" />
            <span>{config.label}</span>
          </div>

          <div className="space-y-1.5 text-xs text-gray-600 pt-2 border-t">
            <div className="flex justify-between">
              <span>Housekeeper:</span>
              <span className="font-semibold text-gray-800 text-right">
                {renderHousekeepers()}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Inspector:</span>
              <span className="font-semibold text-gray-800 text-right">
                {renderInspector()}
              </span>
            </div>
          </div>
        </div>
        <div className="p-3 border-t bg-gray-50/70 rounded-b-xl">
          {renderActionButtons()}
        </div>
      </div>

      <CleaningSessionModal
        isOpen={isCleaningModalOpen}
        onClose={() => setIsCleaningModalOpen(false)}
        room={room}
        updateStatus={updateStatus}
        currentUser={currentUser}
      />
    </>
  );
};

export default HousekeepingRoomCard;
