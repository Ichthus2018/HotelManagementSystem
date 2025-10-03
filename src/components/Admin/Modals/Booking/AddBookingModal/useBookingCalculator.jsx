import { useCallback } from "react";
import supabase from "../../../../../services/supabaseClient";

export const useBookingCalculator = () => {
  const calculatePrice = useCallback(
    async (checkIn, checkOut, selectedRooms) => {
      if (!checkIn || !checkOut || new Date(checkOut) <= new Date(checkIn)) {
        return null;
      }

      const payload = {
        p_check_in_date: checkIn,
        p_check_out_date: checkOut,
        p_selected_rooms: selectedRooms
          .filter((r) => r.room?.id)
          .map((r) => ({
            room_id: r.room.id,
            allocated_guests: r.allocatedGuests,
          })),
      };

      if (payload.p_selected_rooms.length === 0) {
        return null;
      }

      const { data, error } = await supabase.rpc(
        "calculate_booking_price",
        payload
      );

      if (error) {
        console.error("Price calculation RPC error:", error);
        throw new Error(
          "Could not calculate the price. Please check the booking details and try again."
        );
      }

      return data;
    },
    []
  );

  const calculateFinancials = useCallback(
    (priceBreakdown, charges, discount, discountType, payments) => {
      const VAT_RATE = 0.12;

      const roomAndGuestTotal =
        (priceBreakdown?.room_subtotal || 0) +
        (priceBreakdown?.extra_guest_total || 0);

      let vatableChargesSubtotal = 0;
      let nonVatableChargesSubtotal = 0;
      const allVatableCharges = [];
      const allNonVatableCharges = [];

      charges.forEach((charge) => {
        let totalChargeAmount = 0;
        if (charge.charge_type === "percentage") {
          totalChargeAmount = roomAndGuestTotal * (charge.unit_price / 100);
        } else {
          totalChargeAmount = charge.unit_price * charge.quantity;
        }

        const chargeDetails = {
          name: charge.name,
          amount: totalChargeAmount,
          quantity: charge.quantity,
        };

        if (charge.is_vatable) {
          allVatableCharges.push(chargeDetails);
          vatableChargesSubtotal += totalChargeAmount;
        } else {
          allNonVatableCharges.push(chargeDetails);
          nonVatableChargesSubtotal += totalChargeAmount;
        }
      });

      const discountAmount = Number(discount) || 0;
      const totalVatableAmount = roomAndGuestTotal + vatableChargesSubtotal;
      let vatBase, vatAmount, grandTotal;

      if (discountType === "before_tax") {
        vatBase = Math.max(0, totalVatableAmount - discountAmount);
        vatAmount = vatBase * VAT_RATE;
        grandTotal = vatBase + vatAmount + nonVatableChargesSubtotal;
      } else {
        vatBase = totalVatableAmount;
        vatAmount = vatBase * VAT_RATE;
        const subtotalBeforeDiscount =
          vatBase + vatAmount + nonVatableChargesSubtotal;
        grandTotal = Math.max(0, subtotalBeforeDiscount - discountAmount);
      }

      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      const balanceDue = Math.max(0, grandTotal - totalPaid);
      const changeDue = Math.max(0, totalPaid - grandTotal);

      return {
        roomSubtotal: roomAndGuestTotal,
        discount: discountAmount,
        vatBase,
        vatAmount,
        grandTotal,
        totalPaid,
        balanceDue,
        changeDue,
        vatableCharges: allVatableCharges,
        nonVatableCharges: allNonVatableCharges,
      };
    },
    []
  );

  return {
    calculatePrice,
    calculateFinancials,
  };
};
