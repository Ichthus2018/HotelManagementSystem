import {
  UserGroupIcon,
  CheckCircleIcon,
  SparklesIcon,
  ShieldCheckIcon,
  PaintBrushIcon,
  ArrowUturnLeftIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { useRoomActions } from "../../../../hooks/Admin/useRoomActions";

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

const RoomCard = ({ room, currentUser, onAdminAssign, inspectionWorkflow }) => {
  console.log(
    "🏷️ Rendering RoomCard for Room:",
    room.room_number,
    "with assignments:",
    room.room_assignments
  );

  const { tagSelf, updateStatus, isProcessing } = useRoomActions();

  // BETTER DATA HANDLING - Handle both array and object formats
  let assignment;
  if (
    Array.isArray(room.room_assignments) &&
    room.room_assignments.length > 0
  ) {
    // If it's an array with items, take the first one
    assignment = room.room_assignments[0];
  } else if (
    room.room_assignments &&
    typeof room.room_assignments === "object"
  ) {
    // If it's a single object, use it directly
    assignment = room.room_assignments;
  } else {
    // Fallback for no assignment
    assignment = {
      status: "Dirty",
      housekeepers: [],
      inspector: null,
      updated_at: null,
    };
  }

  // DEBUG: Log the assignment to see what we're working with
  console.log("🔍 Processed Assignment:", assignment);
  console.log("👥 Housekeepers:", assignment.housekeepers);
  console.log("👁️ Inspector:", assignment.inspector);

  const config = statusConfig[assignment.status] || statusConfig.Dirty;
  const StatusIcon = config.icon;

  const isAssignedHousekeeper = assignment.housekeepers?.includes(
    currentUser?.id
  );
  const isAssignedInspector = assignment.inspector === currentUser?.id;
  const renderActionButtons = () => {
    if (!currentUser) return null;

    switch (currentUser.role) {
      case "Admin":
        return (
          <button
            onClick={() => onAdminAssign(room)}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-gray-700 px-4 py-3 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-[1.03] active:scale-[0.97]"
          >
            <UserGroupIcon className="h-5 w-5" />
            Assign Staff
          </button>
        );

      case "Housekeeper":
        if (assignment.status === "Dirty") {
          return (
            <button
              onClick={() =>
                tagSelf({ userId: currentUser.id, roomId: room.id })
              }
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white shadow-md hover:shadow-lg disabled:opacity-60 transition-all duration-200 transform hover:scale-[1.03] active:scale-[0.97]"
            >
              <SparklesIcon className="h-5 w-5" />
              {isProcessing ? "Assigning..." : "Start Cleaning"}
            </button>
          );
        }
        if (assignment.status === "For Cleaning" && isAssignedHousekeeper) {
          const nextStatus = inspectionWorkflow ? "For Inspection" : "Clean";
          const buttonText = inspectionWorkflow
            ? "Ready for Inspection"
            : "Mark as Clean";
          const ButtonIcon = inspectionWorkflow
            ? ShieldCheckIcon
            : CheckCircleIcon;
          const buttonColor = inspectionWorkflow
            ? "bg-blue-600"
            : "bg-emerald-600";

          return (
            <button
              onClick={() =>
                updateStatus({ roomId: room.id, newStatus: nextStatus })
              }
              disabled={isProcessing}
              className={`w-full flex items-center justify-center gap-2 rounded-lg ${buttonColor} px-4 py-3 text-sm font-semibold text-white shadow-md hover:shadow-lg disabled:opacity-60 transition-all duration-200 transform hover:scale-[1.03] active:scale-[0.97]`}
            >
              <ButtonIcon className="h-5 w-5" />
              {isProcessing ? "Submitting..." : buttonText}
            </button>
          );
        }
        return (
          <p className="text-center text-xs text-gray-500 p-2">
            No actions available for you.
          </p>
        );

      case "Inspector":
        if (assignment.status === "For Inspection" && isAssignedInspector) {
          return (
            <div className="flex w-full gap-3">
              <button
                onClick={() =>
                  updateStatus({ roomId: room.id, newStatus: "For Cleaning" })
                }
                disabled={isProcessing}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-3 text-sm font-semibold text-white shadow-md hover:shadow-lg disabled:opacity-60 transition-all duration-200"
              >
                <ArrowUturnLeftIcon className="h-4 w-4" />
                Reject
              </button>
              <button
                onClick={() =>
                  updateStatus({ roomId: room.id, newStatus: "Clean" })
                }
                disabled={isProcessing}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-3 text-sm font-semibold text-white shadow-md hover:shadow-lg disabled:opacity-60 transition-all duration-200"
              >
                <CheckCircleIcon className="h-4 w-4" />
                Approve
              </button>
            </div>
          );
        }
        return (
          <p className="text-center text-xs text-gray-500 p-2">
            Not assigned to you for inspection.
          </p>
        );

      default:
        return (
          <p className="text-center text-xs text-gray-500 p-2">
            No actions available
          </p>
        );
    }
  };

  return (
    <div className="group flex flex-col bg-white border border-gray-200 rounded-2xl shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <div className="p-5 flex-grow space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-800">
              Room {room.room_number}
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              {room.room_types?.title || "Standard Room"}
            </p>
            {room.locations?.name && (
              <p className="text-xs text-gray-500 mt-1">
                {room.locations.name}
              </p>
            )}
          </div>
        </div>

        <div
          className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${config.color}`}
        >
          <StatusIcon className={`h-4 w-4 ${config.iconColor}`} />
          <span>{config.label}</span>
        </div>

        <div className="space-y-2 text-sm text-gray-600 pt-2">
          <div className="flex justify-between">
            <span>Housekeepers:</span>
            <span className="font-semibold text-gray-800">
              {
                /* This is safe because 'assignment.housekeepers' is guaranteed to be an array */
                assignment.housekeepers?.length || 0
              }
            </span>
          </div>
          <div className="flex justify-between">
            <span>Inspector:</span>
            <span className="font-semibold text-gray-800">
              {assignment.inspector ? "Assigned" : "Unassigned"}
            </span>
          </div>
          {assignment.updated_at && (
            <p className="text-xs text-gray-500 pt-2 border-t border-gray-100 mt-2">
              Updated:{" "}
              {new Date(assignment.updated_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
        {renderActionButtons()}
      </div>
    </div>
  );
};

export default RoomCard;
