import { useMemo } from "react";
import { FaEdit } from "react-icons/fa";

const ROLES = ["Housekeeping", "Inspector", "Admin"];

const WorkflowRoleTaggingDisplay = ({
  rolePermissions,
  sidebarPermissions,
  onEdit, // Function to open the modal
}) => {
  // Create a lookup map for faster name retrieval
  const permissionNameMap = useMemo(() => {
    return new Map(sidebarPermissions.map((p) => [p.id, p.role_name]));
  }, [sidebarPermissions]);

  return (
    <div className="p-6 border-t mt-6">
      <h3 className="text-lg font-medium text-gray-900">
        Role-Based Sidebar Permissions
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        Assign which sidebar views each role can access.
      </p>

      <div className="mt-6 space-y-3">
        {ROLES.map((role) => {
          const roleData = rolePermissions.find((p) => p.role_name === role);
          const permissionIds = roleData?.sidebar_permission_ids || [];
          const permissionNames = permissionIds
            .map((id) => permissionNameMap.get(id))
            .filter(Boolean);

          return (
            <div
              key={role}
              className="flex items-center justify-between py-4 px-4 bg-gray-50 rounded-lg"
            >
              <div className="flex-1">
                <span className="font-semibold text-gray-800">{role}</span>
                <div className="mt-1 text-sm text-gray-600 flex flex-wrap gap-2">
                  {permissionNames.length > 0 ? (
                    permissionNames.map((name) => (
                      <span
                        key={name}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full"
                      >
                        {name}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400 italic">
                      No permissions assigned
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => onEdit(role)}
                className="ml-4 text-blue-600 hover:text-blue-900 p-2 rounded-full hover:bg-gray-100"
                aria-label={`Edit ${role} permissions`}
              >
                <FaEdit className="w-5 h-5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WorkflowRoleTaggingDisplay;
