import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

// A small, reusable component for a single draggable item
function SortableItem({ id, children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : "auto",
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="flex items-center bg-white border border-gray-200 rounded-lg shadow-sm mb-2"
    >
      <button
        {...listeners}
        className="p-4 text-gray-500 cursor-grab active:cursor-grabbing touch-none"
      >
        <Bars3Icon className="h-5 w-5" />
      </button>
      <div className="flex-grow p-3">{children}</div>
    </div>
  );
}

const SortLocationsModal = ({ isOpen, onClose, locations, onSaveOrder }) => {
  const [items, setItems] = useState(locations);

  // Reset items when the locations prop changes (e.g., when modal opens)
  useEffect(() => {
    setItems(locations);
  }, [locations]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems((currentItems) => {
        const oldIndex = currentItems.indexOf(active.id);
        const newIndex = currentItems.indexOf(over.id);
        return arrayMove(currentItems, oldIndex, newIndex);
      });
    }
  };

  const handleSave = () => {
    onSaveOrder(items);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
      aria-modal="true"
    >
      <div className="bg-gray-50 rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-900">
            Sort Locations
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          <p className="text-sm text-gray-600 mb-4">
            Drag and drop the locations to set your preferred viewing order.
          </p>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items}
              strategy={verticalListSortingStrategy}
            >
              {items.map((id) => (
                <SortableItem key={id} id={id}>
                  <span className="font-medium text-gray-800">{id}</span>
                </SortableItem>
              ))}
            </SortableContext>
          </DndContext>
        </div>

        {/* Footer */}
        <div className="p-4 mt-auto border-t border-gray-200 bg-white/50 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 text-sm font-semibold rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="w-full py-2.5 px-4 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            Save Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default SortLocationsModal;
