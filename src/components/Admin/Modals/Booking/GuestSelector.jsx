import React, { Fragment, useState } from "react";
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Transition,
} from "@headlessui/react";
import { Check, ChevronsUpDown, Loader2, AlertTriangle } from "lucide-react";

export const GuestSelector = ({
  bookingForm,
  handleFormChange,
  guests,
  isLoading = false,
  error = null,
}) => {
  const [query, setQuery] = useState("");

  // Filtering logic
  const filteredGuests =
    query === ""
      ? guests
      : guests.filter((g) => {
          const fullName = `${g.first_name} ${g.last_name}`.toLowerCase();
          return (
            fullName.includes(query.toLowerCase()) ||
            (g.email || "").toLowerCase().includes(query.toLowerCase())
          );
        });

  if (isLoading) {
    return (
      <div className="flex items-center h-10 px-3 bg-gray-100 rounded-md">
        <Loader2 className="h-4 w-4 mr-2 animate-spin text-gray-500" />
        <span className="text-sm text-gray-500">Searching guests...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center h-10 px-3 text-red-700 bg-red-100 rounded-md">
        <AlertTriangle className="h-4 w-4 mr-2" />
        <span className="text-sm">Error: {error.message}</span>
      </div>
    );
  }

  return (
    <Combobox
      value={bookingForm.selectedGuest}
      onChange={(guest) => handleFormChange("selectedGuest", guest)}
    >
      <div className="relative">
        {/* Input */}
        <div className="relative w-full cursor-default overflow-hidden rounded-md border border-gray-300 bg-white text-left shadow-sm focus:outline-none">
          <ComboboxInput
            className="w-full h-10 px-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
            displayValue={(guest) =>
              guest
                ? `${guest.first_name} ${guest.last_name} (${
                    guest.email || "No Email"
                  })`
                : ""
            }
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search guest by name or email..."
          />
          <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronsUpDown className="h-4 w-4 text-gray-400" />
          </ComboboxButton>
        </div>

        {/* Dropdown Options */}
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <ComboboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-none">
            {filteredGuests.length === 0 && query !== "" ? (
              <div className="cursor-default select-none px-4 py-2 text-gray-500">
                No guests found.
              </div>
            ) : (
              filteredGuests.map((guest) => (
                <ComboboxOption
                  key={guest.id}
                  value={guest}
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
                        {guest.first_name} {guest.last_name}
                      </span>
                      <span
                        className={`block truncate text-sm ${
                          active ? "text-indigo-100" : "text-gray-500"
                        }`}
                      >
                        {guest.email || "No Email"}
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
              ))
            )}
          </ComboboxOptions>
        </Transition>
      </div>
    </Combobox>
  );
};
