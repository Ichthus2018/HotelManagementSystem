// src/components/Housekeeping/CleaningSessionModal.js

import { useState, useEffect, useMemo, Fragment } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import supabase from "../../../../services/supabaseClient";
import { IoIosCloseCircleOutline } from "react-icons/io";
import {
  ShieldCheckIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import Loader from "../../../ui/common/Loader";
import IssueReporter from "./IssueReporter";

const CleaningSessionModal = ({
  isOpen,
  onClose,
  room,
  updateStatus,
  currentUser,
}) => {
  const [checklistData, setChecklistData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkedItems, setCheckedItems] = useState(new Set());
  // New state to toggle the issue reporter form
  const [isReportingIssue, setIsReportingIssue] = useState(false);

  useEffect(() => {
    if (isOpen && room?.room_type_id) {
      const fetchChecklist = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const { data: areas, error: areasError } = await supabase
            .from("room_areas")
            .select(
              `*, checklist_items!inner(*, room_type_checklists!inner(*))`
            )
            .eq(
              "checklist_items.room_type_checklists.room_type_id",
              room.room_type_id
            )
            .order("created_at", { ascending: true });

          if (areasError) throw areasError;
          setChecklistData(areas);
        } catch (err) {
          console.error("Error fetching room-specific checklist:", err);
          setError("Failed to load the cleaning checklist for this room type.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchChecklist();
    } else {
      // Reset state when modal is closed or room is invalid
      setCheckedItems(new Set());
      setIsReportingIssue(false);
      if (isOpen && !room?.room_type_id) {
        setError("Cannot load checklist: Room Type information is missing.");
        setIsLoading(false);
      }
    }
  }, [isOpen, room]);

  const { totalItems, isChecklistComplete, progressPercentage } =
    useMemo(() => {
      const total = checklistData.reduce(
        (acc, area) => acc + area.checklist_items.length,
        0
      );
      const completed = checkedItems.size;
      const isComplete = total > 0 && completed === total;
      const percentage = total > 0 ? (completed / total) * 100 : 0;
      return {
        totalItems: total,
        isChecklistComplete: isComplete,
        progressPercentage: percentage,
      };
    }, [checklistData, checkedItems]);

  const handleToggleCheck = (itemId) => {
    setCheckedItems((prev) => {
      const newSet = new Set(prev);
      newSet.has(itemId) ? newSet.delete(itemId) : newSet.add(itemId);
      return newSet;
    });
  };

  const handleFinishCleaning = () => {
    const nextStatus = room.requires_inspection ? "For Inspection" : "Clean";
    updateStatus({ roomId: room.id, newStatus: nextStatus });
    onClose();
  };

  const toggleIssueReporter = () => setIsReportingIssue(!isReportingIssue);

  // Determine Final Action Button properties
  const { finalActionText, FinalActionIcon, isFinalActionDisabled } =
    useMemo(() => {
      const isInspectorRequired = room?.requires_inspection;
      const isInspectorAssigned = !!room?.inspector;

      if (isInspectorRequired) {
        if (isInspectorAssigned) {
          return {
            finalActionText: "Request Inspection",
            FinalActionIcon: ShieldCheckIcon,
            isFinalActionDisabled: !isChecklistComplete,
          };
        }
        return {
          finalActionText: "Awaiting Inspector",
          FinalActionIcon: ShieldCheckIcon,
          isFinalActionDisabled: true,
        };
      }
      return {
        finalActionText: "Mark as Clean",
        FinalActionIcon: CheckCircleIcon,
        isFinalActionDisabled: !isChecklistComplete,
      };
    }, [room, isChecklistComplete]);

  const renderChecklist = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-48">
          <Loader />
        </div>
      );
    }
    if (error) {
      return (
        <div className="p-4 text-center text-red-600 bg-red-50 rounded-lg">
          {error}
        </div>
      );
    }
    if (checklistData.length === 0) {
      return (
        <div className="p-4 text-center text-gray-500 bg-gray-100 rounded-lg">
          No checklist items have been assigned to this room type.
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        {checklistData.map((area) => (
          <div key={area.id}>
            <h5 className="font-semibold text-gray-800 mb-2">{area.name}</h5>
            <ul className="space-y-2">
              {area.checklist_items.map((item) => (
                <li key={item.id}>
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={checkedItems.has(item.id)}
                      onChange={() => handleToggleCheck(item.id)}
                      className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition"
                    />
                    <span
                      className={`ml-3 text-sm text-gray-700 transition-colors group-hover:text-gray-900 ${
                        checkedItems.has(item.id)
                          ? "line-through text-gray-400"
                          : ""
                      }`}
                    >
                      {item.name}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          {...{
            enter: "ease-out duration-300",
            enterFrom: "opacity-0",
            enterTo: "opacity-100",
            leave: "ease-in duration-200",
            leaveFrom: "opacity-100",
            leaveTo: "opacity-0",
          }}
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <TransitionChild
              as={Fragment}
              {...{
                enter: "ease-out duration-300",
                enterFrom: "opacity-0 scale-95",
                enterTo: "opacity-100 scale-100",
                leave: "ease-in duration-200",
                leaveFrom: "opacity-100 scale-100",
                leaveTo: "opacity-0 scale-95",
              }}
            >
              <DialogPanel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                {/* 1. HEADER: Clean and Standard */}
                <div className="flex items-start justify-between p-5 border-b border-gray-200">
                  <div>
                    <DialogTitle
                      as="h3"
                      className="text-xl font-semibold text-gray-900"
                    >
                      Cleaning Session: {room?.room_number}
                    </DialogTitle>
                    <p className="mt-1 text-sm text-gray-500">
                      Complete all tasks and report any issues found.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-1 ml-auto bg-transparent rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <IoIosCloseCircleOutline className="w-7 h-7" />
                  </button>
                </div>

                {/* 2. BODY: Contains progress and the main checklist */}
                <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-gray-700">Progress</span>
                      <span className="text-gray-500">
                        {checkedItems.size} / {totalItems} tasks
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Checklist Content */}
                  {renderChecklist()}
                </div>

                {/* 3. ISSUE REPORTER: Conditionally shown above the footer */}
                {isReportingIssue && (
                  <div className="p-6 border-t border-b bg-gray-50">
                    <IssueReporter
                      room={room}
                      currentUser={currentUser}
                      onCancel={toggleIssueReporter}
                    />
                  </div>
                )}

                {/* 4. FOOTER: All actions are now co-located here */}
                <div className="flex items-center justify-end p-5 space-x-3 bg-gray-50 border-t border-gray-200 rounded-b-2xl">
                  <button
                    type="button"
                    onClick={toggleIssueReporter}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
                  >
                    <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600" />
                    {isReportingIssue ? "Cancel Reporting" : "Report an Issue"}
                  </button>
                  <button
                    type="button"
                    onClick={handleFinishCleaning}
                    disabled={isFinalActionDisabled}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
                  >
                    <FinalActionIcon className="h-5 w-5" />
                    {finalActionText}
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default CleaningSessionModal;
