import { useState } from "react";
import {
  UserGroupIcon,
  CheckCircleIcon,
  SparklesIcon,
  ShieldCheckIcon,
  ArrowUturnLeftIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentCheckIcon,
} from "@heroicons/react/24/outline";
import { useRoomActions } from "../../../../hooks/Admin/useRoomActions";
import CleaningSessionModal from "./CleaningSessionModal";

const statusConfig = {
  Dirty: {
    color: "bg-red-100 text-red-800 border-red-200",
    label: "Dirty",
    icon: ExclamationTriangleIcon,
    iconColor: "text-red-500",
  },
  "For Cleaning": {
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    label: "Cleaning in Progress",
    icon: ClockIcon,
    iconColor: "text-yellow-500",
  },
  "For Inspection": {
    color: "bg-blue-100 text-blue-800 border-blue-200",
    label: "Pending Inspection",
    icon: ShieldCheckIcon,
    iconColor: "text-blue-500",
  },
  Clean: {
    color: "bg-green-100 text-green-800 border-green-200",
    label: "Clean & Ready",
    icon: CheckCircleIcon,
    iconColor: "text-green-500",
  },
};

const RoomCard = ({ room, currentUser, onAdminAssign, staffData }) => {
  const { updateStatus, isProcessing } = useRoomActions();
  const [isCleaningModalOpen, setIsCleaningModalOpen] = useState(false);
  const assignment = room;
  // console.log(assignment); // 🔄 FIX: Removed console.log for cleanup.

  const config = statusConfig[assignment.status] || statusConfig.Dirty;
  const StatusIcon = config.icon;

  const isAssignedHousekeeper = assignment.housekeepers?.includes(
    currentUser?.id
  );
  const isAssignedInspector = assignment.inspector === currentUser?.id;

  const getHousekeeperDetails = () => {
    if (!assignment.housekeepers?.length) return [];
    if (assignment.housekeeper_details?.length)
      return assignment.housekeeper_details;
    if (staffData?.housekeepers)
      return assignment.housekeepers
        .map((id) => staffData.housekeepers.find((hk) => hk.id === id))
        .filter(Boolean);
    return [];
  };

  const getInspectorDetails = () => {
    if (!assignment.inspector) return null;
    if (assignment.users) return assignment.users;
    if (staffData?.inspectors)
      return staffData.inspectors.find(
        (insp) => insp.id === assignment.inspector
      );
    return null;
  };

  const renderHousekeepers = () => {
    const list = getHousekeeperDetails();
    if (!list.length) return "Unassigned";
    return (
      <div className="space-y-0.5">
        {list.map((hk, i) =>
          hk ? (
            <div key={hk.id || i} className="flex flex-col text-xs">
              <span className="font-semibold text-gray-800">
                {hk.first_name} {hk.last_name}
              </span>
              {hk.workflow_role && Array.isArray(hk.workflow_role) && (
                <span className="text-[10px] text-gray-500 capitalize">
                  {hk.workflow_role
                    .map((role) => role.toLowerCase())
                    .join(", ")}
                </span>
              )}
            </div>
          ) : null
        )}
      </div>
    );
  };

  const renderInspector = () => {
    if (!assignment.requires_inspection) {
      return (
        <span className="text-xs font-medium text-gray-500">Not Required</span>
      );
    }

    const insp = getInspectorDetails();
    return insp ? (
      <span className="font-semibold text-gray-800 text-xs">
        {insp.first_name} {insp.last_name}
      </span>
    ) : (
      "Unassigned"
    );
  };

  const renderActionButtons = () => {
    if (!currentUser) return null;

    const baseBtn =
      "w-full flex items-center justify-center gap-1.5 rounded-md text-xs font-semibold text-white shadow transition-all duration-150";
    const userRoles = currentUser.workflow_role || [];

    const isHousekeeper = userRoles.includes("Housekeeping");
    const isInspector = userRoles.includes("Inspector");
    const isRoomUnassigned =
      !assignment.housekeepers || assignment.housekeepers.length === 0;

    switch (assignment.status) {
      case "Dirty":
        if (isHousekeeper) {
          if (isAssignedHousekeeper) {
            return (
              <button
                onClick={() =>
                  updateStatus({ roomId: room.id, newStatus: "For Cleaning" })
                }
                disabled={isProcessing}
                className={`${baseBtn} bg-green-600 py-2 hover:bg-green-700 disabled:opacity-60`}
              >
                <SparklesIcon className="h-4 w-4" />
                {isProcessing ? "Starting..." : "Start Cleaning"}
              </button>
            );
          } else if (isRoomUnassigned) {
            return (
              <p className="text-center text-[11px] text-gray-500">
                Room is unassigned.
              </p>
            );
          } else {
            return (
              <p className="text-center text-[11px] text-gray-500">
                Assigned to another housekeeper.
              </p>
            );
          }
        }
        if (isInspector) {
          return (
            <p className="text-center text-[11px] text-gray-500">
              Room is dirty.
            </p>
          );
        }
        break;

      case "For Cleaning":
        if (isHousekeeper) {
          if (isAssignedHousekeeper) {
            return (
              <button
                onClick={() => setIsCleaningModalOpen(true)}
                disabled={isProcessing}
                className={`${baseBtn} bg-blue-600 hover:bg-blue-700 py-2 disabled:opacity-60`}
              >
                <ClipboardDocumentCheckIcon className="h-4 w-4" />
                Complete Checklist
              </button>
            );
          } else {
            return (
              <p className="text-center text-[11px] text-gray-500">
                Not assigned to you.
              </p>
            );
          }
        }
        if (isInspector) {
          return (
            <p className="text-center text-[11px] text-gray-500">
              Waiting for inspection.
            </p>
          );
        }
        break;

      case "For Inspection":
        if (isInspector) {
          if (isAssignedInspector) {
            return (
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    updateStatus({ roomId: room.id, newStatus: "For Cleaning" })
                  }
                  disabled={isProcessing}
                  className={`${baseBtn} flex-1 bg-red-600 hover:bg-red-700 py-2`}
                >
                  <ArrowUturnLeftIcon className="h-4 w-4" />
                  Reject
                </button>
                <button
                  onClick={() =>
                    updateStatus({ roomId: room.id, newStatus: "Clean" })
                  }
                  disabled={isProcessing}
                  className={`${baseBtn} flex-1 bg-emerald-600 hover:bg-emerald-700 py-2`}
                >
                  <CheckCircleIcon className="h-4 w-4" />
                  Approve
                </button>
              </div>
            );
          } else {
            return (
              <p className="text-center text-[11px] text-gray-500">
                Not assigned to you.
              </p>
            );
          }
        }
        if (isHousekeeper) {
          return (
            <p className="text-center text-[11px] text-gray-500">
              Pending inspection.
            </p>
          );
        }
        break;

      case "Clean":
        if (isHousekeeper || isInspector) {
          return (
            <p className="text-center text-[11px] text-gray-500">
              Room is clean and ready.
            </p>
          );
        }
        break;
    }

    if (currentUser.admin || currentUser.sidebar_role === "Admin") {
      return (
        <div className="space-y-2">
          <div>
            <label
              htmlFor={`status-select-${room.id}`}
              className="block text-[10px] text-gray-500 mb-1"
            >
              Change Status
            </label>
            <select
              id={`status-select-${room.id}`}
              value={assignment.status}
              onChange={(e) =>
                updateStatus({ roomId: room.id, newStatus: e.target.value })
              }
              disabled={isProcessing}
              className="w-full rounded-lg border-gray-200 bg-gray-50 text-sm text-gray-700 shadow-inner focus:border-blue-500 focus:ring-2 focus:ring-blue-300 disabled:bg-gray-100 transition-all duration-150"
            >
              <option>Dirty</option>
              <option>For Cleaning</option>
              <option>For Inspection</option>
              <option>Clean</option>
            </select>
          </div>
          <button
            onClick={() => onAdminAssign(room)}
            className={`${baseBtn} bg-gray-700 py-2 hover:bg-gray-800`}
          >
            <UserGroupIcon className="h-4 w-4" />
            Manage Staff
          </button>
        </div>
      );
    }

    return (
      <p className="text-center text-[11px] text-gray-500">
        No actions available.
      </p>
    );
  };

  return (
    <>
      <div className="group flex flex-col bg-white border border-gray-200 rounded-xl shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
        <div className="p-3 flex-grow space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-800">
                {room.room_number}
              </h3>
              {/* 🔄 FIX: Changed room.room_types?.title to room.room_type_title */}
              <p className="text-xs text-gray-600">
                {room.room_type_title || "Standard Room"}
              </p>
              {/* 🔄 FIX: Changed room.locations?.name to room.location_name */}
              {room.location_name && (
                <p className="text-[10px] text-gray-500">
                  {room.location_name}
                </p>
              )}
            </div>
          </div>

          <div
            className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${config.color}`}
          >
            <StatusIcon className={`h-3.5 w-3.5 ${config.iconColor}`} />
            <span>{config.label}</span>
          </div>

          <div className="space-y-1 text-xs text-gray-600 pt-1">
            <div className="flex justify-between items-start">
              <span>Housekeepers:</span>
              <div className="text-right font-semibold text-gray-800 max-w-[55%]">
                {renderHousekeepers()}
              </div>
            </div>
            <div className="flex justify-between">
              <span>Inspector:</span>
              {renderInspector()}
            </div>
            {assignment.updated_at && (
              <p className="text-[10px] text-gray-500 pt-1 border-t border-gray-100 mt-1">
                Updated:{" "}
                {new Date(assignment.updated_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
          </div>
        </div>
        <div className="p-3 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          {renderActionButtons()}
        </div>
      </div>

      <CleaningSessionModal
        isOpen={isCleaningModalOpen}
        onClose={() => setIsCleaningModalOpen(false)}
        room={room}
        updateStatus={updateStatus}
        inspectionWorkflow={assignment.requires_inspection}
      />
    </>
  );
};

export default RoomCard;
