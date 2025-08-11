/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import {
  FaPlus,
  FaTrash,
  FaEdit,
  FaCalendarAlt,
  FaSun,
} from "react-icons/fa";
import Modal from "../../Components/Modal";
import { Toast } from "../../Components/Toast";
import Swal from "sweetalert2";
import api from "../../utils/api";

type Holiday = {
  _id: string;
  name: string;
  date: string;
};

const Holidays: React.FC = () => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [totalHolidays, setTotalHolidays] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editHoliday, setEditHoliday] = useState<Holiday | null>(null);

  const [form, setForm] = useState({
    name: "",
    date: "",
  });

  const API_URL = import.meta.env.VITE_API_URL as string;

  const fetchHolidays = async () => {
    setLoading(true);
    try {
      const response = await api.get(`${API_URL}holidays`, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
      });
      setHolidays(response.data);
      setTotalHolidays(response.data.length);
    } catch (error) {
      Toast.fire({
        icon: "error",
        title: "Failed to fetch holidays",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  const handleAddHoliday = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.date) {
      Toast.fire({
        icon: "error",
        title: "Please fill in all required fields",
      });
      return;
    }
    try {
      await api.post(
        `${API_URL}add-holiday`,
        {
          name: form.name,
          date: form.date,
        },
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );
      Toast.fire({
        icon: "success",
        title: "Holiday added successfully",
      });
      fetchHolidays();
      closeModals();
    } catch (err: any) {
      Toast.fire({
        icon: "error",
        title: err.response?.data?.message || "Failed to add holiday",
      });
    }
  };

  const handleEditHoliday = async (e: FormEvent) => {
    e.preventDefault();
    if (!editHoliday) return;
    try {
      await api.put(
        `${API_URL}edit-holiday/${editHoliday._id}`,
        {
          name: form.name,
          date: form.date,
        },
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );
      Toast.fire({
        icon: "success",
        title: "Holiday updated successfully",
      });
      fetchHolidays();
      closeModals();
    } catch (error: any) {
      Toast.fire({
        icon: "error",
        title: error.response?.data?.message || "Failed to update holiday",
      });
    }
  };

  const handleDeleteHoliday = async (holidayId: string, holidayName: string) => {
    Swal.fire({
      title: `Delete ${holidayName}?`,
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`${API_URL}delete-holiday/${holidayId}`, {
            headers: {
              Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            },
          });
          Toast.fire({
            icon: "success",
            title: "Holiday deleted successfully",
          });
          fetchHolidays();
        } catch (error: any) {
          Toast.fire({
            icon: "error",
            title: error.response?.data?.message || "Failed to delete holiday",
          });
        }
      }
    });
  };

  const openAddModal = () => {
    setForm({
      name: "",
      date: "",
    });
    setShowAddModal(true);
  };

  const openEditModal = (holiday: Holiday) => {
    setForm({
      name: holiday.name,
      date: holiday.date.split('T')[0],
    });
    setEditHoliday(holiday);
    setShowEditModal(true);
  };

  const closeModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setEditHoliday(null);
  };

  const handleFormChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  return (
    <div className="font-sans antialiased min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header>
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-blue-600 rounded-xl shadow-lg">
                    <FaCalendarAlt className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      Holiday Management
                    </h1>
                    <p className="text-gray-600">
                      Manage company holidays and special days
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-500 px-1">
                  <div className="flex items-center space-x-2">
                    <FaCalendarAlt className="w-4 h-4" />
                    <span>Today: {new Date().toDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FaSun className="w-4 h-4" />
                    <span>{totalHolidays} Total Holidays</span>
                  </div>
                </div>
              </div>
              <button
                onClick={openAddModal}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-200 transform hover:scale-105"
              >
                <FaPlus className="mr-2 w-4 h-4" />
                Add New Holiday
              </button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Holidays</p>
                <p className="text-3xl font-bold text-gray-900">{totalHolidays}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <FaCalendarAlt className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          {/* Add more cards here if needed */}
          <div className="md:col-span-2"></div> {/* Placeholder for additional cards */}
        </div>

        {/* Holidays Table - Full width below cards */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Holiday
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="text-center py-12">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="text-gray-500">Loading holidays...</span>
                      </div>
                    </td>
                  </tr>
                ) : holidays.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-12">
                      <div className="text-gray-500">
                        <FaCalendarAlt className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">No holidays found</p>
                        <p className="text-sm">Add your first holiday to get started</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  holidays.map((holiday) => (
                    <tr
                      key={holiday._id}
                      className="hover:bg-gray-50 transition-colors duration-200"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {holiday.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(holiday.date)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                            title="Edit Holiday"
                            onClick={() => openEditModal(holiday)}
                          >
                            <FaEdit className="w-4 h-4" />
                          </button>
                          <button
                            className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                            title="Delete Holiday"
                            onClick={() => handleDeleteHoliday(holiday._id, holiday.name)}
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
          </div>
        </div>
      </div>

      {/* Add Holiday Modal */}
      <Modal isOpen={showAddModal} onClose={closeModals}>
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 transform transition-all mx-auto">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-50 rounded-t-2xl">
            <h3 className="text-xl font-semibold text-gray-900">
              Add New Holiday
            </h3>
            <p className="text-sm text-gray-600 mt-1">Create a new holiday record</p>
          </div>
          <form onSubmit={handleAddHoliday} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Holiday Name *
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleFormChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Date *
              </label>
              <input
                type="date"
                name="date"
                value={form.date}
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
                Add Holiday
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Edit Holiday Modal */}
      <Modal isOpen={showEditModal} onClose={closeModals}>
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 transform transition-all mx-auto">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-2xl">
            <h3 className="text-xl font-semibold text-gray-900">Edit Holiday</h3>
            <p className="text-sm text-gray-600 mt-1">Update holiday information</p>
          </div>
          <form onSubmit={handleEditHoliday} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Holiday Name *
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleFormChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Date *
              </label>
              <input
                type="date"
                name="date"
                value={form.date}
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
                Update Holiday
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default Holidays;