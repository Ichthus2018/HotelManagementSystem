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
import { FaTrash } from "react-icons/fa";
import ParentCombobox from "../../../ui/common/ParentCombobox";

const AddItemModal = ({ isOpen, onClose, onSuccess }) => {
  // Main Item State
  const [itemCode, setItemCode] = useState("");
  const [itemName, setItemName] = useState("");
  const [batch, setBatch] = useState(false);
  const [status, setStatus] = useState(true);
  const [itemClass, setItemClass] = useState("Raw Material");

  // Raw Material State
  const [selectedItemType, setSelectedItemType] = useState(null);
  const [selectedCategory1, setSelectedCategory1] = useState(null);
  const [selectedCategory2, setSelectedCategory2] = useState(null);
  const [selectedCategory3, setSelectedCategory3] = useState(null);
  const [selectedCategory4, setSelectedCategory4] = useState(null);
  const [selectedCategory5, setSelectedCategory5] = useState(null);
  const [selectedLifecycleType, setSelectedLifecycleType] = useState(null);

  // Bundle (BOM) State
  const [bomComponents, setBomComponents] = useState([]);
  const [availableItems, setAvailableItems] = useState([]); // For the combobox
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [componentQuantity, setComponentQuantity] = useState(1);

  // Parent Data & Control State
  const [parentData, setParentData] = useState({
    itemTypes: [],
    categories1: [],
    categories2: [],
    categories3: [],
    categories4: [],
    categories5: [],
    lifecycleTypes: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Effect to reset fields when switching item class
  useEffect(() => {
    if (itemClass === "Bundle") {
      setBatch(false);
      setSelectedItemType(null);
      setSelectedCategory1(null);
      setSelectedCategory2(null);
      setSelectedCategory3(null);
      setSelectedCategory4(null);
      setSelectedCategory5(null);
      setSelectedLifecycleType(null);
    } else {
      setBomComponents([]);
    }
  }, [itemClass]);

  // Effect to fetch all necessary data when modal opens
  useEffect(() => {
    const fetchRequiredData = async () => {
      if (!isOpen) return;
      try {
        const fetchTable = (tableName, select) =>
          supabase.from(tableName).select(select).eq("status", true);

        const [
          itemTypesRes,
          cat1Res,
          cat2Res,
          cat3Res,
          cat4Res,
          cat5Res,
          lifecycleTypesRes,
          allItemsRes,
        ] = await Promise.all([
          fetchTable("item_type", "id, item_type_name, item_type_code"),
          fetchTable("categories_1", "id, category_1_name, category_1_code"),
          fetchTable("categories_2", "id, category_2_name, category_2_code"),
          fetchTable("categories_3", "id, category_3_name, category_3_code"),
          fetchTable("categories_4", "id, category_4_name, category_4_code"),
          fetchTable("categories_5", "id, category_5_name, category_5_code"),
          supabase.from("item_lifecycle_types").select("id, lifecycle_name"),
          supabase
            .from("items")
            .select("id, item_name, item_code")
            .eq("item_class", "Raw Material")
            .eq("status", true),
        ]);

        if (lifecycleTypesRes.error) throw lifecycleTypesRes.error;

        setParentData({
          itemTypes: itemTypesRes.data || [],
          categories1: cat1Res.data || [],
          categories2: cat2Res.data || [],
          categories3: cat3Res.data || [],
          categories4: cat4Res.data || [],
          categories5: cat5Res.data || [],
          lifecycleTypes: lifecycleTypesRes.data || [],
        });
        setAvailableItems(allItemsRes.data || []);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError("Could not load necessary data. Please try again.");
      }
    };

    fetchRequiredData();
  }, [isOpen]);

  const handleAddComponent = () => {
    if (!selectedComponent || componentQuantity <= 0) {
      setError(
        "Please select a valid component and specify a quantity greater than 0."
      );
      return;
    }
    // Prevent adding the same component twice
    if (bomComponents.some((c) => c.item.id === selectedComponent.id)) {
      setError("This component has already been added.");
      return;
    }

    setBomComponents([
      ...bomComponents,
      { item: selectedComponent, quantity: parseFloat(componentQuantity) },
    ]);
    setSelectedComponent(null); // Reset combobox
    setComponentQuantity(1);
    setError("");
  };

  const handleRemoveComponent = (itemId) => {
    setBomComponents(bomComponents.filter((c) => c.item.id !== itemId));
  };

  const resetForm = () => {
    setItemCode("");
    setItemName("");
    setBatch(false);
    setStatus(true);
    setItemClass("Raw Material");
    setSelectedItemType(null);
    setSelectedCategory1(null);
    setSelectedCategory2(null);
    setSelectedCategory3(null);
    setSelectedCategory4(null);
    setSelectedCategory5(null);
    setSelectedLifecycleType(null);
    setBomComponents([]);
    setSelectedComponent(null);
    setComponentQuantity(1);
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!itemCode.trim() || !itemName.trim()) {
      setError("Item code and name are required.");
      return;
    }
    if (itemClass === "Raw Material" && !selectedItemType) {
      setError("Item type is required for Raw Materials.");
      return;
    }
    if (itemClass === "Raw Material" && !selectedLifecycleType) {
      setError("Item lifecycle is required for Raw Materials.");
      return;
    }
    if (itemClass === "Bundle" && bomComponents.length === 0) {
      setError("A bundle must have at least one component.");
      return;
    }

    setIsSubmitting(true);

    try {
      const itemData = {
        item_code: itemCode,
        item_name: itemName,
        item_class: itemClass,
        batch,
        status,
        item_type_id:
          itemClass === "Raw Material" ? selectedItemType?.id : null,
        category_1_id:
          itemClass === "Raw Material" ? selectedCategory1?.id : null,
        category_2_id:
          itemClass === "Raw Material" ? selectedCategory2?.id : null,
        category_3_id:
          itemClass === "Raw Material" ? selectedCategory3?.id : null,
        category_4_id:
          itemClass === "Raw Material" ? selectedCategory4?.id : null,
        category_5_id:
          itemClass === "Raw Material" ? selectedCategory5?.id : null,
        lifecycle_type_id:
          itemClass === "Raw Material" ? selectedLifecycleType?.id : null,
      };

      const { data: newItem, error: itemError } = await supabase
        .from("items")
        .insert(itemData)
        .select()
        .single();

      if (itemError) throw itemError;

      if (itemClass === "Bundle" && newItem) {
        const { data: newBom, error: bomError } = await supabase
          .from("boms")
          .insert({ bundle_item_id: newItem.id })
          .select()
          .single();

        if (bomError) {
          await supabase.from("items").delete().eq("id", newItem.id);
          throw bomError;
        }

        const componentsToInsert = bomComponents.map((c) => ({
          bom_id: newBom.id,
          component_item_id: c.item.id,
          quantity_required: c.quantity,
        }));

        const { error: componentsError } = await supabase
          .from("bom_components")
          .insert(componentsToInsert);

        if (componentsError) {
          await supabase.from("boms").delete().eq("id", newBom.id);
          await supabase.from("items").delete().eq("id", newItem.id);
          throw componentsError;
        }
      }

      onSuccess();
      handleClose();
    } catch (err) {
      console.error("Error adding item:", err);
      setError(err.message || "Failed to add item.");
    } finally {
      setIsSubmitting(false);
    }
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
              <DialogPanel className="relative w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
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
                  Add New Item
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
                        className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Item Class*
                      </label>
                      <select
                        value={itemClass}
                        onChange={(e) => setItemClass(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="Raw Material">Raw Material</option>
                        <option value="Bundle">Bundle</option>
                      </select>
                    </div>
                  </div>

                  {itemClass === "Raw Material" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4 mt-4">
                      <ParentCombobox
                        label="Item Type*"
                        data={parentData.itemTypes}
                        selected={selectedItemType}
                        setSelected={setSelectedItemType}
                        nameKey="item_type_name"
                        codeKey="item_type_code"
                      />
                      <ParentCombobox
                        label="Item Lifecycle*"
                        data={parentData.lifecycleTypes}
                        selected={selectedLifecycleType}
                        setSelected={setSelectedLifecycleType}
                        nameKey="lifecycle_name"
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
                  ) : (
                    <div className="border-t pt-4 mt-4">
                      <h4 className="text-md font-medium text-gray-800 mb-2">
                        Bundle Components
                      </h4>
                      <div className="flex items-end gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-grow">
                          <ParentCombobox
                            label="Search Component Item"
                            data={availableItems}
                            selected={selectedComponent}
                            setSelected={setSelectedComponent}
                            nameKey="item_name"
                            codeKey="item_code"
                          />
                        </div>
                        <div className="w-24">
                          <label className="block text-sm font-medium text-gray-700">
                            Quantity*
                          </label>
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={componentQuantity}
                            onChange={(e) =>
                              setComponentQuantity(e.target.value)
                            }
                            className="mt-1 w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleAddComponent}
                          className="h-10 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          Add
                        </button>
                      </div>
                      <div className="mt-4 max-h-60 overflow-y-auto">
                        {bomComponents.length > 0 ? (
                          <ul className="divide-y divide-gray-200">
                            {bomComponents.map(({ item, quantity }) => (
                              <li
                                key={item.id}
                                className="flex items-center justify-between py-2 px-1"
                              >
                                <div>
                                  <p className="font-medium text-gray-800">
                                    {item.item_name}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {item.item_code}
                                  </p>
                                </div>
                                <div className="flex items-center gap-4">
                                  <p className="text-sm text-gray-700">
                                    Qty: {quantity}
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRemoveComponent(item.id)
                                    }
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <FaTrash />
                                  </button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-center text-gray-500 py-4">
                            No components added yet.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-6 pt-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={batch}
                        onChange={(e) => setBatch(e.target.checked)}
                        disabled={itemClass === "Bundle"}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:bg-gray-200 disabled:cursor-not-allowed"
                      />
                      <span
                        className={`ml-2 text-sm ${
                          itemClass === "Bundle"
                            ? "text-gray-400"
                            : "text-gray-700"
                        }`}
                      >
                        Has Batch
                      </span>
                    </label>
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
                  {error && (
                    <p className="text-sm text-red-600 mt-2">{error}</p>
                  )}
                  <div className="mt-6 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {isSubmitting ? "Adding..." : "Add Item"}
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

export default AddItemModal;
