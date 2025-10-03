import { createContext, useContext, useReducer, useCallback } from "react";
import { initialFormState, statusOptions } from "./constants";

const AddBookingContext = createContext();

export const useBookingContext = () => {
  const context = useContext(AddBookingContext);
  if (!context) {
    throw new Error(
      "useBookingContext must be used within a AddBookingProvider"
    );
  }
  return context;
};

// Action types
const ACTION_TYPES = {
  UPDATE_FORM: "UPDATE_FORM",
  UPDATE_ROOM: "UPDATE_ROOM",
  ADD_ROOM: "ADD_ROOM",
  REMOVE_ROOM: "REMOVE_ROOM",
  ADD_CHARGE: "ADD_CHARGE",
  REMOVE_CHARGE: "REMOVE_CHARGE",
  ADD_PAYMENT: "ADD_PAYMENT",
  REMOVE_PAYMENT: "REMOVE_PAYMENT",
  RESET_FORM: "RESET_FORM",
  SET_PRICE_BREAKDOWN: "SET_PRICE_BREAKDOWN",
  SET_CURRENT_STEP: "SET_CURRENT_STEP",
  SET_IS_SUBMITTING: "SET_IS_SUBMITTING",
  SET_SUBMISSION_ERROR: "SET_SUBMISSION_ERROR",
  // === NEW: Action for populating the form in edit mode ===
  SET_BOOKING_FORM: "SET_BOOKING_FORM",
};

// Reducer function
const bookingReducer = (state, action) => {
  switch (action.type) {
    case ACTION_TYPES.UPDATE_FORM:
      return {
        ...state,
        bookingForm: {
          ...state.bookingForm,
          [action.payload.field]: action.payload.value,
        },
      };

    case ACTION_TYPES.UPDATE_ROOM:
      const updatedRooms = [...state.bookingForm.selectedRooms];
      updatedRooms[action.payload.index] = {
        ...updatedRooms[action.payload.index],
        [action.payload.field]: action.payload.value,
      };
      return {
        ...state,
        bookingForm: {
          ...state.bookingForm,
          selectedRooms: updatedRooms,
        },
      };

    case ACTION_TYPES.ADD_ROOM:
      return {
        ...state,
        bookingForm: {
          ...state.bookingForm,
          selectedRooms: [
            ...state.bookingForm.selectedRooms,
            { room: null, allocatedGuests: 1 },
          ],
        },
      };

    case ACTION_TYPES.REMOVE_ROOM:
      return {
        ...state,
        bookingForm: {
          ...state.bookingForm,
          selectedRooms: state.bookingForm.selectedRooms.filter(
            (_, i) => i !== action.payload
          ),
        },
      };

    case ACTION_TYPES.ADD_CHARGE:
      return {
        ...state,
        bookingForm: {
          ...state.bookingForm,
          charges: [...state.bookingForm.charges, action.payload],
        },
      };

    case ACTION_TYPES.REMOVE_CHARGE:
      return {
        ...state,
        bookingForm: {
          ...state.bookingForm,
          charges: state.bookingForm.charges.filter(
            (_, i) => i !== action.payload
          ),
        },
      };

    case ACTION_TYPES.ADD_PAYMENT:
      return {
        ...state,
        bookingForm: {
          ...state.bookingForm,
          payments: [...state.bookingForm.payments, action.payload],
        },
      };

    case ACTION_TYPES.REMOVE_PAYMENT:
      return {
        ...state,
        bookingForm: {
          ...state.bookingForm,
          payments: state.bookingForm.payments.filter(
            (_, i) => i !== action.payload
          ),
        },
      };

    case ACTION_TYPES.RESET_FORM:
      return {
        ...state,
        bookingForm: {
          ...initialFormState,
          bookingReference: action.payload.bookingReference,
          selectedRooms: [{ room: null, allocatedGuests: 1 }],
        },
      };

    // === NEW: Reducer case for populating the form in edit mode ===
    case ACTION_TYPES.SET_BOOKING_FORM:
      return {
        ...state,
        bookingForm: action.payload,
      };

    case ACTION_TYPES.SET_PRICE_BREAKDOWN:
      return {
        ...state,
        priceBreakdown: action.payload,
      };

    case ACTION_TYPES.SET_CURRENT_STEP:
      return {
        ...state,
        currentStep: action.payload,
      };

    case ACTION_TYPES.SET_IS_SUBMITTING:
      return {
        ...state,
        isSubmitting: action.payload,
      };

    case ACTION_TYPES.SET_SUBMISSION_ERROR:
      return {
        ...state,
        submissionError: action.payload,
      };

    default:
      return state;
  }
};

