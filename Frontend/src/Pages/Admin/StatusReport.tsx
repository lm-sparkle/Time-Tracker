/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState } from "react";
import { Toast } from "../../Components/Toast";
import api from "../../utils/api";
import Modal from "../../Components/Modal";

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
        className="popup-content bg-white p-6 sm:p-8 rounded-xl max-h-[80vh] w-full max-w-2xl mx-auto overflow-y-auto relative shadow-xl border border-indigo-50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-blue-50 px-4 py-3 rounded-lg">
          <h3 className="text-2xl font-semibold text-indigo-800">
            Status Report Details
          </h3>
          <button
            onClick={onClose}
            className="text-indigo-400 hover:text-indigo-700 text-2xl p-1 hover:bg-indigo-50 rounded-full transition-colors"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {/* Report Info */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
              <h4 className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
                User
              </h4>
              <p className="text-indigo-900 font-medium text-lg">
                {user?.fullName || "Unknown"}
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h4 className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
                Date
              </h4>
              <p className="text-blue-900 font-medium text-lg">
                {formatDate(report.date)}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
              <h4 className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-1">
                Logged Time
              </h4>
              <p className="text-purple-900 font-medium text-lg">
                {report.workingHours}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
              Status Report
            </h4>
            <div className="text-gray-800 bg-indigo-50 p-5 rounded-lg whitespace-pre-line border border-indigo-100 text-base leading-relaxed">
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
    <>
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Status Report Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Track and analyze team member status reports
          </p>
        </header>
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="filter-container flex flex-wrap items-end gap-4 mb-6">
            {/* Start Date */}
            <div className="filter-item flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            {/* End Date */}
            <div className="filter-item flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            {/* User Filter */}
            <div className="filter-item flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by User
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            {/* Apply Filters */}
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors flex items-center"
              onClick={fetchStatusReports}
            >
              <i className="fas fa-filter mr-2"></i> Apply Filters
            </button>

            {/* Reset Filters */}
            <button
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md transition-colors flex items-center"
              onClick={handleResetFilters}
            >
              <i className="fas fa-redo mr-2"></i> Reset
            </button>
          </div>
          {/* Table */}
          <div className="table-container overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    User's Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Logged Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status Report
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {statusReports.map((report, index) => (
                  <tr
                    key={report._id}
                    className="hover:bg-gray-100 cursor-pointer"
                    onClick={() => setPopupReport(report)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(report.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {users.find((u) => u._id === report.userId)?.fullName ||
                        "Unknown"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {report.workingHours}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {report.statusReport}
                    </td>
                  </tr>
                ))}
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
    </>
  );
};