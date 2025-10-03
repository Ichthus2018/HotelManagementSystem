import { useState, useEffect } from "react";
import supabase from "../../services/supabaseClient";
import ReactPaginate from "react-paginate";
import { Plus, Search, Loader2 } from "lucide-react";

import BookingList from "../../components/Admin/Modals/Booking/Pages/BookingList";
import AddBookingModal from "../../components/Admin/Modals/Booking/AddBookingModal/AddBookingModal";
import ManageCardsModal from "../../components/Admin/Modals/Booking/ManageCardsModal";

const Bookings = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);

  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [selectedBookingForCards, setSelectedBookingForCards] = useState(null);

  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 10;

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  useEffect(() => {
    const timerId = setTimeout(() => {
      if (searchTerm !== debouncedSearchTerm) {
        setCurrentPage(0);
      }
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timerId);
  }, [searchTerm, debouncedSearchTerm]);

  const fetchBookings = async () => {
    setIsLoading(true);
    setError(null);
    const from = currentPage * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from("bookings")
      .select(
        `
      id, check_in_date, check_out_date, status, grand_total,
      room_subtotal, charges_subtotal, discount, vat_amount, total_paid, notes,
      num_adults, num_children, discount_type,
      guests ( * ),
      booking_rooms ( id, num_nights, price_at_booking, rooms ( id, room_number, lock_id, room_types ( * ) ) ),
      booking_charges ( id, quantity,
        unit_price_at_booking,
        charge_type_at_booking,
       charge_items ( id, name ) ),
      payments:booking_payments ( id, amount, method ) 
        `, // <-- FIX: Removed payment_date from here
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (debouncedSearchTerm) {
      const searchTermFormatted = `%${debouncedSearchTerm}%`;
      query = query.or(
        `first_name.ilike.${searchTermFormatted},last_name.ilike.${searchTermFormatted}`,
        { foreignTable: "guests" }
      );
    }

    const { data, error: queryError, count } = await query;
    if (queryError) {
      console.error("Error fetching bookings:", queryError);
      setError(queryError.message);
    } else {
      setBookings(data);
      setTotalCount(count);
      setPageCount(Math.ceil(count / PAGE_SIZE));
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, debouncedSearchTerm]);

  const handleDeleteBooking = async (bookingId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this booking? This action cannot be undone."
      )
    ) {
      return;
    }

    const { error: deleteError } = await supabase
      .from("bookings")
      .delete()
      .eq("id", bookingId);

    if (deleteError) {
      console.error("Error deleting booking:", deleteError);
      alert(`Failed to delete booking: ${deleteError.message}`);
    } else {
      fetchBookings();
    }
  };

  const handlePageClick = (event) => {
    setCurrentPage(event.selected);
  };

  const handleOpenAddModal = () => {
    setEditingBooking(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (booking) => {
    setEditingBooking(booking);
    setIsModalOpen(true);
  };

  // --- NEW HANDLERS FOR CARD MODAL ---
  const handleOpenManageCardsModal = (booking) => {
    setSelectedBookingForCards(booking);
    setIsCardModalOpen(true);
  };

  const handleCloseManageCardsModal = () => {
    setIsCardModalOpen(false);
    setSelectedBookingForCards(null);
    // Optionally, you can refetch bookings here if cards were changed
    fetchBookings();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBooking(null);
  };

  const handleSuccess = () => {
    handleCloseModal();
    setSearchTerm(""); // Reset search term after adding/editing

    if (currentPage !== 0) {
      setCurrentPage(0);
    } else {
      fetchBookings();
    }
  };
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center p-12 text-gray-500">
          <Loader2 className="w-6 h-6 mr-3 animate-spin" />
          <span>Loading bookings...</span>
        </div>
      );
    }
    if (error) {
      return <div className="text-center p-8 text-red-500">Error: {error}</div>;
    }
    if (bookings.length === 0) {
      return (
        <div className="text-center p-12 bg-gray-50 rounded-lg">
          <h3 className="text-xl font-semibold text-gray-700">
            No Bookings Found
          </h3>
          <p className="mt-2 text-gray-500">
            {debouncedSearchTerm
              ? `No results for "${debouncedSearchTerm}".`
              : 'Click "Create Booking" to get started.'}
          </p>
        </div>
      );
    }
    return (
      <BookingList
        bookings={bookings}
        onDelete={handleDeleteBooking}
        onEdit={handleOpenEditModal}
        onManageCards={handleOpenManageCardsModal}
      />
    );
  };

  return (
    <>
      <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Bookings</h1>
              <p className="mt-1 text-sm text-gray-600">
                View, create, and manage all guest reservations.
              </p>
            </div>
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
            >
              <Plus className="w-5 h-5" />
              Create Booking
            </button>
          </div>

          <div className="mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by guest first or last name..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl">
            {renderContent()}
            {totalCount > PAGE_SIZE && (
              <div className="p-4 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                <p className="text-sm text-gray-600">
                  Showing{" "}
                  <span className="font-semibold">
                    {Math.min(currentPage * PAGE_SIZE + 1, totalCount)}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold">
                    {Math.min((currentPage + 1) * PAGE_SIZE, totalCount)}
                  </span>{" "}
                  of <span className="font-semibold">{totalCount}</span> results
                </p>
                <ReactPaginate
                  breakLabel="..."
                  nextLabel="Next →"
                  onPageChange={handlePageClick}
                  pageRangeDisplayed={2}
                  marginPagesDisplayed={1}
                  pageCount={pageCount}
                  previousLabel="← Previous"
                  renderOnZeroPageCount={null}
                  forcePage={currentPage}
                  containerClassName="flex items-center gap-1 text-sm"
                  pageLinkClassName="px-3 py-1.5 rounded-md hover:bg-gray-100"
                  activeLinkClassName="bg-blue-500 text-white hover:bg-blue-600"
                  previousLinkClassName="px-3 py-1.5 rounded-md hover:bg-gray-100"
                  nextLinkClassName="px-3 py-1.5 rounded-md hover:bg-gray-100"
                  disabledClassName="opacity-50 cursor-not-allowed"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedBookingForCards && (
        <ManageCardsModal
          isOpen={isCardModalOpen}
          onClose={handleCloseManageCardsModal}
          booking={selectedBookingForCards}
        />
      )}

      <AddBookingModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
        initialData={editingBooking}
      />
    </>
  );
};

export default Bookings;
