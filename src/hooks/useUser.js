// src/hooks/useUser.js
import useSWR from "swr";
import { useSession } from "../context/SessionContext";

// The fetcher function for SWR
// It receives the key (which we've structured as an array)
const fetcher = async ([_key, userId, supabase]) => {
  const { data, error, status } = await supabase
    .from("users")
    .select(
      `
      id, 
      email, 
      admin, 
      first_name, 
      last_name, 
      sidebar_permissions ( role_name, allowed_routes )
    `
    )
    .eq("id", userId)
    .single();

  if (error && status !== 406) {
    // 406 is a normal error when .single() finds no rows
    console.error("Error fetching user profile:", error);
    throw error;
  }

  return data;
};

export const useUser = () => {
  const { session, supabase, isLoading: isSessionLoading } = useSession();

  // The SWR key is an array. SWR will only fetch if the key is not null.
  // If `session.user.id` is not available, the key will be `null`, and no fetch will occur.
  const key = session?.user?.id ? ["user", session.user.id, supabase] : null;

  const { data, error, isLoading, mutate } = useSWR(key, fetcher, {
    // Optional: Revalidate on focus to keep data fresh across browser tabs
    revalidateOnFocus: true,
  });

  return {
    user: data, // The user profile data from your `users` table
    error,
    // The final loading state is true if either the session is loading OR the user profile is fetching
    isLoading: isSessionLoading || isLoading,
    mutate, // Expose SWR's mutate function for manual re-fetching or cache updates
  };
};
