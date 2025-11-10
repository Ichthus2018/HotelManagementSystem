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
import ParentCombobox from "../../../ui/common/ParentCombobox";

const EditChecklistAmenityModal = ({ isOpen, onClose, onSuccess, amenity }) => {
  const [amenityName, setAmenityName] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [status, setStatus] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [inventoryItems, setInventoryItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);

  useEffect(() => {
    const fetchItems = async () => {
      setLoadingItems(true);
      const { data, error } = await supabase.rpc("get_inventory_overview");
      if (error) {
        console.error("Failed to fetch inventory items:", error);
        setError("Could not load inventory items.");
        setInventoryItems([]);
      } else {
        setInventoryItems(data);
        if (amenity && amenity.items) {
          const currentItem = data.find((item) => item.id === amenity.items.id);
          setSelectedItem(currentItem || null);
        }
      }
      setLoadingItems(false);
    };

    if (isOpen) {
      fetchItems();
    }
  }, [isOpen, amenity]);

  useEffect(() => {
    if (amenity) {
      setAmenityName(amenity.amenity_name || "");
      setStatus(amenity.status !== false);
      setError("");
    }
  }, [amenity, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amenityName.trim() || !selectedItem) {
      setError("Amenity name and an associated item are required.");
      return;
    }
    setIsSubmitting(true);
    setError("");

    try {
      const { error: updateError } = await supabase
        .from("checklist_amenities")
        .update({
          amenity_name: amenityName,
          item_id: selectedItem.id,
          status,
        })
        .eq("id", amenity.id);

      if (updateError) throw updateError;

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Error updating amenity:", err);
      setError(err.message || "Failed to update amenity.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!amenity) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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
                  onClick={onClose}
                  className="absolute top-4 right-4 text-3xl text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  <IoIosCloseCircleOutline />
                </button>
                <DialogTitle
                  as="h3"
                  className="text-lg font-semibold leading-6 text-gray-900"
                >
                  Edit Checklist Amenity
                </DialogTitle>
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  <div>
                    <label
                      htmlFor="edit-amenityName"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Amenity Name*
                    </label>
                    <input
                      type="text"
                      id="edit-amenityName"
                      value={amenityName}
                      onChange={(e) => setAmenityName(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <ParentCombobox
                      label="Associated Item*"
                      data={inventoryItems}
                      selected={selectedItem}
                      setSelected={setSelectedItem}
                      nameKey="item_name"
                      codeKey="item_code"
                      loading={loadingItems}
                    />
                  </div>
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={status}
                        onChange={(e) => setStatus(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Active Status
                      </span>
                    </label>
                  </div>
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <div className="mt-6 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting || loadingItems}
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none disabled:bg-blue-300"
                    >
                      {isSubmitting ? "Saving..." : "Save Changes"}
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

export default EditChecklistAmenityModal;
