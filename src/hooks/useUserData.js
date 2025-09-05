// src/hooks/useUserData.js
import useSWR from "swr";
import supabase from "../services/supabaseClient";
import { useAuth } from "./useAuth"; // Assuming useAuth is in the hooks folder

// The fetcher function for SWR
const fetcher = async (key, userId) => {
  if (!userId) {
    throw new Error("User not authenticated.");
  }

  const { data, error } = await supabase
    .from(key) // 'key' will be the table name, e.g., 'bookings'
    .select("*")
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
  return data;
};

// The custom hook
const useUserData = (tableName) => {
  const { user } = useAuth();
  const { data, error, mutate } = useSWR(
    user ? [tableName, user.id] : null, // Only fetch if the user exists
    ([key, userId]) => fetcher(key, userId)
  );

  return {
    data,
    isLoading: !error && !data,
    isError: error,
    mutate, // Allows you to re-fetch the data on demand
  };
};

export default useUserData;
