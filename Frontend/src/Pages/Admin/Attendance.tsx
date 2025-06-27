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
} from "react-icons/fa";
import Modal from "../../Components/Modal";

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
  totalSeconds: number;
  inTime: string | number | Date;
  workingHours: string;
  _id: string;
  user: any;
  dateISO: string;
  userId: string;
  dateString: string;
};

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

  const handleResetFilters = () => {
    setStartDate("");
    setEndDate("");
  };

  useEffect(() => {
    if (!startDate && !endDate) {
      fetchEntriesForDateRange();
    }
  }, [startDate, endDate]);

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

  useEffect(() => {
    fetchUsers();
  }, []);

  const attendanceStatusMap = useMemo(() => {
    const map: Record<string, string> = {};
    fetchedEntries.forEach((entry) => {
      const key = `${entry.userId}_${entry.dateString}`;
      map[key] = entry.attendanceStatus;
    });
    return map;
  }, [fetchedEntries]);

  const userSummaryCounts: Record<
    string,
    { fullDay: number; halfDay: number; absent: number }
  > = {};

  users.forEach((user) => {
    let fullDay = 0;
    let halfDay = 0;
    let absent = 0;

    datesISO.forEach((dateISO) => {
      const date = new Date(dateISO);
      if (date.getDay() === 0) return; // skip Sundays

      const key = `${user._id}_${dateISO}`;
      const status = attendanceStatusMap[key];

      if (status === "full_day") {
        fullDay++;
      } else if (status === "half_day") {
        halfDay++;
      } else {
        absent++;
      }
    });

    userSummaryCounts[user._id] = { fullDay, halfDay, absent };
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-md overflow-hidden p-6 mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Attendance Tracker
        </h1>

        {/* Filter Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm p-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm p-2"
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={fetchEntriesForDateRange}
                disabled={!startDate || !endDate}
                className={`px-4 py-2 rounded-md text-white ${
                  !startDate || !endDate
                    ? "bg-indigo-300 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                Search
              </button>
              <button
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md transition-colors flex items-center"
                onClick={handleResetFilters}
              >
                <i className="fas fa-redo mr-2"></i> Reset
              </button>
            </div>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="border rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="text-center">
                  <th className="sticky left-0 z-20 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-white">
                    Date
                  </th>
                  {users.map((user) => (
                    <th
                      key={user._id}
                      className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider bg-white whitespace-nowrap"
                    >
                      {user.fullName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {datesISO.map((iso, _index) => (
                  <tr key={iso} className="hover:bg-gray-50">
                    <td className="sticky left-0 z-10 px-6 py-4 text-sm font-medium text-gray-900 bg-white whitespace-nowrap">
                      {new Date(iso).toLocaleDateString("en-US", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    {users.map((user) => {
                      const key = `${user._id}_${iso}`;
                      const attendanceStatus = attendanceStatusMap[key];

                      const date = new Date(iso);
                      const isSunday = date.getDay() === 0;

                      if (isSunday) {
                        return (
                          <td
                            key={user._id + iso}
                            className="text-center text-gray-400"
                          >
                            -
                          </td>
                        );
                      }

                      return (
                        <td
                          key={user._id + iso}
                          className="text-center"
                          onClick={() => openModal(user, iso)}
                        >
                          {!attendanceStatus ? (
                            <FaTimesCircle
                              className="text-red-500 text-xl inline"
                              title="Absent"
                            />
                          ) : attendanceStatus === "full_day" ? (
                            <FaCheckCircle
                              className="text-green-500 text-xl inline"
                              title="Full Day"
                            />
                          ) : attendanceStatus === "half_day" ? (
                            <FaCheckCircle
                              className="text-amber-500 text-xl inline"
                              title="Half Day"
                            />
                          ) : (
                            <FaTimesCircle
                              className="text-red-500 text-xl inline"
                              title="Absent"
                            />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* ✅ Proper summary row */}
                <tr className="bg-gray-100 font-semibold">
                  <td className="sticky left-0 z-10 px-6 py-4 text-sm font-medium text-gray-900 bg-gray-100">
                    Total Summary
                  </td>
                  {users.map((user) => {
                    const {
                      fullDay = 0,
                      halfDay = 0,
                      absent = 0,
                    } = userSummaryCounts[user._id] || {};

                    return (
                      <td
                        key={`total-summary-${user._id}`}
                        className="text-center px-4 py-2"
                      >
                        <div className="text-green-600">
                          Full Day: {fullDay}
                        </div>
                        <div className="text-amber-500">
                          Half Day: {halfDay}
                        </div>
                        <div className="text-red-600">Absent: {absent}</div>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Attendance Status update */}
      <Modal isOpen={isOpen} onClose={closeModal}>
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-auto">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-xl font-bold mb-2">Update Attendance Status</h2>
            <p>
              For {modalData.user?.fullName} on{" "}
              {modalData.date ? new Date(modalData.date).toDateString() : ""}
            </p>
          </div>

          <div className="p-6 space-y-4">
            {["absent", "half_day", "full_day"].map((status) => {
              const options = {
                absent: {
                  icon: <FaUserSlash className="text-2xl" />,
                  title: "Absent",
                  desc: "Employee was not present",
                  color: "indigo",
                },
                half_day: {
                  icon: <FaClock className="text-2xl" />,
                  title: "Half Day",
                  desc: "Employee worked partial hours",
                  color: "amber",
                },
                full_day: {
                  icon: <FaCalendarCheck className="text-2xl" />,
                  title: "Full Day",
                  desc: "Employee worked full hours",
                  color: "green",
                },
              }[status];

              return (
                <label
                  key={status}
                  className={`block border-2 rounded-lg p-4 cursor-pointer flex items-center transition ${
                    modalData.status === status
                      ? `border-${options?.color}-500 bg-${options?.color}-50 text-${options?.color}-700`
                      : "border-gray-200 hover:border-blue-300"
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
                  <div className="mr-4 text-gray-400">{options?.icon}</div>
                  <div>
                    <h4 className="font-medium">{options?.title}</h4>
                    <p className="text-sm text-gray-500">{options?.desc}</p>
                  </div>
                </label>
              );
            })}
          </div>

          <div className="border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
            <button
              onClick={closeModal}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              className="bg-indigo-600 text-white px-4 py-2 rounded disabled:opacity-50"
              onClick={handleSave}
              disabled={!modalData.status}
            >
              <FaSave className="inline mr-2" />
              Save
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Attendance;
