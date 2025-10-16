// src/hooks/inventory/useInventoryHistoryData.js

import { useState } from "react";
import useSWR from "swr";
import supabase from "../../services/supabaseClient";

// --- CHANGE 1: Query the new view ---
const VIEW_NAME = "inventory_movements_with_item_details";
// Define all the columns we need from the view
const SELECT_QUERY = `id, created_at, quantity_change, action_type, reason, item_name, item_code`;

const BASE_ORDER_COLUMN = "created_at";

/**
 * Custom fetcher for Inventory History using the new view
 */
const inventoryHistoryFetcher = async ({ page, pageSize, filterText }) => {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    // --- CHANGE 2: Use the view name here ---
    .from(VIEW_NAME)
    .select(SELECT_QUERY, { count: "exact" });

  // --- CHANGE 3: The OR query is now much simpler! ---
  // Both `reason` and `item_name` are top-level columns in our view.
  if (filterText) {
    const searchPattern = `%${filterText}%`;
    query = query.or(
      `reason.ilike.${searchPattern},item_name.ilike.${searchPattern}`
    );
  }

  const { data, error, count } = await query
    .order(BASE_ORDER_COLUMN, { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Inventory History Fetcher Error:", error);
    throw new Error(error.message || "Could not fetch inventory history.");
  }

  // The data structure from the view is slightly different, so we map it back
  // to what the MovementList component expects.
  const formattedData = data.map((move) => ({
    ...move,
    item: {
      item_name: move.item_name,
      item_code: move.item_code,
    },
  }));

  return { data: formattedData, count };
};

export const useInventoryHistoryData = ({
  filterText,
  initialPageSize = 15,
}) => {
  const [pageSize] = useState(initialPageSize);
  const [currentPage, setCurrentPage] = useState(1);

  const swrKey = {
    key: "inventory_history_view", // Changed key to avoid stale cache
    page: currentPage,
    pageSize,
    filterText: filterText || "",
  };

  const {
    data: swrData,
    error,
    isLoading,
    mutate,
  } = useSWR(swrKey, () => inventoryHistoryFetcher(swrKey), {
    keepPreviousData: true,
    revalidateOnFocus: false,
  });

  return {
    movements: swrData?.data || [],
    totalCount: swrData?.count || 0,
    isLoading,
    error,
    mutate,
    currentPage,
    setCurrentPage,
    pageCount: Math.ceil((swrData?.count || 0) / pageSize),
    pageSize,
  };
};
