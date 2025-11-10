// src/hooks/useStaffByRole.js
import useSWR from "swr";
import supabase from "../../services/supabaseClient";

const fetchStaffByRole = async () => {
  try {
    // Fetch all users with their sidebar_permissions
    const { data: users, error } = await supabase
      .from("users")
      .select(
        `
        id,
        email,
        first_name,
        last_name,
        admin,
        sidebar_permissions (
          role_name,
          allowed_routes,
          allowed_roles
        )
      `
      )
      .order("first_name", { ascending: true });

    if (error) throw error;

    // Filter users based on allowed_roles
    const housekeepers = users.filter((user) =>
      user.sidebar_permissions?.allowed_roles?.includes("Housekeeping")
    );

    const inspectors = users.filter((user) =>
      user.sidebar_permissions?.allowed_roles?.includes("Inspector")
    );

    return {
      housekeepers: housekeepers || [],
      inspectors: inspectors || [],
      allUsers: users || [],
    };
  } catch (error) {
    console.error("Error fetching staff by role:", error);
    throw error;
  }
};

export const useStaffByRole = () => {
  const { data, error, isLoading, mutate } = useSWR(
    "staff_by_role",
    fetchStaffByRole,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 1 minute
    }
  );

  return {
    housekeepers: data?.housekeepers || [],
    inspectors: data?.inspectors || [],
    allUsers: data?.allUsers || [],
    error,
    isLoading,
    mutate,
  };
};
