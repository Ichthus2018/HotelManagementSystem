import { useState, useEffect } from "react";
import supabase from "../../services/supabaseClient";

// UI Components
import PageHeader from "../../components/ui/common/PageHeader";
import Loader from "../../components/ui/common/Loader";
import WorkflowRoleTaggingDisplay from "../../components/Admin/Modals/InspectionWorkflowSettings/WorkflowRoleTaggingDisplay";
import EditWorkflowRoleTaggingModal from "../../components/Admin/Modals/InspectionWorkflowSettings/EditWorkflowRoleTaggingModal";

const InspectionWorkflowSettings = () => {
  // State for sidebar permissions and role editing
  const [sidebarPermissions, setSidebarPermissions] = useState([]);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedRoleForEdit, setSelectedRoleForEdit] = useState(null);

  // General state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSidebarPermissions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("sidebar_permissions")
        .select("*");

      if (error) throw error;

      setSidebarPermissions(data || []);
    } catch (err) {
      console.error("Failed to fetch sidebar permissions:", err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSidebarPermissions();
  }, []);

  const handleEditRole = (role) => {
    setSelectedRoleForEdit(role);
    setIsRoleModalOpen(true);
  };

  const handleRoleUpdateSuccess = () => {
    setIsRoleModalOpen(false);
    fetchSidebarPermissions();
  };

  const renderContent = () => {
    if (isLoading) return <Loader />;
    if (error)
      return (
        <div className="text-center text-red-500 p-6">
          Error: {error.message}
        </div>
      );

    if (!sidebarPermissions.length)
      return (
        <div className="p-6 text-center text-gray-500">
          No sidebar permissions found.
        </div>
      );

    return (
      <WorkflowRoleTaggingDisplay
        sidebarPermissions={sidebarPermissions}
        onEdit={handleEditRole}
      />
    );
  };

  // Get the permissions that the selected role currently has
  const currentPermissionIdsForModal = sidebarPermissions
    .filter((p) => p.allowed_roles?.includes(selectedRoleForEdit))
    .map((p) => p.id);

  return (
    <>
      <div className="space-y-6 w-full mx-auto p-2 pt-10 md:p-6 max-w-[95rem] xl:px-12 min-h-screen">
        <PageHeader
          title="Role-Based Sidebar Permissions"
          description="Manage access for Admin, Inspector, and Housekeeping roles."
        />
        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg">
          {renderContent()}
        </div>
      </div>

      {selectedRoleForEdit && (
        <EditWorkflowRoleTaggingModal
          isOpen={isRoleModalOpen}
          onClose={() => setIsRoleModalOpen(false)}
          onSuccess={handleRoleUpdateSuccess}
          role={selectedRoleForEdit}
          currentPermissionIds={currentPermissionIdsForModal}
          availablePermissions={sidebarPermissions}
        />
      )}
    </>
  );
};

export default InspectionWorkflowSettings;
