import { Request, Response, NextFunction } from "express";
import Time from "../models/Time.model";
import User from "../models/User.model";
import { sendStatusUpdate } from "./status.controller";

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
