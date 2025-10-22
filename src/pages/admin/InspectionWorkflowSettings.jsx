import { useState, useEffect } from "react";
import supabase from "../../services/supabaseClient";

// UI Components
import PageHeader from "../../components/ui/common/PageHeader";
import Loader from "../../components/ui/common/loader";
import WorkflowSettingDisplay from "../../components/Admin/Modals/InspectionWorkflowSettings/WorkflowSettingDisplay";
import EditWorkflowSettingModal from "../../components/Admin/Modals/InspectionWorkflowSettings/EditWorkflowSettingModal";
import EditWorkflowRoleTaggingModal from "../../components/Admin/Modals/InspectionWorkflowSettings/EditWorkflowRoleTaggingModal";
import WorkflowRoleTaggingDisplay from "../../components/Admin/Modals/InspectionWorkflowSettings/WorkflowRoleTaggingDisplay";

const InspectionWorkflowSettings = () => {
  // State for original toggle feature
  const [setting, setSetting] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // State for new role tagging feature
  const [rolePermissions, setRolePermissions] = useState([]);
  const [sidebarPermissions, setSidebarPermissions] = useState([]);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedRoleForEdit, setSelectedRoleForEdit] = useState(null);

  // General state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAllSettings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [settingRes, rolePermissionsRes, sidebarPermissionsRes] =
        await Promise.all([
          supabase
            .from("company_settings")
            .select("*")
            .eq("setting_name", "inspection_workflow")
            .single(),
          supabase.from("workflow_role_permissions").select("*"),
          supabase.from("sidebar_permissions").select("id, role_name"),
        ]);

      if (settingRes.error) throw settingRes.error;
      if (rolePermissionsRes.error) throw rolePermissionsRes.error;
      if (sidebarPermissionsRes.error) throw sidebarPermissionsRes.error;

      setSetting(settingRes.data);
      setRolePermissions(rolePermissionsRes.data || []);
      setSidebarPermissions(sidebarPermissionsRes.data || []);
    } catch (err) {
      console.error("Failed to fetch settings:", err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllSettings();
  }, []);

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    fetchAllSettings();
  };

  // Handlers for the new role tagging modal
  const handleEditRole = (role) => {
    setSelectedRoleForEdit(role);
    setIsRoleModalOpen(true);
  };

  const handleRoleUpdateSuccess = () => {
    setIsRoleModalOpen(false);
    fetchAllSettings();
  };

  const renderContent = () => {
    if (isLoading) return <Loader />;
    if (error)
      return (
        <div className="text-center text-red-500 p-6">
          Error: {error.message}
        </div>
      );
    if (!setting)
      return (
        <div className="p-6 text-center text-gray-500">
          Workflow setting not found.
        </div>
      );

    return (
      <>
        {/* Section 1: Inspection Requirement */}
        <WorkflowSettingDisplay
          setting={setting}
          onEdit={() => setIsEditModalOpen(true)}
        />
        {/* Section 2: Role-Based Permissions */}
        <WorkflowRoleTaggingDisplay
          rolePermissions={rolePermissions}
          sidebarPermissions={sidebarPermissions}
          onEdit={handleEditRole}
        />
      </>
    );
  };

  const currentRolePermissions = rolePermissions.find(
    (p) => p.role_name === selectedRoleForEdit
  );

  return (
    <>
      <div className="space-y-6 w-full mx-auto p-2 pt-10 md:p-6 max-w-[95rem] xl:px-12 min-h-screen">
        <PageHeader
          title="Workflow & Permissions"
          description="Manage inspection requirements and role-based sidebar access."
        />
        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg">
          {renderContent()}
        </div>
      </div>

      {/* Modal for the Inspection Requirement toggle */}
      {setting && (
        <EditWorkflowSettingModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={handleEditSuccess}
          currentSetting={setting}
        />
      )}

      {/* Modal for Role Permission Tagging */}
      {selectedRoleForEdit && (
        <EditWorkflowRoleTaggingModal
          isOpen={isRoleModalOpen}
          onClose={() => setIsRoleModalOpen(false)}
          onSuccess={handleRoleUpdateSuccess}
          role={selectedRoleForEdit}
          currentPermissionIds={
            currentRolePermissions?.sidebar_permission_ids || []
          }
          availablePermissions={sidebarPermissions}
        />
      )}
    </>
  );
};

export default InspectionWorkflowSettings;
