// src/hooks/useUser.js
import useSWR from "swr";
import { useSession } from "../context/SessionContext";

const fetcher = async ([_key, userId, supabase]) => {
  const { data, error, status } = await supabase
    .from("user_roles_view")
    .select(
      `
      id, 
      email, 
      admin, 
      first_name, 
      last_name, 
      sidebar_role, 
      allowed_routes,
      workflow_role 
    `
    )
    .eq("id", userId)
    .single();

  if (error && status !== 406) {
    console.error("Error fetching user profile from view:", error);
    throw error;
  }
  return data;
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
