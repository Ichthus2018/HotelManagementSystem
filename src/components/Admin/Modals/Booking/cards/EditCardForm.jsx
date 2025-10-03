// src/components/.../cards/EditCardForm.js

import { useState } from "react";
import supabase from "../../../../../services/supabaseClient";
import axios from "axios"; // Import axios
import { API_BASE_URL } from "../../../../../services/api"; // Your API base URL
import { Loader2 } from "lucide-react";

// Helper function to format dates for the datetime-local input
const formatDateForInput = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};

const EditCardForm = ({ card, onSuccess }) => {
  const [formData, setFormData] = useState({
    valid_from: formatDateForInput(card.valid_from),
    valid_until: formatDateForInput(card.valid_until),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (!card.rooms?.lock_id || !card.card_id_on_lock) {
      setError("Card is missing lock information. Cannot update.");
      setIsSubmitting(false);
      return;
    }

    // Convert dates to TTLock format (milliseconds timestamp)
    const startTimestamp = formData.valid_from
      ? new Date(formData.valid_from).getTime()
      : 0;
    const endTimestamp = formData.valid_until
      ? new Date(formData.valid_until).getTime()
      : 0;

    try {
      // 1. Update the card on the physical lock via API
      const apiPayload = {
        startDate: startTimestamp,
        endDate: endTimestamp,
      };
      await axios.put(
        `${API_BASE_URL}/locks/${card.rooms.lock_id}/cards/${card.card_id_on_lock}`,
        apiPayload
      );

      // 2. If successful, update the record in Supabase
      const dbUpdateData = {
        valid_from: new Date(startTimestamp).toISOString(),
        valid_until: new Date(endTimestamp).toISOString(),
      };
      const { error: dbError } = await supabase
        .from("booking_cards")
        .update(dbUpdateData)
        .eq("id", card.id);

      if (dbError) throw dbError;

      // 3. Success
      onSuccess();
    } catch (err) {
      console.error("Error updating card:", err);
      const apiErrorMessage = err.response?.data?.error || err.message;
      setError(`Error: ${apiErrorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Card Name
        </label>
        <p className="mt-1 text-gray-900 bg-gray-100 p-2 rounded-md">
          {card.card_name}
        </p>
      </div>

      <div>
        <label
          htmlFor="valid_from"
          className="block text-sm font-medium text-gray-700"
        >
          Valid From
        </label>
        <input
          type="datetime-local"
          name="valid_from"
          id="valid_from"
          value={formData.valid_from}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm"
        />
      </div>
      <div>
        <label
          htmlFor="valid_until"
          className="block text-sm font-medium text-gray-700"
        >
          Valid Until
        </label>
        <input
          type="datetime-local"
          name="valid_until"
          id="valid_until"
          value={formData.valid_until}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm"
        />
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:bg-yellow-300"
        >
          {isSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            "Save Changes"
          )}
        </button>
      </div>
    </form>
  );
};

export default EditCardForm;
