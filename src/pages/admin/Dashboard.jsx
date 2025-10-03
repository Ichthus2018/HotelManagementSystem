// src/components/Dashboard.jsx
import React from "react";
import StatCard from "../../components/Admin/Modals/Dashboard/StatCard";
import RoomStatusOverview from "../../components/Admin/Modals/Dashboard/RoomStatusOverview";
import BookingTrendsChart from "../../components/Admin/Modals/Dashboard/BookingTrendsChart";
import PopularRooms from "../../components/Admin/Modals/Dashboard/PopularRooms";
import RecentBookings from "../../components/Admin/Modals/Dashboard/RecentBookings";
import {
  RevenueIcon,
  OccupancyIcon,
  CheckInIcon,
  CheckOutIcon,
} from "../../components/Admin/Modals/Dashboard/Icons";
import { dailySummary } from "../../components/Admin/Modals/Dashboard/sampleData";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              Hotel Dashboard
            </h1>
            <p className="text-gray-500 mt-2">
              Welcome back! Here's your hotel performance overview.
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-ping absolute -top-1 -right-1"></div>
              <div className="px-4 py-2 bg-blue-50 rounded-lg border border-blue-100">
                <span className="text-blue-600 font-semibold">Live</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="space-y-6">
        {/* Stat Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={<RevenueIcon />}
            title="Today's Revenue"
            value={`₱${(dailySummary.revenue.value / 1000).toFixed(1)}k`}
            change={dailySummary.revenue.change}
            bgColor="bg-gradient-to-br from-blue-500 to-blue-600"
            iconColor="text-white"
          />
          <StatCard
            icon={<OccupancyIcon />}
            title="Occupancy Rate"
            value={dailySummary.occupancy.value}
            unit="%"
            change={dailySummary.occupancy.change}
            bgColor="bg-gradient-to-br from-cyan-500 to-blue-500"
            iconColor="text-white"
          />
          <StatCard
            icon={<CheckInIcon />}
            title="Today's Check-ins"
            value={dailySummary.checkIns.value}
            change={dailySummary.checkIns.change}
            bgColor="bg-gradient-to-br from-green-500 to-emerald-600"
            iconColor="text-white"
          />
          <StatCard
            icon={<CheckOutIcon />}
            title="Today's Check-outs"
            value={dailySummary.checkOuts.value}
            change={dailySummary.checkOuts.change}
            bgColor="bg-gradient-to-br from-purple-500 to-indigo-600"
            iconColor="text-white"
          />
        </div>

        {/* Two-Column Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {/* Main Content (Left Column) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <BookingTrendsChart className="h-full" />
            <RecentBookings className="h-full" />
          </div>

          {/* Sidebar (Right Column) */}
          <div className="lg:col-span-1 flex flex-col gap-6 h-full">
            <RoomStatusOverview className="flex-1" />
            <PopularRooms className="flex-1" />
          </div>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
