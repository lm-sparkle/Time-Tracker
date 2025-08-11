/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState, useMemo } from "react";
import { Toast } from "../../Components/Toast";
import api from "../../utils/api";
import {
  FaCalendarCheck,
  FaCheckCircle,
  FaClock,
  FaSave,
  FaTimesCircle,
  FaUserSlash,
  FaCalendarAlt,
  FaSearch,
  FaRedo,
  FaUsers,
  FaChartBar,
  FaFilter,
  FaPlus,
} from "react-icons/fa";
import Modal from "../../Components/Modal";

function isTodayISO(dateISO: string) {
  const today = new Date();
  const isoToday = today.toISOString().slice(0, 10);
  return dateISO === isoToday;
}

type User = {
  _id: string;
  fullName: string;
  email: string;
  status: "Online" | "Offline";
  role: "user" | "admin";
  isActive: boolean;
};

type TimeEntry = {
  attendanceStatus: string;
  status: string;
  totalSeconds: any;
  inTime: string | number | Date;
  workingHours: any;
  _id: string;
  user: any;
  dateISO: string;
  present: any;
  userId: string;
  dateString: string;
};

// Add timeStrToSeconds helper
function timeStrToSeconds(timeStr: string) {
  if (!timeStr) return 0;
  const [h = "0", m = "0", s = "0"] = timeStr.split(":");
  return Number(h) * 3600 + Number(m) * 60 + Number(s);
}

