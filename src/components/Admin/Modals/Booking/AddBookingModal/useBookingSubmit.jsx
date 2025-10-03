import { useCallback } from "react";
import supabase from "../../../../../services/supabaseClient";
import { useBookingCalculator } from "./useBookingCalculator";

export const useBookingSubmit = (initialData) => {
  const { calculateFinancials } = useBookingCalculator();

  const submitBooking = useCallback(
    async (bookingForm, priceBreakdown, onSuccess) => {
      try {
        const isEditMode = !!initialData;

        let finalProfileImageUrl = "";
        let guestDataForPayload = null;
        let guestIdForBooking =
          bookingForm.guestMode === "existing"
            ? bookingForm.selectedGuest?.id
            : null;

        // Handle photo upload for new guests (only in create mode)
        if (
          !isEditMode &&
          bookingForm.guestMode === "new" &&
          bookingForm.idPhoto
        ) {
          const file = bookingForm.idPhoto;
          const fileExt = file.name.split(".").pop();
          const fileName = `${Date.now()}_${Math.random()
            .toString(36)
            .substring(2)}.${fileExt}`;
          const filePath = `public/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("guest-photos")
            .upload(filePath, file);

          if (uploadError) {
            throw new Error(
              `Failed to upload ID photo: ${uploadError.message}`
            );
          }

          const { data: urlData } = supabase.storage
            .from("guest-photos")
            .getPublicUrl(filePath);
          finalProfileImageUrl = urlData.publicUrl;
        }

        // Prepare guest data for new guests (only in create mode)
        if (!isEditMode && bookingForm.guestMode === "new") {
          guestDataForPayload = {
            first_name: bookingForm.firstName,
            middle_name: bookingForm.middleName || null,
            last_name: bookingForm.lastName,
            contact_no: bookingForm.contactNo || null,
            email: bookingForm.email || null,
            profile_image_url: finalProfileImageUrl || null,
            street_address: bookingForm.streetAddress || null,
            region: bookingForm.region || null,
            province: bookingForm.province || null,
            city_municipality: bookingForm.cityMunicipality || null,
            barangay: bookingForm.barangay || null,
          };
        }

        // Calculate final financials
        const financials = calculateFinancials(
          priceBreakdown,
          bookingForm.charges,
          bookingForm.discount,
          bookingForm.discount_type,
          bookingForm.payments
        );

        // Prepare booking data
        const bookingDataForPayload = {
          guest_id: guestIdForBooking,
          check_in_date: bookingForm.checkIn,
          check_out_date: bookingForm.checkOut,
          num_adults: bookingForm.adults,
          num_children: bookingForm.children,
          status: bookingForm.bookingStatus,
          notes: bookingForm.specialRequests || null,
          room_subtotal: financials.roomSubtotal,
          charges_subtotal:
            financials.vatableChargesSubtotal +
            financials.nonVatableChargesSubtotal,
          discount: financials.discount,
          discount_type: bookingForm.discount_type,
          vat_amount: financials.vatAmount,
          grand_total: financials.grandTotal,
        };

        // Prepare relational data
        const roomsDataForPayload = bookingForm.selectedRooms
          .filter((r) => r.room?.id)
          .map((selectedRoom) => {
            const roomNightlyData = priceBreakdown?.nightly_breakdown?.find(
              (night) => night.room_number === selectedRoom.room.room_number
            );
            const priceAtBooking = roomNightlyData?.room_rate || 0;

            return {
              id: selectedRoom.room.id,
              price_at_booking: priceAtBooking,
              num_nights: bookingForm.nights,
              allocated_guests: selectedRoom.allocatedGuests,
            };
          });

        const chargesDataForPayload = bookingForm.charges;
        const paymentsDataForPayload = bookingForm.payments;

        // **CRITICAL FIX: Use different RPC functions for create vs edit**
        let result;
        if (isEditMode) {
          // For edit mode, include the booking ID and use update RPC
          const updatePayload = {
            p_booking_id: initialData.id, // Include the existing booking ID
            p_booking_data: bookingDataForPayload,
            p_guest_data: guestDataForPayload,
            p_rooms_data: roomsDataForPayload,
            p_charges_data: chargesDataForPayload,
            p_payments_data: paymentsDataForPayload,
          };

          const { data, error: rpcError } = await supabase.rpc(
            "update_full_booking", // You'll need to create this RPC function
            updatePayload
          );

          if (rpcError) {
            throw new Error(
              rpcError.message ||
                "An unknown error occurred during booking update."
            );
          }
          result = data;
        } else {
          // For create mode, use the existing create RPC
          const createPayload = {
            p_booking_data: bookingDataForPayload,
            p_guest_data: guestDataForPayload,
            p_rooms_data: roomsDataForPayload,
            p_charges_data: chargesDataForPayload,
            p_payments_data: paymentsDataForPayload,
          };

          const { data, error: rpcError } = await supabase.rpc(
            "create_full_booking",
            createPayload
          );

          if (rpcError) {
            throw new Error(
              rpcError.message ||
                "An unknown error occurred during booking creation."
            );
          }
          result = data;
        }

        // ✅ CALL onSuccess HERE after successful submission
        if (onSuccess && typeof onSuccess === "function") {
          onSuccess(result);
        }

        return result;
      } catch (error) {
        console.error("Booking submission error:", error);
        throw error;
      }
    },
    [calculateFinancials, initialData] // Add initialData to dependencies
  );

  return {
    submitBooking,
  };
};
