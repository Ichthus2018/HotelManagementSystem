// src/components/Admin/Modals/Hotel/AddHotelModal.jsx

import { useState, Fragment, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import supabase from "../../../../services/supabaseClient";
import { IoMdCloseCircle } from "react-icons/io";
import { Country, State, City } from "country-state-city";
import StarRatingInput from "../../../ui/common/StarRatingInput";

// Import address libraries conditionally
let phAddressLib = null;
if (typeof window !== "undefined") {
  try {
    phAddressLib = await import("select-philippines-address");
  } catch (error) {
    console.log("Philippines address library not available");
  }
}

const AddHotelModal = ({ isOpen, onClose, onSuccess }) => {
  const inputStyles =
    "mt-1 w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-orange-500";
  const labelStyles = "block text-sm font-medium text-gray-700";

  const countryOptions = useMemo(() => {
    const allCountryNames = Country.getAllCountries().map(
      (country) => country.name
    );
    const filteredNames = allCountryNames.filter(
      (name) => name !== "Philippines"
    );
    filteredNames.sort();
    return ["Philippines", ...filteredNames];
  }, []);

  // Form states
  const [formData, setFormData] = useState({
    hotel_name: "",
    star_rating: 0, // Changed initial state to 0 for clarity
    tin_number: "",
    phone_number: "",
    email: "",
    website: "",
    address_line_1: "",
    address_line_2: "",
    city: "",
    province: "",
    region: "",
    country: "Philippines",
    postal_code: "",
    social_media_links: { facebook: "", instagram: "" },
  });

  // Philippines address states
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
  const [selectedAddressCodes, setSelectedAddressCodes] = useState({
    region: "",
    province: "",
    city: "",
  });

  // International address states
  const [internationalAddressData, setInternationalAddressData] = useState({
    states: [],
    cities: [],
  });
  const [internationalAddressLoading, setInternationalAddressLoading] =
    useState({
      states: false,
      cities: false,
    });
  const [selectedLocation, setSelectedLocation] = useState({
    countryCode: "",
    stateCode: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && formData.country === "Philippines" && phAddressLib) {
      loadRegions();
    }
  }, [isOpen, formData.country]);

  const loadRegions = async () => {
    setAddressLoading((prev) => ({ ...prev, regions: true }));
    try {
      const regions = await phAddressLib.regions();
      setAddressData((prev) => ({ ...prev, regions: regions || [] }));
    } catch (err) {
      console.error("Failed to load regions:", err);
    } finally {
      setAddressLoading((prev) => ({ ...prev, regions: false }));
    }
  };

  const handleInputChange = (field, value) => {
    if (field === "country") {
      setFormData((prev) => ({
        ...prev,
        country: value,
        region: "",
        province: "",
        city: "",
      }));

      setSelectedAddressCodes({ region: "", province: "", city: "" });
      setAddressData({ regions: [], provinces: [], cities: [], barangays: [] });

      setInternationalAddressData({ states: [], cities: [] });
      setSelectedLocation({ countryCode: "", stateCode: "" });

      if (value !== "Philippines") {
        const countryInfo = Country.getAllCountries().find(
          (c) => c.name === value
        );
        if (countryInfo) {
          setSelectedLocation((prev) => ({
            ...prev,
            countryCode: countryInfo.isoCode,
          }));
          setInternationalAddressLoading((prev) => ({ ...prev, states: true }));
          try {
            const states = State.getStatesOfCountry(countryInfo.isoCode);
            setInternationalAddressData({
              states: states || [],
              cities: [],
            });
          } catch (error) {
            console.error("Failed to load states:", error);
            setInternationalAddressData({ states: [], cities: [] });
          } finally {
            setInternationalAddressLoading((prev) => ({
              ...prev,
              states: false,
            }));
          }
        }
      }
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleSocialMediaChange = (platform, value) => {
    setFormData((prev) => ({
      ...prev,
      social_media_links: {
        ...prev.social_media_links,
        [platform]: value,
      },
    }));
  };

  const handleAddressChange = async (type, value, code) => {
    setSelectedAddressCodes((prev) => ({ ...prev, [type]: code }));

    if (type === "region" && phAddressLib) {
      handleInputChange("region", value);
      setAddressData((prev) => ({ ...prev, provinces: [], cities: [] }));
      if (code) {
        setAddressLoading((prev) => ({ ...prev, provinces: true }));
        try {
          const provinces = await phAddressLib.provinces(code);
          setAddressData((prev) => ({ ...prev, provinces: provinces || [] }));
        } catch (err) {
          console.error("Failed to load provinces:", err);
        } finally {
          setAddressLoading((prev) => ({ ...prev, provinces: false }));
        }
      }
    } else if (type === "province" && phAddressLib) {
      handleInputChange("province", value);
      setAddressData((prev) => ({ ...prev, cities: [] }));
      if (code) {
        setAddressLoading((prev) => ({ ...prev, cities: true }));
        try {
          const cities = await phAddressLib.cities(code);
          setAddressData((prev) => ({ ...prev, cities: cities || [] }));
        } catch (err) {
          console.error("Failed to load cities:", err);
        } finally {
          setAddressLoading((prev) => ({ ...prev, cities: false }));
        }
      }
    } else if (type === "city") {
      handleInputChange("city", value);
    }
  };

  const handleInternationalStateChange = (stateName, stateCode) => {
    setFormData((prev) => ({ ...prev, province: stateName, city: "" }));
    setSelectedLocation((prev) => ({ ...prev, stateCode: stateCode }));
    setInternationalAddressData((prev) => ({ ...prev, cities: [] }));

    if (stateCode && selectedLocation.countryCode) {
      setInternationalAddressLoading((prev) => ({ ...prev, cities: true }));
      try {
        const cities = City.getCitiesOfState(
          selectedLocation.countryCode,
          stateCode
        );
        setInternationalAddressData((prev) => ({
          ...prev,
          cities: cities || [],
        }));
      } catch (error) {
        console.error("Failed to load cities:", error);
        setInternationalAddressData((prev) => ({ ...prev, cities: [] }));
      } finally {
        setInternationalAddressLoading((prev) => ({ ...prev, cities: false }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.hotel_name.trim() ||
      !formData.address_line_1.trim() ||
      !formData.city.trim() ||
      !formData.country.trim()
    ) {
      setError("Hotel name, address line 1, city, and country are required.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const { data, error: insertError } = await supabase
        .from("hotel_information")
        .insert([
          {
            ...formData,
            star_rating: formData.star_rating
              ? parseInt(formData.star_rating)
              : null,
            social_media_links: Object.fromEntries(
              Object.entries(formData.social_media_links).filter(([_, value]) =>
                value.trim()
              )
            ),
          },
        ])
        .select();

      if (insertError) throw insertError;
      onSuccess(data[0]);
      handleClose();
    } catch (err) {
      console.error("Error adding hotel:", err);
      setError(err.message || "Failed to add hotel.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setFormData({
      hotel_name: "",
      star_rating: 0,
      tin_number: "",
      phone_number: "",
      email: "",
      website: "",
      address_line_1: "",
      address_line_2: "",
      city: "",
      province: "",
      region: "",
      country: "Philippines",
      postal_code: "",
      social_media_links: { facebook: "", instagram: "" },
    });
    setError("");
    onClose();
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
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="relative w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 sm:p-8 text-left align-middle shadow-xl transition-all">
                <button
                  type="button"
                  onClick={handleClose}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 rounded-full"
                >
                  <IoMdCloseCircle className="h-7 w-7" />
                </button>

                <DialogTitle
                  as="h3"
                  className="text-2xl font-bold leading-6 text-gray-900 mb-6"
                >
                  Add New Hotel
                </DialogTitle>

                <form
                  onSubmit={handleSubmit}
                  className="space-y-8 max-h-[70vh] overflow-y-auto pr-2"
                >
                  {/* Basic Information */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">
                      Basic Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="hotel_name" className={labelStyles}>
                          Hotel Name *
                        </label>
                        <input
                          type="text"
                          id="hotel_name"
                          value={formData.hotel_name}
                          onChange={(e) =>
                            handleInputChange("hotel_name", e.target.value)
                          }
                          className={inputStyles}
                          required
                        />
                      </div>
                      {/* --- MODIFIED SECTION START --- */}
                      <div>
                        <label className={labelStyles}>Star Rating</label>
                        <StarRatingInput
                          rating={formData.star_rating}
                          onRatingChange={(rating) =>
                            handleInputChange("star_rating", rating)
                          }
                        />
                      </div>
                      {/* --- MODIFIED SECTION END --- */}
                      <div>
                        <label htmlFor="tin_number" className={labelStyles}>
                          TIN Number
                        </label>
                        <input
                          type="text"
                          id="tin_number"
                          value={formData.tin_number}
                          onChange={(e) =>
                            handleInputChange("tin_number", e.target.value)
                          }
                          className={inputStyles}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">
                      Contact Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="phone_number" className={labelStyles}>
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          id="phone_number"
                          value={formData.phone_number}
                          onChange={(e) =>
                            handleInputChange("phone_number", e.target.value)
                          }
                          className={inputStyles}
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className={labelStyles}>
                          Email
                        </label>
                        <input
                          type="email"
                          id="email"
                          value={formData.email}
                          onChange={(e) =>
                            handleInputChange("email", e.target.value)
                          }
                          className={inputStyles}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label htmlFor="website" className={labelStyles}>
                          Website
                        </label>
                        <input
                          type="url"
                          id="website"
                          value={formData.website}
                          onChange={(e) =>
                            handleInputChange("website", e.target.value)
                          }
                          className={inputStyles}
                          placeholder="https://example.com"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">
                      Address Information
                    </h4>
                    <div className="space-y-4">
                      {/* Country and Postal Code on same line */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Country - takes 2/3 of the space */}
                        <div className="md:col-span-2">
                          <label htmlFor="country" className={labelStyles}>
                            Country *
                          </label>
                          <select
                            id="country"
                            value={formData.country}
                            onChange={(e) =>
                              handleInputChange("country", e.target.value)
                            }
                            className={inputStyles}
                            required
                          >
                            {countryOptions.map((country) => (
                              <option key={country} value={country}>
                                {country}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Postal Code - takes 1/3 of the space */}
                        <div>
                          <label htmlFor="postal_code" className={labelStyles}>
                            Postal Code *
                          </label>
                          <input
                            type="text"
                            id="postal_code"
                            value={formData.postal_code}
                            onChange={(e) =>
                              handleInputChange("postal_code", e.target.value)
                            }
                            className={inputStyles}
                            required
                            placeholder="ZIP code"
                          />
                        </div>
                      </div>

                      {/* Conditional: Philippines vs International */}
                      {formData.country === "Philippines" && phAddressLib ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <label htmlFor="region" className={labelStyles}>
                              Region *
                            </label>
                            <select
                              id="region"
                              value={selectedAddressCodes.region}
                              onChange={(e) =>
                                handleAddressChange(
                                  "region",
                                  e.target.options[e.target.selectedIndex].text,
                                  e.target.value
                                )
                              }
                              disabled={addressLoading.regions}
                              className={inputStyles}
                              required
                            >
                              <option value="">
                                {addressLoading.regions
                                  ? "Loading..."
                                  : "Select Region"}
                              </option>
                              {addressData.regions.map((region) => (
                                <option
                                  key={region.region_code}
                                  value={region.region_code}
                                >
                                  {region.region_name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label htmlFor="province" className={labelStyles}>
                              Province *
                            </label>
                            <select
                              id="province"
                              value={selectedAddressCodes.province}
                              onChange={(e) =>
                                handleAddressChange(
                                  "province",
                                  e.target.options[e.target.selectedIndex].text,
                                  e.target.value
                                )
                              }
                              disabled={
                                !selectedAddressCodes.region ||
                                addressLoading.provinces
                              }
                              className={inputStyles}
                              required
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

                          <div>
                            <label htmlFor="city" className={labelStyles}>
                              City/Municipality *
                            </label>
                            <select
                              id="city"
                              value={selectedAddressCodes.city}
                              onChange={(e) =>
                                handleAddressChange(
                                  "city",
                                  e.target.options[e.target.selectedIndex].text,
                                  e.target.value
                                )
                              }
                              disabled={
                                !selectedAddressCodes.province ||
                                addressLoading.cities
                              }
                              className={inputStyles}
                              required
                            >
                              <option value="">
                                {addressLoading.cities
                                  ? "Loading..."
                                  : "Select City"}
                              </option>
                              {addressData.cities.map((city) => (
                                <option
                                  key={city.city_code}
                                  value={city.city_code}
                                >
                                  {city.city_name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label htmlFor="province" className={labelStyles}>
                              Province/State *
                            </label>
                            {formData.country &&
                            internationalAddressData.states.length > 0 ? (
                              <select
                                id="province"
                                value={selectedLocation.stateCode}
                                onChange={(e) =>
                                  handleInternationalStateChange(
                                    e.target.options[e.target.selectedIndex]
                                      .text,
                                    e.target.value
                                  )
                                }
                                disabled={internationalAddressLoading.states}
                                className={inputStyles}
                                required
                              >
                                <option value="">
                                  {internationalAddressLoading.states
                                    ? "Loading..."
                                    : "Select State"}
                                </option>
                                {internationalAddressData.states.map(
                                  (state) => (
                                    <option
                                      key={state.isoCode}
                                      value={state.isoCode}
                                    >
                                      {state.name}
                                    </option>
                                  )
                                )}
                              </select>
                            ) : (
                              <input
                                type="text"
                                id="province"
                                value={formData.province}
                                onChange={(e) =>
                                  handleInputChange("province", e.target.value)
                                }
                                className={inputStyles}
                                required
                                placeholder="Enter province or state"
                              />
                            )}
                          </div>
                          <div>
                            <label htmlFor="city" className={labelStyles}>
                              City *
                            </label>
                            {selectedLocation.stateCode &&
                            internationalAddressData.cities.length > 0 ? (
                              <select
                                id="city"
                                value={formData.city}
                                onChange={(e) =>
                                  handleInputChange("city", e.target.value)
                                }
                                disabled={internationalAddressLoading.cities}
                                className={inputStyles}
                                required
                              >
                                <option value="">
                                  {internationalAddressLoading.cities
                                    ? "Loading..."
                                    : "Select City"}
                                </option>
                                {internationalAddressData.cities.map((city) => (
                                  <option key={city.name} value={city.name}>
                                    {city.name}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                id="city"
                                value={formData.city}
                                onChange={(e) =>
                                  handleInputChange("city", e.target.value)
                                }
                                className={inputStyles}
                                required
                                placeholder="Enter city name"
                              />
                            )}
                          </div>
                        </div>
                      )}
                      <div>
                        <label htmlFor="address_line_1" className={labelStyles}>
                          Address Line 1 *
                        </label>
                        <input
                          type="text"
                          id="address_line_1"
                          value={formData.address_line_1}
                          onChange={(e) =>
                            handleInputChange("address_line_1", e.target.value)
                          }
                          className={inputStyles}
                          required
                          placeholder="Street address, P.O. box, company name"
                        />
                      </div>

                      <div>
                        <label htmlFor="address_line_2" className={labelStyles}>
                          Address Line 2
                        </label>
                        <input
                          type="text"
                          id="address_line_2"
                          value={formData.address_line_2}
                          onChange={(e) =>
                            handleInputChange("address_line_2", e.target.value)
                          }
                          className={inputStyles}
                          placeholder="Apartment, suite, unit, building, floor, etc."
                        />
                      </div>
                    </div>
                    {/* Address Lines */}
                  </div>

                  {/* Social Media Links */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">
                      Social Media Links
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="facebook" className={labelStyles}>
                          Facebook URL
                        </label>
                        <input
                          type="url"
                          id="facebook"
                          value={formData.social_media_links.facebook}
                          onChange={(e) =>
                            handleSocialMediaChange("facebook", e.target.value)
                          }
                          className={inputStyles}
                          placeholder="https://facebook.com/yourpage"
                        />
                      </div>
                      <div>
                        <label htmlFor="instagram" className={labelStyles}>
                          Instagram URL
                        </label>
                        <input
                          type="url"
                          id="instagram"
                          value={formData.social_media_links.instagram}
                          onChange={(e) =>
                            handleSocialMediaChange("instagram", e.target.value)
                          }
                          className={inputStyles}
                          placeholder="https://instagram.com/yourpage"
                        />
                      </div>
                    </div>
                  </div>

                  {error && <p className="text-sm text-red-600">{error}</p>}

                  <div className="flex justify-end gap-4 border-t pt-6">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 disabled:bg-orange-300 transition-colors"
                    >
                      {isSubmitting ? "Adding..." : "Add Hotel"}
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

export default AddHotelModal;
