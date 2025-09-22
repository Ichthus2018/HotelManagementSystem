// src/hooks/common/useSupabaseQuery.js

import { useState } from "react";
import useSWR from "swr";
import supabase from "../../services/supabaseClient";

// The generic fetcher function
const fetcher = async ({
  tableName,
  selectQuery,
  page,
  searchTerm,
  searchColumn,
  pageSize,
  filter, // <-- ADDED: Receive the filter object
}) => {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase.from(tableName).select(selectQuery, { count: "exact" });

  if (searchTerm && searchColumn) {
    query = query.ilike(searchColumn, `%${searchTerm}%`);
  }

  // --- MODIFICATION START ---
  // Apply the filter if it exists
  if (filter && filter.column && filter.value) {
    query = query.eq(filter.column, filter.value);
  }
  // --- MODIFICATION END ---

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("SWR Fetcher Error:", error);
    throw new Error(error.message || "Could not fetch data.");
  }

  return { data, count };
};

export const hookRoomType = ({
  tableName,
  selectQuery = "*",
  searchColumn,
  initialPageSize = 5,
  filter = null, // <-- ADDED: Accept a filter config, default to null
}) => {
  const [pageSize] = useState(initialPageSize);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearchTerm, setActiveSearchTerm] = useState("");

  const swrKey = {
    tableName,
    selectQuery,
    page: currentPage,
    searchTerm: activeSearchTerm,
    searchColumn,
    pageSize,
    filter, // <-- ADDED: Include filter in the SWR key
  };

  const {
    data: swrData,
    error,
    isLoading,
    mutate,
  } = useSWR(swrKey, fetcher, {
    keepPreviousData: true,
    // You might want to remove dedupingInterval to allow re-fetching when navigating
    // between pages that use the same hook but different filters. Or keep it if the
    // data is very static. For this use case, let's allow more frequent revalidation.
    revalidateOnFocus: true,
    revalidateIfStale: true,
  });

  const handleSearch = (e) => {
    e?.preventDefault();
    setCurrentPage(1);
    setActiveSearchTerm(searchTerm);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setActiveSearchTerm("");
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  };

  return {
    data: swrData?.data || [],
    totalCount: swrData?.count || 0,
    isLoading,
    error,
    mutate,
    currentPage,
    setCurrentPage,
    pageCount: Math.ceil((swrData?.count || 0) / pageSize),
    pageSize,
    searchTerm,
    setSearchTerm,
    activeSearchTerm,
    handleSearch,
    clearSearch,
  };
};
