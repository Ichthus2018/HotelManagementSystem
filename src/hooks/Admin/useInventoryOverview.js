import useSWR from "swr";
import supabase from "../../services/supabaseClient";

/**
 * The fetcher function dedicated to calling the get_inventory_overview RPC.
 * It does not need any parameters because the RPC function fetches everything.
 */
const inventoryFetcher = async () => {
  // Use .rpc() to call the PostgreSQL function
  const { data, error } = await supabase.rpc("get_inventory_overview");

  if (error) {
    console.error("SWR Inventory Fetcher Error:", error);
    // The error object from Supabase is more informative, so we throw it.
    throw error;
  }

  return data;
};

/**
 * A dedicated hook to fetch data from the get_inventory_overview function.
 * It's simpler than the generic query hook because search and filtering
 * are handled on the client-side within the component.
 */
export const useInventoryOverview = () => {
  // The SWR key is a simple string. When SWR sees this key, it will run our fetcher.
  const swrKey = "inventory_overview";

  const {
    data,
    error,
    isLoading,
    mutate, // 'mutate' allows us to manually re-fetch the data later if needed
  } = useSWR(swrKey, inventoryFetcher);

  return {
    // We return the raw data, and the component will handle filtering.
    // Default to an empty array to prevent errors on the first render.
    inventoryData: data || [],
    isLoading,
    error,
    mutate,
  };
};
