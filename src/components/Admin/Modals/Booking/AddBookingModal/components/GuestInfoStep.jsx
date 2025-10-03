import { Fragment, useState, useEffect, useMemo } from "react";
import {
  Combobox,
  ComboboxInput,
  ComboboxButton,
  ComboboxOptions,
  ComboboxOption,
  Transition,
} from "@headlessui/react";
import {
  XCircle as XCircleIcon,
  Check,
  ChevronsUpDown,
  Loader2,
  UserPlus,
  Search,
  Camera,
  FileImage,
  User,
} from "lucide-react";
import { useBookingContext } from "../AddBookingContext";
import { useDebouncedSupabaseSearch } from "../../../../../../hooks/Admin/useDebouncedSupabaseSearch";
import {
  regions,
  provinces,
  cities,
  barangays,
} from "select-philippines-address";

const GuestInfoStep = () => {
  const { bookingForm, updateForm } = useBookingContext();

  const {
    inputValue: query,
    setInputValue: setQuery,
    results: guests,
    isLoading: isSearching,
    clearInput,
  } = useDebouncedSupabaseSearch({
    tableName: "guests",
    selectQuery:
      "id, first_name, middle_name, last_name, email, contact_no, profile_image_url, street_address, region, province, city_municipality, barangay",
    searchColumns: ["first_name", "last_name", "email"],
    initialOrderBy: { column: "created_at", ascending: false },
    limit: 15,
  });

  const [addressData, setAddressData] = useState({
    regions: [],
    provinces: [],
    cities: [],
    barangays: [],
  });
  const [addressLoading, setAddressLoading] = useState({
    regions: false,
    provinces: false,
    cities: false,
    barangays: false,
  });

  const [selectedAddress, setSelectedAddress] = useState({
    region: "",
    province: "",
    city: "",
    barangay: "",
  });

  const imageSrc = useMemo(() => {
    return bookingForm.idPhoto
      ? URL.createObjectURL(bookingForm.idPhoto)
      : null;
  }, [bookingForm.idPhoto]);

  useEffect(() => {
    if (bookingForm.guestMode === "new") {
      setAddressLoading((prev) => ({ ...prev, regions: true }));
      regions()
        .then((data) =>
          setAddressData((prev) => ({ ...prev, regions: data || [] }))
        )
        .finally(() =>
          setAddressLoading((prev) => ({ ...prev, regions: false }))
        );
    }
  }, [bookingForm.guestMode]);

  const handleRegionChange = async (e) => {
    const regionCode = e.target.value;
    const selectedRegion = addressData.regions.find(
      (r) => r.region_code === regionCode
    );
    setSelectedAddress({
      region: regionCode,
      province: "",
      city: "",
      barangay: "",
    });
    updateForm("region", selectedRegion ? selectedRegion.region_name : "");
    updateForm("province", "");
    updateForm("cityMunicipality", "");
    updateForm("barangay", "");
    setAddressData((prev) => ({
      ...prev,
      provinces: [],
      cities: [],
      barangays: [],
    }));
    if (regionCode) {
      setAddressLoading((prev) => ({ ...prev, provinces: true }));
      const provinceData = await provinces(regionCode);
      setAddressData((prev) => ({ ...prev, provinces: provinceData || [] }));
      setAddressLoading((prev) => ({ ...prev, provinces: false }));
    }
  };

  const handleProvinceChange = async (e) => {
    const provinceCode = e.target.value;
    const selectedProvince = addressData.provinces.find(
      (p) => p.province_code === provinceCode
    );
    setSelectedAddress((prev) => ({
      ...prev,
      province: provinceCode,
      city: "",
      barangay: "",
    }));
    updateForm(
      "province",
      selectedProvince ? selectedProvince.province_name : ""
    );
    updateForm("cityMunicipality", "");
    updateForm("barangay", "");
    setAddressData((prev) => ({ ...prev, cities: [], barangays: [] }));
    if (provinceCode) {
      setAddressLoading((prev) => ({ ...prev, cities: true }));
      const cityData = await cities(provinceCode);
      setAddressData((prev) => ({ ...prev, cities: cityData || [] }));
      setAddressLoading((prev) => ({ ...prev, cities: false }));
    }
  };

  const handleCityChange = async (e) => {
    const cityCode = e.target.value;
    const selectedCity = addressData.cities.find(
      (c) => c.city_code === cityCode
    );
    setSelectedAddress((prev) => ({ ...prev, city: cityCode, barangay: "" }));
    updateForm("cityMunicipality", selectedCity ? selectedCity.city_name : "");
    updateForm("barangay", "");
    setAddressData((prev) => ({ ...prev, barangays: [] }));
    if (cityCode) {
      setAddressLoading((prev) => ({ ...prev, barangays: true }));
      const barangayData = await barangays(cityCode);
      setAddressData((prev) => ({ ...prev, barangays: barangayData || [] }));
      setAddressLoading((prev) => ({ ...prev, barangays: false }));
    }
  };

  const handleBarangayChange = (e) => {
    const barangayCode = e.target.value;
    const selectedBarangay = addressData.barangays.find(
      (b) => b.brgy_code === barangayCode
    );
    setSelectedAddress((prev) => ({ ...prev, barangay: barangayCode }));
    updateForm("barangay", selectedBarangay ? selectedBarangay.brgy_name : "");
  };

  const handleGuestModeChange = (mode) => {
    updateForm("guestMode", mode);
    setSelectedAddress({ region: "", province: "", city: "", barangay: "" });
    updateForm("region", "");
    updateForm("province", "");
    updateForm("cityMunicipality", "");
    updateForm("barangay", "");
    updateForm("streetAddress", "");
    updateForm("idPhoto", null);

    if (mode === "new") {
      updateForm("selectedGuest", null);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800">
        Step 3: Guest Information
      </h3>

      <div className="flex rounded-md shadow-sm">
        <button
          type="button"
          onClick={() => handleGuestModeChange("new")}
          className={`relative inline-flex items-center px-4 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
            bookingForm.guestMode === "new"
              ? "bg-blue-600 text-white border-blue-600 z-10"
              : "bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          <UserPlus className="h-5 w-5 mr-2" /> New Guest
        </button>
        <button
          type="button"
          onClick={() => handleGuestModeChange("existing")}
          className={`-ml-px relative inline-flex items-center px-4 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
            bookingForm.guestMode === "existing"
              ? "bg-blue-600 text-white border-blue-600 z-10"
              : "bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          <Search className="h-5 w-5 mr-2" /> Existing Guest
        </button>
      </div>

      {bookingForm.guestMode === "existing" && (
        <Combobox
          value={bookingForm.selectedGuest}
          onChange={(guest) => {
            updateForm("selectedGuest", guest);
            setQuery("");
          }}
        >
          <div className="relative">
            <div className="relative w-full cursor-default overflow-hidden rounded-md border border-gray-300 bg-white text-left shadow-sm focus-within:ring-1 focus-within:ring-blue-500">
              <ComboboxInput
                className="w-full border-none py-2 pl-3 pr-16 text-sm leading-5 text-gray-900 focus:ring-0"
                onChange={(event) => setQuery(event.target.value)}
                displayValue={(guest) =>
                  guest ? `${guest.first_name} ${guest.last_name}` : ""
                }
                placeholder="Search or select a guest..."
              />
              {query && (
                <button
                  type="button"
                  className="absolute inset-y-0 right-8 flex items-center p-2 text-gray-400 hover:text-gray-600"
                  onClick={() => {
                    clearInput();
                    updateForm("selectedGuest", null);
                  }}
                >
                  <XCircleIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              )}
              <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronsUpDown
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
              afterLeave={() => {
                if (!bookingForm.selectedGuest) setQuery("");
              }}
            >
              <ComboboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-none">
                {isSearching && (
                  <div className="relative cursor-default select-none py-2 px-4 text-gray-700 flex items-center">
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Searching...
                  </div>
                )}
                {!isSearching && guests.length === 0 ? (
                  <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                    {query ? "Nothing found." : "No recent guests found."}
                  </div>
                ) : (
                  guests.map((guest) => (
                    <ComboboxOption
                      key={guest.id}
                      value={guest}
                      className={({ active }) =>
                        `relative cursor-default select-none py-2 pl-10 pr-4 ${
                          active ? "bg-blue-600 text-white" : "text-gray-900"
                        }`
                      }
                    >
                      {({ selected, active }) => (
                        <>
                          <div>
                            <span
                              className={`block truncate ${
                                selected ? "font-medium" : "font-normal"
                              }`}
                            >
                              {guest.first_name} {guest.last_name}
                            </span>
                            <span
                              className={`block truncate text-xs ${
                                active ? "text-blue-100" : "text-gray-500"
                              }`}
                            >
                              {guest.email || "No Email"}
                            </span>
                          </div>
                          {selected ? (
                            <span
                              className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                active ? "text-white" : "text-blue-600"
                              }`}
                            >
                              <Check className="h-5 w-5" aria-hidden="true" />
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
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            First Name *
          </label>
          <input
            type="text"
            value={bookingForm.firstName}
            onChange={(e) => updateForm("firstName", e.target.value)}
            disabled={bookingForm.guestMode === "existing"}
            className="mt-1 w-full p-2 border border-gray-300 rounded-md disabled:bg-gray-100"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Middle Name
          </label>
          <input
            type="text"
            value={bookingForm.middleName}
            onChange={(e) => updateForm("middleName", e.target.value)}
            disabled={bookingForm.guestMode === "existing"}
            className="mt-1 w-full p-2 border border-gray-300 rounded-md disabled:bg-gray-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Last Name *
          </label>
          <input
            type="text"
            value={bookingForm.lastName}
            onChange={(e) => updateForm("lastName", e.target.value)}
            disabled={bookingForm.guestMode === "existing"}
            className="mt-1 w-full p-2 border border-gray-300 rounded-md disabled:bg-gray-100"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Contact No.
          </label>
          <input
            type="tel"
            value={bookingForm.contactNo}
            onChange={(e) => updateForm("contactNo", e.target.value)}
            disabled={bookingForm.guestMode === "existing"}
            className="mt-1 w-full p-2 border border-gray-300 rounded-md disabled:bg-gray-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            value={bookingForm.email}
            onChange={(e) => updateForm("email", e.target.value)}
            disabled={bookingForm.guestMode === "existing"}
            className="mt-1 w-full p-2 border border-gray-300 rounded-md disabled:bg-gray-100"
          />
        </div>
      </div>

      <div className="pt-4 border-t">
        <h4 className="text-md font-semibold text-gray-700 mb-4">Address</h4>
        {bookingForm.guestMode === "existing" ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Region
                </label>
                <input
                  type="text"
                  value={bookingForm.region || "N/A"}
                  disabled
                  className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Province
                </label>
                <input
                  type="text"
                  value={bookingForm.province || "N/A"}
                  disabled
                  className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-gray-100"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  City / Municipality
                </label>
                <input
                  type="text"
                  value={bookingForm.cityMunicipality || "N/A"}
                  disabled
                  className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Barangay
                </label>
                <input
                  type="text"
                  value={bookingForm.barangay || "N/A"}
                  disabled
                  className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-gray-100"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Street Address
              </label>
              <input
                type="text"
                value={bookingForm.streetAddress || "N/A"}
                disabled
                className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-gray-100"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Region
                </label>
                <select
                  value={selectedAddress.region}
                  onChange={handleRegionChange}
                  disabled={addressLoading.regions}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-md disabled:bg-gray-100"
                >
                  <option value="">
                    {addressLoading.regions ? "Loading..." : "Select Region"}
                  </option>
                  {addressData.regions.map((region) => (
                    <option key={region.region_code} value={region.region_code}>
                      {region.region_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Province
                </label>
                <select
                  value={selectedAddress.province}
                  onChange={handleProvinceChange}
                  disabled={!selectedAddress.region || addressLoading.provinces}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-md disabled:bg-gray-100"
                >
                  <option value="">
                    {addressLoading.provinces
                      ? "Loading..."
                      : "Select Province"}
                  </option>
                  {addressData.provinces.map((province) => (
                    <option
                      key={province.province_code}
                      value={province.province_code}
                    >
                      {province.province_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  City / Municipality
                </label>
                <select
                  value={selectedAddress.city}
                  onChange={handleCityChange}
                  disabled={!selectedAddress.province || addressLoading.cities}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-md disabled:bg-gray-100"
                >
                  <option value="">
                    {addressLoading.cities
                      ? "Loading..."
                      : "Select City/Municipality"}
                  </option>
                  {addressData.cities.map((city) => (
                    <option key={city.city_code} value={city.city_code}>
                      {city.city_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Barangay
                </label>
                <select
                  value={selectedAddress.barangay}
                  onChange={handleBarangayChange}
                  disabled={!selectedAddress.city || addressLoading.barangays}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-md disabled:bg-gray-100"
                >
                  <option value="">
                    {addressLoading.barangays
                      ? "Loading..."
                      : "Select Barangay"}
                  </option>
                  {addressData.barangays.map((barangay) => (
                    <option key={barangay.brgy_code} value={barangay.brgy_code}>
                      {barangay.brgy_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Street Address
              </label>
              <input
                type="text"
                value={bookingForm.streetAddress}
                onChange={(e) => updateForm("streetAddress", e.target.value)}
                className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                placeholder="House No., Street Name"
              />
            </div>
          </div>
        )}
      </div>

      <div className="bg-gray-50 p-4 rounded-lg border">
        <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
          <Camera /> ID Photo{" "}
          <span className="text-gray-500 font-normal">(Optional)</span>
        </label>
        <div className="mt-2 flex items-center gap-4">
          <label
            htmlFor="file-upload"
            className={`relative cursor-pointer w-40 h-24 bg-gray-200 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-md overflow-hidden group ${
              bookingForm.guestMode === "existing"
                ? "cursor-not-allowed bg-gray-300"
                : "hover:border-blue-500"
            }`}
          >
            {imageSrc ? (
              <img
                src={imageSrc}
                alt="ID Preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="text-gray-400 text-center">
                <FileImage className="h-8 w-8 mx-auto" />
                <span className="text-xs mt-1 block">Click to upload</span>
              </div>
            )}
            <input
              id="file-upload"
              name="file-upload"
              type="file"
              className="sr-only"
              accept="image/*"
              disabled={bookingForm.guestMode === "existing"}
              onChange={(e) =>
                updateForm("idPhoto", e.target.files ? e.target.files[0] : null)
              }
            />
          </label>
          {bookingForm.idPhoto && (
            <div>
              <p className="text-sm text-gray-600 truncate max-w-xs">
                {bookingForm.idPhoto.name}
              </p>
              <button
                type="button"
                onClick={() => updateForm("idPhoto", null)}
                className="text-sm text-red-600 hover:underline"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GuestInfoStep;
