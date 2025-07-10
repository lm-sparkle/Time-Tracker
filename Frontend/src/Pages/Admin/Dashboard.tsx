/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-wrapper-object-types */
import React, {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import {
  FaPlus,
  FaTrash,
  FaEdit,
  FaCircle,
  FaTimesCircle,
  FaExclamationCircle,
  FaUserCheck,
  FaUsers,
  FaUserTimes,
  FaClock,
} from "react-icons/fa";
import Modal from "../../Components/Modal";
import { Toast } from "../../Components/Toast";
import Swal from "sweetalert2";
import api from "../../utils/api";

type User = {
  _id: string;
  fullName: string;
  email: string;
  status: "Online" | "Offline";
  role: "user" | "admin";
  isActive: boolean;
};

const Dashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [userTimeEntries, setUserTimeEntries] = useState<
    {
      userId: string;
      status: string;
      inTime: Date | null;
      outTime: Date | null;
      workingHours: String;
    }[]
  >([]);

  const [loading, setLoading] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusUser, setStatusUser] = useState<User | null>(null);
  const [pendingStatus, setPendingStatus] = useState<boolean | null>(true);
  const [statusLoading, setStatusLoading] = useState(false);

  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user" as "user" | "admin",
  });

  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    content: React.ReactNode;
  }>({
    visible: false,
    x: 0,
    y: 0,
    content: null,
  });

  const API_URL = import.meta.env.VITE_API_URL as string;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get(`${API_URL}users/all`, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
      });
      setUsers(response.data);
      setTotalUsers(response.data.length);
    } catch (error) {
      Toast.fire({
        icon: "error",
        title: "Failed to fetch users",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserTimeEntries = async () => {
    const today = new Date().toISOString().split("T")[0];
    try {
      const response = await api.get(`${API_URL}time/userTime?date=${today}`, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
      });
      setUserTimeEntries(response.data);
      return response.data;
    } catch (error) {
      Toast.fire({
        icon: "error",
        title: "Failed to fetch user time entries",
      });
      return [];
    }
  };

  const activateUser = async (userId: string, isActive: boolean) => {
    try {
      await api.put(
        `${API_URL}users/status/${userId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );
      Toast.fire({
        icon: "success",
        title: `User ${isActive ? "deactivated" : "activated"}  successfully`,
      });
      fetchUsers();
    } catch (error) {
      Toast.fire({
        icon: "error",
        title: "Failed to activate user",
      });
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchUserTimeEntries();
  }, []);

  const handleAddUser = async (e: FormEvent) => {
    e.preventDefault();
    if (
      !form.firstName ||
      !form.lastName ||
      !form.email ||
      !form.password ||
      form.password !== form.confirmPassword
    ) {
      Toast.fire({
        icon: "error",
        title: "Please fill in all fields",
      });
      return;
    }
    try {
      await api.post(
        `${API_URL}register`,
        {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          password: form.password,
          confirmPassword: form.confirmPassword,
          role: form.role,
        },
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );
      Toast.fire({
        icon: "success",
        title: "User created successfully",
      });
      fetchUsers();
      closeModals();
    } catch (err: any) {
      Toast.fire({
        icon: "error",
        title: err.response?.data?.message || "Failed to create user",
      });
    }
  };

  const handleEditUser = async (e: FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    try {
      await api.put(
        `${API_URL}users/${editUser._id}`,
        {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
        },
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );
      Toast.fire({
        icon: "success",
        title: "User updated successfully",
      });
      fetchUsers();
      closeModals();
    } catch (error: any) {
      Toast.fire({
        icon: "error",
        title: error.response?.data?.message || "Failed to update user",
      });
    }
  };

  const handleDeleteUser = async (userId: string, fullName: string) => {
    Swal.fire({
      title: `You're about to permanently delete ${fullName} !!!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`${API_URL}users/${userId}`, {
            headers: {
              Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            },
          });
          Toast.fire({
            icon: "success",
            title: "User deleted successfully",
          });
          fetchUsers();
        } catch (error: any) {
          Toast.fire({
            icon: "error",
            title: error.response?.data?.message || "Failed to delete user",
          });
        }
      }
    });
  };

  const openAddModal = () => {
    setForm({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "user",
    });
    setShowAddModal(true);
  };

  const openEditModal = (user: User) => {
    const [firstName, ...rest] = user.fullName.split(" ");
    setForm({
      firstName: firstName,
      lastName: rest.join(" "),
      email: user.email,
      password: "",
      confirmPassword: "",
      role: user.role,
    });
    setEditUser(user);
    setShowEditModal(true);
  };

  const closeModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setEditUser(null);
  };

  const openStatusModal = (user: User) => {
    setStatusUser(user);
    setPendingStatus(user.isActive ? true : false);
    setShowStatusModal(true);
  };

  const closeStatusModal = () => {
    setShowStatusModal(false);
    setStatusUser(null);
    setPendingStatus(null);
    setStatusLoading(false);
  };

  const handleStatusChange = (status: boolean) => {
    setPendingStatus(status);
  };

  const confirmStatusUpdate = async () => {
    if (!statusUser || pendingStatus === null) return;
    setStatusLoading(true);
    try {
      await activateUser(statusUser._id, statusUser.isActive); // Your existing API call
      closeStatusModal();
    } catch (e) {
      setStatusLoading(false);
    }
  };

  const handleFormChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="font-sans antialiased min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header>
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-600 rounded-xl shadow-lg">
                  <FaUsers className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    User Management
                  </h1>
                  <p className="text-gray-600">
                    Manage your team members and track their activities
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-500 px-1">
                <div className="flex items-center space-x-2">
                  <FaClock className="w-4 h-4" />
                  <span>Today: {new Date().toDateString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FaUsers className="w-4 h-4" />
                  <span>{totalUsers} Total Users</span>
                </div>
              </div>
            </div>
            <button
              onClick={openAddModal}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-200 transform hover:scale-105"
            >
              <FaPlus className="mr-2 w-4 h-4" />
              Add New User
            </button>
          </div>
        </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{totalUsers}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <FaUsers className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-3xl font-bold text-green-600">
                  {users.filter(user => user.isActive).length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <FaUserCheck className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Online Users</p>
                <p className="text-3xl font-bold text-purple-600">
                  {users.filter(user =>
                    userTimeEntries.some(entry =>
                      entry.userId === user._id && entry.outTime === null
                    )
                  ).length}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <FaCircle className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
        {/* Users Table */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Working Hours
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Last Activity
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Account
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="text-gray-500">Loading users...</span>
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12">
                      <div className="text-gray-500">
                        <FaUsers className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">No users found</p>
                        <p className="text-sm">Get started by adding your first user</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr
                      key={user._id}
                      className="hover:bg-gray-50 transition-colors duration-200 cursor-pointer group"
                      onMouseEnter={(e) => {
                        const rect = (
                          e.currentTarget as HTMLElement
                        ).getBoundingClientRect();

                        const userEntries = userTimeEntries
                          .filter((entry) => entry.userId === user._id)
                          .sort((a, b) => {
                            const timeA = a.inTime
                              ? new Date(a.inTime).getTime()
                              : 0;
                            const timeB = b.inTime
                              ? new Date(b.inTime).getTime()
                              : 0;
                            return timeA - timeB;
                          });

                        let trackerStatus = "Not Clocked In";
                        if (userEntries.length > 0) {
                          const latest = userEntries[userEntries.length - 1];
                          if (latest.status === "clocked_in")
                            trackerStatus = "Clocked In";
                          else if (latest.status === "clocked_out_for_break")
                            trackerStatus = "On Break";
                          else if (latest.status === "clocked_out")
                            trackerStatus = "Clocked Out";
                        }

                        let totalLoggedSeconds = 0;
                        userEntries.forEach((entry, _i) => {
                          const inTime = entry.inTime
                            ? new Date(entry.inTime).getTime()
                            : null;
                          const outTime = entry.outTime
                            ? new Date(entry.outTime).getTime()
                            : null;
                          if (inTime && outTime) {
                            totalLoggedSeconds += Math.floor(
                              (outTime - inTime) / 1000
                            );
                          }
                        });

                        if (
                          userEntries.length > 0 &&
                          userEntries[userEntries.length - 1].status ===
                          "clocked_in" &&
                          userEntries[userEntries.length - 1].inTime &&
                          !userEntries[userEntries.length - 1].outTime
                        ) {
                          const lastEntry =
                            userEntries.length > 0
                              ? userEntries[userEntries.length - 1]
                              : undefined;
                          const lastIn =
                            lastEntry && lastEntry.inTime
                              ? new Date(lastEntry.inTime).getTime()
                              : 0;

                          totalLoggedSeconds += Math.floor(
                            (Date.now() - lastIn) / 1000
                          );
                        }

                        let totalBreakSeconds = 0;
                        for (let i = 1; i < userEntries.length; i++) {
                          const prev = userEntries[i - 1];
                          const curr = userEntries[i];
                          if (prev.outTime && curr.inTime) {
                            const breakStart = new Date(prev.outTime).getTime();
                            const breakEnd = new Date(curr.inTime).getTime();
                            if (breakEnd > breakStart) {
                              totalBreakSeconds += Math.floor(
                                (breakEnd - breakStart) / 1000
                              );
                            }
                          }
                        }
                        if (
                          userEntries.length > 0 &&
                          userEntries[userEntries.length - 1].status ===
                          "clocked_out_for_break" &&
                          userEntries[userEntries.length - 1].outTime
                        ) {
                          const lastOut = userEntries[userEntries.length - 1]
                            .outTime
                            ? new Date(
                              userEntries[userEntries.length - 1].outTime ||
                              ""
                            ).getTime()
                            : 0;
                          totalBreakSeconds += Math.floor(
                            (Date.now() - lastOut) / 1000
                          );
                        }

                        const formatTime = (seconds: number) => {
                          const h = Math.floor(seconds / 3600)
                            .toString()
                            .padStart(2, "0");
                          const m = Math.floor((seconds % 3600) / 60)
                            .toString()
                            .padStart(2, "0");
                          const s = Math.floor(seconds % 60)
                            .toString()
                            .padStart(2, "0");
                          return `${h}:${m}:${s}`;
                        };

                        setTooltip({
                          visible: true,
                          x: rect.left + rect.width / 2,
                          y: rect.top - 10,
                          content: (
                            <div className="bg-white p-4 rounded-xl shadow-2xl border border-gray-200 min-w-[280px]">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-semibold text-gray-700">Tracker Status:</span>
                                  <span className="text-sm text-gray-600">{trackerStatus}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-semibold text-gray-700">Logged Time:</span>
                                  <span className="text-sm text-green-600 font-mono">{formatTime(totalLoggedSeconds)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-semibold text-gray-700">Break Time:</span>
                                  <span className="text-sm text-orange-600 font-mono">{formatTime(totalBreakSeconds)}</span>
                                </div>
                              </div>
                            </div>
                          ),
                        });
                      }}
                      onMouseLeave={() =>
                        setTooltip((prev) => ({ ...prev, visible: false }))
                      }
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img
                              className="h-10 w-10 rounded-full"
                              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                                user.fullName
                              )}&background=6366f1&color=fff&size=40`}
                              alt=""
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900">
                              {user.fullName}
                            </div>
                            <div className="text-sm text-gray-500 capitalize">
                              {user.role}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono text-gray-900">
                          {userTimeEntries.filter(
                            (entry) => entry.userId === user._id
                          ).length > 0
                            ? (() => {
                              const totalWorkedMs = userTimeEntries
                                .filter((entry) => entry.userId === user._id)
                                .reduce((total, entry) => {
                                  const entryDuration =
                                    entry.outTime && entry.inTime
                                      ? new Date(entry.outTime).getTime() -
                                      new Date(entry.inTime).getTime()
                                      : 0;
                                  return total + entryDuration;
                                }, 0);

                              const totalSeconds = Math.floor(
                                totalWorkedMs / 1000
                              );
                              const hours = Math.floor(totalSeconds / 3600);
                              const minutes = Math.floor(
                                (totalSeconds % 3600) / 60
                              );
                              const seconds = totalSeconds % 60;

                              return `${String(hours).padStart(
                                2,
                                "0"
                              )}:${String(minutes).padStart(2, "0")}:${String(
                                seconds
                              ).padStart(2, "0")}`;
                            })()
                            : "00:00:00"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {userTimeEntries.filter(
                            (entry) => entry.userId === user._id
                          ).length > 0
                            ? (() => {
                              const latestEntry = userTimeEntries
                                .filter((entry) => entry.userId === user._id)
                                .sort((a, b) => {
                                  const timeA = a.inTime
                                    ? new Date(a.inTime).getTime()
                                    : 0;
                                  const timeB = b.inTime
                                    ? new Date(b.inTime).getTime()
                                    : 0;
                                  return timeB - timeA;
                                })[0];

                              return latestEntry?.outTime
                                ? new Date(latestEntry.outTime).toLocaleString()
                                : "-";
                            })()
                            : "No entries"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {userTimeEntries.some(
                          (entry) =>
                            entry.userId === user._id && entry.outTime === null
                        ) ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                            <FaCircle className="mr-1.5 w-2 h-2 text-green-500" />
                            Online
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                            <FaCircle className="mr-1.5 w-2 h-2 text-gray-400" />
                            Offline
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => openStatusModal(user)}
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold transition-colors ${user.isActive
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : "bg-red-100 text-red-800 hover:bg-red-200"
                            }`}
                        >
                          {user.isActive ? (
                            <>
                              <FaUserCheck className="mr-1.5 w-3 h-3" />
                              Active
                            </>
                          ) : (
                            <>
                              <FaUserTimes className="mr-1.5 w-3 h-3" />
                              Inactive
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-50"
                            title="Edit User"
                            onClick={() => openEditModal(user)}
                          >
                            <FaEdit className="w-4 h-4" />
                          </button>
                          <button
                            className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors group-hover:bg-red-50"
                            title="Delete User"
                            onClick={() =>
                              handleDeleteUser(user._id, user.fullName)
                            }
                          >
                            <FaTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {tooltip.visible && (
              <div
                className="fixed z-50 pointer-events-none"
                style={{
                  left: tooltip.x,
                  top: tooltip.y,
                  transform: 'translateX(-50%) translateY(-100%)',
                  opacity: tooltip.visible ? 1 : 0,
                  transition: "opacity 0.2s",
                }}
              >
                {tooltip.content}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      <Modal isOpen={showAddModal} onClose={closeModals}>
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 transform transition-all mx-auto">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
            <h3 className="text-xl font-semibold text-gray-900">
              Add New User
            </h3>
            <p className="text-sm text-gray-600 mt-1">Create a new user account</p>
          </div>
          <form onSubmit={handleAddUser} className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleFormChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Role
              </label>
              <select
                name="role"
                value={form.role}
                onChange={handleFormChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleFormChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleFormChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={closeModals}
                className="px-6 py-3 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg"
              >
                Create User
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal isOpen={showEditModal} onClose={closeModals}>
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 transform transition-all mx-auto">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-2xl">
            <h3 className="text-xl font-semibold text-gray-900">Edit User</h3>
            <p className="text-sm text-gray-600 mt-1">Update user information</p>
          </div>
          <form onSubmit={handleEditUser} className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleFormChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleFormChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                required
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={closeModals}
                className="px-6 py-3 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-xl hover:from-green-700 hover:to-green-800 transition-all shadow-lg"
              >
                Update User
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* User Status Modal */}
      <Modal isOpen={showStatusModal} onClose={closeStatusModal}>
        {statusUser && (
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all mx-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-2xl">
              <h3 className="text-xl font-semibold text-gray-800">
                Manage Account Status
              </h3>
              <button
                onClick={closeStatusModal}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
              >
                <FaTimesCircle className="text-xl" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center mb-6">
                <div className="relative mr-4">
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                      statusUser.fullName
                    )}&background=6366f1&color=fff&size=64`}
                    alt="User avatar"
                    className="w-16 h-16 rounded-full border-4 border-gray-200 object-cover shadow-lg"
                  />
                  <span
                    className={`absolute bottom-0 right-0 w-5 h-5 rounded-full border-2 border-white shadow-sm ${pendingStatus === true ? "bg-green-500" : "bg-red-500"
                      }`}
                  ></span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-lg">
                    {statusUser.fullName}
                  </h4>
                  <p className="text-gray-600 text-sm">{statusUser.email}</p>
                  <div
                    className={`inline-block px-3 py-1 rounded-full text-xs mt-2 font-semibold ${pendingStatus === true
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                      }`}
                  >
                    {pendingStatus === true ? "Active" : "Inactive"}
                  </div>
                </div>
              </div>
              <div className="mb-6">
                <h5 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
                  Set Account Status
                </h5>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleStatusChange(true)}
                    className={`border-2 font-semibold py-4 px-4 rounded-xl flex items-center justify-center transition-all duration-200 ${pendingStatus === true
                      ? "border-green-400 bg-green-50 text-green-700 shadow-md"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-green-50 hover:border-green-300"
                      }`}
                  >
                    <FaUserCheck className="mr-2 w-4 h-4" />
                    Activate
                  </button>
                  <button
                    onClick={() => handleStatusChange(false)}
                    className={`border-2 font-semibold py-4 px-4 rounded-xl flex items-center justify-center transition-all duration-200 ${pendingStatus === false
                      ? "border-red-400 bg-red-50 text-red-700 shadow-md"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-red-50 hover:border-red-300"
                      }`}
                  >
                    <FaUserTimes className="mr-2 w-4 h-4" />
                    Deactivate
                  </button>
                </div>
              </div>
              <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-xl mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <FaExclamationCircle className="text-amber-400 w-5 h-5" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-amber-700 font-medium">
                      Deactivating an account will immediately restrict user access.
                      The user won't be able to log in until reactivated.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <button
                onClick={closeStatusModal}
                className="px-6 py-3 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 mr-3 transition-colors"
                disabled={statusLoading}
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusUpdate}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg"
                disabled={
                  statusLoading ||
                  pendingStatus === (statusUser.isActive ? true : false)
                }
              >
                {statusLoading ? "Saving..." : "Confirm Changes"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Dashboard;
