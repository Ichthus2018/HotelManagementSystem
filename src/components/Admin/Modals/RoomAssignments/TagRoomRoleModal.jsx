// src/components/Admin/Modals/RoomAssignments/TagRoomRoleModal.jsx

import { useState, useEffect, Fragment, useMemo } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
  Switch, // ✨ NEW: Import Switch
} from "@headlessui/react";
import {
  IoIosCloseCircleOutline,
  IoIosCheckmarkCircle,
  IoIosPeople,
  IoIosEye,
  IoIosSearch,
  IoIosWarning,
  IoIosEyeOff, // ✨ NEW: Import EyeOff icon
} from "react-icons/io";
import { useRoomActions } from "../../../../hooks/Admin/useRoomActions";

// ✨ NEW: A reusable Toggle Switch component
const ToggleSwitch = ({ enabled, setEnabled }) => (
  <Switch
    checked={enabled}
    onChange={setEnabled}
    className={`${
      enabled ? "bg-blue-600" : "bg-gray-200"
    } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
  >
    <span
      className={`${
        enabled ? "translate-x-6" : "translate-x-1"
      } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
    />
  </Switch>
);

const TagRoomRoleModal = ({
  isOpen,
  onClose,
  roomToTag,
  housekeepers = [],
  inspectors = [],
  currentUser,
  onAssignmentSuccess,
}) => {
  const [selectedHousekeepers, setSelectedHousekeepers] = useState([]);
  const [selectedInspector, setSelectedInspector] = useState("");
  // ✨ NEW: State for the inspection toggle
  const [requiresInspection, setRequiresInspection] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [errors, setErrors] = useState({});
  const { assignStaff, isProcessing } = useRoomActions();

  useEffect(() => {
    if (roomToTag && isOpen) {
      const assignment = roomToTag.room_assignments?.[0];
      setSelectedHousekeepers(assignment?.housekeepers || []);
      setSelectedInspector(assignment?.inspector || "");
      // ✨ NEW: Set toggle state from existing assignment data, default to true
      setRequiresInspection(assignment?.requires_inspection ?? true);
      setErrors({});
    } else {
      // Reset all state on close
      setSelectedHousekeepers([]);
      setSelectedInspector("");
      setRequiresInspection(true);
      setSearchTerm("");
      setErrors({});
    }
  }, [roomToTag, isOpen]);

  // ✨ NEW: Effect to clear inspector when toggle is off
  useEffect(() => {
    if (!requiresInspection) {
      setSelectedInspector("");
      setErrors((prev) => ({ ...prev, inspector: undefined }));
    }
  }, [requiresInspection]);

  // Memoized filtered housekeepers for better performance
  const filteredHousekeepers = useMemo(() => {
    return housekeepers.filter((user) =>
      `${user.first_name} ${user.last_name} ${user.email}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [housekeepers, searchTerm]);

  // 🔄 UPDATED: Validation is now conditional
  const validateForm = () => {
    const newErrors = {};
    if (selectedHousekeepers.length === 0) {
      newErrors.housekeepers = "At least one housekeeper must be selected";
    }
    // Only validate inspector if inspection is required
    if (requiresInspection && !selectedInspector) {
      newErrors.inspector = "An inspector must be selected";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleHousekeeperToggle = (userId) => {
    setSelectedHousekeepers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
    if (errors.housekeepers) {
      setErrors((prev) => ({ ...prev, housekeepers: "" }));
    }
  };

  const handleInspectorChange = (inspectorId) => {
    setSelectedInspector(inspectorId);
    if (errors.inspector) {
      setErrors((prev) => ({ ...prev, inspector: "" }));
    }
  };

  const handleSelectAll = () => {
    if (selectedHousekeepers.length === filteredHousekeepers.length) {
      setSelectedHousekeepers([]);
    } else {
      setSelectedHousekeepers(filteredHousekeepers.map((user) => user.id));
    }
    if (errors.housekeepers) {
      setErrors((prev) => ({ ...prev, housekeepers: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!roomToTag || !validateForm()) return;

    try {
      await assignStaff(
        {
          roomId: roomToTag.id,
          housekeepers: selectedHousekeepers,
          // 🔄 UPDATED: Send inspector only if required
          inspector: requiresInspection ? selectedInspector : null,
          assignedBy: currentUser.id,
          // ✨ NEW: Pass the toggle state
          requires_inspection: requiresInspection,
        },
        {
          onSuccess: () => {
            onClose();
            onAssignmentSuccess?.({
              room: roomToTag,
              housekeepers: selectedHousekeepers,
              inspector: selectedInspector,
              requires_inspection: requiresInspection,
            });
          },
          onError: (error) => {
            setErrors({ submit: error.message || "Failed to assign staff" });
          },
        }
      );
    } catch (error) {
      setErrors({ submit: error.message || "An unexpected error occurred" });
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      setErrors({});
      onClose();
    }
  };

  const getSelectedHousekeeperNames = () => {
    return selectedHousekeepers
      .map((hkId) => {
        const user = housekeepers.find((u) => u.id === hkId);
        return user ? `${user.first_name} ${user.last_name}` : "";
      })
      .filter(Boolean);
  };

  // 🔄 UPDATED: Helper reflects inspection requirement
  const getSelectedInspectorName = () => {
    if (!requiresInspection) return "Not Required";
    if (!selectedInspector) return "Unassigned";
    const inspector = inspectors.find((i) => i.id === selectedInspector);
    return inspector
      ? `${inspector.first_name} ${inspector.last_name}`
      : "Unassigned";
  };

  const allSelected =
    selectedHousekeepers.length === filteredHousekeepers.length &&
    filteredHousekeepers.length > 0;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </TransitionChild>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <DialogTitle
                    as="h3"
                    className="text-xl font-bold leading-6 text-gray-900"
                  >
                    Assign Staff for Room{" "}
                    <span className="font-bold text-blue-600">
                      {roomToTag?.room_number}
                    </span>
                  </DialogTitle>
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isProcessing}
                    className="text-2xl text-gray-400 hover:text-gray-600 focus:outline-none transition-colors disabled:opacity-50"
                    aria-label="Close"
                  >
                    <IoIosCloseCircleOutline />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <IoIosPeople className="text-blue-500" />
                        Housekeepers
                        <span className="text-xs font-normal text-gray-500">
                          (Select multiple)
                        </span>
                      </label>
                      {filteredHousekeepers.length > 0 && (
                        <button
                          type="button"
                          onClick={handleSelectAll}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {allSelected ? "Deselect All" : "Select All"}
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <IoIosSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                      <input
                        type="text"
                        placeholder="Search housekeepers by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    {errors.housekeepers && (
                      <div className="flex items-center gap-2 text-red-600 text-sm">
                        <IoIosWarning className="text-red-500" />
                        {errors.housekeepers}
                      </div>
                    )}
                    {selectedHousekeepers.length > 0 && (
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <IoIosCheckmarkCircle className="text-blue-500 text-sm" />
                          <span className="text-sm font-medium text-blue-800">
                            Selected ({selectedHousekeepers.length})
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {getSelectedHousekeeperNames().map((name, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs"
                            >
                              {name}
                              <button
                                type="button"
                                onClick={() =>
                                  handleHousekeeperToggle(
                                    selectedHousekeepers[index]
                                  )
                                }
                                className="hover:text-blue-900 text-xs"
                                disabled={isProcessing}
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="max-h-60 overflow-y-auto rounded-lg border border-gray-200">
                      {filteredHousekeepers.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                          {filteredHousekeepers.map((user) => (
                            <div
                              key={user.id}
                              className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors"
                            >
                              <input
                                id={`hk-${user.id}`}
                                type="checkbox"
                                checked={selectedHousekeepers.includes(user.id)}
                                onChange={() =>
                                  handleHousekeeperToggle(user.id)
                                }
                                disabled={isProcessing}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                              />
                              <label
                                htmlFor={`hk-${user.id}`}
                                className="flex-1 flex items-center justify-between cursor-pointer"
                              >
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {user.first_name} {user.last_name}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {user.email}
                                  </div>
                                </div>
                                {selectedHousekeepers.includes(user.id) && (
                                  <IoIosCheckmarkCircle className="text-green-500 text-lg" />
                                )}
                              </label>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 text-center text-gray-500">
                          {searchTerm
                            ? "No housekeepers match your search."
                            : housekeepers.length === 0
                            ? "No housekeepers available."
                            : "Start typing to search for housekeepers."}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ✨ NEW: Inspection Requirement Toggle Section */}
                  <div className="space-y-3 rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        {requiresInspection ? (
                          <IoIosEye className="text-purple-500" />
                        ) : (
                          <IoIosEyeOff className="text-gray-500" />
                        )}
                        Requires Inspection
                      </label>
                      <ToggleSwitch
                        enabled={requiresInspection}
                        setEnabled={setRequiresInspection}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      {requiresInspection
                        ? "An inspector must approve the room after cleaning."
                        : "Room will be 'Clean' right after the housekeeper finishes."}
                    </p>
                  </div>

                  {/* 🔄 UPDATED: Inspector Section is now conditional */}
                  {requiresInspection && (
                    <div className="space-y-3 transition-all duration-300">
                      <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <IoIosEye className="text-purple-500" />
                        Inspector
                        <span className="text-xs font-normal text-gray-500">
                          (Select one)
                        </span>
                      </label>
                      {errors.inspector && (
                        <div className="flex items-center gap-2 text-red-600 text-sm">
                          <IoIosWarning className="text-red-500" />
                          {errors.inspector}
                        </div>
                      )}
                      <select
                        value={selectedInspector}
                        onChange={(e) => handleInspectorChange(e.target.value)}
                        disabled={isProcessing || inspectors.length === 0}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50"
                      >
                        <option value="">-- Select Inspector --</option>
                        {inspectors.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.first_name} {user.last_name} ({user.email})
                          </option>
                        ))}
                      </select>
                      {inspectors.length === 0 && (
                        <p className="text-xs text-yellow-600">
                          No inspectors available. Please add inspectors first.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Summary */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">
                      Assignment Summary
                    </h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Housekeepers:</span>
                        <span className="font-medium">
                          {selectedHousekeepers.length} selected
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Inspector:</span>
                        <span className="font-medium">
                          {getSelectedInspectorName()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Submit Error */}
                  {errors.submit && (
                    <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                      <IoIosWarning className="text-red-500" />
                      {errors.submit}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isProcessing}
                      className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      // 🔄 UPDATED: Disabled logic is now conditional
                      disabled={
                        isProcessing ||
                        selectedHousekeepers.length === 0 ||
                        (requiresInspection && !selectedInspector)
                      }
                      className="inline-flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Assignments"
                      )}
                    </button>
                  </div>
                </form>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default TagRoomRoleModal;
