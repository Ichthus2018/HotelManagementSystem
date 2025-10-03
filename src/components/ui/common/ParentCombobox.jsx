import { useState, Fragment } from "react";
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Transition,
} from "@headlessui/react";
import { HiChevronUpDown, HiCheck } from "react-icons/hi2";

const ParentCombobox = ({
  label,
  data,
  selected,
  setSelected,
  placeholder = "Select...",
  nameKey,
  codeKey,
}) => {
  const [query, setQuery] = useState("");

  const filteredData =
    query === ""
      ? data
      : data.filter((item) => {
          return item[nameKey].toLowerCase().includes(query.toLowerCase());
        });

  return (
    <Combobox value={selected} onChange={setSelected}>
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        <div className="relative mt-1">
          <ComboboxInput
            className="w-full rounded-lg border border-gray-300 p-2 pr-10 focus:outline-none focus:ring-2 focus:ring-orange-500"
            displayValue={(item) => (item ? item[nameKey] : "")}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={placeholder}
          />
          <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2">
            <HiChevronUpDown
              className="h-5 w-5 text-gray-400"
              aria-hidden="true"
            />
          </ComboboxButton>
        </div>
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          afterLeave={() => setQuery("")}
        >
          <ComboboxOptions className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm z-10">
            {filteredData.length === 0 && query !== "" ? (
              <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                Nothing found.
              </div>
            ) : (
              filteredData.map((item) => (
                <ComboboxOption
                  key={item.id}
                  className={({ active }) =>
                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                      active ? "bg-orange-600 text-white" : "text-gray-900"
                    }`
                  }
                  value={item}
                >
                  {({ selected, active }) => (
                    <>
                      <span className="block truncate">
                        {item[nameKey]}
                        <p
                          className={`text-xs ${
                            active ? "text-orange-100" : "text-gray-500"
                          }`}
                        >
                          {item[codeKey]}
                        </p>
                      </span>
                      {selected ? (
                        <span
                          className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                            active ? "text-white" : "text-orange-600"
                          }`}
                        >
                          <HiCheck className="h-5 w-5" aria-hidden="true" />
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

export default ParentCombobox;
