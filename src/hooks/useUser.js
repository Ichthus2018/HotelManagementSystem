// src/hooks/useUser.js
import useSWR from "swr";
import { useSession } from "../context/SessionContext";

const fetcher = async ([_key, userId, supabase]) => {
  const {
    data: rawData,
    error,
    status,
  } = await supabase
    .from("users")
    .select(
      `
      id,
      email,
      admin,
      first_name,
      last_name,
      sidebar_permissions (
        role_name,
        allowed_routes,
        allowed_roles
      )
    `
    )
    .eq("id", userId)
    .single();

  if (error && status !== 406) {
    console.error("Error fetching user profile:", error);
    throw error;
  }

  if (!rawData) {
    return null;
  }

  const { sidebar_permissions, ...userProfile } = rawData;

  const user = {
    ...userProfile,
    sidebar_role: sidebar_permissions?.role_name,
    allowed_routes: sidebar_permissions?.allowed_routes || [],
    // Convert to array and ensure it's always an array
    workflow_role: Array.isArray(sidebar_permissions?.allowed_roles)
      ? sidebar_permissions.allowed_roles
      : sidebar_permissions?.allowed_roles
      ? [sidebar_permissions.allowed_roles]
      : [],
  };

  return user;
};

export const useUser = () => {
  const { session, supabase, isLoading: isSessionLoading } = useSession();
  const key = session?.user?.id
    ? ["user_profile", session.user.id, supabase]
    : null;

  const { data, error, isLoading, mutate } = useSWR(key, fetcher, {
    revalidateOnFocus: true,
  });

  return {
    user: data,
    error,
    isLoading: isSessionLoading || isLoading,
    mutate,
  };
};