export const AddBookingProvider = ({
  children,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [state, dispatch] = useReducer(bookingReducer, {
    bookingForm: {
      ...initialFormState,
      bookingReference: "",
      selectedRooms: [{ room: null, allocatedGuests: 1 }],
    },
    priceBreakdown: null,
    currentStep: 1,
    isSubmitting: false,
    submissionError: null,
  });

  // Action creators
  const updateForm = useCallback(
    (field, value) => {
      dispatch({
        type: ACTION_TYPES.UPDATE_FORM,
        payload: { field, value },
      });

      if (field === "checkIn" || field === "checkOut") {
        const currentCheckIn =
          field === "checkIn" ? value : state.bookingForm.checkIn;
        const currentCheckOut =
          field === "checkOut" ? value : state.bookingForm.checkOut;

        let calculatedNights = 0;
        if (currentCheckIn && currentCheckOut) {
          const startDate = new Date(currentCheckIn);
          const endDate = new Date(currentCheckOut);
          if (endDate > startDate) {
            const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
            calculatedNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          }
        }
        dispatch({
          type: ACTION_TYPES.UPDATE_FORM,
          payload: { field: "nights", value: calculatedNights },
        });
      }

      if (field === "selectedGuest") {
        if (value) {
          dispatch({
            type: ACTION_TYPES.UPDATE_FORM,
            payload: { field: "firstName", value: value.first_name || "" },
          });
          dispatch({
            type: ACTION_TYPES.UPDATE_FORM,
            payload: { field: "middleName", value: value.middle_name || "" },
          });
          dispatch({
            type: ACTION_TYPES.UPDATE_FORM,
            payload: { field: "lastName", value: value.last_name || "" },
          });
          dispatch({
            type: ACTION_TYPES.UPDATE_FORM,
            payload: { field: "email", value: value.email || "" },
          });
          dispatch({
            type: ACTION_TYPES.UPDATE_FORM,
            payload: { field: "contactNo", value: value.contact_no || "" },
          });
          dispatch({
            type: ACTION_TYPES.UPDATE_FORM,
            payload: {
              field: "streetAddress",
              value: value.street_address || "",
            },
          });
          dispatch({
            type: ACTION_TYPES.UPDATE_FORM,
            payload: { field: "region", value: value.region || "" },
          });
          dispatch({
            type: ACTION_TYPES.UPDATE_FORM,
            payload: { field: "province", value: value.province || "" },
          });
          dispatch({
            type: ACTION_TYPES.UPDATE_FORM,
            payload: {
              field: "cityMunicipality",
              value: value.city_municipality || "",
            },
          });
          dispatch({
            type: ACTION_TYPES.UPDATE_FORM,
            payload: { field: "barangay", value: value.barangay || "" },
          });
        }
      }

      if (field === "guestMode" && value === "new") {
        dispatch({
          type: ACTION_TYPES.UPDATE_FORM,
          payload: { field: "selectedGuest", value: null },
        });
        dispatch({
          type: ACTION_TYPES.UPDATE_FORM,
          payload: { field: "firstName", value: "" },
        });
        dispatch({
          type: ACTION_TYPES.UPDATE_FORM,
          payload: { field: "middleName", value: "" },
        });
        dispatch({
          type: ACTION_TYPES.UPDATE_FORM,
          payload: { field: "lastName", value: "" },
        });
        dispatch({
          type: ACTION_TYPES.UPDATE_FORM,
          payload: { field: "email", value: "" },
        });
        dispatch({
          type: ACTION_TYPES.UPDATE_FORM,
          payload: { field: "contactNo", value: "" },
        });
        dispatch({
          type: ACTION_TYPES.UPDATE_FORM,
          payload: { field: "streetAddress", value: "" },
        });
        dispatch({
          type: ACTION_TYPES.UPDATE_FORM,
          payload: { field: "region", value: "" },
        });
        dispatch({
          type: ACTION_TYPES.UPDATE_FORM,
          payload: { field: "province", value: "" },
        });
        dispatch({
          type: ACTION_TYPES.UPDATE_FORM,
          payload: { field: "cityMunicipality", value: "" },
        });
        dispatch({
          type: ACTION_TYPES.UPDATE_FORM,
          payload: { field: "barangay", value: "" },
        });
        dispatch({
          type: ACTION_TYPES.UPDATE_FORM,
          payload: { field: "idPhoto", value: null },
        });
      }
    },
    [
      dispatch,
      state.bookingForm.checkIn,
      state.bookingForm.checkOut,
      state.bookingForm.guestMode,
    ]
  );

  const updateRoom = useCallback((index, field, value) => {
    dispatch({
      type: ACTION_TYPES.UPDATE_ROOM,
      payload: { index, field, value },
    });
  }, []);

  const addRoom = useCallback(() => {
    dispatch({ type: ACTION_TYPES.ADD_ROOM });
  }, []);

  const removeRoom = useCallback((index) => {
    dispatch({ type: ACTION_TYPES.REMOVE_ROOM, payload: index });
  }, []);

  const addCharge = useCallback((charge) => {
    dispatch({ type: ACTION_TYPES.ADD_CHARGE, payload: charge });
  }, []);

  const removeCharge = useCallback((index) => {
    dispatch({ type: ACTION_TYPES.REMOVE_CHARGE, payload: index });
  }, []);

  const addPayment = useCallback((payment) => {
    dispatch({ type: ACTION_TYPES.ADD_PAYMENT, payload: payment });
  }, []);

  const removePayment = useCallback((index) => {
    dispatch({ type: ACTION_TYPES.REMOVE_PAYMENT, payload: index });
  }, []);

  const setPriceBreakdown = useCallback((breakdown) => {
    dispatch({ type: ACTION_TYPES.SET_PRICE_BREAKDOWN, payload: breakdown });
  }, []);

  const setCurrentStep = useCallback((step) => {
    dispatch({ type: ACTION_TYPES.SET_CURRENT_STEP, payload: step });
  }, []);

  const setIsSubmitting = useCallback((submitting) => {
    dispatch({ type: ACTION_TYPES.SET_IS_SUBMITTING, payload: submitting });
  }, []);

  const setSubmissionError = useCallback((error) => {
    dispatch({ type: ACTION_TYPES.SET_SUBMISSION_ERROR, payload: error });
  }, []);

  const resetForm = useCallback((bookingReference) => {
    dispatch({ type: ACTION_TYPES.RESET_FORM, payload: { bookingReference } });
    dispatch({ type: ACTION_TYPES.SET_PRICE_BREAKDOWN, payload: null });
  }, []);

  // === NEW: Action creator for populating the form in edit mode ===
  const setBookingForm = useCallback((formData) => {
    dispatch({ type: ACTION_TYPES.SET_BOOKING_FORM, payload: formData });
  }, []);

  const value = {
    // State
    ...state,
    isOpen,
    onClose,
    onSuccess,

    // Actions
    updateForm,
    updateRoom,
    addRoom,
    removeRoom,
    addCharge,
    removeCharge,
    addPayment,
    removePayment,
    setPriceBreakdown,
    setCurrentStep,
    setIsSubmitting,
    setSubmissionError,
    resetForm,
    // === NEW: Expose the new function through the context ===
    setBookingForm,

    // Constants
    statusOptions,
  };

  return (
    <AddBookingContext.Provider value={value}>
      {children}
    </AddBookingContext.Provider>
  );
};
