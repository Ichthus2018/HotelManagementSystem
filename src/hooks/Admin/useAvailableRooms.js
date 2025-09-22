import { useState, useEffect, useCallback } from "react";
import supabase from "../../services/supabaseClient";
import { useDebounce } from "@uidotdev/usehooks";

export const useAvailableRooms = ({ startDate, endDate }) => {
  const [availableRooms, setAvailableRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const fetchRooms = useCallback(
    async (signal) => {
      if (!startDate || !endDate || new Date(endDate) <= new Date(startDate)) {
        setAvailableRooms([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const query = supabase.rpc("get_available_rooms", {
          start_date: startDate,
          end_date: endDate,
          search_query: debouncedSearchTerm,
        });

        // This line will THROW an error on abort and jump to catch.
        const { data, error: rpcError } = await query.abortSignal(signal);

        // This check is for DATABASE errors (e.g., bad SQL), not network errors.
        if (rpcError) {
          throw rpcError;
        }

        setAvailableRooms(data || []);
      } catch (err) {
        // ============================ THE FIX IS HERE ============================
        // We check if the error's MESSAGE includes 'AbortError'.
        // This correctly identifies the cancelled request from Supabase.
        const isAbortError = err.message.includes("AbortError");

        if (!isAbortError) {
          // Only log and set state if it's a genuine error.
          console.error("A real error occurred:", err);
          setError(err);
        } else {
          // Optionally, log that the abort was successful and intentional.
          console.log("Fetch aborted (this is normal and efficient)");
        }
        // ========================== END OF FIX ============================
      } finally {
        setIsLoading(false);
      }
    },
    [startDate, endDate, debouncedSearchTerm]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchRooms(controller.signal);

    return () => {
      controller.abort();
    };
  }, [fetchRooms]);

  return { availableRooms, isLoading, error, searchTerm, setSearchTerm };
};
