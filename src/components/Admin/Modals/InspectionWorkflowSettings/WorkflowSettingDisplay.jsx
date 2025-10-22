import { FaEdit } from "react-icons/fa";

const WorkflowSettingDisplay = ({ setting, onEdit }) => {
  const isRequired = setting.setting_value;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Room Inspection Requirement
          </h3>
          <p className="mt-1 text-sm text-gray-500">{setting.description}</p>
        </div>
        <div className="flex items-center space-x-4">
          <span
            className={`inline-flex px-3 py-1 text-sm font-semibold leading-5 rounded-full ${
              isRequired
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {isRequired ? "Required" : "Not Required"}
          </span>
          <button
            onClick={onEdit}
            className="text-blue-600 hover:text-blue-900 p-2 rounded-full hover:bg-gray-100"
            aria-label="Edit Setting"
          >
            <FaEdit className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkflowSettingDisplay;
