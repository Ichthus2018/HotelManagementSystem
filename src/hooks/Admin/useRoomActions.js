import { useState } from "react";
import { useSWRConfig } from "swr";
import supabase from "../../services/supabaseClient";
import { SWR_KEY_ROOMS_DATA } from "../../pages/admin/RoomAssignments";

export const useRoomActions = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { mutate } = useSWRConfig();

  const assignStaff = async (assignmentData, options = {}) => {
    const { roomId, housekeepers, inspector } = assignmentData;
    setIsProcessing(true);

    console.log("🔄 Starting assignStaff with:", {
      roomId,
      housekeepers,
      inspector,
    });

    try {
      // Use upsert to handle both insert and update in one operation
      const { data, error } = await supabase
        .from("room_assignments")
        .upsert(
          {
            room_id: roomId,
            housekeepers: housekeepers || [],
            inspector: inspector || null,
            status:
              housekeepers && housekeepers.length > 0
                ? "For Cleaning"
                : "Dirty",
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "room_id",
            ignoreDuplicates: false,
          }
        )
        .select();

      if (error) {
        console.error("❌ Database error:", error);
        throw new Error(`Failed to save assignment: ${error.message}`);
      }

      console.log("✅ Assignment saved successfully:", data);

      // Update room status if housekeepers are assigned
      if (housekeepers && housekeepers.length > 0) {
        await supabase
          .from("rooms")
          .update({
            status: "occupied",
            updated_at: new Date().toISOString(),
          })
          .eq("id", roomId);
      }

      // Force refresh the data
      mutate(SWR_KEY_ROOMS_DATA);

      console.log("✅ Successfully completed assignStaff");
      options.onSuccess?.();
    } catch (error) {
      console.error("❌ Error in assignStaff:", error);
      options.onError?.(error);
      throw error; // Re-throw to handle in component
    } finally {
      setIsProcessing(false);
    }
  };

  const tagSelf = async ({ userId, roomId }, options = {}) => {
    setIsProcessing(true);
    try {
      console.log("🔄 Starting tagSelf with:", { userId, roomId });

      // Use the RPC function we created
      const { data, error } = await supabase.rpc("add_housekeeper_to_room", {
        p_room_id: roomId,
        p_housekeeper_id: userId,
      });

      if (error) {
        console.error("❌ RPC error:", error);
        throw new Error(`Failed to assign yourself: ${error.message}`);
      }

      console.log("✅ tagSelf RPC result:", data);

      mutate(SWR_KEY_ROOMS_DATA);
      options.onSuccess?.();
    } catch (error) {
      console.error("❌ Error in tagSelf:", error);
      options.onError?.(error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const updateStatus = async ({ roomId, newStatus }, options = {}) => {
    setIsProcessing(true);
    try {
      console.log("🔄 Starting updateStatus with:", { roomId, newStatus });

      // Use the RPC function for status updates
      const { data, error } = await supabase.rpc("update_room_status", {
        p_room_id: roomId,
        p_new_status: newStatus,
      });

      if (error) {
        console.error("❌ Status update error:", error);
        throw new Error(`Failed to update status: ${error.message}`);
      }

      console.log("✅ Status updated successfully:", data);

      mutate(SWR_KEY_ROOMS_DATA);
      options.onSuccess?.();
    } catch (error) {
      console.error("❌ Error updating status:", error);
      options.onError?.(error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    assignStaff,
    tagSelf,
    updateStatus,
    isProcessing,
  };
};
