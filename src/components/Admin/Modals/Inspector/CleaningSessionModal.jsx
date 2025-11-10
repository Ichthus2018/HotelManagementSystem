// src/components/Admin/Modals/RoomAssignments/CleaningSessionModal.js
import { useState, useEffect, useMemo, Fragment } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import supabase from "../../../../services/supabaseClient";
import {
  IoIosCloseCircleOutline,
  IoIosWarning,
  IoMdCamera,
} from "react-icons/io";
import { ShieldCheckIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import Loader from "../../../ui/common/Loader";

const CleaningSessionModal = ({
  isOpen,
  onClose,
  room,
  updateStatus,
  inspectionWorkflow,
}) => {
  const [checklistData, setChecklistData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkedItems, setCheckedItems] = useState(new Set());

  // Issue Reporting State
  const [issueDescription, setIssueDescription] = useState("");
  const [issuePhoto, setIssuePhoto] = useState(null);
  const [isSubmittingIssue, setIsSubmittingIssue] = useState(false);
  const [issueReported, setIssueReported] = useState(false);

  // Fetch checklist data when the modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchChecklist = async () => {
        setIsLoading(true);
        setError(null);
        setIssueReported(false); // Reset issue status on open
        try {
          const { data: areas, error: areasError } = await supabase
            .from("room_areas")
            .select("*, checklist_items(*)")
            .order("created_at", { ascending: true });

          if (areasError) throw areasError;

          setChecklistData(areas);
        } catch (err) {
          console.error("Error fetching checklist:", err);
          setError("Failed to load cleaning checklist.");
        } finally {
          setIsLoading(false);
        }
      };

      fetchChecklist();
    } else {
      // Reset state when modal closes
      setCheckedItems(new Set());
      setIssueDescription("");
      setIssuePhoto(null);
    }
  }, [isOpen]);

  const totalItems = useMemo(() => {
    return checklistData.reduce(
      (acc, area) => acc + area.checklist_items.length,
      0
    );
  }, [checklistData]);

  const isChecklistComplete = useMemo(() => {
    if (totalItems === 0) return false; // Can't complete an empty list
    return checkedItems.size === totalItems;
  }, [checkedItems, totalItems]);

  const handleToggleCheck = (itemId) => {
    setCheckedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setIssuePhoto(e.target.files[0]);
    }
  };

  const handleReportIssue = async (e) => {
    e.preventDefault();
    if (!issueDescription.trim()) {
      alert("Please provide a description for the issue.");
      return;
    }
    setIsSubmittingIssue(true);

    // Simulate API call
    await new Promise((res) => setTimeout(res, 1500));

    setIssueReported(true);
    setIssueDescription("");
    setIssuePhoto(null);
    setIsSubmittingIssue(false);
  };

  const handleRequestInspection = () => {
    const nextStatus = inspectionWorkflow ? "For Inspection" : "Clean";
    updateStatus({ roomId: room.id, newStatus: nextStatus });
    onClose();
  };

  const renderContent = () => {
    if (isLoading)
      return (
        <div className="flex justify-center p-8">
          <Loader />
        </div>
      );
    if (error)
      return (
        <div className="p-4 text-center text-red-600 bg-red-50 rounded-lg">
          {error}
        </div>
      );

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        {/* Checklist Section */}
        <div className="md:col-span-2">
          <h4 className="text-base font-semibold text-gray-800 border-b pb-2 mb-3">
            Cleaning Tasks
          </h4>
        </div>
        {checklistData.map((area) => (
          <div key={area.id}>
            <h5 className="font-semibold text-gray-700 mb-2">{area.name}</h5>
            <ul className="space-y-2">
              {area.checklist_items.map((item) => (
                <li key={item.id}>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checkedItems.has(item.id)}
                      onChange={() => handleToggleCheck(item.id)}
                      className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span
                      className={`ml-3 text-sm text-gray-700 ${
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

        {/* Issue Reporting Section */}
        <div className="md:col-span-2 border-t pt-6 mt-4">
          <h4 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <IoIosWarning className="text-yellow-500" size={20} /> Report an
            Issue
          </h4>
          {issueReported ? (
            <div className="p-4 text-center text-green-800 bg-green-100 rounded-lg">
              <p className="font-semibold">
                Thank you! Your issue has been reported.
              </p>
            </div>
          ) : (
            <form onSubmit={handleReportIssue} className="space-y-3">
              <textarea
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                rows="3"
                placeholder="Describe the issue (e.g., 'Broken lamp on bedside table')..."
                className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <label
                  htmlFor={`issue-photo-${room.id}`}
                  className="flex-1 w-full cursor-pointer inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                >
                  <IoMdCamera size={18} />
                  {issuePhoto ? `${issuePhoto.name}` : "Attach Photo"}
                </label>
                <input
                  id={`issue-photo-${room.id}`}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <button
                  type="submit"
                  disabled={isSubmittingIssue || !issueDescription.trim()}
                  className="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent bg-yellow-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:bg-yellow-300 disabled:cursor-not-allowed"
                >
                  {isSubmittingIssue ? "Submitting..." : "Submit Issue"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  };

  const finalActionText = inspectionWorkflow
    ? "Request Inspection"
    : "Mark as Clean";
  const FinalActionIcon = inspectionWorkflow
    ? ShieldCheckIcon
    : CheckCircleIcon;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-40" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60" />
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
              <DialogPanel className="relative w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute top-4 right-4 text-3xl text-gray-400 hover:text-gray-600 focus:outline-none z-10"
                >
                  <IoIosCloseCircleOutline />
                </button>
                <div className="p-6">
                  <DialogTitle
                    as="h3"
                    className="text-xl font-bold leading-6 text-gray-900"
                  >
                    Cleaning Session: Room {room?.room_number}
                  </DialogTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    Complete all tasks and report any issues before requesting
                    an inspection.
                  </p>
                </div>
                <div className="p-6 border-y bg-gray-50/50 max-h-[60vh] overflow-y-auto">
                  {renderContent()}
                </div>
                <div className="p-4 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="text-sm text-gray-600">
                    <span className="font-semibold">{checkedItems.size}</span> /{" "}
                    <span className="font-semibold">{totalItems}</span> tasks
                    completed
                  </div>
                  <button
                    type="button"
                    onClick={handleRequestInspection}
                    disabled={!isChecklistComplete}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
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
