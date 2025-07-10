/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState } from "react";
import { Toast } from "../../Components/Toast";
import api from "../../utils/api";
import Modal from "../../Components/Modal";
import {
  FaFileAlt,
  FaCalendarAlt,
  FaUser,
  FaClock,
  FaFilter,
  FaSearch,
  FaRedo,
  FaTimes,
  FaEye,
  FaChartLine,
  FaUsers,
  // FaCalendarCheck,
} from "react-icons/fa";

type Report = {
  _id: string;
  userId: string;
  date: string;
  fullName: string;
  workingHours: string;
  statusReport: string;
};

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Popup component
type PopupProps = {
  report: Report | null;
  onClose: () => void;
  users: { _id: string; email: string; fullName: string }[];
};

function ReportPopup({ report, onClose, users }: PopupProps) {
  if (!report) return null;
  const user = users.find((u) => u._id === report.userId);

  return (
    <Modal isOpen={!!report} onClose={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-h-[85vh] w-full max-w-3xl mx-4 overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-600 rounded-lg">
              <FaFileAlt className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Status Report Details
              </h3>
              <p className="text-sm text-gray-600">View detailed report information</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Report Info */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <FaUser className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">
                    User
                  </h4>
                  <p className="text-blue-900 font-semibold text-lg">
                    {user?.fullName || "Unknown"}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-600 rounded-lg">
                  <FaCalendarAlt className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-1">
                    Date
                  </h4>
                  <p className="text-green-900 font-semibold text-lg">
                    {formatDate(report.date)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-600 rounded-lg">
                  <FaClock className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-purple-700 uppercase tracking-wider mb-1">
                    Logged Time
                  </h4>
                  <p className="text-purple-900 font-semibold text-lg font-mono">
                    {report.workingHours}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <FaFileAlt className="w-4 h-4 text-gray-600" />
              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                Status Report
              </h4>
            </div>
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200 text-gray-800 whitespace-pre-line text-base leading-relaxed">
              {report.statusReport}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default function StatusReport() {
  // Filter states
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [user, setUser] = useState("");
  const [users, setUsers] = useState<
    { _id: string; email: string; fullName: string }[]
  >([]);
  const [statusReports, setStatusReports] = useState<Report[]>([]);

  // Popup state
  const [popupReport, setPopupReport] = useState<Report | null>(null);

  // Handlers
  const handleResetFilters = () => {
    setStartDate("");
    setEndDate("");
    setUser("");
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get(`/users/all`, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
      });
      setUsers(response.data);
    } catch (error) {
      Toast.fire({
        icon: "error",
        title: "Failed to fetch users",
      });
      return [];
    }
  };

  const fetchStatusReports = async () => {
    if (new Date(startDate) > new Date(endDate)) {
      Toast.fire({
        icon: "warning",
        title: "Start date must be before end date",
      });
      return;
    }

    try {
      const params: Record<string, string> = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (user) params.username = user;

      const queryString = new URLSearchParams(params).toString();

      const response = await api.get(`/status/all-status?${queryString}`, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
      });
      setStatusReports(response.data);
    } catch (error) {
      Toast.fire({
        icon: "error",
        title: "Failed to fetch status reports",
      });
    }
  };

  useEffect(() => {
    if (!startDate && !endDate && !user) {
      fetchStatusReports();
    }
  }, [startDate, endDate, user]);

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-purple-600 rounded-xl shadow-lg">
                  <FaFileAlt className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Status Report Dashboard
                  </h1>
                  <p className="text-gray-600">
                    Track and analyze team member status reports
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-500 px-2">
                <div className="flex items-center space-x-2">
                  <FaUsers className="w-4 h-4" />
                  <span>{users.length} Team Members</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FaChartLine className="w-4 h-4" />
                  <span>{statusReports.length} Reports</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
            <div className="flex items-center space-x-2">
              <FaFilter className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Filter Reports</h2>
            </div>
            <p className="text-sm text-gray-600 mt-1">Filter status reports by date range and user</p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
              {/* Start Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              {/* User Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Filter by User
                </label>
                <select
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                >
                  <option value="">All Users</option>
                  {users.map((user) => (
                    <option
                      key={user.email}
                      value={user.fullName}
                      className="text-gray-700"
                    >
                      {user.fullName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-end space-x-3">
                <button
                  className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg transform hover:scale-105"
                  onClick={fetchStatusReports}
                >
                  <FaSearch className="mr-2 w-4 h-4" />
                  Apply Filters
                </button>
                <button
                  className="inline-flex items-center justify-center px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
                  onClick={handleResetFilters}
                >
                  <FaRedo className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Reports Table */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    User's Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Logged Time
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status Report
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {statusReports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12">
                      <div className="text-gray-500">
                        <FaFileAlt className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">No status reports found</p>
                        <p className="text-sm">Try adjusting your filters or check back later</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  statusReports.map((report, index) => (
                    <tr
                      key={report._id}
                      className="hover:bg-gray-50 transition-colors duration-200 group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-black text-sm font-semibold">
                            {index + 1}.
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">
                            {new Date(report.date).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                            {users.find((u) => u._id === report.userId)?.fullName?.charAt(0).toUpperCase() || "U"}
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {users.find((u) => u._id === report.userId)?.fullName || "Unknown"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-mono text-gray-900">
                            {report.workingHours}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <p className="text-sm text-gray-900 truncate">
                            {report.statusReport}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          className="inline-flex items-center px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors group-hover:bg-purple-200 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPopupReport(report);
                          }}
                        >
                          <FaEye className="w-4 h-4 mr-1" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Popup */}
      <ReportPopup
        report={popupReport}
        onClose={() => setPopupReport(null)}
        users={users}
      />
    </div>
  );
}