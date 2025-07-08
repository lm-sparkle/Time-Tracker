import { Request, Response, NextFunction } from "express";
import Time, { AttendanceStatus } from "../models/Time.model";
import User from "../models/User.model";
import { sendStatusUpdate } from "./status.controller";
import os from "os";

// Helper function
function convertTimeToSeconds(time: string): number {
  const [hours, minutes, seconds] = time.split(":").map(Number);
  return hours * 3600 + minutes * 60 + seconds;
}

// POST /api/time/clock-in
export const clockIn = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any | void> => {
  try {
    const { userId } = req.body;
    if (!userId)
      return res.status(400).json({ message: "userId is required." });

    const userExists = await User.exists({ _id: userId });
    if (!userExists) {
      return res.status(404).json({ message: "User does not exist." });
    }

    const clockInCount = 0;

    // Create a new time entry
    const entry = await Time.create({
      userId,
      status: "clocked_in",
      inTime: new Date(),
      clockInCount: clockInCount + 1,
      clockOutCount: 0,
      outTime: null,
      workingHours: null,
      computerName: os.hostname(),
    });

    res.status(201).json(entry);
  } catch (error) {
    next(error);
  }
};

// PUT /api/time/clock-out/:id
export const clockOut = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any | void> => {
  try {
    const { id } = req.params;

    const entry = await Time.findById(id);
    if (!entry) return res.status(404).json({ message: "Entry not found." });

    const outTime = new Date();

    const totalWorkedMs = outTime.getTime() - entry.inTime.getTime();

    const totalSeconds = Math.floor(totalWorkedMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const formattedTime = `${String(hours).padStart(2, "0")}:${String(
      minutes
    ).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

    entry.status = "clocked_out_for_break";
    entry.outTime = outTime;
    entry.clockOutCount += 1;
    entry.workingHours = formattedTime;

    await entry.save();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const entries = await Time.find({
      userId: entry.userId,
      inTime: {
        $gte: today,
        $lt: tomorrow,
      },
    }).sort({ inTime: -1 });

    // Accumulate total working hours
    const totalWorkedSeconds = entries.reduce((acc, currEntry) => {
      const entrySeconds = currEntry.workingHours
        ? convertTimeToSeconds(currEntry.workingHours)
        : 0;
      return acc + entrySeconds;
    }, 0);

    // Determine Attendance Status based on total working hours
    let attendanceStatus: AttendanceStatus;
    if (totalWorkedSeconds >= 8 * 3600) {
      attendanceStatus = "full_day";
    } else if (totalWorkedSeconds >= 4 * 3600) {
      attendanceStatus = "half_day";
    } else {
      attendanceStatus = "absent";
    }

    // Update the entry's attendance status
    entry.attendanceStatus = attendanceStatus;

    await entry.save();

    res.status(200).json(entry);
  } catch (error) {
    next(error);
  }
};

// PUT /api/time/final-clock-out/:id
export const finalClockOut = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any | void> => {
  try {
    const { id } = req.params;

    // Find the entry by id
    const entry = await Time.findById(id);
    if (!entry) return res.status(404).json({ message: "Entry not found." });
    if (entry.status !== "clocked_out_for_break" && entry.outTime)
      return res.status(400).json({ message: "Entry already clocked out." });

    const outTime = new Date();
    const totalWorkedMs = outTime.getTime() - entry.inTime.getTime();
    const totalSeconds = Math.floor(totalWorkedMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const formattedTime = `${String(hours).padStart(2, "0")}:${String(
      minutes
    ).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

    entry.outTime = outTime;
    entry.workingHours = formattedTime;
    entry.status = "clocked_out";

    await entry.save();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const entries = await Time.find({
      userId: entry.userId,
      inTime: {
        $gte: today,
        $lt: tomorrow,
      },
    }).sort({ inTime: -1 });

    // Accumulate total working hours
    const totalWorkedSeconds = entries.reduce((acc, currEntry) => {
      const entrySeconds = currEntry.workingHours
        ? convertTimeToSeconds(currEntry.workingHours)
        : 0;
      return acc + entrySeconds;
    }, 0);

    // Determine Attendance Status based on total working hours
    let attendanceStatus: AttendanceStatus;
    if (totalWorkedSeconds >= 8 * 3600) {
      attendanceStatus = "full_day";
    } else if (totalWorkedSeconds >= 4 * 3600) {
      attendanceStatus = "half_day";
    } else {
      attendanceStatus = "absent";
    }

    // Update the entry's attendance status
    entry.attendanceStatus = attendanceStatus;

    await entry.save();

    // Send status update email
    await sendStatusUpdate(req, res, next);
    res.status(200).json(entry);
  } catch (error) {
    next(error);
  }
};

// GET /api/time/userTimes
export const getTimeEntries = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const entries = await Time.find({
      inTime: {
        $gte: today,
        $lt: tomorrow,
      },
    }).sort({ inTime: -1 });
    res.status(200).json(entries);
  } catch (error) {
    next(error);
  }
};

