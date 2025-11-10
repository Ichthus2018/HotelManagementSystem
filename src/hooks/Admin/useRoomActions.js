// src/hooks/Admin/useRoomActions.js
import { useState } from "react";
import { useSWRConfig } from "swr";
import supabase from "../../services/supabaseClient";
import { SWR_KEY_ROOMS_DATA } from "../../pages/admin/RoomAssignments";
import { useUser } from "../useUser";

export const useRoomActions = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { mutate } = useSWRConfig();
  const { user } = useUser();

  const revalidateRoomsData = () => {
    mutate((key) => Array.isArray(key) && key[0] === SWR_KEY_ROOMS_DATA);
  };

  const assignStaff = async (assignmentData, options = {}) => {
    const { roomId, housekeepers, inspector, requires_inspection } =
      assignmentData;
    setIsProcessing(true);

    try {
      console.log("🔄 Starting assignStaff with:", {
        roomId,
        housekeepers,
        inspector,
        requires_inspection,
      });

      const { data, error } = await supabase
        .from("room_assignments")
        .upsert(
          {
            room_id: roomId,
            housekeepers: housekeepers || [],
            inspector: requires_inspection ? inspector || null : null,
            assigned_by: user?.id,
            // ✅ CORRECTED: Status is set to 'For Cleaning' when staff are assigned.
            status: "For Cleaning",
            updated_at: new Date().toISOString(),
            requires_inspection: requires_inspection,
          },
          { onConflict: "room_id", ignoreDuplicates: false }
        )
        .select();

      if (error) throw new Error(`Failed to save assignment: ${error.message}`);
      console.log("✅ Assignment saved:", data);
      revalidateRoomsData();
      options.onSuccess?.();
    } catch (error) {
      console.error("❌ assignStaff error:", error);
      options.onError?.(error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const tagSelf = async ({ userId, roomId }, options = {}) => {
    setIsProcessing(true);
    try {
      console.log("🔄 Starting tagSelf with:", { userId, roomId });
      const { error } = await supabase.rpc("add_housekeeper_to_room", {
        p_room_id: roomId,
        p_housekeeper_id: userId,
      });

      if (error) throw new Error(`Failed to assign yourself: ${error.message}`);

      console.log("✅ tagSelf successful");
      revalidateRoomsData();
      options.onSuccess?.();
    } catch (error) {
      console.error("❌ tagSelf error:", error);
      options.onError?.(error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const updateStatus = async ({ roomId, newStatus }, options = {}) => {
    setIsProcessing(true);
    try {
      console.log("🔄 Updating status via upsert:", { roomId, newStatus });

      const { error } = await supabase
        .from("room_assignments")
        .upsert(
          {
            room_id: roomId,
            status: newStatus,
            updated_at: new Date().toISOString(),
            assigned_by: user?.id, // Also track who changed the status
          },
          { onConflict: "room_id", ignoreDuplicates: false }
        )
        .select();

      if (error) throw new Error(`Failed to update status: ${error.message}`);

      console.log("✅ Status updated successfully");
      revalidateRoomsData();
      options.onSuccess?.();
    } catch (error) {
      console.error("❌ updateStatus error:", error);
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
