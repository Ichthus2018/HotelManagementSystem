import { useState, Fragment, useEffect, useRef } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import supabase from "../../../../services/supabaseClient";

// Import the address library
import {
  regions,
  provinces,
  cities,
  barangays,
} from "select-philippines-address";
import { RefreshCcw, LoaderCircle, X, FileImage } from "lucide-react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { IoMdCloseCircle } from "react-icons/io";

const EditGuestModal = ({ isOpen, onClose, onSuccess, guestData }) => {
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

  // States for ID Photo
  const [idPhotoFile, setIdPhotoFile] = useState(null);
  const [idPhotoPreview, setIdPhotoPreview] = useState(null);
  const [isProcessingIdPhoto, setIsProcessingIdPhoto] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const idFileInputRef = useRef(null);

  // State for submission status and errors
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // States for managing dynamic address data
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

  // --- KEY CHANGE: Populate form with existing guest data ---
  useEffect(() => {
    if (isOpen && guestData) {
      // Populate standard fields
      setFirstName(guestData.first_name || "");
      setMiddleName(guestData.middle_name || "");
      setLastName(guestData.last_name || "");
      setEmail(guestData.email || "");
      setContactNo(guestData.contact_no || "");
      setStreetAddress(guestData.street_address || "");
      setRegion(guestData.region || "");
      setProvince(guestData.province || "");
      setCityMunicipality(guestData.city_municipality || "");
      setBarangay(guestData.barangay || "");

      // Set the existing photo URL as the initial preview
      setIdPhotoPreview(guestData.profile_image_url || null);

      // Reset file-specific states and errors
      setIdPhotoFile(null);
      setError("");

      // Asynchronously pre-load and set address dropdowns based on guest's address
      populateAddressDropdowns();
    }
  }, [isOpen, guestData]);

  // Helper to pre-populate address dropdowns sequentially
  const populateAddressDropdowns = async () => {
    if (!guestData?.region) {
      // If there's no region, just load the region list and stop
      setAddressLoading((prev) => ({ ...prev, regions: true }));
      const allRegions = await regions();
      setAddressData((prev) => ({ ...prev, regions: allRegions || [] }));
      setAddressLoading((prev) => ({ ...prev, regions: false }));
      return;
    }

    try {
      // 1. Load regions and find the code for the guest's region
      setAddressLoading((prev) => ({ ...prev, regions: true }));
      const allRegions = await regions();
      const regionCode = allRegions.find(
        (r) => r.region_name === guestData.region
      )?.region_code;
      setAddressData((prev) => ({ ...prev, regions: allRegions || [] }));
      setAddressLoading((prev) => ({ ...prev, regions: false }));
      if (!regionCode) return;
      setSelectedAddressCodes((prev) => ({ ...prev, region: regionCode }));

      // 2. Load provinces for that region and find the code
      setAddressLoading((prev) => ({ ...prev, provinces: true }));
      const allProvinces = await provinces(regionCode);
      const provinceCode = allProvinces.find(
        (p) => p.province_name === guestData.province
      )?.province_code;
      setAddressData((prev) => ({ ...prev, provinces: allProvinces || [] }));
      setAddressLoading((prev) => ({ ...prev, provinces: false }));
      if (!provinceCode) return;
      setSelectedAddressCodes((prev) => ({ ...prev, province: provinceCode }));

      // 3. Load cities for that province and find the code
      setAddressLoading((prev) => ({ ...prev, cities: true }));
      const allCities = await cities(provinceCode);
      const cityCode = allCities.find(
        (c) => c.city_name === guestData.city_municipality
      )?.city_code;
      setAddressData((prev) => ({ ...prev, cities: allCities || [] }));
      setAddressLoading((prev) => ({ ...prev, cities: false }));
      if (!cityCode) return;
      setSelectedAddressCodes((prev) => ({ ...prev, city: cityCode }));

      // 4. Load barangays for that city and find the code
      setAddressLoading((prev) => ({ ...prev, barangays: true }));
      const allBarangays = await barangays(cityCode);
      const barangayCode = allBarangays.find(
        (b) => b.brgy_name === guestData.barangay
      )?.brgy_code;
      setAddressData((prev) => ({ ...prev, barangays: allBarangays || [] }));
      setAddressLoading((prev) => ({ ...prev, barangays: false }));
      if (!barangayCode) return;
      setSelectedAddressCodes((prev) => ({ ...prev, barangay: barangayCode }));
    } catch (err) {
      console.error("Error populating address dropdowns:", err);
    }
  };

  // --- Photo Handlers (No changes from AddGuestModal) ---
  const handleIdPhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setIsProcessingIdPhoto(true);
      setIdPhotoFile(file); // A new file is staged for upload
      const reader = new FileReader();
      reader.onloadend = () => {
        setIdPhotoPreview(reader.result); // Show preview of the new file
        setIsProcessingIdPhoto(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveIdPhoto = () => {
    setIdPhotoFile(null); // Unstage the new file
    setIdPhotoPreview(null); // This clears the preview, signaling removal
    if (idFileInputRef.current) {
      idFileInputRef.current.value = "";
    }
  };

  const triggerIdPhotoUpload = () => {
    idFileInputRef.current?.click();
  };

  // --- Address Selection Handlers (No changes from AddGuestModal) ---
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
        console.error(err);
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
        console.error(err);
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
        console.error(err);
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

  // --- KEY CHANGE: Form Submission Logic for UPDATE ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setError("First name and last name are required.");
      return;
    }
    if (!guestData?.id) {
      setError("Guest ID is missing. Cannot update.");
      return;
    }
    setIsSubmitting(true);
    setError("");

    try {
      // 1. Handle ID Photo: Only upload if a NEW file was selected
      let finalIdPhotoUrl = idPhotoPreview; // Start with the current preview URL
      if (idPhotoFile) {
        // A new file was uploaded
        const fileExt = idPhotoFile.name.split(".").pop();
        const fileName = `id_${guestData.id}_${Date.now()}.${fileExt}`;
        const filePath = `public/ids/${fileName}`;
        const { error: uploadError } = await supabase.storage
          .from("guest-photos")
          .upload(filePath, idPhotoFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage
          .from("guest-photos")
          .getPublicUrl(filePath);
        finalIdPhotoUrl = urlData.publicUrl;
      } else if (
        idPhotoPreview === null &&
        guestData.profile_image_url !== null
      ) {
        // The photo was removed (preview is null but original had a URL)
        finalIdPhotoUrl = null;
      }

      // 2. Prepare data for update
      const updates = {
        first_name: firstName,
        middle_name: middleName || null,
        last_name: lastName,
        email: email || null,
        contact_no: contactNo || null,
        profile_image_url: finalIdPhotoUrl,
        street_address: streetAddress || null,
        region: region || null,
        province: province || null,
        city_municipality: cityMunicipality || null,
        barangay: barangay || null,
        updated_at: new Date().toISOString(), // Good practice
      };

      // 3. Update Guest Record in Database
      const { data, error: updateError } = await supabase
        .from("guests")
        .update(updates)
        .eq("id", guestData.id)
        .select();
      if (updateError) throw updateError;

      onSuccess(data[0]);
      handleClose();
    } catch (err) {
      console.error("Error updating guest:", err);
      setError(err.message || "Failed to update guest.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
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
                  Edit Guest Information {/* <-- UI TEXT CHANGE */}
                </DialogTitle>

                <form onSubmit={handleSubmit} className="mt-6 space-y-8">
                  <h4 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">
                    Upload ID Photo
                  </h4>

                  {/* ID PHOTO UPLOADER (JSX is identical to Add modal) */}
                  <div className="flex flex-col items-center justify-center w-full">
                    {isProcessingIdPhoto && (
                      <div className="w-full h-56 flex flex-col items-center justify-center text-center bg-white p-4 border-2 border-dashed border-gray-300 rounded-lg">
                        <LoaderCircle className="h-10 w-10 text-purple-600 animate-spin" />
                        <p className="mt-3 text-sm font-semibold text-gray-700">
                          Processing your image...
                        </p>
                      </div>
                    )}
                    {!isProcessingIdPhoto && idPhotoPreview && (
                      <div className="p-2 border border-dashed border-gray-300 rounded-lg inline-block bg-white">
                        <div className="relative w-full max-w-sm rounded-md overflow-hidden group shadow-md">
                          <img
                            src={idPhotoPreview}
                            alt="ID Preview"
                            className="w-full h-auto object-contain cursor-pointer"
                            onClick={() => setIsLightboxOpen(true)}
                          />
                          <button
                            type="button"
                            onClick={triggerIdPhotoUpload}
                            className="absolute top-2 left-2 bg-white/80 backdrop-blur-sm rounded-full p-2 text-gray-800 hover:bg-white hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white transition-all shadow-lg"
                            aria-label="Re-upload photo"
                          >
                            <RefreshCcw className="h-5 w-5" />
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveIdPhoto}
                            className="absolute top-2 right-2 bg-black/40 backdrop-blur-sm rounded-full p-1.5 text-white hover:bg-black/60 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white transition-all shadow-lg"
                            aria-label="Remove photo"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    )}
                    {!isProcessingIdPhoto && !idPhotoPreview && (
                      <div
                        className="w-full h-32 flex flex-col items-center justify-center text-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 hover:border-blue-500 transition-colors"
                        onClick={triggerIdPhotoUpload}
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
                      id="id-photo-upload-edit"
                      ref={idFileInputRef}
                      type="file"
                      className="sr-only"
                      accept="image/*"
                      onChange={handleIdPhotoChange}
                    />
                  </div>
                  {isLightboxOpen && idPhotoPreview && (
                    <Lightbox
                      open={isLightboxOpen}
                      close={() => setIsLightboxOpen(false)}
                      slides={[{ src: idPhotoPreview }]}
                    />
                  )}

                  {/* Personal Information (JSX is identical) */}
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

                  {/* Contact Details (JSX is identical) */}
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

                  {/* Address Section (JSX is identical) */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">
                      Address
                    </h4>
                    <div className="space-y-4">
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

                  {/* Action Buttons */}
                  <div className="mt-8 flex justify-end gap-x-4 border-t pt-6">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex justify-center rounded-md border border-transparent bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:bg-orange-300"
                    >
                      {isSubmitting ? "Saving..." : "Save Changes"}{" "}
                      {/* <-- UI TEXT CHANGE */}
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

export default EditGuestModal;
