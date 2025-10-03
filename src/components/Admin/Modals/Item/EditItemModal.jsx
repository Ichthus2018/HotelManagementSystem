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

const EditItemModal = ({ isOpen, onClose, onSuccess, item }) => {
  const [itemCode, setItemCode] = useState("");
  const [itemName, setItemName] = useState("");
  const [batch, setBatch] = useState(false);
  const [status, setStatus] = useState(true);

  // State for selected parent objects
  const [selectedItemType, setSelectedItemType] = useState(null);
  const [selectedCategory1, setSelectedCategory1] = useState(null);
  const [selectedCategory2, setSelectedCategory2] = useState(null);
  const [selectedCategory3, setSelectedCategory3] = useState(null);
  const [selectedCategory4, setSelectedCategory4] = useState(null);
  const [selectedCategory5, setSelectedCategory5] = useState(null);

  // State to hold fetched parent data
  const [parentData, setParentData] = useState({
    itemTypes: [],
    categories1: [],
    categories2: [],
    categories3: [],
    categories4: [],
    categories5: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchActiveParents = async () => {
      if (!isOpen) return;
      try {
        const fetchTable = (tableName, select) =>
          supabase.from(tableName).select(select).eq("status", true);

        const [itemTypesRes, cat1Res, cat2Res, cat3Res, cat4Res, cat5Res] =
          await Promise.all([
            fetchTable("item_type", "id, item_type_name, item_type_code"),
            fetchTable("categories_1", "id, category_1_name, category_1_code"),
            fetchTable("categories_2", "id, category_2_name, category_2_code"),
            fetchTable("categories_3", "id, category_3_name, category_3_code"),
            fetchTable("categories_4", "id, category_4_name, category_4_code"),
            fetchTable("categories_5", "id, category_5_name, category_5_code"),
          ]);

        const allParentData = {
          itemTypes: itemTypesRes.data || [],
          categories1: cat1Res.data || [],
          categories2: cat2Res.data || [],
          categories3: cat3Res.data || [],
          categories4: cat4Res.data || [],
          categories5: cat5Res.data || [],
        };
        setParentData(allParentData);

        // Pre-select values based on the item prop
        if (item) {
          setItemCode(item.item_code || "");
          setItemName(item.item_name || "");
          setBatch(item.batch || false);
          setStatus(item.status !== false);
          setError("");

          const findById = (arr, id) => arr.find((d) => d.id === id) || null;

          setSelectedItemType(
            findById(allParentData.itemTypes, item.item_type?.id)
          );
          setSelectedCategory1(
            findById(allParentData.categories1, item.categories_1?.id)
          );
          setSelectedCategory2(
            findById(allParentData.categories2, item.categories_2?.id)
          );
          setSelectedCategory3(
            findById(allParentData.categories3, item.categories_3?.id)
          );
          setSelectedCategory4(
            findById(allParentData.categories4, item.categories_4?.id)
          );
          setSelectedCategory5(
            findById(allParentData.categories5, item.categories_5?.id)
          );
        }
      } catch (err) {
        console.error("Failed to fetch parent data:", err);
        setError("Could not load necessary data. Please try again.");
      }
    };

    fetchActiveParents();
  }, [isOpen, item]);

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!itemCode.trim() || !itemName.trim() || !selectedItemType) {
      setError("Item code, name, and type are required.");
      return;
    }
    setIsSubmitting(true);
    setError("");

    try {
      const { error: updateError } = await supabase
        .from("items")
        .update({
          item_code: itemCode,
          item_name: itemName,
          item_type_id: selectedItemType.id,
          category_1_id: selectedCategory1?.id || null,
          category_2_id: selectedCategory2?.id || null,
          category_3_id: selectedCategory3?.id || null,
          category_4_id: selectedCategory4?.id || null,
          category_5_id: selectedCategory5?.id || null,
          batch,
          status,
        })
        .eq("id", item.id);

      if (updateError) throw updateError;

      onSuccess();
      handleClose();
    } catch (err) {
      console.error("Error updating item:", err);
      setError(err.message || "Failed to update item.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!item) return null;

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
              <DialogPanel className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <button
                  type="button"
                  onClick={handleClose}
                  className="absolute top-4 right-4 text-3xl text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  <IoIosCloseCircleOutline />
                </button>
                <DialogTitle
                  as="h3"
                  className="text-lg font-semibold leading-6 text-gray-900"
                >
                  Edit Item
                </DialogTitle>
                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Item Code*
                      </label>
                      <input
                        type="text"
                        value={itemCode}
                        onChange={(e) => setItemCode(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Item Name*
                      </label>
                      <input
                        type="text"
                        value={itemName}
                        onChange={(e) => setItemName(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        required
                      />
                    </div>
                    <ParentCombobox
                      label="Item Type*"
                      data={parentData.itemTypes}
                      selected={selectedItemType}
                      setSelected={setSelectedItemType}
                      nameKey="item_type_name"
                      codeKey="item_type_code"
                    />
                    <ParentCombobox
                      label="Category 1"
                      data={parentData.categories1}
                      selected={selectedCategory1}
                      setSelected={setSelectedCategory1}
                      nameKey="category_1_name"
                      codeKey="category_1_code"
                    />
                    <ParentCombobox
                      label="Category 2"
                      data={parentData.categories2}
                      selected={selectedCategory2}
                      setSelected={setSelectedCategory2}
                      nameKey="category_2_name"
                      codeKey="category_2_code"
                    />
                    <ParentCombobox
                      label="Category 3"
                      data={parentData.categories3}
                      selected={selectedCategory3}
                      setSelected={setSelectedCategory3}
                      nameKey="category_3_name"
                      codeKey="category_3_code"
                    />
                    <ParentCombobox
                      label="Category 4"
                      data={parentData.categories4}
                      selected={selectedCategory4}
                      setSelected={setSelectedCategory4}
                      nameKey="category_4_name"
                      codeKey="category_4_code"
                    />
                    <ParentCombobox
                      label="Category 5"
                      data={parentData.categories5}
                      selected={selectedCategory5}
                      setSelected={setSelectedCategory5}
                      nameKey="category_5_name"
                      codeKey="category_5_code"
                    />
                  </div>
                  <div className="flex items-center space-x-6 pt-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={batch}
                        onChange={(e) => setBatch(e.target.checked)}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Has Batch
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={status}
                        onChange={(e) => setStatus(e.target.checked)}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
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
                      disabled={isSubmitting}
                      className="inline-flex justify-center rounded-md border border-transparent bg-orange-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
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

export default EditItemModal;
