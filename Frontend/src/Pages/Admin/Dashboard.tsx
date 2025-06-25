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
  FaChevronLeft,
  FaChevronRight,
  FaTrash,
  FaEdit,
  FaCircle,
  FaTimesCircle,
  FaExclamationCircle,
  FaCheckCircle,
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

type Pagination = {
  currentPage: number;
  totalPages: number;
  totalUsers: number;
};

const Dashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [userTimeEntries, setUserTimeEntries] = useState<
    {
      userId: string;
      status: string;
      inTime: Date | null;
      outTime: Date | null;
      workingHours: String;
    }[]
  >([]);
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
  });
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

  const fetchUsers = async (page = 1) => {
    setLoading(true);
    try {
      const response = await api.get(`${API_URL}users`, {
        params: {
          page,
          limit: 10,
        },
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
      });
      setUsers(response.data.users);
      setPagination({
        currentPage: response.data.currentPage,
        totalPages: response.data.totalPages,
        totalUsers: response.data.totalUsers,
      });
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
      fetchUsers(pagination.currentPage);
    } catch (error) {
      Toast.fire({
        icon: "error",
        title: "Failed to activate user",
      });
    }
  };

  useEffect(() => {
    fetchUsers(pagination.currentPage);
    fetchUserTimeEntries();
  }, [pagination.currentPage]);

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
      fetchUsers(1);
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
      fetchUsers(pagination.currentPage);
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
          fetchUsers(pagination.currentPage);
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

  const renderPagination = () => (
    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
      <button
        onClick={() =>
          setPagination((prev) => ({
            ...prev,
            currentPage: Math.max(1, prev.currentPage - 1),
          }))
        }
        disabled={pagination.currentPage === 1}
        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
      >
        <FaChevronLeft />
      </button>
      {Array.from({ length: pagination.totalPages }, (_, i) => (
        <button
          key={i + 1}
          onClick={() =>
            setPagination((prev) => ({
              ...prev,
              currentPage: i + 1,
            }))
          }
          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
            pagination.currentPage === i + 1
              ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
              : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
          }`}
        >
          {i + 1}
        </button>
      ))}
      <button
        onClick={() =>
          setPagination((prev) => ({
            ...prev,
            currentPage: Math.min(prev.totalPages, prev.currentPage + 1),
          }))
        }
        disabled={pagination.currentPage === pagination.totalPages}
        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
      >
        <FaChevronRight />
      </button>
    </nav>
  );

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
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                User Management
              </h1>
              <p className="pt-2 px-1 text-sm text-gray-600">
                Today is{" "}
                <span className="font-medium">{new Date().toDateString()}</span>
              </p>
            </div>
            <button
              onClick={openAddModal}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <FaPlus className="mr-2" /> Add User
            </button>
          </div>
        </header>

        {/* Users Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Working Hours(hh:mm:ss)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Active
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tracking Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Account Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-gray-500">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr
                      key={user._id}
                      className="hover:bg-gray-50 cursor-pointer"
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
                            <div>
                              <div className="mb-2 text-sm font-bold text-gray-800">
                                Tracker Status:{" "}
                                <span className="font-normal">
                                  {trackerStatus}
                                </span>
                              </div>
                              <div className="mb-2 text-sm font-bold text-gray-800">
                                Logged Time:{" "}
                                <span className="font-normal">
                                  {formatTime(totalLoggedSeconds)}
                                </span>
                              </div>
                              <div className="mb-2 text-sm font-bold text-gray-800">
                                Break Time:{" "}
                                <span className="font-normal">
                                  {formatTime(totalBreakSeconds)}
                                </span>
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
                        {user.fullName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
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
                          : 0}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
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
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {userTimeEntries.some(
                          (entry) =>
                            entry.userId === user._id && entry.outTime === null
                        ) ? (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-500">
                            <FaCircle className="mr-1" /> Online
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100">
                            <FaCircle className="mr-1 text-gray-400" /> Offline
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap cursor-pointer">
                        <button
                          onClick={() => openStatusModal(user)}
                          className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium cursor-pointer ${
                            user.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-red-200 text-red-600"
                          }`}
                        >
                          {user.isActive ? (
                            <>
                              <FaCheckCircle className="mr-1" /> Active
                            </>
                          ) : (
                            <>
                              <FaTimesCircle className="mr-1" /> Inactive
                            </>
                          )}
                        </button>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                        <button
                          className="p-1 rounded hover:bg-indigo-50 text-indigo-600"
                          title="Edit"
                          onClick={() => openEditModal(user)}
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="p-1 rounded hover:bg-red-50 text-red-600"
                          title="Delete"
                          onClick={() =>
                            handleDeleteUser(user._id, user.fullName)
                          }
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {tooltip.visible && (
              <div
                className="fixed z-50 bg-white p-3 rounded-lg shadow-lg min-w-[220px] pointer-events-none"
                style={{
                  left: tooltip.x,
                  top: tooltip.y,
                  opacity: tooltip.visible ? 1 : 0,
                  transition: "opacity 0.2s",
                }}
              >
                {tooltip.content}
              </div>
            )}
          </div>
          {/* Pagination */}
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{" "}
                  <span className="font-medium">
                    {(pagination.currentPage - 1) * 10 + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium">
                    {Math.min(
                      pagination.currentPage * 10,
                      pagination.totalUsers
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium">{pagination.totalUsers}</span>{" "}
                  results
                </p>
              </div>
              <div>{renderPagination()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      <Modal isOpen={showAddModal} onClose={closeModals}>
        <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 mx-auto">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Add New User
          </h3>
          <form onSubmit={handleAddUser} className="space-y-4">
            <div className="flex gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleFormChange}
                  className="mt-1 block w-full border-gray-300 border rounded-md focus:outline-none focus:ring-4 focus:ring-indigo-700 p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleFormChange}
                  className="mt-1 block w-full border-gray-300 border rounded-md focus:outline-none focus:ring-4 focus:ring-indigo-700 p-2"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleFormChange}
                className="mt-1 block w-full border-gray-300 border rounded-md focus:outline-none focus:ring-4 focus:ring-indigo-700 p-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <select
                name="role"
                value={form.role}
                onChange={handleFormChange}
                className="mt-1 block w-full border-gray-300 border rounded-md focus:outline-none focus:ring-4 focus:ring-indigo-700 p-2"
                required
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleFormChange}
                className="mt-1 block w-full border-gray-300 border rounded-md focus:outline-none focus:ring-4 focus:ring-indigo-700 p-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleFormChange}
                className="mt-1 block w-full border-gray-300 border rounded-md focus:outline-none focus:ring-4 focus:ring-indigo-700 p-2"
                required
              />
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md"
              >
                Save
              </button>
              <button
                type="button"
                onClick={closeModals}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal isOpen={showEditModal} onClose={closeModals}>
        <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 mx-auto">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Edit User</h3>
          <form onSubmit={handleEditUser} className="space-y-4">
            <div className="flex gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleFormChange}
                  className="mt-1 block w-full border-gray-300 border rounded-md focus:outline-none focus:ring-4 focus:ring-indigo-700 p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleFormChange}
                  className="mt-1 block w-full border-gray-300 border rounded-md focus:outline-none focus:ring-4 focus:ring-indigo-700 p-2"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleFormChange}
                className="mt-1 block w-full border-gray-300 border rounded-md focus:outline-none focus:ring-4 focus:ring-indigo-700 p-2"
                required
              />
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md"
              >
                Save
              </button>
              <button
                type="button"
                onClick={closeModals}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* User Status Modal */}
      <Modal isOpen={showStatusModal} onClose={closeStatusModal}>
        {statusUser && (
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 transform transition-all duration-300">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800">
                Manage User Account
              </h3>
              <button
                onClick={closeStatusModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
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
                    )}`}
                    alt="User avatar"
                    className="w-16 h-16 rounded-full border-4 border-gray-200 object-cover shadow-sm"
                  />
                  <span
                    className={`absolute bottom-0 right-0 w-5 h-5 rounded-full border-2 border-white ${
                      pendingStatus === true ? "bg-green-500" : "bg-red-400"
                    }`}
                  ></span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">
                    {statusUser.fullName}
                  </h4>
                  <p className="text-gray-600 text-sm">{statusUser.email}</p>
                  <div
                    className={`inline-block px-3 py-1 rounded-full text-xs mt-1 font-medium ${
                      pendingStatus === true
                        ? "bg-green-100 text-green-800"
                        : "bg-red-200 text-red-600"
                    }`}
                  >
                    {pendingStatus === true ? "Active" : "Inactive"}
                  </div>
                </div>
              </div>
              <div className="mb-6">
                <h5 className="text-sm font-medium text-gray-500 mb-3">
                  SET ACCOUNT STATUS
                </h5>
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleStatusChange(true)}
                    className={`flex-1 border-2 font-medium py-3 px-4 rounded-lg flex items-center justify-center transition-all duration-200 ${
                      pendingStatus === true
                        ? "border-green-400 bg-green-50 text-green-700"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-green-50"
                    }`}
                  >
                    <FaCheckCircle className="mr-2" />
                    Activate
                  </button>
                  <button
                    onClick={() => handleStatusChange(false)}
                    className={`flex-1 border-2 font-medium py-3 px-4 rounded-lg flex items-center justify-center transition-all duration-200 ${
                      pendingStatus === false
                        ? "border-red-400 bg-red-100 text-red-700"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <FaTimesCircle className="mr-2" />
                    Deactivate
                  </button>
                </div>
              </div>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <FaExclamationCircle className="text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      Deactivating an account will restrict user access
                      immediately. The user won't be able to log in until
                      reactivated.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <button
                onClick={closeStatusModal}
                className="px-4 py-2 text-gray-700 font-medium rounded-lg hover:bg-gray-100 mr-3 transition-colors"
                disabled={statusLoading}
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusUpdate}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
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