import React, { useState, Fragment } from "react";
import { format } from "date-fns";
import {
  ChevronDown,
  BedDouble,
  Receipt,
  Wallet,
  CreditCard,
  Tag,
} from "lucide-react";

// Helper function to format currency (no changes needed)
const formatCurrency = (amount) => {
  const numericAmount = Number(amount);
  if (isNaN(numericAmount)) {
    return "₱0.00";
  }
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(numericAmount);
};

// Status badge component (no changes needed)
const StatusBadge = ({ status }) => {
  const statusStyles = {
    pending: "bg-yellow-100 text-yellow-800",
    reserved: "bg-green-100 text-green-800",
    checked_in: "bg-blue-100 text-blue-800",
    checked_out: "bg-indigo-100 text-indigo-800",
    cancelled: "bg-red-100 text-red-800",
    no_show: "bg-orange-100 text-orange-800",
    default: "bg-gray-100 text-gray-800",
  };
  const style = statusStyles[status] || statusStyles.default;
  const label = (status || "unknown").replace("_", " ").toUpperCase();
  return (
    <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${style}`}>
      {label}
    </span>
  );
};

// The main enhanced BookingList component
const BookingList = ({ bookings, onDelete, onEdit, onManageCards }) => {
  const [expandedRows, setExpandedRows] = useState({});

  const toggleRow = (bookingId) => {
    setExpandedRows((prev) => ({
      ...prev,
      [bookingId]: !prev[bookingId],
    }));
  };

  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        {/* ... thead remains the same ... */}
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-4 py-3 w-12">
              <span className="sr-only">Expand</span>
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Guest
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Dates
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Rooms
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Status
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Total Bill
            </th>
            <th scope="col" className="relative px-6 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {bookings.map((booking) => {
            const isExpanded = expandedRows[booking.id];
            const totalPaid =
              booking.payments?.reduce((sum, p) => sum + Number(p.amount), 0) ||
              0;
            const balanceDue = booking.grand_total - totalPaid;

            return (
              <Fragment key={booking.id}>
                <tr
                  className={`hover:bg-gray-50 ${
                    isExpanded ? "bg-gray-50" : ""
                  }`}
                >
                  <td className="px-4 py-4">
                    <button
                      onClick={() => toggleRow(booking.id)}
                      className="p-1 rounded-full hover:bg-gray-200"
                    >
                      <ChevronDown
                        className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${
                          isExpanded ? "transform rotate-180" : ""
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {booking.guests?.first_name} {booking.guests?.last_name}
                    </div>
                    <div className="text-sm text-gray-500 font-mono">
                      {booking.id.substring(0, 8)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>
                      Check-in:{" "}
                      {format(new Date(booking.check_in_date), "MMM dd, yyyy")}
                    </div>
                    <div>
                      Check-out:{" "}
                      {format(new Date(booking.check_out_date), "MMM dd, yyyy")}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {booking.booking_rooms
                      ?.map((br) => br.rooms?.room_number)
                      .filter(Boolean)
                      .join(", ")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={booking.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-mono text-gray-800">
                    {formatCurrency(booking.grand_total)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => onManageCards(booking)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                      title="Manage Key Cards"
                    >
                      Cards
                    </button>
                    <button
                      onClick={() => onEdit(booking)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(booking.id)}
                      className="text-red-600 hover:text-red-900 focus:outline-none"
                    >
                      Delete
                    </button>
                  </td>
                </tr>

                {isExpanded && (
                  <tr className="bg-slate-50">
                    <td colSpan="7" className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* ... Column 1 remains the same ... */}
                        <div className="space-y-3">
                          <h4 className="font-semibold text-sm text-gray-700 flex items-center">
                            <BedDouble className="h-4 w-4 mr-2" /> Booked Rooms
                          </h4>
                          <div className="text-sm space-y-2 p-3 bg-white rounded-md border">
                            {booking.booking_rooms?.length > 0 ? (
                              booking.booking_rooms.map((br) => (
                                <div
                                  key={br.id}
                                  className="flex justify-between"
                                >
                                  <span>
                                    Room{" "}
                                    <strong>
                                      {br.rooms?.room_number || "N/A"}
                                    </strong>{" "}
                                    ({br.num_nights} nights)
                                  </span>
                                  <span className="font-mono">
                                    {formatCurrency(br.price_at_booking)}/night
                                  </span>
                                </div>
                              ))
                            ) : (
                              <p className="text-gray-500">
                                No rooms assigned.
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Column 2: Charges & Payments */}
                        <div className="space-y-3">
                          <h4 className="font-semibold text-sm text-gray-700 flex items-center">
                            <Receipt className="h-4 w-4 mr-2" /> Additional
                            Charges
                          </h4>

                          <div className="text-sm space-y-2 p-3 bg-white rounded-md border max-h-40 overflow-y-auto">
                            {booking.booking_charges.map((bc) => {
                              console.log(
                                "Charge Type:",
                                bc.charge_type_at_booking
                              ); // 👈 now works

                              return (
                                <div
                                  key={bc.id}
                                  className="flex justify-between"
                                >
                                  <span>
                                    {bc.charge_items?.name || "Charge"} (x
                                    {bc.quantity})
                                  </span>
                                  <span className="font-mono">
                                    {bc.charge_type_at_booking === "percentage"
                                      ? `${bc.unit_price_at_booking}%`
                                      : formatCurrency(
                                          (bc.unit_price_at_booking || 0) *
                                            bc.quantity
                                        )}
                                  </span>
                                </div>
                              );
                            })}
                          </div>

                          {/* ... Payments section remains the same ... */}
                          <h4 className="font-semibold text-sm text-gray-700 flex items-center pt-2">
                            <CreditCard className="h-4 w-4 mr-2" /> Payments
                            Recorded
                          </h4>
                          <div className="text-sm space-y-2 p-3 bg-white rounded-md border max-h-40 overflow-y-auto">
                            {booking.payments?.length > 0 ? (
                              booking.payments.map((p) => (
                                <div
                                  key={p.id}
                                  className="flex justify-between"
                                >
                                  <span className="capitalize">
                                    {p.method.replace("_", " ")}
                                  </span>
                                  <span className="font-mono text-green-700">
                                    {formatCurrency(p.amount)}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <p className="text-gray-500">
                                No payments recorded.
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h4 className="font-semibold text-sm text-gray-700 flex items-center">
                            <Wallet className="h-4 w-4 mr-2" /> Financial
                            Summary
                          </h4>
                          <div className="text-sm space-y-2 p-3 bg-white rounded-md border">
                            <div className="flex justify-between">
                              <span>Room Subtotal:</span>
                              <span className="font-mono">
                                {formatCurrency(booking.room_subtotal)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Charges Subtotal:</span>
                              <span className="font-mono">
                                {formatCurrency(booking.charges_subtotal)}
                              </span>
                            </div>
                            <div className="flex justify-between text-red-600">
                              <span>
                                <Tag className="h-3 w-3 inline-block mr-1" />
                                Discount:
                              </span>
                              <span className="font-mono">
                                - {formatCurrency(booking.discount)}
                              </span>
                            </div>
                            <div className="flex justify-between border-t pt-2 mt-2">
                              <span>VAT (12%):</span>
                              <span className="font-mono">
                                {formatCurrency(booking.vat_amount)}
                              </span>
                            </div>
                            <div className="flex justify-between font-bold">
                              <span>Grand Total:</span>
                              <span className="font-mono">
                                {formatCurrency(booking.grand_total)}
                              </span>
                            </div>
                            <div className="flex justify-between text-green-700 border-t pt-2 mt-2">
                              <span>Total Paid:</span>
                              <span className="font-mono">
                                {formatCurrency(totalPaid)}
                              </span>
                            </div>
                            <div
                              className={`flex justify-between font-bold text-lg pt-2 mt-2 ${
                                balanceDue > 0
                                  ? "text-red-600"
                                  : "text-emerald-600"
                              }`}
                            >
                              <span>Balance Due:</span>
                              <span className="font-mono">
                                {formatCurrency(balanceDue)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default BookingList;
