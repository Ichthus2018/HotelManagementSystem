import { useState, Fragment, useRef, useEffect } from "react";
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
  const inputRef = useRef(null);
  const [width, setWidth] = useState("auto");

  // Dynamically match dropdown width to input
  useEffect(() => {
    if (inputRef.current) {
      setWidth(`${inputRef.current.offsetWidth}px`);
    }
  }, [inputRef.current]);

  const filteredData =
    query === ""
      ? data
      : data.filter((item) =>
          item[nameKey].toLowerCase().includes(query.toLowerCase())
        );

  return (
    <Combobox value={selected} onChange={setSelected}>
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>

        <div className="relative mt-1" ref={inputRef}>
          <ComboboxInput
            className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-3 pr-10 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-400/60"
            displayValue={(item) => (item ? item[nameKey] : "")}
            onChange={(e) => setQuery(e.target.value)}
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
          <ComboboxOptions
            className="mt-1 max-h-64 overflow-auto rounded-xl border border-gray-200 bg-white py-2 text-sm shadow-lg ring-1 ring-black/5 focus:outline-none z-[9999]"
            style={{
              position: "fixed",
              width: width,
            }}
          >
            {filteredData.length === 0 && query !== "" ? (
              <div className="relative cursor-default select-none py-3 px-4 text-gray-500 text-center">
                Nothing found.
              </div>
            ) : (
              filteredData.map((item) => (
                <ComboboxOption
                  key={item.id}
                  value={item}
                  className={({ active }) =>
                    `relative cursor-pointer select-none py-3 pl-12 pr-4 ${
                      active
                        ? "bg-blue-50 text-blue-900"
                        : "text-gray-800 hover:bg-gray-50"
                    }`
                  }
                >
                  {({ selected, active }) => (
                    <>
                      <div className="flex flex-col leading-tight">
                        <span
                          className={`font-medium ${
                            active ? "text-blue-900" : "text-gray-900"
                          }`}
                        >
                          {item[nameKey]}
                        </span>
                        <span
                          className={`text-xs ${
                            active ? "text-blue-600" : "text-gray-500"
                          }`}
                        >
                          {item[codeKey]}
                        </span>
                      </div>

                      {selected && (
                        <span
                          className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                            active ? "text-blue-600" : "text-blue-500"
                          }`}
                        >
                          <HiCheck className="h-5 w-5" aria-hidden="true" />
                        </span>
                      )}
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