const Attendance: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [_loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [fetchedEntries, setFetchedEntries] = useState<TimeEntry[]>([]);
  const [searchRange, setSearchRange] = useState<{
    start: string;
    end: string;
  } | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [holidays, setHolidays] = useState<{ date: string; name: string }[]>(
    []
  );

  const handleResetFilters = () => {
    setStartDate("");
    setEndDate("");
  };

  useEffect(() => {
    if (!startDate && !endDate) {
      fetchEntriesForDateRange();
    }
  }, [startDate]);

  const openModal = (user: User, date: string) => {
    setModalData({ user, date, status: "" });
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setModalData({ user: null, date: null, status: "" });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setModalData((prev) => ({
      ...prev,
      status: e.target.value,
    }));
  };

  const [modalData, setModalData] = useState<{
    user: User | null;
    date: string | null;
    status: string;
  }>({ user: null, date: null, status: "" });

  const handleSave = async () => {
    try {
      if (!modalData.user || !modalData.date) {
        throw new Error("User and date must be selected");
      }

      const matchedEntry = fetchedEntries.find(
        (entry) =>
          entry.userId === modalData.user?._id &&
          entry.dateString === modalData.date &&
          entry.status === "clocked_out"
      );

      await api.put(
        `/time/update/attendance-status/${matchedEntry?._id}`,
        {
          attendanceStatus: modalData.status,
        },
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );

      Toast.fire({
        icon: "success",
        title: "Attendance status updated successfully",
      });

      closeModal();
      fetchEntriesForDateRange();
    } catch (error) {
      console.error("Error saving attendance status:", error);
      Toast.fire({
        icon: "error",
        title: "Failed to update attendance status",
      });
      return;
    }
  };

  function toLocalDateString(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  const datesISO = useMemo(() => {
    const isoDates: string[] = [];

    let start: Date;
    let end: Date;

    if (searchRange) {
      start = new Date(searchRange.start);
      end = new Date(searchRange.end);
    } else {
      const today = new Date();
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = today;
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
      isoDates.push(toLocalDateString(new Date(dt))); // clone here
    }

    return isoDates;
  }, [searchRange]);

  const fetchUsers = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const fetchEntriesForDateRange = async () => {
    if (new Date(startDate) > new Date(endDate)) {
      Toast.fire({
        icon: "warning",
        title: "Start date must be before end date",
      });
      return;
    }

    try {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await api.get(
        `/time/all-entry-month?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );

      setFetchedEntries(response.data);
      if (startDate && endDate) {
        setSearchRange({ start: startDate, end: endDate });
      } else {
        setSearchRange(null);
      }
    } catch (error) {
      Toast.fire({
        icon: "error",
        title: "Failed to fetch attendance data",
      });
    }
  };

  const fetchHolidays = async () => {
    try {
      const res = await api.get("/holidays", {
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
      });
      setHolidays(res.data);
    } catch (err) {
      console.error("Failed to fetch holidays", err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchHolidays();
  }, []);

  const attendanceStatusMap = useMemo(() => {
    const map: Record<
      string,
      { attendanceStatus: string; workingHours: string }
    > = {};
    fetchedEntries.forEach((entry) => {
      const key = `${entry.userId}_${entry.dateString}`;
      map[key] = {
        attendanceStatus: entry.attendanceStatus,
        workingHours: entry.workingHours,
      };
    });
    return map;
  }, [fetchedEntries]);

  const userSummaryCounts: Record<string, { fullDay: number; halfDay: number; absent: number }> = {};
  users.forEach((user) => {
    let fullDay = 0;
    let halfDay = 0;
    let absent = 0;

    datesISO.forEach((dateISO) => {
      const date = new Date(dateISO);
      if (date.getDay() === 0) return; // skip Sundays

      const isHolidayDate = holidays.some(
        (h) => new Date(h.date).toISOString().slice(0, 10) === dateISO
      );
      if (isHolidayDate) {
        return;
      }

      const key = `${user._id}_${dateISO}`;
      const attendanceData = attendanceStatusMap[key];
      const attendanceStatus = attendanceData?.attendanceStatus;

      // Saturday logic
      let totalSeconds = 0;
      if (date.getDay() === 6) {
        totalSeconds = fetchedEntries
          .filter(
            (entry) => entry.userId === user._id && entry.dateString === dateISO
          )
          .reduce(
            (sum, entry) => sum + timeStrToSeconds(entry.workingHours),
            0
          );
      } else {
        totalSeconds = timeStrToSeconds(attendanceData?.workingHours);
      }

      const isToday = isTodayISO(dateISO);
      const hasEntryToday = fetchedEntries.some(
        (entry) => entry.userId === user._id && entry.dateString === dateISO
      );

      // Saturday rule
      if (date.getDay() === 6 && totalSeconds >= 14400) {
        fullDay++;
        return;
      }
      if (isToday) {
        if (attendanceStatus === "full_day") {
          fullDay++;
        } else if (attendanceStatus === "half_day") {
          halfDay++;
        } else if (attendanceStatus === "absent") {
          absent++;
        } else if (hasEntryToday) {
          fullDay++;
        } else {
          absent++;
        }
      } else {
        if (attendanceStatus === "full_day") {
          fullDay++;
        } else if (attendanceStatus === "half_day") {
          halfDay++;
        } else {
          absent++;
        }
      }
    });

    userSummaryCounts[user._id] = { fullDay, halfDay, absent };
  });

    function renderAttendanceCell(
    user: User,
    isoDate: string,
    index: number
  ): React.ReactNode {
    // Check if this date is a holiday and get holiday name
    const holiday = holidays.find(
      (h) => new Date(h.date).toISOString().slice(0, 10) === isoDate
    );
    if (holiday) {
      // Holiday cell spanning all users, only render for first user
      if (index === 0) {
        return (
          <td
            key={`${user._id}_${isoDate}_holiday`}
            colSpan={users.length}
            className="px-8 py-4 text-center cursor-default border-b border-gray-100 bg-blue-50 align-middle min-w-[120px]"
          >
            <div className="mx-auto flex items-center justify-center space-x-2 text-blue-600 font-semibold">
              <span>Holiday Leave - {holiday.name}</span>
            </div>
          </td>
        );
      } else {
        return null; // skip rendering other user cells on holiday row
      }
    }

    const date = new Date(isoDate);
    const isSaturday = date.getDay() === 6;
    const isSunday = date.getDay() === 0;
    const isToday = isTodayISO(isoDate);
    const hasEntryToday = fetchedEntries.some(
      (entry) => entry.userId === user._id && entry.dateString === isoDate
    );

    const key = `${user._id}_${isoDate}`;
    const attendanceData = attendanceStatusMap[key];
    const attendanceStatus = attendanceData?.attendanceStatus;

    // Calculate total seconds for Saturday logic
    let totalSeconds = 0;
    if (isSaturday) {
      totalSeconds = fetchedEntries
        .filter((entry) => entry.userId === user._id && entry.dateString === isoDate)
        .reduce((sum, entry) => sum + timeStrToSeconds(entry.workingHours), 0);
    } else {
      totalSeconds = timeStrToSeconds(attendanceData?.workingHours);
    }

    let cellClass = `px-8 py-4 transition-colors duration-200 cursor-pointer border-b border-gray-100 bg-white align-middle min-w-[120px]`;
    if (index === users.length - 1) cellClass += " rounded-r-xl";
    if (isSunday) {
      // Sunday cell - gray text, no click
      return (
        <td
          key={user._id + isoDate}
          className={"text-center text-gray-300 bg-white px-8 py-4 align-middle min-w-[120px]"}
        >
          <div className="mx-auto flex items-center justify-center">
            <span className="text-xs text-gray-500" title="Sunday (not counted)">
              -
            </span>
          </div>
        </td>
      );
    }

    // Saturday full-day check
    if (isSaturday && totalSeconds >= 14400) {
      return (
        <td
          key={user._id + isoDate}
          className={`${cellClass} hover:bg-green-50`}
          onClick={() => openModal(user, isoDate)}
        >
          <div className="mx-auto flex items-center justify-center">
            <FaCheckCircle
              className="text-green-500 w-5 h-5 text-xl"
              title="Saturday: working hours ≥ 4h, counted as Full Day"
            />
          </div>
        </td>
      );
    }

    // Render based on attendance status or entries with consistent styles and icons
    const renderIcon = (icon: React.ReactNode, title: string, colorClass: string) => (
      <div className="mx-auto flex items-center justify-center">
        {React.cloneElement(icon as React.ReactElement<any>, {
          className: `${colorClass} w-5 h-5 text-xl`,
          title,
        })}
      </div>
    );

    if (isToday) {
      switch (attendanceStatus) {
        case "full_day":
          return (
            <td
              key={user._id + isoDate}
              className={`${cellClass} hover:bg-green-50 min-w-[120px]`}
              onClick={() => openModal(user, isoDate)}
            >
              {renderIcon(<FaCheckCircle />, "Full Day", "text-green-500")}
            </td>
          );
        case "half_day":
          return (
            <td
              key={user._id + isoDate}
              className={`${cellClass} hover:bg-amber-50 min-w-[120px]`}
              onClick={() => openModal(user, isoDate)}
            >
              {renderIcon(<FaCheckCircle />, "Half Day", "text-amber-400")}
            </td>
          );
        case "absent":
          return (
            <td
              key={user._id + isoDate}
              className={`${cellClass} hover:bg-red-50 min-w-[120px]`}
              onClick={() => openModal(user, isoDate)}
            >
              {renderIcon(<FaTimesCircle />, "Absent", "text-red-500")}
            </td>
          );
        default:
          // No status but entry exists - count as present full day; else absent
          if (hasEntryToday) {
            return (
              <td
                key={user._id + isoDate}
                className={`${cellClass} hover:bg-green-50 min-w-[120px]`}
                onClick={() => openModal(user, isoDate)}
              >
                {renderIcon(<FaCheckCircle />, "Present (entry exists, status not set)", "text-green-500")}
              </td>
            );
          } else {
            return (
              <td
                key={user._id + isoDate}
                className={`${cellClass} hover:bg-red-50 min-w-[120px]`}
                onClick={() => openModal(user, isoDate)}
              >
                {renderIcon(<FaTimesCircle />, "Absent (no entry)", "text-red-500")}
              </td>
            );
          }
      }
    }

    // Non-today dates
    if (!attendanceStatus) {
      return (
        <td
          key={user._id + isoDate}
          className={`${cellClass} hover:bg-red-50 min-w-[120px]`}
          onClick={() => openModal(user, isoDate)}
        >
          {renderIcon(<FaTimesCircle />, "Absent (no status)", "text-red-500")}
        </td>
      );
    }

    switch (attendanceStatus) {
      case "full_day":
        return (
          <td
            key={user._id + isoDate}
            className={`${cellClass} hover:bg-green-50 min-w-[120px]`}
            onClick={() => openModal(user, isoDate)}
          >
            {renderIcon(<FaCheckCircle />, "Full Day", "text-green-500")}
          </td>
        );
      case "half_day":
        return (
          <td
            key={user._id + isoDate}
            className={`${cellClass} hover:bg-amber-50 min-w-[120px]`}
            onClick={() => openModal(user, isoDate)}
          >
            {renderIcon(<FaCheckCircle />, "Half Day", "text-amber-400")}
          </td>
        );
      default:
        return (
          <td
            key={user._id + isoDate}
            className={`${cellClass} hover:bg-red-50 min-w-[120px]`}
            onClick={() => openModal(user, isoDate)}
          >
            {renderIcon(<FaTimesCircle />, "Absent", "text-red-500")}
          </td>
        );
    }
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-10">
        {/* Header Section */}
        <div className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow">
                  <FaCalendarAlt className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                    Attendance Tracker
                  </h1>
                  <p className="text-gray-500 text-base mt-1">
                    Monitor and manage employee attendance records
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-6 text-sm text-gray-500 mt-2 px-2">
                <div className="flex items-center space-x-2">
                  <FaUsers className="w-4 h-4" />
                  <span>{users.length} Team Members</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FaChartBar className="w-4 h-4" />
                  <span>{datesISO.length} Days Tracked</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden mb-10">
          <div className="px-8 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
            <div className="flex items-center space-x-3">
              <FaFilter className="w-5 h-5 text-green-600" />
              <h2 className="text-xl font-bold text-gray-900">Date Range Filter</h2>
            </div>
            <p className="text-sm text-gray-500 mt-1">Select date range to view attendance data</p>
          </div>
          <div className="p-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
              <div className="flex flex-col sm:flex-row gap-6 flex-1">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-gray-50 shadow-sm"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all bg-gray-50 shadow-sm"
                  />
                </div>
              </div>
              {/* Responsive filter button group */}
              <div className="flex flex-col sm:flex-row gap-3 mt-4 lg:mt-0 w-full sm:w-auto">
                <button
                  onClick={fetchEntriesForDateRange}
                  disabled={!startDate || !endDate}
                  className={`w-full sm:w-auto inline-flex items-center justify-center px-7 py-3 rounded-xl font-semibold transition-all text-base shadow border border-green-600
                    ${!startDate || !endDate
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed border-gray-200"
                      : "bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 hover:shadow-md transform hover:scale-105"
                    }`}
                >
                  <FaSearch className="mr-2 w-5 h-5" />
                  Search
                </button>
                <button
                  className="w-full sm:w-auto inline-flex items-center px-7 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl border border-gray-200 shadow-sm transition-colors"
                  onClick={handleResetFilters}
                >
                  <FaRedo className="mr-2 w-5 h-5" />
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-center border-separate border-spacing-0">
              <thead>
                <tr className="border-b border-gray-200 bg-white">
                  {/* Responsive table: adjust min-width, padding, font size, and sticky for date column */}
                  <th className="sticky md:left-0 z-20 px-4 md:px-8 py-3 md:py-5 text-xs md:text-sm font-bold text-gray-700 uppercase tracking-wider bg-white border-r border-gray-200 shadow-sm min-w-[120px] md:min-w-[200px] whitespace-nowrap">
                    Date
                  </th>
                  {users.map((user, idx) => (
                    <th
                      key={user._id}
                      className={`px-8 py-5 text-sm font-bold text-gray-700 uppercase tracking-wider bg-white border-b border-gray-200 align-middle min-w-[120px] ${idx === users.length - 1 ? 'rounded-tr-xl' : ''}`}
                    >
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold mb-1 shadow-sm">
                          {user.fullName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs font-medium text-gray-700">{user.fullName}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {datesISO.map((iso) => {
                  const holiday = holidays.find(
                    (h) => new Date(h.date).toISOString().slice(0, 10) === iso
                  );
                  return (
                    <tr key={iso} className="bg-white">
                      <td className="sticky md:left-0 z-10 px-4 md:px-8 py-2 md:py-4 text-xs md:text-sm font-semibold text-gray-900 bg-white border-r border-gray-200 shadow-sm align-middle min-w-[120px] md:min-w-[200px] whitespace-nowrap">
                        <span className="font-medium">
                          {new Date(iso).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "2-digit",
                            year: "numeric",
                          })}
                        </span>
                        {holiday && <span className="ml-1 text-blue-500 font-normal">(Holiday)</span>}
                      </td>

                      {/* If it's a holiday, render one holiday cell for first user and skip all other user cells */}
                      {holiday
                        ? Array(users.length)
                            .fill(null)
                            .map((_, idx) => renderAttendanceCell(users[0], iso, idx))
                        : users.map((user, idx) => renderAttendanceCell(user, iso, idx))}
                    </tr>
                  );
                })}
                <tr className="font-semibold border-t-2 border-gray-200 bg-white">
                  <td className="sticky left-0 z-10 px-8 py-5 text-sm font-semibold text-gray-900 bg-white border-r border-gray-200 shadow-sm align-middle min-w-[120px]">
                    <div className="flex items-center space-x-2 justify-center">
                      <FaChartBar className="w-4 h-4 text-gray-600" />
                      <span>Summary</span>
                    </div>
                  </td>
                  {users.map((user) => {
                    const { fullDay = 0, halfDay = 0, absent = 0 } = userSummaryCounts[user._id] || {};
                    return (
                      <td
                        key={`total-summary-${user._id}`}
                        className="text-center px-2 md:px-4 py-3 md:py-5 bg-white border-t border-gray-200 align-middle min-w-[90px] md:min-w-[120px] text-xs md:text-base"
                      >
                        <div className="space-y-1 font-bold">
                          <div className="text-green-600">Full Day: {fullDay}</div>
                          <div className="text-amber-500">Half Day: {halfDay}</div>
                          <div className="text-red-600">Absent: {absent}</div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Attendance Status update Modal */}
      <Modal isOpen={isOpen} onClose={closeModal}>
        <div className="bg-white rounded-2xl shadow w-full max-w-lg mx-4 transform transition-all border border-gray-100 mx-auto">
          <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Update Attendance Status</h2>
            <p className="text-sm text-gray-600">
              For <span className="font-semibold text-gray-900">{modalData.user?.fullName}</span> on{" "}
              <span className="font-semibold text-gray-900">
                {modalData.date ? new Date(modalData.date).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric"
                }) : ""}
              </span>
            </p>
          </div>

          <div className="p-8 space-y-5">
            {(["absent", "half_day", "full_day"] as const).map((status) => {
              const options = {
                absent: {
                  icon: <FaUserSlash className="text-2xl" />,
                  title: "Absent",
                  desc: "Employee was not present",
                  color: "red",
                  bgColor: "red",
                },
                half_day: {
                  icon: <FaClock className="text-2xl" />,
                  title: "Half Day",
                  desc: "Employee worked partial hours",
                  color: "amber",
                  bgColor: "amber",
                },
                full_day: {
                  icon: <FaCalendarCheck className="text-2xl" />,
                  title: "Full Day",
                  desc: "Employee worked full hours",
                  color: "green",
                  bgColor: "green",
                },
              }[status];

              return (
                <label
                  key={status}
                  className={`block border-2 rounded-xl p-5 cursor-pointer transition-all duration-200 hover:shadow ${modalData.status === status
                    ? `border-${options?.color}-500 bg-${options?.bgColor}-50 text-${options?.color}-700 shadow`
                    : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                >
                  <input
                    type="radio"
                    name="attendanceStatus"
                    value={status}
                    checked={modalData.status === status}
                    onChange={handleStatusChange}
                    className="hidden"
                  />
                  <div className="flex items-center">
                    <div className={`mr-5 p-4 rounded-xl ${modalData.status === status
                      ? `bg-${options?.color}-100 text-${options?.color}-600`
                      : "text-gray-400 bg-gray-100"
                      }`}>
                      {options?.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">{options?.title}</h4>
                      <p className="text-sm text-gray-500">{options?.desc}</p>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>

          <div className="border-t border-gray-100 px-8 py-6 flex justify-end space-x-4 bg-gray-50 rounded-b-2xl">
            <button
              onClick={closeModal}
              className="px-7 py-3 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 border border-gray-200 shadow-sm transition-colors"
            >
              Cancel
            </button>
            <button
              className={`px-7 py-3 font-semibold rounded-xl transition-all shadow text-base border border-green-600
                ${!modalData.status
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed border-gray-200"
                  : "bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 transform hover:scale-105"
                }`}
              onClick={handleSave}
              disabled={!modalData.status}
            >
              <FaSave className="inline mr-2 w-5 h-5" />
              Save Changes
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Attendance;
