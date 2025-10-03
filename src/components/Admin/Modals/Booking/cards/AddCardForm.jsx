import { useState } from "react";
import supabase from "../../../../../services/supabaseClient";
import { Loader2 } from "lucide-react";

const AddCardForm = ({ room, booking, onSuccess }) => {
  const [formData, setFormData] = useState({
    card_name: "",
    card_number: "",
    card_type: "guest",
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
    if (!formData.card_name || !formData.card_number) {
      setError("Card name and number are required.");
      return;
    }
    setIsSubmitting(true);

    try {
      const newCard = {
        booking_id: booking.id,
        room_id: room.rooms.id,
        card_name: formData.card_name,
        card_number: formData.card_number,
        card_type: formData.card_type,
        valid_from: booking.check_in_date, // Default to booking dates
        valid_until: booking.check_out_date,
        // card_id_on_lock: cardIdOnLock, // Store the ID from the lock API response
      };

      const { error: dbError } = await supabase
        .from("booking_cards")
        .insert([newCard]);

      if (dbError) throw dbError;

      // If successful, call the parent's onSuccess function
      onSuccess();
    } catch (err) {
      console.error("Error adding card:", err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div>
        <label
          htmlFor="card_name"
          className="block text-sm font-medium text-gray-700"
        >
          Card Name
        </label>
        <input
          type="text"
          name="card_name"
          id="card_name"
          value={formData.card_name}
          onChange={handleChange}
          placeholder="e.g., John Doe - Main"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
        />
      </div>
      <div>
        <label
          htmlFor="card_number"
          className="block text-sm font-medium text-gray-700"
        >
          Card Number
        </label>
        <input
          type="text"
          name="card_number"
          id="card_number"
          value={formData.card_number}
          onChange={handleChange}
          placeholder="Tap or enter card number"
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
          value={formData.card_type}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          <option value="guest">Guest</option>
          <option value="staff">Staff</option>
          <option value="master">Master</option>
        </select>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
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