// GET /api/time/user/:userId
export const getUserTimeEntries = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const entries = await Time.find({
      userId: req.params.userId,
      inTime: {
        $gte: today,
        $lt: tomorrow,
      },
    }).sort({ inTime: -1 });

    let totalBreakSeconds = 0;
    for (let i = entries.length - 1; i > 0; i--) {
      const prevOut = entries[i].outTime;
      const nextIn = entries[i - 1].inTime;
      if (prevOut && nextIn) {
        const out = new Date(prevOut).getTime();
        const next = new Date(nextIn).getTime();
        const breakDuration = next - out;
        if (breakDuration > 0) {
          totalBreakSeconds += Math.floor(breakDuration / 1000);
        }
      }
    }

    const totalBreakWithOngoing = totalBreakSeconds;

    const breakHours = Math.floor(totalBreakWithOngoing / 3600);
    const breakMinutes = Math.floor((totalBreakWithOngoing % 3600) / 60);
    const breakSeconds = totalBreakWithOngoing % 60;
    const formattedBreakTime = `${String(breakHours).padStart(2, "0")}:${String(
      breakMinutes
    ).padStart(2, "0")}:${String(breakSeconds).padStart(2, "0")}`;

    res.status(200).json({
      entries,
      breakSeconds: totalBreakWithOngoing,
      formattedBreakTime,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/time/user/latest/:userId
export const getUserLatestEntry = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const entry = await Time.find({
      userId: req.params.userId,
      inTime: { $gte: today, $lt: tomorrow },
    })
      .sort({ inTime: -1 })
      .limit(1);

    res.status(200).json(entry);
  } catch (error) {
    next(error);
  }
};

// GET /api/time/first-entry-month
export const getAllEntriesForDateRange = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { startDate, endDate } = req.query;

    const now = new Date();

    const start = startDate
      ? new Date(startDate as string)
      : new Date(now.getFullYear(), now.getMonth(), 1);

    const end = endDate
      ? new Date(new Date(endDate as string).setHours(23, 59, 59, 999))
      : new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          23,
          59,
          59,
          999
        );

    const entries = await Time.aggregate([
      {
        $match: {
          inTime: {
            $gte: start,
            $lte: end,
          },
        },
      },
      {
        $project: {
          userId: 1,
          inTime: 1,
          outTime: 1,
          status: 1,
          workingHours: 1,
          attendanceStatus: 1,
          dateString: {
            $dateToString: { format: "%Y-%m-%d", date: "$inTime" },
          },
        },
      },
      {
        $sort: { userId: 1, inTime: 1 },
      },
    ]);

    res.status(200).json(entries);
  } catch (error) {
    next(error);
  }
};

// GET /api/time/all-entry-month/:userId
export const getAllEntriesForMonthForUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) : Promise<any | void> => {
  try {
    const { userId } = req.params; 

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const entries = await Time.aggregate([
      {
        $match: { userId: userId }, // filter by userId
      },
      {
        $project: {
          userId: 1,
          inTime: 1,
          outTime: 1,
          status: 1,
          workingHours: 1,
          attendanceStatus: 1,
          dateString: {
            $dateToString: { format: "%Y-%m-%d", date: "$inTime" },
          },
        },
      },
      {
        $sort: { inTime: 1 },
      },
    ]);

    res.status(200).json(entries);
  } catch (error) {
    next(error);
  }
};

// PUT /api/time/update/attendance-status/:id
export const updateAttendanceStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any | void> => {
  try {
    const { id } = req.params;
    const { attendanceStatus } = req.body;

    if (!attendanceStatus) {
      return res.status(400).json({ message: "attendanceStatus is required." });
    }

    const validStatuses: AttendanceStatus[] = ["absent", "half_day", "full_day"];
    if (!validStatuses.includes(attendanceStatus)) {
      return res.status(400).json({ message: "Invalid attendance status." });
    }

    const entry = await Time.findById(id);
    if (!entry) return res.status(404).json({ message: "Entry not found." });

    // Check if the entry is already clocked out then you can update the attendance status
    if (entry.status !== "clocked_out" && entry.outTime) {
      return res.status(400).json({
        message: "Entry must be clocked out to update attendance status.",
      });
    }

    entry.attendanceStatus = attendanceStatus;
    await entry.save();

    res.status(200).json(entry);
  } catch (error) {
    next(error);
  }
}