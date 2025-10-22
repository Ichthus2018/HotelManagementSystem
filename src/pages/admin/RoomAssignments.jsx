import { useState, useEffect } from "react";
import ReactPaginate from "react-paginate";
import useSWR from "swr";
import supabase from "../../services/supabaseClient";

// UI Components
import PageHeader from "../../components/ui/common/PageHeader";
import SearchInput from "../../components/ui/common/SearchInput";
import EmptyState from "../../components/ui/common/EmptyState";
import Loader from "../../components/ui/common/loader";
import RoomCard from "../../components/Admin/Modals/RoomAssignments/RoomCard";
import TagRoomRoleModal from "../../components/Admin/Modals/RoomAssignments/TagRoomRoleModal";
import StatusFilter from "../../components/Admin/Modals/RoomAssignments/StatusFilter";
import QuickActions from "../../components/Admin/Modals/RoomAssignments/QuickActions";

// Constants
export const SWR_KEY_ROOMS_DATA = "rooms_data";
const ITEMS_PER_PAGE = 12;

// --- FIX IS HERE ---
// Enhanced data fetcher with corrected status filtering logic
const fetchRoomsData = async ([
  _key,
  page,
  searchTerm,
  statusFilter,
  pageSize,
]) => {
  try {
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !authUser) throw new Error("Authentication failed");

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select(
        `id, email, admin, first_name, last_name, sidebar_permissions!inner(role_name, allowed_routes)`
      )
      .eq("id", authUser.id)
      .single();
    if (userError) throw userError;

    const currentUser = {
      id: userData.id,
      email: userData.email,
      name: `${userData.first_name} ${userData.last_name}`,
      role: userData.admin ? "Admin" : userData.sidebar_permissions.role_name,
      isAdmin:
        userData.admin || userData.sidebar_permissions.role_name === "Admin",
    };

    const { data: settings } = await supabase
      .from("company_settings")
      .select("setting_value")
      .eq("setting_name", "inspection_workflow")
      .single();
    const inspectionWorkflow = settings?.setting_value !== "false";

    let staffData = { housekeepers: [], inspectors: [] };
    if (currentUser.isAdmin) {
      const { data: housekeepers } = await supabase
        .from("users")
        .select(
          `id, first_name, last_name, email, sidebar_permissions!inner(id, role_name)`
        )
        .in("role_id", [2, 3]);
      staffData.housekeepers = housekeepers || [];

      const { data: inspectors } = await supabase
        .from("users")
        .select(
          `id, first_name, last_name, email, sidebar_permissions!inner(id, role_name)`
        )
        .eq("role_id", 4);
      staffData.inspectors = inspectors || [];
    }

    let query = supabase.from("rooms").select(
      `
        id, room_number, status,
        room_types(title, base_rate),
        locations(name),
        room_assignments!left(
          status, housekeepers, inspector, updated_at,
          users!room_assignments_inspector_fkey(first_name, last_name)
        )
      `,
      { count: "exact" }
    );

    if (searchTerm) {
      query = query.or(
        `room_number.ilike.%${searchTerm}%,room_types.title.ilike.%${searchTerm}%`
      );
    }

    // *** CORRECTED STATUS FILTER LOGIC ***
    if (statusFilter && statusFilter !== "all") {
      if (statusFilter === "Dirty") {
        // For "Dirty", we must also find rooms that have NO assignment record yet.
        query = query.or(
          `room_assignments.status.eq.Dirty,room_assignments.status.is.null`
        );
      } else {
        // For all other statuses, a direct filter is correct.
        query = query.eq("room_assignments.status", statusFilter);
      }
    }

    if (!currentUser.isAdmin) {
      switch (currentUser.role) {
        case "Housekeeper":
          query = query.or(
            `room_assignments.status.eq.Dirty,room_assignments.housekeepers.cs.{"${currentUser.id}"}`
          );
          break;
        case "Inspector":
          query = query.eq("room_assignments.inspector", currentUser.id);
          break;
        case "Housekeeping Manager":
          query = query.not("room_assignments.housekeepers", "cs", "{}");
          break;
      }
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const {
      data: rooms,
      error: roomsError,
      count,
    } = await query.range(from, to).order("room_number", { ascending: true });
    if (roomsError) throw roomsError;

    return {
      rooms: rooms || [],
      count: count || 0,
      currentUser,
      staffData,
      inspectionWorkflow,
    };
  } catch (error) {
    console.error("Error fetching rooms data:", error);
    throw error;
  }
};

