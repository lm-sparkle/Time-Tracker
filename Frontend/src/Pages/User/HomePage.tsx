/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useRef, type FormEvent, useMemo } from "react";
import {
  FaUserClock,
  FaBusinessTime,
  FaSignInAlt,
  FaSignOutAlt,
  FaDoorOpen,
  FaClipboardCheck,
  FaTimes,
  FaTag,
  FaPaperPlane,
  FaClock,
  FaExclamationTriangle,
  FaHamburger,
  FaSpinner,
  FaCalendarCheck,
  FaCheckCircle,
  FaUserSlash,
  FaStopwatch,
} from "react-icons/fa";
import { useAuth } from "../../Auth/AuthContext";
import Modal from "../../Components/Modal";
import { Toast } from "../../Components/Toast";
import api from "../../utils/api";

type Status =
  | "not_clocked_in"
  | "clocked_in"
  | "clocked_out_for_break"
  | "clocked_out";

type AttendanceSummary = {
  fullDay: number;
  halfDay: number;
  absent: number;
};

const formatTime = (seconds: number): string => {
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

function timeStrToSeconds(timeStr: string) {
  if (!timeStr) return 0;
  const [h = "0", m = "0", s = "0"] = timeStr.split(":");
  return Number(h) * 3600 + Number(m) * 60 + Number(s);
}

const HomePage: React.FC = () => {
  const { user } = useAuth();
  // State
  const isSaturday = new Date().getDay() === 6;
  const [currentDate, setCurrentDate] = useState<string>("");
  const [status, setStatus] = useState<Status>("not_clocked_in");
  const [_inTime, setInTime] = useState<Date | null>(null);
  const [_outTime, setOutTime] = useState<Date | null>(null);
  const [totalSecondsToday, setTotalSecondsToday] = useState<number>(0);
  const [_currentEntryId, setCurrentEntryId] = useState<string | null>(null);
  const [userTimes, setUserTimes] = useState<any[]>([]);
  const [userLatestTime, setUserLatestTime] = useState<any>("");
  const [totalWorkingTime, setTotalWorkingTime] = useState<string>("");
  const [totalBreakTime, setTotalBreakTime] = useState<string>("");
  const [breakSeconds, setBreakSeconds] = useState(0);
  const [clockInCount, setClockInCount] = useState(0);
  const [clockOutCount, setClockOutCount] = useState(0);
  const [userInTime, setUserInTime] = useState<string>("");

  const breakTimerRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [currentBreakTime, setCurrentBreakTime] = useState<number>(0);

  //Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [_recipient, setRecipient] = useState<string>();
  const [subject, setSubject] = useState<string>();
  const [message, setMessage] = useState<string>();
  const modalRef = useRef<HTMLDivElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isClockInLoading, setIsClockInLoading] = useState(false);
  const [isClockOutLoading, setIsClockOutLoading] = useState(false);

  const [buttonsDisabled, setButtonsDisabled] = useState(true);

  const [loggedTimeAnim, setLoggedTimeAnim] = useState(false);
  const [breakTimeAnim, setBreakTimeAnim] = useState(false);
  const [trackerStatusAnim, setTrackerStatusAnim] = useState(false);

  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary>(
    {
      fullDay: 0,
      halfDay: 0,
      absent: 0,
    }
  );
  const [fetchedEntriesForAttendance, setFetchedEntriesForAttendance] =
    useState<any[]>([]);

  const [showLunchModal, setShowLunchModal] = useState(false);
  const [lunchReason, setLunchReason] = useState("");
  const [isLunchSubmitting, setIsLunchSubmitting] = useState(false);

  if (user) {
    sessionStorage.setItem("userId", user.id);
  }

  // UI helpers
  const getCurrentStatus = () => {
    switch (status) {
      case "not_clocked_in":
        return "Not Clocked In";
      case "clocked_in":
        return "Clocked In";
      case "clocked_out_for_break":
        return "On Break";
      case "clocked_out":
        return "Clocked Out";
      default:
        return "";
    }
  };

  useEffect(() => {
    setCurrentDate(
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    function updateBreakTime() {
      if (status === "clocked_out_for_break" && userLatestTime[0]?.outTime) {
        const outTimeDate = new Date(userLatestTime[0].outTime);
        setCurrentBreakTime(
          Math.floor((Date.now() - outTimeDate.getTime()) / 1000)
        );
      }
    }

    if (status === "clocked_out_for_break" && userLatestTime[0]?.outTime) {
      updateBreakTime();
      breakTimerRef.current = setInterval(updateBreakTime, 1000);
    } else {
      setCurrentBreakTime(0);
      if (breakTimerRef.current) clearInterval(breakTimerRef.current);
    }

    return () => {
      if (breakTimerRef.current) clearInterval(breakTimerRef.current);
    };
  }, [userLatestTime]);

  useEffect(() => {
    function updateTotalSeconds() {
      if (status === "clocked_in" && userLatestTime[0]?.inTime) {
        const inTimeDate = new Date(userLatestTime[0].inTime);
        setTotalSecondsToday(
          Math.floor((Date.now() - inTimeDate.getTime()) / 1000)
        );
      }
    }

    if (status === "clocked_in" && userLatestTime[0]?.inTime) {
      updateTotalSeconds();
      timerRef.current = setInterval(updateTotalSeconds, 1000);
    } else if (
      status === "clocked_out" &&
      userLatestTime[0]?.inTime &&
      userLatestTime[0]?.outTime
    ) {
      const inTimeDate = new Date(userLatestTime[0].inTime);
      const outTimeDate = new Date(userLatestTime[0].outTime);
      setTotalSecondsToday(
        Math.floor((outTimeDate.getTime() - inTimeDate.getTime()) / 1000)
      );
      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      setTotalSecondsToday(0);
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [userLatestTime]);

  //modal open
  const openModal = () => {
    setIsModalOpen(true);
    setShowConfirmModal(false);
    fetchMailInfo();
  };
  const closeModals = () => {
    setIsModalOpen(false);
    setShowConfirmModal(false);
  };

  const fetchMailInfo = async () => {
    const response = await api.get(
      `${import.meta.env.VITE_API_URL}status/mail-info`,
      {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
      }
    );
    setRecipient(response.data.adminEmail);
    setSubject(response.data.subject);
  };

  function isLunchTime() {
    const now = new Date();
    const start = new Date(now);
    start.setHours(13, 0, 0, 0); // 1:00 pm
    const end = new Date(now);
    end.setHours(14, 0, 0, 0); // 2:00 pm
    return now >= start && now < end;
  }

  const handleClockIn = async () => {
    const bypassId = import.meta.env.VITE_LUNCH_BYPASS_ID;
    if (isLunchTime() && user?.id !== bypassId) {
      setShowLunchModal(true);
      return;
    }
    await doClockIn();
  };

  const doClockIn = async (reason?: string) => {
    setIsClockInLoading(true);
    try {
      if (status === "not_clocked_in" || status === "clocked_out_for_break") {
        const res = await api.post(
          `${import.meta.env.VITE_API_URL}time/clock-in`,
          {
            userId: user?.id,
            lunchReason: reason || undefined,
          },
          {
            headers: {
              Authorization: `Bearer ${sessionStorage.getItem("token")}`,
            },
          }
        );
        setLoggedTimeAnim(true);
        setTrackerStatusAnim(true);
        setTimeout(() => setLoggedTimeAnim(false), 1000);
        setTimeout(() => setTrackerStatusAnim(false), 1000);
        setCurrentEntryId(res.data._id);
        sessionStorage.setItem("time_Id", res.data._id);
        setInTime(new Date(res.data.inTime));
        setStatus(res?.data?.status);
        fetchEntriesForMonth();
        fetchUserLatestTime();
        fetchUserTimes();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsClockInLoading(false);
    }
  };

  const handleClockOut = async () => {
    setIsClockOutLoading(true);
    try {
      if (status !== "clocked_in") return;
      const response = await api.put(
        `${import.meta.env.VITE_API_URL}time/clock-out/${sessionStorage.getItem(
          "time_Id"
        )}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );
      setBreakTimeAnim(true);
      setTrackerStatusAnim(true);
      setTimeout(() => setBreakTimeAnim(false), 1000);
      setTimeout(() => setTrackerStatusAnim(false), 1000);
      setOutTime(new Date(response?.data?.outTime));
      setStatus(response?.data?.status);
      fetchEntriesForMonth();
      fetchUserLatestTime();
      fetchUserTimes();
    } catch (err) {
      console.error(err);
    } finally {
      setIsClockOutLoading(false);
    }
  };

  const timeToSeconds = (timeStr: string) => {
    if (!timeStr) return 0;
    const [h, m, s] = timeStr.split(":").map(Number);
    return h * 3600 + m * 60 + s;
  };

  const handleFinalClockOut = async () => {
    let workedSeconds = 0;
    if (status === "clocked_in") {
      workedSeconds = timeToSeconds(totalWorkingTime) + totalSecondsToday;
    } else {
      workedSeconds = timeToSeconds(totalWorkingTime);
    }

    const minSeconds = isSaturday ? 14400 : 28800;

    if (workedSeconds >= minSeconds) {
      setIsModalOpen(true);
      fetchMailInfo();
    } else {
      setShowConfirmModal(true);
    }
  };

  const fetchUserTimes = async () => {
    const today = new Date().toISOString().split("T")[0];
    const userId = sessionStorage.getItem("userId");

    try {
      const response = await api.get(
        `${import.meta.env.VITE_API_URL}time/user/${userId}?date=${today}`,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );

      const data = response.data?.entries || [];
      const completedBreakSeconds = Number(response?.data?.breakSeconds) || 0;

      let breakSeconds = completedBreakSeconds;

      if (
        status === "clocked_out_for_break" &&
        data.length > 0 &&
        data[0].outTime
      ) {
        const outTime = new Date(data[0].outTime).getTime();
        const now = Date.now();
        const ongoingBreakSeconds = Math.floor((now - outTime) / 1000);
        breakSeconds += ongoingBreakSeconds;
      }

      setBreakSeconds(breakSeconds);
      setTotalBreakTime(response?.data?.formattedBreakTime);

      if (data.length > 0) {
        const latestEntry = data[0];
        const earliestEntry = data[data.length - 1];

        const userInTime = new Date(earliestEntry.inTime).toLocaleTimeString(
          [],
          {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }
        );

        const now = new Date();
        const outTime = new Date(latestEntry.outTime);

        const diffInMs = now.getTime() - outTime.getTime();
        const diffInSec = Math.floor(diffInMs / 1000);

        setCurrentBreakTime(diffInSec);

        setUserInTime(userInTime);
      }
      setUserTimes(data);
      setClockInCount(
        data.filter((entry: { clockInCount: number }) => entry.clockInCount)
          .length
      );
      setClockOutCount(
        data.filter((entry: { clockOutCount: number }) => entry.clockOutCount)
          .length
      );

      const timeToSeconds = (timeStr: {
        split: (arg0: string) => {
          (): any;
          new(): any;
          map: { (arg0: NumberConstructor): [any, any, any]; new(): any };
        };
      }) => {
        const [h, m, s] = timeStr.split(":").map(Number);
        return h * 3600 + m * 60 + s;
      };

      const totalSeconds = data.reduce(
        (sum: any, entry: { workingHours: any }) => {
          return (
            sum + (entry.workingHours ? timeToSeconds(entry.workingHours) : 0)
          );
        },
        0
      );

      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      const formattedTime = `${String(hours).padStart(2, "0")}:${String(
        minutes
      ).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
      setTotalWorkingTime(formattedTime);
    } catch (error: any) {
      const message = error.response?.data || error.message;
      if (
        error.response?.status === 403 &&
        message === "Access denied: Your IP is not allowed."
      ) {
        Toast.fire({
          icon: "error",
          title: message || "Access denied: Your IP is not allowed.",
        });
      } else if (error.response?.status >= 400) {
        Toast.fire({
          icon: "error",
          title: message || "Something went wrong",
        });
      }
    }
  };

  const fetchUserLatestTime = async () => {
    setButtonsDisabled(true); // Set buttons disabled while fetching
    try {
      const today = new Date().toISOString().split("T")[0];
      const response = await api.get(
        `${import.meta.env.VITE_API_URL
        }time/user/latest/${sessionStorage.getItem("userId")}?date=${today}`,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );
      setUserLatestTime(response.data);
      sessionStorage.setItem("time_Id", response.data?.[0]?._id);
      setStatus(response.data?.[0]?.status || "not_clocked_in");
      if (Array.isArray(response.data) && response.data.length > 0) {
        setButtonsDisabled(false); // Enable buttons if data is available
      } else if (response.data && typeof response.data === 'object') {
        setButtonsDisabled(false); // Enable buttons if data is available
      } else {
        setButtonsDisabled(true); // Disable buttons if no data
      }
    } catch (error: any) {
      setButtonsDisabled(true);
      const message = error.response?.data || error.message;
      if (
        error.response?.status === 403 &&
        message === "Access denied: Your IP is not allowed."
      ) {
        Toast.fire({
          icon: "error",
          title: message || "Access denied: Your IP is not allowed.",
        });
      } else if (error.response?.status >= 400) {
        Toast.fire({
          icon: "error",
          title: message || "Something went wrong",
        });
      }
    }
  };

  useEffect(() => {
    fetchUserTimes();
    fetchUserLatestTime();
  }, []);

  const fetchEntriesForMonth = async () => {
    try {
      const response = await api.get(
        `/time/all-entry-month/${sessionStorage.getItem("userId")}`,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );

      setFetchedEntriesForAttendance(response.data);
    } catch (error: any) {
      const message = error.response?.data || error.message;
      if (
        error.response?.status === 403 &&
        message === "Access denied: Your IP is not allowed."
      ) {
        Toast.fire({
          icon: "error",
          title: message || "Access denied: Your IP is not allowed.",
        });
      } else if (error.response?.status >= 400) {
        Toast.fire({
          icon: "error",
          title: message || "Something went wrong",
        });
      }
    }
  };

  useEffect(() => {
    fetchEntriesForMonth();
  }, []);

  const attendanceStatusMap = useMemo(() => {
    const map: Record<
      string,
      { attendanceStatus: string; workingHours: string; totalSeconds: number }
    > = {};

    fetchedEntriesForAttendance.forEach((entry) => {
      const key = `${entry.userId}_${entry.dateString}`;
      const seconds = timeStrToSeconds(entry.workingHours);

      if (!map[key]) {
        map[key] = {
          attendanceStatus: entry.attendanceStatus,
          workingHours: entry.workingHours,
          totalSeconds: seconds,
        };
      } else {
        map[key].totalSeconds += seconds;

        map[key].attendanceStatus = entry.attendanceStatus;
      }
    });

    return map;
  }, [fetchedEntriesForAttendance]);

  const calculateUserAttendance = useMemo<AttendanceSummary>(() => {
    let fullDay = 0;
    let halfDay = 0;
    let absent = 0;

    const today = new Date();
    const currentDate = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const pad = (num: number) => String(num).padStart(2, '0');

    const todayISO = `${currentYear}-${pad(currentMonth + 1)}-${pad(currentDate)}`;

    for (let day = 1; day <= currentDate; day++) {
      const date = new Date(currentYear, currentMonth, day);
      if (date.getDay() === 0) continue;

      const formattedDate = `${currentYear}-${pad(currentMonth + 1)}-${pad(day)}`;
      const key = `${user?.id}_${formattedDate}`;
      const attendanceData = attendanceStatusMap[key];
      const status = attendanceData?.attendanceStatus;
      const totalSeconds = attendanceData?.totalSeconds;
      const isToday = formattedDate === todayISO;
      const hasEntryToday = fetchedEntriesForAttendance.some(
        (entry) => entry.userId === user?.id && entry.dateString === todayISO
      );

      if (
        date.getDay() === 6 &&
        totalSeconds >= 14400
      ) {
        fullDay++;
        continue;
      }

      if (isToday) {
        if (status === "full_day") {
          fullDay++;
        } else if (status === "half_day") {
          halfDay++;
        } else if (status === "absent") {
          absent++;
        } else if (hasEntryToday) {
          fullDay++;
        } else {
          absent++;
        }
      } else {
        if (status === "full_day") {
          fullDay++;
        } else if (status === "half_day") {
          halfDay++;
        } else {
          absent++;
        }
      }
    }

    return { fullDay, halfDay, absent };
  }, [attendanceStatusMap, user?.id, userTimes]);

  useEffect(() => {
    setAttendanceSummary(calculateUserAttendance);
  }, [calculateUserAttendance]);

  const workedSeconds =
    status === "clocked_in"
      ? timeToSeconds(totalWorkingTime) + totalSecondsToday
      : timeToSeconds(totalWorkingTime);

  const dailyTargetSeconds = isSaturday ? 14400 : 28800;

  const progressPercent = Math.min(
    100,
    // Math.round((workedSeconds / dailyTargetSeconds) * 100)
    parseFloat(((workedSeconds / dailyTargetSeconds) * 100).toFixed(2))
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (!(status === "clocked_in" || status === "clocked_out_for_break"))
        return;
      const response = await api.put(
        `${import.meta.env.VITE_API_URL
        }time/final-clock-out/${sessionStorage.getItem("time_Id")}`,
        {
          userId: user?.id,
          userName: user?.fullName,
          userMail: user?.email,
          message: message,
          inTime: userInTime,
          // outTime: userOutTime,
          totalBreakTime: totalBreakTime,
        },
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );
      Toast.fire({
        icon: "success",
        title: "Status update submitted successfully",
      });
      sessionStorage.removeItem("time_Id");
      setStatus(response?.data?.status); // Should be "clocked_out"
      setInTime(null);
      setOutTime(null);
      if (timerRef.current) clearInterval(timerRef.current);
      closeModals();
      fetchEntriesForMonth();
      fetchUserLatestTime();
      fetchUserTimes();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  function getProgressGradient(percent: number) {
    if (percent < 33.34) {
      return "linear-gradient(to right, #ef4444, #f87171)";
    } else if (percent < 66.68) {
      return "linear-gradient(to right, #fbbf24, #f59e42)";
    } else {
      return "linear-gradient(to right, #22c55e, #14b8a6)";
    }
  }

  const handleLunchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLunchSubmitting(true);
    try {
      // Send email with reason
      await api.post(
        `${import.meta.env.VITE_API_URL}status/lunch-warning`,
        {
          userName: user?.fullName,
          userMail: user?.email,
          reason: lunchReason,
        },
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        }
      );
      // Proceed with clock in
      await doClockIn(lunchReason);
      setShowLunchModal(false);
      setLunchReason("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsLunchSubmitting(false);
    }
  };

  return (
    <div className="font-sans antialiased min-h-screen">
      {/* Main Content */}
      <div className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="w-full md:w-auto flex items-center gap-4">
                <div className="relative flex-shrink-0">
                  <img
                    className="h-16 w-16 md:h-16 md:w-16 h-12 w-12 sm:h-14 sm:w-14 rounded-full object-cover border-4 border-white shadow-lg transition-all duration-200 md:h-16 md:w-16"
                    src={`https://ui-avatars.com/api/?name=${user?.fullName}`}
                    alt="User profile"
                  />
                  {status === "clocked_in" ? (
                    <span className="absolute bottom-0 right-0 h-4 w-4 md:h-5 md:w-5 bg-green-500 rounded-full border-2 border-white shadow"></span>
                  ) : status === "clocked_out_for_break" ? (
                    <span className="absolute bottom-0 right-0 h-4 w-4 md:h-5 md:w-5 bg-amber-500 rounded-full border-2 border-white shadow"></span>
                  ) : status === "clocked_out" ? (
                    <span className="absolute bottom-0 right-0 h-4 w-4 md:h-5 md:w-5 bg-red-500 rounded-full border-2 border-white shadow"></span>
                  ) : null}
                </div>
                <div className="ml-2">
                  <h1 className="text-3xl font-bold text-gray-900">
                    Welcome back, {user?.fullName}
                  </h1>
                  <p className="px-1 mt-2 text-sm text-gray-600">
                    Today is {<span className="font-medium">{currentDate}</span>}
                  </p>
                </div>
              </div>

              <div className="w-full md:w-auto mt-4 md:mt-0 border border-indigo-200 rounded-lg">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center gap-2">
                      <div className="w-full">
                        <dt className="text-sm font-medium text-gray-500 truncate text-center md:text-left flex items-center justify-center md:justify-start">
                          <FaCalendarCheck className="mr-2 text-blue-600 text-lg" />My Monthly Attendance
                        </dt>
                        <dd className="mt-2 flex flex-col md:flex-row gap-2 md:gap-4 items-center justify-center md:justify-start">
                          <div className="flex items-center text-green-600">
                            <FaCheckCircle className="mr-2" />
                            Full Day: {attendanceSummary.fullDay}
                          </div>
                          <div className="flex items-center text-amber-500">
                            <FaCheckCircle className="mr-2" />
                            Half Day: {attendanceSummary.halfDay}
                          </div>
                          <div className="flex items-center text-red-600">
                            <FaUserSlash className="mr-2" />
                            Absent: {attendanceSummary.absent}
                          </div>
                        </dd>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Time Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Current Status */}
            <div
              className={`pt-2 border border-indigo-200 bg-white overflow-hidden shadow rounded-lg transition 
    ${trackerStatusAnim ? " animated-ring-status" : ""}`}
            >
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
                    <FaUserClock className="text-indigo-600 text-xl" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Tracker Status
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {getCurrentStatus()}
                      </div>
                    </dd>
                  </div>
                </div>
                <div className="mt-3 flex items-center text-sm text-gray-500 px-1">
                  <FaClock className="mr-2" />
                  <span>Since {userLatestTime[0]?.inTime
                    ? new Date(
                      userLatestTime[0]?.inTime
                    ).toLocaleTimeString('en-US', {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })
                    : "--:--:--"}</span>
                </div>
              </div>
            </div>
            {/* Total Hours Today */}
            <div
              className={`border border-green-200 bg-white overflow-hidden shadow rounded-lg transition 
    ${loggedTimeAnim ? " animated-ring-in" : ""}`}
            >
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                    <FaBusinessTime className="text-green-600 text-xl" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Logged Time
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {status === "clocked_in"
                          ? formatTime(
                            (totalWorkingTime
                              ? totalWorkingTime
                                .split(":")
                                .reduce((acc, time) => 60 * acc + +time, 0)
                              : 0) + totalSecondsToday
                          )
                          : totalWorkingTime || "00:00:00"}
                      </div>
                    </dd>
                  </div>

                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
                    <span>Daily Target: {isSaturday ? "4" : "8"}h</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div className="bg-gradient-to-r from-green-400 to-teal-500 h-1.5 rounded-full" style={{ width: `${progressPercent}%`, background: getProgressGradient(progressPercent), }}></div>
                  </div>
                </div>
              </div>
            </div>
            {/* Total Break Today */}
            <div
              className={`pt-2 border border-amber-200 bg-white overflow-hidden shadow rounded-lg transition 
    ${breakTimeAnim ? " animated-ring-out" : ""}`}
            >
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                    <FaHamburger className="text-yellow-600 text-xl" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Break Time
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {status === "clocked_out_for_break"
                          ? formatTime(currentBreakTime + breakSeconds)
                          : totalBreakTime}
                      </div>
                    </dd>
                  </div>
                </div>
                <div className="mt-3 flex items-center text-sm text-gray-500 px-1">
                  <FaStopwatch className="mr-2" />
                  <span>Since {userLatestTime[0]?.outTime
                    ? new Date(
                      userLatestTime[0]?.outTime
                    ).toLocaleTimeString('en-US', {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })
                    : "--:--:--"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Time Tracking Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* In Time */}
            <button
              onClick={handleClockIn}
              disabled={buttonsDisabled ||
                isClockInLoading ||
                !(
                  status === "not_clocked_in" ||
                  status === "clocked_out_for_break"
                )
              }
              className={`time-card bg-gradient-to-br from-green-50 to-green-100 border border-green-200 overflow-hidden shadow rounded-lg text-left ${buttonsDisabled || isClockInLoading ||
                !(status === "not_clocked_in" || status === "clocked_out_for_break")
                ? "opacity-50 cursor-not-allowed"
                : "cursor-pointer hover:shadow-lg transition-shadow"
                }`}
            >
              <div className="px-4 py-5 sm:p-6 text-center h-full">
                {buttonsDisabled || isClockInLoading ? (
                  <FaSpinner className="animate-spin text-2xl text-green-600 mx-auto" />
                ) : (
                  <>
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-200">
                      <FaSignInAlt className="text-green-600 text-xl" />
                    </div>
                    <h3 className="mt-3 text-lg font-medium text-gray-900 space-x-2 gap-2 flex items-center justify-center">
                      Clock In
                      <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-green-600/20 ring-inset">
                        <FaTimes className="mr-1" />
                        <span className="text-base">
                          {clockInCount > 0 ? clockInCount : "0"}
                        </span>
                      </span>
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Start your workday
                    </p>
                    <div className="mt-4 text-2xl font-semibold text-gray-900">
                      {userLatestTime[0]?.inTime
                        ? new Date(
                          userLatestTime[0]?.inTime
                        ).toLocaleTimeString('en-US', {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })
                        : "--:--:--"}
                    </div>
                  </>
                )}
              </div>
            </button>

            {/* Out Time */}
            <button
              onClick={handleClockOut}
              disabled={buttonsDisabled || status !== "clocked_in" || isClockOutLoading}
              className={`time-card bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 overflow-hidden shadow rounded-lg text-left ${buttonsDisabled || isClockOutLoading || status !== "clocked_in"
                ? "opacity-50 cursor-not-allowed"
                : "cursor-pointer hover:shadow-lg transition-shadow"
                }`}
            >
              <div className="px-4 py-5 sm:p-6 text-center h-full">
                {buttonsDisabled || isClockOutLoading ? (
                  <FaSpinner className="animate-spin text-2xl text-amber-600 mx-auto" />
                ) : (
                  <>
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-amber-200">
                      <FaSignOutAlt className="text-amber-600 text-xl" />
                    </div>
                    <h3 className="mt-3 text-lg font-medium text-gray-900 space-x-2 gap-2 flex items-center justify-center">
                      Clock Out
                      <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800 ring-1 ring-amber-600/20 ring-inset">
                        <FaTimes className="mr-1" />
                        <span className="text-base">
                          {clockOutCount > 0 ? clockOutCount : "0"}
                        </span>
                      </span>
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">Take a break</p>
                    <div className="mt-4 text-2xl font-semibold text-gray-900">
                      {userLatestTime[0]?.outTime
                        ? new Date(
                          userLatestTime[0]?.outTime
                        ).toLocaleTimeString('en-US', {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })
                        : "--:--:--"}
                    </div>
                  </>
                )}
              </div>
            </button>

            {/* Final Out Time */}
            <button
              onClick={handleFinalClockOut}
              disabled={buttonsDisabled ||
                !(status === "clocked_in" || status === "clocked_out_for_break")
              }
              className={`time-card bg-gradient-to-br from-red-50 to-red-100 border border-red-200 overflow-hidden shadow rounded-lg text-left ${buttonsDisabled || !(status === "clocked_in" || status === "clocked_out_for_break")
                ? "opacity-50 cursor-not-allowed"
                : "cursor-pointer hover:shadow-lg transition-shadow"
                }`}
            >
              <div className="px-4 py-5 sm:p-6 text-center">
                {buttonsDisabled ? (
                  <FaSpinner className="animate-spin text-2xl text-red-600 mx-auto" />
                ) : (<>
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-200">
                    <FaDoorOpen className="text-red-600 text-xl" />
                  </div>
                  <h3 className="mt-3 text-lg font-medium text-gray-900">
                    Final Clock Out
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">End your workday</p>
                  <div className="mt-4 text-2xl font-semibold text-gray-900">
                    {userLatestTime[0]?.status === "clocked_out" ? (
                      <>
                        {userLatestTime[0]?.outTime
                          ? new Date(
                            userLatestTime[0]?.outTime
                          ).toLocaleTimeString('en-US', {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })
                          : "--:--:--"}
                      </>
                    ) : (
                      "--:--:--"
                    )}
                  </div>
                </>)}
              </div>
            </button>
          </div>

          {/* Today's Timeline */}
          <div className="bg-white shadow rounded-xl overflow-hidden border border-gray-200">
            <div className="px-6 py-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-indigo-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">
                    Today's Activity Timeline
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Your work sessions and breaks
                  </p>
                </div>
                <div className="bg-white px-3 py-1 rounded-full text-sm font-medium text-indigo-600 border border-indigo-100">
                  {userTimes.length} records
                </div>
              </div>
            </div>
            <div className="p-4">
              <div className="relative">
                <ul className="space-y-4">
                  {userTimes.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-gray-100 mb-3">
                        <FaClock className="text-gray-400 text-xl" />
                      </div>
                      <h4 className="text-gray-500 font-medium">
                        No activities today
                      </h4>
                      <p className="text-sm text-gray-400 mt-1">
                        Your timeline will appear here once you clock in
                      </p>
                    </div>
                  ) : (
                    userTimes.map((event, idx) => (
                      <li className="relative" key={idx}>
                        <div className="bg-gray-100 p-4 rounded-xl">
                          <div className="grid grid-cols-3 gap-4">
                            <div className="flex items-center space-x-2">
                              <FaSignInAlt className="text-green-500" />
                              <div>
                                <p className="text-xs text-gray-500">
                                  Clock In
                                </p>
                                <p className="font-medium">
                                  {event.inTime
                                    ? new Date(event.inTime).toLocaleTimeString('en-US', {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      second: "2-digit",
                                    }
                                    )
                                    : "--:--:--"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <FaSignOutAlt className="text-yellow-500" />
                              <div>
                                <p className="text-xs text-gray-500">
                                  Clock Out
                                </p>
                                <p className="font-medium">
                                  {event.outTime
                                    ? new Date(
                                      event.outTime
                                    ).toLocaleTimeString('en-US', {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      second: "2-digit",
                                    })
                                    : "--:--:--"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <FaClock className="text-blue-500" />
                              <div>
                                <p className="text-xs text-gray-500">
                                  Duration
                                </p>
                                <p className="font-medium">
                                  {event.outTime
                                    ? event.workingHours
                                    : "--:--:--"}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Modal for Final Clock Out */}
      <Modal isOpen={isModalOpen}>
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <div
            ref={modalRef}
            className="modal-animate bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-[modalFadeIn_0.3s_ease-out_forwards]"
            style={{
              animation: "modalFadeIn 0.3s ease-out",
            }}
          >
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <FaClipboardCheck className="mr-3" /> Daily Status Update
              </h2>
              <button
                onClick={closeModals}
                className="text-white hover:text-gray-200 text-2xl focus:outline-none transition duration-200"
              >
                <FaTimes />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Subject
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaTag className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="subject"
                      value={subject}
                      required
                      onChange={(e) => setSubject(e.target.value)}
                      className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 border disabled:opacity-50"
                      disabled
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Status Update
                  </label>
                  <textarea
                    id="message"
                    rows={8}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-3 resize-none custom-scroll"
                    placeholder="Enter your status update here..."
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <FaPaperPlane className="mr-2" /> Send Update
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
            <style>{`
          @keyframes modalFadeIn {
            from { opacity: 0; transform: translateY(-20px);}
            to { opacity: 1; transform: translateY(0);}
          }
          .custom-scroll::-webkit-scrollbar {
            width: 8px;
          }
          .custom-scroll::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 4px;
          }
          .custom-scroll::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 4px;
          }
          .custom-scroll::-webkit-scrollbar-thumb:hover {
            background: #555;
          }
        `}</style>
          </div>
        </div>
      </Modal>

      {/*confirmation modal*/}
      <Modal isOpen={showConfirmModal} onClose={closeModals}>
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="modal-overlay fixed inset-0 bg-opacity-50 backdrop-blur-sm transition-opacity duration-300"></div>

          <div className="modal-content relative bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-xl transform transition-all duration-300">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center">
                <div className="mr-4">
                  <FaExclamationTriangle
                    className="text-yellow-600"
                    style={{ fontSize: "2rem" }}
                  />
                </div>
                <h3 className="text-xl font-semibold text-gray-800">
                  Incomplete Workday
                </h3>
              </div>
            </div>

            <p className="text-gray-700 mb-6">
              You have worked less than {isSaturday ? "4" : "8"} hours today.
              <br />
              Are you sure you want to submit your status report?
            </p>

            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={closeModals}
                className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-300 sm:w-auto w-full"
              >
                Cancel
              </button>
              <button
                onClick={openModal}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors duration-300 sm:w-auto w-full"
              >
                Submit Anyway
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Lunch Time Warning Modal */}
      <Modal isOpen={showLunchModal} onClose={() => setShowLunchModal(false)}>
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="modal-overlay fixed inset-0 bg-opacity-50 backdrop-blur-sm transition-opacity duration-300"></div>
          <div className="modal-content relative bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-xl transform transition-all duration-300">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center">
                <div className="mr-4">
                  <FaExclamationTriangle className="text-yellow-600" style={{ fontSize: "2rem" }} />
                </div>
                <h3 className="text-xl font-semibold text-gray-800">
                  <span className="text-yellow-700">Warning: Lunch Time</span>
                </h3>
              </div>
            </div>
            <p className="text-red-700 mb-4">
              <span className="font-semibold">It is currently lunch time.</span> Starting the tracker early is not recommended.<br />
              Please confirm if you have a valid reason before proceeding.
            </p>
            <form onSubmit={handleLunchSubmit} className="space-y-4">
              <textarea
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-3 resize-none custom-scroll lunch-modal-textarea"
                placeholder="Enter your reason for starting during lunch..."
                rows={4}
                required
                value={lunchReason}
                onChange={e => setLunchReason(e.target.value)}
                disabled={isLunchSubmitting}
              />
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowLunchModal(false); setLunchReason(""); }}
                  className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-300 sm:w-auto w-full"
                  disabled={isLunchSubmitting}
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors duration-300 sm:w-auto w-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLunchSubmitting || !lunchReason.trim()}
                >
                  {isLunchSubmitting ? (
                    <><FaSpinner className="animate-spin mr-2" />Submitting...</>
                  ) : (
                    <>Submit & Start Tracker</>
                  )}
                </button>
              </div>
            </form>
            <style>{`
              .lunch-modal-textarea::placeholder {
                color: #b0b7c3;
                opacity: 1;
                font-weight: 400;
              }
            `}</style>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default HomePage;
