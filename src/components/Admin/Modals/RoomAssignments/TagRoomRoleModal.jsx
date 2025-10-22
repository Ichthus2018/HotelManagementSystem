import { useState, useEffect, Fragment } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import {
  IoIosCloseCircleOutline,
  IoIosCheckmarkCircle,
  IoIosPeople,
  IoIosEye,
} from "react-icons/io";
import { useRoomActions } from "../../../../hooks/Admin/useRoomActions";

const TagRoomRoleModal = ({
  isOpen,
  onClose,
  roomToTag,
  housekeepers,
  inspectors,
  currentUser,
}) => {
  const [selectedHousekeepers, setSelectedHousekeepers] = useState([]);
  const [selectedInspector, setSelectedInspector] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const { assignStaff, isAssigning } = useRoomActions();

  useEffect(() => {
    if (roomToTag && isOpen) {
      const assignment = roomToTag.room_assignments?.[0];
      setSelectedHousekeepers(assignment?.housekeepers || []);
      setSelectedInspector(assignment?.inspector || "");
    } else {
      setSelectedHousekeepers([]);
      setSelectedInspector("");
      setSearchTerm("");
    }
  }, [roomToTag, isOpen]);

  const filteredHousekeepers = housekeepers.filter((user) =>
    `${user.first_name} ${user.last_name}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const handleHousekeeperToggle = (userId) => {
    setSelectedHousekeepers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedHousekeepers.length === filteredHousekeepers.length) {
      setSelectedHousekeepers([]);
    } else {
      setSelectedHousekeepers(filteredHousekeepers.map((user) => user.id));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!roomToTag) return;

    assignStaff(
      {
        roomId: roomToTag.id,
        housekeepers: selectedHousekeepers,
        inspector: selectedInspector,
      },
      {
        onSuccess: () => onClose(),
      }
    );
  };

  const handleClose = () => {
    if (!isAssigning) onClose();
  };

  const getSelectedHousekeeperNames = () => {
    return selectedHousekeepers
      .map((hkId) => {
        const user = housekeepers.find((u) => u.id === hkId);
        return user ? `${user.first_name} ${user.last_name}` : "";
      })
      .filter(Boolean);
  };

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
                    className="text-2xl text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                    aria-label="Close"
                  >
                    <IoIosCloseCircleOutline />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Current Status */}
                  {roomToTag?.room_assignments?.[0]?.status && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">Current Status:</span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            roomToTag.room_assignments[0].status === "Dirty"
                              ? "bg-red-100 text-red-800"
                              : roomToTag.room_assignments[0].status ===
                                "For Cleaning"
                              ? "bg-yellow-100 text-yellow-800"
                              : roomToTag.room_assignments[0].status ===
                                "For Inspection"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {roomToTag.room_assignments[0].status}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Housekeepers Section */}
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
                          {selectedHousekeepers.length ===
                          filteredHousekeepers.length
                            ? "Deselect All"
                            : "Select All"}
                        </button>
                      )}
                    </div>

                    {/* Search for Housekeepers */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search housekeepers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    {/* Selected Housekeepers Preview */}
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
                                className="hover:text-blue-900"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Housekeepers List */}
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
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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
                            : "No housekeepers available."}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Inspector Section */}
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <IoIosEye className="text-purple-500" />
                      Inspector
                      <span className="text-xs font-normal text-gray-500">
                        (Select one)
                      </span>
                    </label>
                    <select
                      value={selectedInspector}
                      onChange={(e) => setSelectedInspector(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="">-- Unassigned --</option>
                      {inspectors.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.first_name} {user.last_name} ({user.email})
                        </option>
                      ))}
                    </select>
                  </div>

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
                          {selectedInspector
                            ? inspectors.find((i) => i.id === selectedInspector)
                                ?.first_name +
                              " " +
                              inspectors.find((i) => i.id === selectedInspector)
                                ?.last_name
                            : "Unassigned"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isAssigning}
                      className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isAssigning}
                      className="inline-flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isAssigning ? (
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