const RoomAssignments = () => {
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data, error, isLoading, mutate } = useSWR(
    [SWR_KEY_ROOMS_DATA, currentPage, searchTerm, statusFilter, ITEMS_PER_PAGE],
    fetchRoomsData,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );

  useEffect(() => {
    const channel = supabase
      .channel("room_assignments_and_rooms_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_assignments" },
        () => mutate()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms" },
        () => mutate()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mutate]);

  const rooms = data?.rooms || [];
  const totalCount = data?.count || 0;
  const pageCount = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const currentUser = data?.currentUser;
  const staffData = data?.staffData;
  const inspectionWorkflow = data?.inspectionWorkflow ?? true;

  const openTagModal = (room) => {
    setSelectedRoom(room);
    setIsTagModalOpen(true);
  };

  const closeTagModal = () => {
    setIsTagModalOpen(false);
    setSelectedRoom(null);
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-12">
          <Loader />
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
            <h3 className="text-red-800 font-semibold">Error Loading Rooms</h3>
            <p className="text-red-600 text-sm mt-1">{error.message}</p>
            <button
              onClick={() => mutate()}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    if (rooms.length === 0) {
      return (
        <EmptyState
          title="No Rooms Found"
          description={
            searchTerm || statusFilter !== "all"
              ? "No rooms match your current filters."
              : "No rooms are available for assignment at this time."
          }
          action={
            (searchTerm || statusFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                }}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear filters
              </button>
            )
          }
        />
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
        {rooms.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            currentUser={currentUser}
            onAdminAssign={openTagModal}
            inspectionWorkflow={inspectionWorkflow}
          />
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="space-y-6 w-full mx-auto p-2 pt-10 md:p-6 max-w-[95rem] xl:px-12 min-h-screen">
        <PageHeader
          title={
            currentUser?.role === "Admin"
              ? "Room Management"
              : currentUser?.role === "Housekeeper"
              ? "My Cleaning Assignments"
              : currentUser?.role === "Inspector"
              ? "Rooms for Inspection"
              : "Room Assignments"
          }
          description={
            currentUser?.isAdmin
              ? "Manage room assignments and track cleaning progress across all rooms."
              : "View and manage your assigned room cleaning tasks."
          }
        />

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <SearchInput
                searchTerm={searchTerm}
                setSearchTerm={handleSearch}
                placeholder="Search by room number or type..."
                className="min-w-[250px]"
              />

              <StatusFilter
                currentFilter={statusFilter}
                onFilterChange={handleStatusFilter}
              />
            </div>

            {currentUser?.isAdmin && (
              <QuickActions
                onBulkAssign={() => console.log("Bulk assign")}
                selectedRooms={[]}
              />
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
            <span>Total: {totalCount} rooms</span>
            {statusFilter !== "all" && (
              <span>Filtered: {rooms.length} rooms</span>
            )}
          </div>
        </div>

        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 rounded-lg overflow-hidden">
          {renderContent()}

          {pageCount > 1 && (
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <ReactPaginate
                breakLabel="..."
                nextLabel="›"
                onPageChange={(event) => setCurrentPage(event.selected + 1)}
                pageRangeDisplayed={3}
                pageCount={pageCount}
                previousLabel="‹"
                renderOnZeroPageCount={null}
                forcePage={currentPage - 1}
                containerClassName="flex items-center justify-center gap-2 text-base font-medium"
                pageLinkClassName="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 text-gray-900 hover:bg-gray-100 transition duration-200"
                activeLinkClassName="bg-blue-500 text-white border-blue-500 hover:bg-blue-600"
                previousLinkClassName="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 text-gray-900 hover:bg-gray-100 transition duration-200"
                nextLinkClassName="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-300 text-gray-900 hover:bg-gray-100 transition duration-200"
                disabledLinkClassName="opacity-50 cursor-not-allowed hover:bg-transparent"
              />
            </div>
          )}
        </div>
      </div>

      <TagRoomRoleModal
        isOpen={isTagModalOpen}
        onClose={closeTagModal}
        roomToTag={selectedRoom}
        housekeepers={staffData?.housekeepers || []}
        inspectors={staffData?.inspectors || []}
        currentUser={currentUser}
      />
    </>
  );
};

export default RoomAssignments;
