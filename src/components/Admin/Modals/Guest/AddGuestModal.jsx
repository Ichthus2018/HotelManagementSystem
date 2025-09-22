import { useState, Fragment, useEffect, useRef } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import supabase from "../../../../services/supabaseClient";

// Import the address library for dynamic dropdowns
import {
  regions,
  provinces,
  cities,
  barangays,
} from "select-philippines-address";
import { FileImage, X, RefreshCcw, LoaderCircle } from "lucide-react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { IoMdCloseCircle } from "react-icons/io";

const AddGuestModal = ({ isOpen, onClose, onSuccess }) => {
  // Centralized styles for inputs and labels for consistency
  const inputStyles =
    "mt-1 w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-orange-500";
  const labelStyles = "block text-sm font-medium text-gray-700";

  // State for all guest fields
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [region, setRegion] = useState("");
  const [province, setProvince] = useState("");
  const [cityMunicipality, setCityMunicipality] = useState("");
  const [barangay, setBarangay] = useState("");

  // --- MERGED LOGIC: States for the single Profile Photo ---
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false); // For loading state
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const fileInputRef = useRef(null); // Ref to trigger file input

  // State for submission status and errors
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // States for managing dynamic address data (no changes here)
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
    barangay: "",
  });

  // Effect to load regions when the modal opens
  useEffect(() => {
    if (isOpen) {
      setAddressLoading((prev) => ({ ...prev, regions: true }));
      regions()
        .then((data) =>
          setAddressData((prev) => ({ ...prev, regions: data || [] }))
        )
        .catch(console.error)
        .finally(() =>
          setAddressLoading((prev) => ({ ...prev, regions: false }))
        );
    }
  }, [isOpen]);

  const resetForm = () => {
    setFirstName("");
    setMiddleName("");
    setLastName("");
    setEmail("");
    setContactNo("");
    setStreetAddress("");
    setRegion("");
    setProvince("");
    setCityMunicipality("");
    setBarangay("");
    // Reset all profile photo states
    setProfileImageFile(null);
    setProfileImagePreview(null);
    setIsProcessingImage(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Clear file input value
    }
    setError("");
    setAddressData((prev) => ({
      ...prev,
      provinces: [],
      cities: [],
      barangays: [],
    }));
    setSelectedAddressCodes({
      region: "",
      province: "",
      city: "",
      barangay: "",
    });
  };

  // --- MERGED LOGIC: Handlers for Profile Photo Upload ---
  const handleProfileFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setIsProcessingImage(true); // Start processing state
      setProfileImageFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result);
        setIsProcessingImage(false); // End processing state when preview is ready
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveProfileImage = () => {
    setProfileImageFile(null);
    setProfileImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  // --- Address Selection Handlers (no changes here) ---
  const handleRegionChange = async (e) => {
    const regionCode = e.target.value;
    const selectedRegion = addressData.regions.find(
      (r) => r.region_code === regionCode
    );
    setSelectedAddressCodes({
      region: regionCode,
      province: "",
      city: "",
      barangay: "",
    });
    setRegion(selectedRegion ? selectedRegion.region_name : "");
    setProvince("");
    setCityMunicipality("");
    setBarangay("");
    setAddressData((prev) => ({
      ...prev,
      provinces: [],
      cities: [],
      barangays: [],
    }));
    if (regionCode) {
      setAddressLoading((prev) => ({ ...prev, provinces: true }));
      try {
        const provinceData = await provinces(regionCode);
        setAddressData((prev) => ({ ...prev, provinces: provinceData || [] }));
      } catch (err) {
        console.error("Failed to load provinces:", err);
      } finally {
        setAddressLoading((prev) => ({ ...prev, provinces: false }));
      }
    }
  };
  const handleProvinceChange = async (e) => {
    const provinceCode = e.target.value;
    const selectedProvince = addressData.provinces.find(
      (p) => p.province_code === provinceCode
    );
    setSelectedAddressCodes((prev) => ({
      ...prev,
      province: provinceCode,
      city: "",
      barangay: "",
    }));
    setProvince(selectedProvince ? selectedProvince.province_name : "");
    setCityMunicipality("");
    setBarangay("");
    setAddressData((prev) => ({ ...prev, cities: [], barangays: [] }));
    if (provinceCode) {
      setAddressLoading((prev) => ({ ...prev, cities: true }));
      try {
        const cityData = await cities(provinceCode);
        setAddressData((prev) => ({ ...prev, cities: cityData || [] }));
      } catch (err) {
        console.error("Failed to load cities:", err);
      } finally {
        setAddressLoading((prev) => ({ ...prev, cities: false }));
      }
    }
  };
  const handleCityChange = async (e) => {
    const cityCode = e.target.value;
    const selectedCity = addressData.cities.find(
      (c) => c.city_code === cityCode
    );
    setSelectedAddressCodes((prev) => ({
      ...prev,
      city: cityCode,
      barangay: "",
    }));
    setCityMunicipality(selectedCity ? selectedCity.city_name : "");
    setBarangay("");
    setAddressData((prev) => ({ ...prev, barangays: [] }));
    if (cityCode) {
      setAddressLoading((prev) => ({ ...prev, barangays: true }));
      try {
        const barangayData = await barangays(cityCode);
        setAddressData((prev) => ({ ...prev, barangays: barangayData || [] }));
      } catch (err) {
        console.error("Failed to load barangays:", err);
      } finally {
        setAddressLoading((prev) => ({ ...prev, barangays: false }));
      }
    }
  };
  const handleBarangayChange = (e) => {
    const barangayCode = e.target.value;
    const selectedBarangay = addressData.barangays.find(
      (b) => b.brgy_code === barangayCode
    );
    setSelectedAddressCodes((prev) => ({ ...prev, barangay: barangayCode }));
    setBarangay(selectedBarangay ? selectedBarangay.brgy_name : "");
  };

  // --- Form Submission Logic (MODIFIED) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setError("First name and last name are required.");
      return;
    }
    setIsSubmitting(true);
    setError("");

    try {
      // 1. Handle Profile Image Upload
      let profileImageUrl = null;
      if (profileImageFile) {
        const fileExt = profileImageFile.name.split(".").pop();
        const fileName = `profile_${Date.now()}.${fileExt}`;
        const filePath = `public/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("guest-photos")
          .upload(filePath, profileImageFile);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("guest-photos")
          .getPublicUrl(filePath);
        profileImageUrl = urlData.publicUrl;
      }

      // 2. Insert Guest Record into Database (No more id_photo_url)
      const { data, error: insertError } = await supabase
        .from("guests")
        .insert([
          {
            first_name: firstName,
            middle_name: middleName || null,
            last_name: lastName,
            email: email || null,
            contact_no: contactNo || null,
            profile_image_url: profileImageUrl, // This is the only image URL now
            street_address: streetAddress || null,
            region: region || null,
            province: province || null,
            city_municipality: cityMunicipality || null,
            barangay: barangay || null,
          },
        ])
        .select();
      if (insertError) throw insertError;

      onSuccess(data[0]);
      handleClose();
    } catch (err) {
      console.error("Error adding guest:", err);
      setError(err.message || "Failed to add guest.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetForm();
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        {/* ... Dialog overlay ... */}
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
              <DialogPanel className="relative w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white p-6 sm:p-8 text-left align-middle shadow-xl transition-all">
                <button
                  type="button"
                  onClick={handleClose}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 rounded-full"
                >
                  <span className="sr-only">Close</span>
                  <IoMdCloseCircle className="h-7 w-7" />
                </button>
                <DialogTitle
                  as="h3"
                  className="text-xl font-bold leading-6 text-gray-900"
                >
                  Add New Guest
                </DialogTitle>

                <form onSubmit={handleSubmit} className="mt-6 space-y-8">
                  <h4 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">
                    Upload Profile Photo
                  </h4>

                  {/* --- PROFILE PHOTO UPLOADER LOGIC --- */}
                  <div className="flex flex-col items-center justify-center w-full">
                    {/* State 1: Processing */}
                    {isProcessingImage && (
                      <div className="w-full h-56 flex flex-col items-center justify-center text-center bg-white p-4 border-2 border-dashed border-gray-300 rounded-lg">
                        <LoaderCircle className="h-10 w-10 text-purple-600 animate-spin" />
                        <p className="mt-3 text-sm font-semibold text-gray-700">
                          Processing your image...
                        </p>
                      </div>
                    )}

                    {/* State 2: Image Preview */}
                    {!isProcessingImage && profileImagePreview && (
                      <div className="p-2 border border-dashed border-gray-300 rounded-lg inline-block bg-white">
                        <div className="relative w-full max-w-sm rounded-md overflow-hidden group shadow-md">
                          <img
                            src={profileImagePreview}
                            alt="Profile Preview"
                            className="w-full h-auto object-contain cursor-pointer"
                            onClick={() => setIsLightboxOpen(true)}
                          />
                          <button
                            type="button"
                            onClick={triggerFileUpload}
                            className="absolute top-2 left-2 bg-white/80 backdrop-blur-sm rounded-full p-2 text-gray-800 hover:bg-white hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white transition-all shadow-lg"
                            aria-label="Re-upload photo"
                          >
                            <RefreshCcw className="h-5 w-5" />
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveProfileImage}
                            className="absolute top-2 right-2 bg-black/40 backdrop-blur-sm rounded-full p-1.5 text-white hover:bg-black/60 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white transition-all shadow-lg"
                            aria-label="Remove photo"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* State 3: Initial Upload Box */}
                    {!isProcessingImage && !profileImagePreview && (
                      <div
                        className="w-full h-32 flex flex-col items-center justify-center text-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 hover:border-blue-500 transition-colors"
                        onClick={triggerFileUpload}
                      >
                        <FileImage className="h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-600">
                          <span className="font-semibold text-blue-600">
                            Click to upload
                          </span>{" "}
                          or drag and drop
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Max. File Size: 15MB
                        </p>
                      </div>
                    )}

                    <input
                      id="profile-photo-upload"
                      ref={fileInputRef}
                      type="file"
                      className="sr-only"
                      accept="image/*"
                      onChange={handleProfileFileChange}
                    />
                  </div>

                  {isLightboxOpen && profileImagePreview && (
                    <Lightbox
                      open={isLightboxOpen}
                      close={() => setIsLightboxOpen(false)}
                      slides={[{ src: profileImagePreview }]}
                    />
                  )}
                  {/* --- END OF UPLOADER --- */}

                  {/* Personal Information Section */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">
                      Personal Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                      <div>
                        <label htmlFor="firstName" className={labelStyles}>
                          First Name*
                        </label>
                        <input
                          type="text"
                          id="firstName"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className={inputStyles}
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="middleName" className={labelStyles}>
                          Middle Name
                        </label>
                        <input
                          type="text"
                          id="middleName"
                          value={middleName}
                          onChange={(e) => setMiddleName(e.target.value)}
                          className={inputStyles}
                        />
                      </div>
                      <div>
                        <label htmlFor="lastName" className={labelStyles}>
                          Last Name*
                        </label>
                        <input
                          type="text"
                          id="lastName"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className={inputStyles}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contact Details Section */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">
                      Contact Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                      <div>
                        <label htmlFor="email" className={labelStyles}>
                          Email Address
                        </label>
                        <input
                          type="email"
                          id="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={inputStyles}
                        />
                      </div>
                      <div>
                        <label htmlFor="contactNo" className={labelStyles}>
                          Contact Number
                        </label>
                        <input
                          type="tel"
                          id="contactNo"
                          value={contactNo}
                          onChange={(e) => setContactNo(e.target.value)}
                          className={inputStyles}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Address Section (unchanged) */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">
                      Address
                    </h4>
                    <div className="space-y-4">
                      {/* ... address selects ... */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <div>
                          <label htmlFor="region" className={labelStyles}>
                            Region
                          </label>
                          <select
                            id="region"
                            value={selectedAddressCodes.region}
                            onChange={handleRegionChange}
                            disabled={addressLoading.regions}
                            className={inputStyles}
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
                            Province
                          </label>
                          <select
                            id="province"
                            value={selectedAddressCodes.province}
                            onChange={handleProvinceChange}
                            disabled={
                              !selectedAddressCodes.region ||
                              addressLoading.provinces
                            }
                            className={inputStyles}
                          >
                            <option value="">
                              {addressLoading.provinces
                                ? "Loading..."
                                : "Select Province"}
                            </option>
                            {addressData.provinces.map((prov) => (
                              <option
                                key={prov.province_code}
                                value={prov.province_code}
                              >
                                {prov.province_name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label
                            htmlFor="cityMunicipality"
                            className={labelStyles}
                          >
                            City / Municipality
                          </label>
                          <select
                            id="cityMunicipality"
                            value={selectedAddressCodes.city}
                            onChange={handleCityChange}
                            disabled={
                              !selectedAddressCodes.province ||
                              addressLoading.cities
                            }
                            className={inputStyles}
                          >
                            <option value="">
                              {addressLoading.cities
                                ? "Loading..."
                                : "Select City/Municipality"}
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
                        <div>
                          <label htmlFor="barangay" className={labelStyles}>
                            Barangay
                          </label>
                          <select
                            id="barangay"
                            value={selectedAddressCodes.barangay}
                            onChange={handleBarangayChange}
                            disabled={
                              !selectedAddressCodes.city ||
                              addressLoading.barangays
                            }
                            className={inputStyles}
                          >
                            <option value="">
                              {addressLoading.barangays
                                ? "Loading..."
                                : "Select Barangay"}
                            </option>
                            {addressData.barangays.map((brgy) => (
                              <option
                                key={brgy.brgy_code}
                                value={brgy.brgy_code}
                              >
                                {brgy.brgy_name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label htmlFor="streetAddress" className={labelStyles}>
                          Street Address, Building, etc.
                        </label>
                        <input
                          type="text"
                          id="streetAddress"
                          value={streetAddress}
                          onChange={(e) => setStreetAddress(e.target.value)}
                          className={inputStyles}
                          placeholder="House No., Street Name"
                        />
                      </div>
                    </div>
                  </div>

                  {error && <p className="text-sm text-red-600">{error}</p>}

                  <div className="mt-8 flex justify-end gap-x-4 border-t pt-6">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex justify-center rounded-md border border-transparent bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:bg-orange-300"
                    >
                      {isSubmitting ? "Adding..." : "Add Guest"}
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

export default AddGuestModal;
