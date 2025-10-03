import { useBookingContext } from "../AddBookingContext";

const BookingStatusStep = () => {
  // You get statusOptions from the context, so the direct import above is redundant.
  const { bookingForm, updateForm, statusOptions } = useBookingContext();

  // Split statusOptions into chunks of 3
  const chunkedStatus = [];
  for (let i = 0; i < statusOptions.length; i += 3) {
    chunkedStatus.push(statusOptions.slice(i, i + 3));
  }

  const colorClasses = {
    yellow: "border-yellow-500 bg-yellow-50 text-yellow-700",
    green: "border-green-500 bg-green-50 text-green-700",
    blue: "border-blue-500 bg-blue-50 text-blue-700",
    purple: "border-purple-500 bg-purple-50 text-purple-700",
    red: "border-red-500 bg-red-50 text-red-700",
    orange: "border-orange-500 bg-orange-50 text-orange-700",
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800">
        Step 1: Booking Status
      </h3>

      {chunkedStatus.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className={`grid gap-4 ${
            row.length === 3 ? "grid-cols-3" : "grid-cols-2"
          }`}
        >
          {row.map((status) => {
            const isSelected = bookingForm.bookingStatus === status.value;

            return (
              <label
                key={status.value}
                // I've adjusted the classes here to center the text
                className={`flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  isSelected
                    ? colorClasses[status.color]
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  value={status.value}
                  checked={isSelected}
                  onChange={(e) => updateForm("bookingStatus", e.target.value)}
                  className="sr-only"
                />
                <span className="text-sm font-medium">{status.label}</span>
              </label>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default BookingStatusStep;
