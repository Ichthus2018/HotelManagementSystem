// src/hooks/useDebouncedSupabaseSearch.js

import { useState, useEffect, useCallback } from "react";
import supabase from "../../services/supabaseClient"; // Adjust path if necessary

export const useDebouncedSupabaseSearch = ({
  tableName,
  selectQuery,
  searchColumns,
  initialOrderBy = { column: "created_at", ascending: false },
  limit = 10,
  debounceMs = 450,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [results, setResults] = useState([]);
  // Set initial loading state to true for a better initial UI experience
  const [isLoading, setIsLoading] = useState(true);

  const clearInput = useCallback(() => {
    setInputValue("");
  }, []);

  // We stringify array dependencies to make them stable for the useEffect hook
  const stableSearchColumns = JSON.stringify(searchColumns);

  useEffect(() => {
    const fetchResults = async () => {
      // Destructure the stableSearchColumns back into an array
      const parsedSearchColumns = JSON.parse(stableSearchColumns);

      if (!tableName || !selectQuery || !parsedSearchColumns) {
        setIsLoading(false); // Stop loading if parameters are missing
        return;
      }

      setIsLoading(true);

      let query = supabase.from(tableName).select(selectQuery);

      if (inputValue.trim()) {
        const orFilter = parsedSearchColumns
          .map((column) => `${column}.ilike.%${inputValue.trim()}%`)
          .join(",");
        query = query.or(orFilter);
      } else {
        if (initialOrderBy?.column) {
          query = query.order(initialOrderBy.column, {
            ascending: initialOrderBy.ascending,
          });
        }
      }

      const { data, error } = await query.limit(limit);

      if (error) {
        console.error("Supabase search error:", error);
        setResults([]);
      } else {
        setResults(data || []);
      }

      setIsLoading(false);
    };

    const handler = setTimeout(() => {
      fetchResults();
    }, debounceMs);

    return () => {
      clearTimeout(handler);
    };
  }, [
    // --- DEPENDENCIES ARE NOW STABLE ---
    inputValue,
    tableName,
    selectQuery,
    limit,
    debounceMs,
    // We depend on the primitive values inside the object, not the object reference itself
    initialOrderBy.column,
    initialOrderBy.ascending,
    // We depend on the stringified version of the array
    stableSearchColumns,
  ]);

  return {
    inputValue,
    setInputValue,
    results,
    isLoading,
    clearInput,
  };
};
