import { useBookingContext } from "../AddBookingContext";
import { Calendar, Moon } from "lucide-react";

const DatesDurationStep = () => {
  const { bookingForm, updateForm } = useBookingContext();

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800 flex items-center">
        <Calendar className="h-5 w-5 mr-2 text-gray-600" />
        Step 2: Dates & Duration
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Check-In Date *
          </label>
          <input
            type="date"
            value={bookingForm.checkIn}
            onChange={(e) => updateForm("checkIn", e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Check-Out Date *
          </label>
          <input
            type="date"
            min={bookingForm.checkIn}
            value={bookingForm.checkOut}
            onChange={(e) => updateForm("checkOut", e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg"
            required
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
          <Moon className="h-4 w-4 mr-1 text-gray-500" />
          Number of Nights
        </label>
        <input
          type="number"
          min="0"
          value={bookingForm.nights}
          className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100"
          readOnly
        />
      </div>
    </div>
  );
};

export default DatesDurationStep;
