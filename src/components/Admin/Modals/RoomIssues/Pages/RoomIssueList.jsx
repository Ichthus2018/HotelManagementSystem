import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { format } from "date-fns";

const statusColors = {
  Reported: "bg-yellow-100 text-yellow-800",
  "In Progress": "bg-blue-100 text-blue-800",
  Resolved: "bg-green-100 text-green-800",
};

const RoomIssueList = ({ issues, onEdit, onDelete }) => {
  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th
            scope="col"
            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            Room
          </th>
          <th
            scope="col"
            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            Description
          </th>
          <th
            scope="col"
            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            Status
          </th>
          <th
            scope="col"
            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            Reported By
          </th>
          <th
            scope="col"
            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          >
            Reported On
          </th>
          <th scope="col" className="relative px-6 py-3">
            <span className="sr-only">Actions</span>
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {issues.map((issue) => (
          <tr key={issue.id} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              {issue.rooms?.room_number || "N/A"}
            </td>
            <td className="px-6 py-4 whitespace-pre-wrap text-sm text-gray-600 max-w-sm truncate">
              {issue.description}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm">
              <span
                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  statusColors[issue.status] || "bg-gray-100 text-gray-800"
                }`}
              >
                {issue.status}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
              {issue.reporter
                ? `${issue.reporter.first_name} ${issue.reporter.last_name}`
                : "Unknown"}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
              {format(new Date(issue.created_at), "MMM d, yyyy")}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <div className="flex items-center justify-end gap-x-4">
                <button
                  onClick={() => onEdit(issue)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => onDelete(issue)}
                  className="text-red-600 hover:text-red-800"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default RoomIssueList;
