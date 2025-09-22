import React, { Fragment, useMemo } from "react";
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Transition,
} from "@headlessui/react";
import { Check, ChevronsUpDown, Loader2, AlertTriangle } from "lucide-react";
import { useAvailableRooms } from "../../../../hooks/Admin/useAvailableRooms";

export const AvailableRoomSelector = ({
  startDate,
  endDate,
  value,
  onChange,
  disabledRooms = [],
}) => {
  const { availableRooms, isLoading, error, searchTerm, setSearchTerm } =
    useAvailableRooms({ startDate, endDate });

  if (!startDate || !endDate) {
    return (
      <div className="flex items-center h-10 px-3 text-sm text-gray-500 bg-gray-100 border border-gray-300 rounded-md shadow-sm">
        Please select check-in and check-out dates first.
      </div>
    );
  }

  const finalOptions = useMemo(() => {
    if (!availableRooms) return [];
    return availableRooms.filter(
      (room) => room.id === value?.id || !disabledRooms.includes(room.id)
    );
  }, [availableRooms, disabledRooms, value]);

  return (
    <Combobox value={value || null} onChange={onChange} nullable>
      <div className="relative">
        <div className="relative w-full cursor-default overflow-hidden rounded-md border border-gray-300 bg-white text-left shadow-sm focus-within:ring-1 focus-within:ring-indigo-500">
          <ComboboxInput
            className="w-full h-10 px-3 pr-10 text-sm leading-5 text-gray-900 border-none focus:ring-0"
            displayValue={(room) =>
              room && room.room_types
                ? `${room.room_number} - ${room.room_types.title}`
                : ""
            }
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search or select a room..."
          />
          <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronsUpDown className="h-4 w-4 text-gray-400" />
          </ComboboxButton>
        </div>

        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <ComboboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-none">
            {isLoading && (
              <div className="flex items-center p-2 text-gray-500">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </div>
            )}
            {error && (
              <div className="flex items-center p-2 text-red-600">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Error loading rooms
              </div>
            )}
            {!isLoading && !error && finalOptions.length === 0 && (
              <div className="p-2 text-gray-500">No available rooms found.</div>
            )}

            {finalOptions.map((room) => (
              <ComboboxOption
                key={room.id}
                value={room}
                className={({ active }) =>
                  `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                    active ? "bg-indigo-600 text-white" : "text-gray-900"
                  }`
                }
              >
                {({ selected, active }) => (
                  <>
                    <span
                      className={`block truncate ${
                        selected ? "font-medium" : "font-normal"
                      }`}
                    >
                      {room.room_number} -{" "}
                      {room.room_types?.title || "Unknown Type"}
                    </span>
                    {selected ? (
                      <span
                        className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                          active ? "text-white" : "text-indigo-600"
                        }`}
                      >
                        <Check className="h-4 w-4" />
                      </span>
                    ) : null}
                  </>
                )}
              </ComboboxOption>
            ))}
          </ComboboxOptions>
        </Transition>
      </div>
    </Combobox>
  );
};
