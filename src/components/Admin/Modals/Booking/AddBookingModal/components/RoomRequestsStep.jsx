import { useMemo } from "react";
import {
  Users,
  Home,
  PlusCircle,
  XCircle as XCircleIcon,
  Info,
  AlertCircle,
} from "lucide-react";
import { useBookingContext } from "../AddBookingContext";
import { AvailableRoomSelector } from "../../../Booking/AvailableRoomSelector";

// --- FIX: Accept props from the parent component ---
const RoomRequestsStep = ({ isEditMode, initialData }) => {
  const { bookingForm, updateForm, addRoom, removeRoom, updateRoom } =
    useBookingContext();

  const totalBookingGuests = useMemo(
    () =>
      (Number(bookingForm.adults) || 0) + (Number(bookingForm.children) || 0),
    [bookingForm.adults, bookingForm.children]
  );

  const totalAllocatedGuests = useMemo(
    () =>
      bookingForm.selectedRooms.reduce(
        (sum, room) => sum + (Number(room.allocatedGuests) || 0),
        0
      ),
    [bookingForm.selectedRooms]
  );

  const totalCapacity = useMemo(
    () =>
      bookingForm.selectedRooms.reduce(
        (sum, selectedRoom) =>
          sum + (selectedRoom.room?.room_types?.guests_maximum || 0),
        0
      ),
    [bookingForm.selectedRooms]
  );

  const isGuestCountMismatch = totalAllocatedGuests !== totalBookingGuests;
  const isCapacityExceeded =
    totalBookingGuests > 0 &&
    totalCapacity > 0 &&
    totalBookingGuests > totalCapacity;

  const selectedRoomIds = useMemo(
    () => bookingForm.selectedRooms.map((r) => r.room?.id).filter(Boolean),
    [bookingForm.selectedRooms]
  );

  const handleUpdateRoom = (index, field, value) => {
    updateRoom(index, field, value);
  };

  return (
    <div className="space-y-8">
      <h3 className="text-lg font-semibold text-gray-800">
        Step 4: Room & Guest Allocation
      </h3>

      <div className="p-4 border border-indigo-200 rounded-lg bg-indigo-50/60">
        <h4 className="text-md font-semibold text-gray-800 flex items-center mb-4">
          <Users className="h-5 w-5 mr-2 text-indigo-600" />
          Number of Guests
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Adults</label>
            <input
              type="number"
              value={bookingForm.adults}
              onChange={(e) => updateForm("adults", Number(e.target.value))}
              min="1"
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">
              Children
            </label>
            <input
              type="number"
              value={bookingForm.children}
              onChange={(e) => updateForm("children", Number(e.target.value))}
              min="0"
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="flex items-center gap-3 pl-2 self-end">
            <div
              className={`h-10 w-10 text-white rounded-full flex items-center justify-center text-lg font-bold ${
                isGuestCountMismatch || isCapacityExceeded
                  ? "bg-red-500"
                  : "bg-indigo-600"
              }`}
            >
              {totalBookingGuests}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Total Guests</p>
              <p className="text-xs text-gray-500">
                {totalAllocatedGuests} allocated of {totalCapacity} capacity
              </p>
            </div>
          </div>
        </div>

        {(isGuestCountMismatch || isCapacityExceeded) && (
          <div className="mt-4 space-y-2">
            {isGuestCountMismatch && (
              <div className="flex items-center p-2 text-sm text-yellow-800 bg-yellow-100 rounded-md">
                <Info className="h-4 w-4 mr-2 flex-shrink-0" />
                Guest allocation does not match total guests.
              </div>
            )}
            {isCapacityExceeded && (
              <div className="flex items-center p-2 text-sm text-red-800 bg-red-100 rounded-md">
                <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                Capacity exceeded. Please add another room to accommodate all
                guests.
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h4 className="text-md font-semibold text-gray-700 flex items-center">
          <Home className="h-5 w-5 mr-2 text-gray-600" />
          Room Allocation
        </h4>
        {bookingForm.selectedRooms.map((selectedRoom, index) => {
          const maxGuestsForRoom =
            selectedRoom.room?.room_types?.guests_maximum;
          const isRoomOverfilled =
            maxGuestsForRoom && selectedRoom.allocatedGuests > maxGuestsForRoom;

          const minGuestsForRoom = selectedRoom.room?.room_types?.guests_base;
          return (
            <div
              key={index}
              className={`p-4 border rounded-lg bg-white shadow-sm space-y-4 ${
                isRoomOverfilled ? "border-red-400" : "border-gray-200"
              }`}
            >
              <div className="flex justify-between items-start">
                <h5 className="text-md font-semibold text-gray-800">
                  Room {index + 1}
                  {selectedRoom.room && (
                    <span className="text-xs font-normal text-gray-500 ml-2">
                      ( Base {minGuestsForRoom} / Max {maxGuestsForRoom} )
                    </span>
                  )}
                </h5>
                {bookingForm.selectedRooms.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRoom(index)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-full"
                  >
                    <XCircleIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Available Room
                  </label>
                  <AvailableRoomSelector
                    startDate={bookingForm.checkIn}
                    endDate={bookingForm.checkOut}
                    value={selectedRoom.room}
                    onChange={(roomObject) => {
                      handleUpdateRoom(index, "room", roomObject);
                    }}
                    disabledRooms={selectedRoomIds}
                    // --- FIX: isEditMode and initialData are now defined ---
                    currentBookingId={isEditMode ? initialData.id : null}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Guests in Room
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={maxGuestsForRoom}
                    value={selectedRoom.allocatedGuests}
                    onChange={(e) =>
                      handleUpdateRoom(
                        index,
                        "allocatedGuests",
                        Number(e.target.value)
                      )
                    }
                    className={`w-full h-10 px-3 border rounded-md shadow-sm ${
                      isRoomOverfilled
                        ? "border-red-500 ring-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  {isRoomOverfilled && (
                    <p className="mt-1 text-xs text-red-600">
                      Exceeds this room's capacity of {maxGuestsForRoom}.
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <button
          type="button"
          onClick={addRoom}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border-2 border-dashed border-blue-200 rounded-lg hover:bg-blue-100"
        >
          <PlusCircle className="h-5 w-5" />
          Add Another Room
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Special Requests
        </label>
        <textarea
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          value={bookingForm.specialRequests}
          onChange={(e) => updateForm("specialRequests", e.target.value)}
        />
      </div>
    </div>
  );
};

export default RoomRequestsStep;
