import { useState } from "react";
import supabase from "../../../../../services/supabaseClient";
import { Loader2 } from "lucide-react";

// Helper function to format dates for the datetime-local input
const formatDateForInput = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  // Returns date in "YYYY-MM-DDTHH:mm" format
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};

const EditCardForm = ({ card, onSuccess }) => {
  const [formData, setFormData] = useState({
    card_name: card.card_name || "",
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
    if (!formData.card_name) {
      setError("Card name is required.");
      return;
    }
    setIsSubmitting(true);

    try {
      // NOTE: Here you would first call an Edge Function to update the physical lock.
      // This might involve deleting the old card and adding a new one with the updated validity.

      const updateData = {
        card_name: formData.card_name,
        // Convert local datetime back to ISO string for Supabase (timestamp with time zone)
        valid_from: new Date(formData.valid_from).toISOString(),
        valid_until: new Date(formData.valid_until).toISOString(),
      };

      const { error: dbError } = await supabase
        .from("booking_cards")
        .update(updateData)
        .eq("id", card.id);

      if (dbError) throw dbError;

      onSuccess();
    } catch (err) {
      console.error("Error updating card:", err);
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
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 sm:text-sm"
          required
        />
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
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:bg-yellow-300 disabled:cursor-not-allowed"
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
