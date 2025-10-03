// src/components/.../cards/AddCardForm.js

import { useState, useEffect } from "react";
import supabase from "../../../../../services/supabaseClient";
import axios from "axios"; // Import axios
import { API_BASE_URL } from "../../../../../services/api"; // Your API base URL
import { Loader2 } from "lucide-react";

// Helper function to combine date and time and format for input
const combineAndFormatDateTime = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return "";
  const combined = new Date(`${dateStr}T${timeStr}`);
  // Adjust for timezone offset to display correct local time
  const tzoffset = combined.getTimezoneOffset() * 60000;
  return new Date(combined - tzoffset).toISOString().slice(0, 16);
};

const AddCardForm = ({ room, booking, onSuccess }) => {
  const [cardNumber, setCardNumber] = useState("");
  const [cardType, setCardType] = useState("guest");
  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Set default guest name and validity dates from booking
  useEffect(() => {
    if (booking && room) {
      // Set default valid_from and valid_until
      const checkInTime = room.rooms?.room_types?.check_in || "14:00:00";
      const checkOutTime = room.rooms?.room_types?.check_out || "12:00:00";
      setValidFrom(
        combineAndFormatDateTime(booking.check_in_date, checkInTime)
      );
      setValidUntil(
        combineAndFormatDateTime(booking.check_out_date, checkOutTime)
      );
    }
  }, [booking, room]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const guestFirstName = booking?.guests?.first_name || "Guest";
    const guestLastName = booking?.guests?.last_name || "";
    const cardName = `${guestFirstName} ${guestLastName}`.trim();

    if (!cardNumber || !validFrom || !validUntil) {
      setError("Card Number and validity dates are required.");
      setIsSubmitting(false);
      return;
    }
    if (!room?.rooms?.lock_id) {
      setError("The selected room does not have a Lock ID configured.");
      setIsSubmitting(false);
      return;
    }

    // Convert dates to TTLock format (milliseconds timestamp)
    const startTimestamp = validFrom ? new Date(validFrom).getTime() : 0;
    const endTimestamp = validUntil ? new Date(validUntil).getTime() : 0;

    try {
      // 1. Add card to the physical lock via API
      const apiPayload = {
        cardNumber,
        cardName,
        startDate: startTimestamp,
        endDate: endTimestamp,
      };
      const response = await axios.post(
        `${API_BASE_URL}/locks/${room.rooms.lock_id}/cards`,
        apiPayload
      );

      if (response.data.errcode && response.data.errcode !== 0) {
        throw new Error(response.data.errmsg || "An API error occurred.");
      }

      // 2. Save card details to your Supabase DB
      const newCardRecord = {
        booking_id: booking.id,
        room_id: room.rooms.id,
        card_name: cardName,
        card_number: cardNumber, // <-- THE FIX IS HERE
        card_type: cardType,
        valid_from: new Date(startTimestamp).toISOString(),
        valid_until: new Date(endTimestamp).toISOString(),
        card_id_on_lock: response.data.cardId, // IMPORTANT: Save the ID from the lock
      };

      const { error: dbError } = await supabase
        .from("booking_cards")
        .insert([newCardRecord]);

      if (dbError) {
        // Here you might want to try and delete the card from the lock to prevent orphans
        console.error("DB Write Failed after adding to lock:", dbError);
        throw new Error(
          "Card was added to lock, but failed to save in database."
        );
      }

      // 3. Success
      onSuccess();
    } catch (err) {
      console.error("Error in handleSubmit:", err);
      const apiErrorMessage = err.response?.data?.error || err.message;
      setError(`Error: ${apiErrorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-500 text-sm pb-2">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Card Name
        </label>
        <p className="mt-1 text-gray-900 bg-gray-100 p-2 rounded-md">
          {`${booking?.guests?.first_name || ""} ${
            booking?.guests?.last_name || ""
          }`.trim()}
        </p>
      </div>

      <div>
        <label
          htmlFor="card_number"
          className="block text-sm font-medium text-gray-700"
        >
          Card Number*
        </label>
        <input
          type="text"
          name="card_number"
          id="card_number"
          value={cardNumber}
          onChange={(e) => setCardNumber(e.target.value)}
          placeholder="Tap or enter card number from reader"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm font-mono"
          required
        />
      </div>

      <div>
        <label
          htmlFor="card_type"
          className="block text-sm font-medium text-gray-700"
        >
          Card Type
        </label>
        <select
          name="card_type"
          id="card_type"
          value={cardType}
          onChange={(e) => setCardType(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          <option value="guest">Guest</option>
          <option value="staff">Staff</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="valid_from"
            className="block text-sm font-medium text-gray-700"
          >
            Valid From*
          </label>
          <input
            type="datetime-local"
            id="valid_from"
            name="valid_from"
            value={validFrom}
            onChange={(e) => setValidFrom(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label
            htmlFor="valid_until"
            className="block text-sm font-medium text-gray-700"
          >
            Valid Until*
          </label>
          <input
            type="datetime-local"
            id="valid_until"
            name="valid_until"
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
          />
        </div>
      </div>
      <p className="text-xs text-gray-500 !-mt-2">
        Dates default to booking check-in/out times. Adjust if needed.
      </p>

      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
        >
          {isSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            "Add Card"
          )}
        </button>
      </div>
    </form>
  );
};

export default AddCardForm;
