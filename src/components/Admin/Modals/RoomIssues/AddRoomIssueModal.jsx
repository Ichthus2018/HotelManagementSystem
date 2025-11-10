import { useState, useEffect, Fragment } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import supabase from "../../../../services/supabaseClient";
import { IoIosCloseCircleOutline } from "react-icons/io";
import Loader from "../../../ui/common/Loader";

const issueStatuses = ["Reported", "In Progress", "Resolved"];

const AddRoomIssueModal = ({ isOpen, onClose, onSuccess, currentUser }) => {
  console.log(currentUser);

  const [roomId, setRoomId] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [status, setStatus] = useState("Reported");

  const [rooms, setRooms] = useState([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      const fetchRooms = async () => {
        setIsLoadingRooms(true);
        const { data, error } = await supabase
          .from("rooms")
          .select("id, room_number")
          .order("room_number", { ascending: true });
        if (error) {
          setError("Failed to fetch rooms.");
        } else {
          setRooms(data);
        }
        setIsLoadingRooms(false);
      };
      fetchRooms();
    }
  }, [isOpen]);

  const handleClose = () => {
    setRoomId("");
    setDescription("");
    setImageUrl("");
    setStatus("Reported");
    setError("");
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!roomId || !description.trim()) {
      setError("Room and description are required.");
      return;
    }
    setIsSubmitting(true);
    setError("");

    try {
      const { error: insertError } = await supabase.from("room_issues").insert([
        {
          room_id: roomId,
          reported_by: currentUser?.id,
          description,
          image_url: imageUrl || null,
          status,
        },
      ]);

      if (insertError) throw insertError;

      onSuccess();
      handleClose();
    } catch (err) {
      console.error("Error adding issue:", err);
      setError(err.message || "Failed to add issue.");
    } finally {
      setIsSubmitting(false);
    }
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
              <DialogPanel className="relative w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <button
                  type="button"
                  onClick={handleClose}
                  className="absolute top-4 right-4 text-3xl text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
                  aria-label="Close"
                >
                  <IoIosCloseCircleOutline />
                </button>
                <DialogTitle
                  as="h3"
                  className="text-lg font-semibold leading-6 text-gray-900"
                >
                  Report New Room Issue
                </DialogTitle>

                {isLoadingRooms ? (
                  <Loader />
                ) : (
                  <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    <div>
                      <label
                        htmlFor="roomId"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Room*
                      </label>
                      <select
                        id="roomId"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="" disabled>
                          Select a room
                        </option>
                        {rooms.map((room) => (
                          <option key={room.id} value={room.id}>
                            {room.room_number}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor="description"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Description*
                      </label>
                      <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows="3"
                        className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="imageUrl"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Image URL (Optional)
                      </label>
                      <input
                        type="text"
                        id="imageUrl"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="status"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Status
                      </label>
                      <select
                        id="status"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {issueStatuses.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <div className="mt-6 flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300"
                      >
                        {isSubmitting ? "Submitting..." : "Submit Issue"}
                      </button>
                    </div>
                  </form>
                )}
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default AddRoomIssueModal;
