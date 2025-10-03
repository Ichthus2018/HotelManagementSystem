import { useState, useEffect, useMemo, useCallback } from "react";
import {
  PlusCircle,
  MinusCircle,
  ChevronDown,
  Loader2,
  Receipt,
} from "lucide-react";
import { useBookingContext } from "../AddBookingContext";
import { useBookingCalculator } from "../useBookingCalculator";
import Card from "../../../../../ui/common/Card";
import ReceiptLine from "../../../../../ui/common/ReceiptLine";
import supabase from "../../../../../../services/supabaseClient";

const PaymentStep = () => {
  const {
    bookingForm,
    updateForm,
    addCharge,
    removeCharge,
    addPayment,
    removePayment,
    priceBreakdown,
    setPriceBreakdown,
  } = useBookingContext();

  const { calculatePrice, calculateFinancials } = useBookingCalculator();

  const [isChargesLoading, setIsChargesLoading] = useState(true);
  const [availableCharges, setAvailableCharges] = useState([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState(null);
  const [newPayment, setNewPayment] = useState({ amount: "", method: "cash" });
  const [newCharge, setNewCharge] = useState({ id: "", quantity: 1 });

  const formatCurrency = (amount) => `₱${Number(amount || 0).toFixed(2)}`;

  const handleCalculatePrice = useCallback(async () => {
    setPriceBreakdown(null);
    setCalculationError(null);
    const { checkIn, checkOut, selectedRooms } = bookingForm;

    if (
      !checkIn ||
      !checkOut ||
      new Date(checkOut) <= new Date(checkIn) ||
      selectedRooms.some((r) => !r.room)
    ) {
      return;
    }

    setIsCalculating(true);
    try {
      const result = await calculatePrice(checkIn, checkOut, selectedRooms);
      setPriceBreakdown(result);
    } catch (error) {
      setCalculationError(error.message);
    } finally {
      setIsCalculating(false);
    }
  }, [
    bookingForm.checkIn,
    bookingForm.checkOut,
    bookingForm.selectedRooms,
    calculatePrice,
    setPriceBreakdown,
  ]);

  // FIX #2: Correctly call the debounced price calculation function.
  useEffect(() => {
    const handler = setTimeout(() => {
      handleCalculatePrice(); // <-- FIXED: Was 'calculatePrice()'
    }, 500);
    return () => {
      clearTimeout(handler);
    };
  }, [handleCalculatePrice]); // <-- FIXED: Dependency should be the memoized callback

  useEffect(() => {
    const fetchChargeItems = async () => {
      setIsChargesLoading(true);
      const { data, error } = await supabase
        .from("charge_items")
        .select("id, name, value, charge_type, is_vatable, is_default");
      if (!error) {
        setAvailableCharges(data);
      } else {
        console.error("Error fetching charge items:", error);
      }
      setIsChargesLoading(false);
    };
    fetchChargeItems();
  }, []);

  // Automatically add default charges when the component loads
  useEffect(() => {
    // Only run if charges haven't been set yet and available charges have loaded
    if (bookingForm.charges.length === 0 && availableCharges.length > 0) {
      const defaultCharges = availableCharges
        .filter((charge) => charge.is_default)
        .map((charge) => ({
          charge_item_id: charge.id,
          name: charge.name,
          quantity: 1, // Default quantity is 1
          unit_price: charge.value,
          charge_type: charge.charge_type,
          is_vatable: charge.is_vatable,
          is_default: charge.is_default,
        }));

      if (defaultCharges.length > 0) {
        // FIX #1: Use 'updateForm' from context instead of non-existent 'handleFormChange'.
        updateForm("charges", defaultCharges); // <-- FIXED
      }
    }
  }, [availableCharges, bookingForm.charges, updateForm]); // <-- FIXED: Added proper dependencies

  const handleAddCharge = () => {
    const chargeItem = availableCharges.find((c) => c.id === newCharge.id);
    if (!chargeItem) return;

    if (bookingForm.charges.some((c) => c.charge_item_id === chargeItem.id)) {
      alert(`${chargeItem.name} has already been added.`);
      return;
    }

    addCharge({
      charge_item_id: chargeItem.id,
      name: chargeItem.name,
      quantity: newCharge.quantity,
      unit_price: chargeItem.value,
      charge_type: chargeItem.charge_type,
      is_vatable: chargeItem.is_vatable,
      is_default: chargeItem.is_default,
    });
    setNewCharge({ id: "", quantity: 1 });
  };

  const handleAddPayment = () => {
    const amount = parseFloat(newPayment.amount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid payment amount.");
      return;
    }

    addPayment({ amount, method: newPayment.method });
    setNewPayment({ amount: "", method: "cash" });
  };

  const financials = useMemo(() => {
    return calculateFinancials(
      priceBreakdown,
      bookingForm.charges,
      bookingForm.discount,
      bookingForm.discount_type,
      bookingForm.payments
    );
  }, [
    priceBreakdown,
    bookingForm.charges,
    bookingForm.discount,
    bookingForm.discount_type,
    bookingForm.payments,
    calculateFinancials,
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-2xl font-bold text-slate-900">
          Step 5: Payment & Charges
        </h3>
        <p className="text-slate-500 mt-1">
          Review the financial summary and record payments or additional
          services.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 lg:gap-12">
        <div className="lg:col-span-3 space-y-8">
          {isCalculating && !priceBreakdown && (
            <div className="flex items-center p-4 bg-blue-50 text-blue-800 rounded-lg">
              <Loader2 className="h-5 w-5 animate-spin mr-3" />
              Calculating price and checking rules...
            </div>
          )}
          {calculationError && (
            <div className="p-4 bg-red-50 text-red-800 rounded-lg">
              <strong>Error:</strong> {calculationError}
            </div>
          )}

          <Card title="Discount">
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Apply Discount
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="discount_type"
                    value="before_tax"
                    checked={bookingForm.discount_type === "before_tax"}
                    onChange={(e) =>
                      updateForm("discount_type", e.target.value)
                    }
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-slate-600">
                    Before Tax (Standard)
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="discount_type"
                    value="after_tax"
                    checked={bookingForm.discount_type === "after_tax"}
                    onChange={(e) =>
                      updateForm("discount_type", e.target.value)
                    }
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-slate-600">
                    After Tax (On Total Bill)
                  </span>
                </label>
              </div>
            </div>

            <label className="block text-sm font-medium text-slate-700 mb-1">
              Discount Amount
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                ₱
              </span>
              <input
                type="number"
                min="0"
                value={bookingForm.discount || ""}
                onChange={(e) => updateForm("discount", Number(e.target.value))}
                className="w-full p-2 pl-7 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>
          </Card>

          <Card title="Additional Charges & Services">
            <div className="space-y-3">
              {bookingForm.charges.length > 0 ? (
                <div className="space-y-2 border-b border-slate-200 pb-4 mb-4">
                  {bookingForm.charges.map((charge, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-3 border border-slate-200 rounded-lg"
                    >
                      <div>
                        <span className="font-medium text-slate-800">
                          {charge.name}
                        </span>
                        <span className="text-slate-500 ml-2">
                          ({charge.quantity}x)
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-slate-700">
                          {formatCurrency(charge.unit_price * charge.quantity)}
                        </span>
                        <button
                          onClick={() => removeCharge(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <MinusCircle size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 pb-4 text-center">
                  No additional charges added.
                </p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                <div className="md:col-span-3">
                  <label className="text-xs font-medium text-slate-600">
                    Charge Item
                  </label>
                  <select
                    value={newCharge.id}
                    onChange={(e) =>
                      setNewCharge({ ...newCharge, id: e.target.value })
                    }
                    className="w-full p-2 mt-1 border border-slate-300 rounded-lg"
                    disabled={isChargesLoading}
                  >
                    <option value="">
                      {isChargesLoading ? "Loading..." : "Select a charge"}
                    </option>
                    {availableCharges.map((charge) => (
                      <option key={charge.id} value={charge.id}>
                        {charge.name} (
                        {charge.charge_type === "fixed"
                          ? formatCurrency(charge.value)
                          : `${charge.value}%`}
                        )
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-1">
                  <label className="text-xs font-medium text-slate-600">
                    Qty
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newCharge.quantity}
                    onChange={(e) =>
                      setNewCharge({
                        ...newCharge,
                        quantity: Number(e.target.value),
                      })
                    }
                    className="w-full p-2 mt-1 border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="md:col-span-2">
                  <button
                    onClick={handleAddCharge}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  >
                    <PlusCircle size={16} /> Add
                  </button>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Record Payments">
            <div className="space-y-3">
              {bookingForm.payments.length > 0 ? (
                <div className="space-y-2 border-b border-slate-200 pb-4 mb-4">
                  {bookingForm.payments.map((payment, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-3 border border-emerald-200 bg-emerald-50 rounded-lg"
                    >
                      <div className="capitalize font-medium text-emerald-800">
                        {payment.method.replace("_", " ")}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-emerald-900 font-semibold">
                          {formatCurrency(payment.amount)}
                        </span>
                        <button
                          onClick={() => removePayment(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <MinusCircle size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 pb-4 text-center">
                  No payments recorded yet.
                </p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-slate-600">
                    Amount
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newPayment.amount}
                    onChange={(e) =>
                      setNewPayment({ ...newPayment, amount: e.target.value })
                    }
                    className="w-full p-2 mt-1 border border-slate-300 rounded-lg"
                    placeholder="0.00"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-slate-600">
                    Method
                  </label>
                  <select
                    value={newPayment.method}
                    onChange={(e) =>
                      setNewPayment({ ...newPayment, method: e.target.value })
                    }
                    className="w-full p-2 mt-1 border border-slate-300 rounded-lg"
                  >
                    <option value="cash">Cash</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="online_wallet">Online Wallet</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <button
                    onClick={handleAddPayment}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                  >
                    <PlusCircle size={16} /> Record
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-8 bg-white p-6 rounded-xl shadow-lg border border-slate-200 mt-8 lg:mt-0">
            <div className="text-center border-b border-slate-200 pb-4 mb-4">
              <h2 className="text-xl font-bold text-slate-900">
                Booking Receipt
              </h2>
              <p className="text-sm text-slate-500">
                Thank you for your reservation!
              </p>
            </div>

            {priceBreakdown?.nightly_breakdown && (
              <details className="group mb-4">
                <summary className="list-none flex justify-between items-center cursor-pointer text-sm font-semibold text-slate-700 hover:text-slate-900">
                  Nightly Breakdown
                  <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
                </summary>
                <div className="mt-3 space-y-2 text-xs border-t border-slate-200 pt-3">
                  {priceBreakdown.nightly_breakdown.map((night, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-4 gap-2 items-center"
                    >
                      <span className="font-bold">
                        Room {night.room_number}
                      </span>
                      <span className="text-slate-500 col-span-2">
                        {new Date(night.date).toLocaleDateString()} (
                        {night.rate_type})
                      </span>
                      <div className="text-right font-mono">
                        <div>{formatCurrency(night.room_rate)}</div>
                        <div className="text-[0.7rem] text-slate-500">
                          +{formatCurrency(night.extra_guest_fee)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            )}

            <div className="space-y-2">
              <ReceiptLine
                label="Room Rate & Fees"
                value={formatCurrency(financials.roomSubtotal)}
              />
              {financials.vatableCharges.map((charge, index) => (
                <div key={`vat-charge-${index}`} className="pl-4">
                  <ReceiptLine
                    label={charge.name}
                    value={formatCurrency(charge.amount)}
                  />
                </div>
              ))}
              <ReceiptLine
                label="Discount"
                value={formatCurrency(financials.discount)}
                isNegative={true}
                className="text-red-600"
              />
            </div>

            <hr className="my-3 border-slate-200" />

            <div className="space-y-2">
              <ReceiptLine
                label="VATable Sale"
                value={formatCurrency(financials.vatBase)}
              />
              <ReceiptLine
                label="VAT (12%)"
                value={formatCurrency(financials.vatAmount)}
              />
              {financials.nonVatableCharges.map((charge, index) => (
                <ReceiptLine
                  key={`nonvat-charge-${index}`}
                  label={`${charge.name} (VAT-Exempt)`}
                  value={formatCurrency(charge.amount)}
                />
              ))}
            </div>

            <hr className="my-3 border-slate-300 border-dashed" />

            <div className="flex justify-between items-center font-bold text-lg">
              <span>Grand Total</span>
              <span className="font-mono">
                {formatCurrency(financials.grandTotal)}
              </span>
            </div>

            <div className="mt-6 space-y-2">
              <div className="flex justify-between items-center bg-emerald-100 text-emerald-800 p-3 rounded-lg font-semibold">
                <span>Total Paid</span>
                <span className="font-mono">
                  {formatCurrency(financials.totalPaid)}
                </span>
              </div>
              <div className="flex justify-between items-center bg-red-100 text-red-800 p-3 rounded-lg font-bold text-lg">
                <span>Balance Due</span>
                <span className="font-mono">
                  {formatCurrency(financials.balanceDue)}
                </span>
              </div>
              {financials.changeDue > 0 && (
                <div className="flex justify-between items-center bg-blue-100 text-blue-800 p-3 rounded-lg font-semibold">
                  <span>Change Due</span>
                  <span className="font-mono">
                    {formatCurrency(financials.changeDue)}
                  </span>
                </div>
              )}
            </div>

            <div className="text-center text-xs text-slate-400 mt-6 pt-4 border-t border-slate-200">
              <p>
                Ichthus Hotel & Suites &bull; Official Receipt -{" "}
                {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentStep;
