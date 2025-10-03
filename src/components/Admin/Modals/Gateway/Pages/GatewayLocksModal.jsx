import { useState, useEffect, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  XMarkIcon,
  LockClosedIcon,
  Battery50Icon,
} from "@heroicons/react/24/outline";
import Loader from "../../../../ui/common/loader";
import { API_BASE_URL } from "../../../../../services/api";

const GatewayLocksModal = ({ isOpen, onClose, gateway }) => {
  const [locks, setLocks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !gateway?.id) return;

    const fetchLocks = async () => {
      setIsLoading(true);
      setError(null);
      setLocks([]); // Clear previous locks

      try {
        const response = await fetch(`${API_BASE_URL}/${gateway.id}/locks`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error?.message || `HTTP error! Status: ${response.status}`
          );
        }
        const data = await response.json();
        setLocks(data.list || []); // The API returns an object with a 'list' property
      } catch (err) {
        setError(err.message);
        console.error("Failed to fetch locks:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocks();
  }, [isOpen, gateway]); // Re-run when the modal opens or the gateway changes

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-48">
          <Loader />
        </div>
      );
    }
    if (error) {
      return (
        <div className="text-center text-red-600 bg-red-50 p-6 rounded-lg">
          <h4 className="font-semibold">Failed to Load Locks</h4>
          <p className="text-sm mt-1">{error}</p>
        </div>
      );
    }
    if (locks.length === 0) {
      return (
        <div className="text-center text-gray-500 py-12">
          <LockClosedIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">
            No Locks Found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            This gateway is not connected to any locks.
          </p>
        </div>
      );
    }
    return (
      <ul className="divide-y divide-gray-200">
        {locks.map((lock) => (
          <li
            key={lock.lockId}
            className="flex items-center justify-between gap-4 py-4"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-orange-100 text-orange-600">
                <LockClosedIcon className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold text-gray-900 truncate">
                  {lock.lockAlias || lock.lockName}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  ID: {lock.lockId}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Battery50Icon className="h-5 w-5 text-green-500" />
              <span className="font-medium">{lock.electricQuantity}%</span>
            </div>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-xl font-bold leading-6 text-gray-900 flex justify-between items-center"
                >
                  <span>
                    Locks on{" "}
                    <span className="text-orange-600">{gateway?.name}</span>
                  </span>
                  <button
                    type="button"
                    className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </Dialog.Title>
                <div className="mt-4 max-h-[60vh] overflow-y-auto pr-2">
                  {renderContent()}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default GatewayLocksModal;
