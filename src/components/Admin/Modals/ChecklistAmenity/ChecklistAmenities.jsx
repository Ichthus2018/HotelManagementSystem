import { FaEdit, FaTrash } from "react-icons/fa";

const ChecklistAmenityList = ({ amenities, onEdit, onDelete }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Amenity Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Associated Item
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date Created
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {amenities.map((amenity) => (
            <tr key={amenity.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {amenity.amenity_name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {amenity.items ? amenity.items.item_name : "N/A"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`inline-flex px-2 text-xs font-semibold leading-5 rounded-full ${
                    amenity.status
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {amenity.status ? "Active" : "Inactive"}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(amenity.created_at).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex space-x-2">
                  <button
                    onClick={() => onEdit(amenity)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <FaEdit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(amenity)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <FaTrash className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ChecklistAmenityList;
