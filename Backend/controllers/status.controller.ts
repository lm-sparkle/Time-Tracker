import { Request, Response, NextFunction } from "express";
import nodemailer from "nodemailer";
import Time from "../models/Time.model";
import User from "../models/User.model";
import Status from "../models/Status.model";
import jwt from "jsonwebtoken";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

// POST /api/status/send-update
export const sendStatusUpdate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const currentDate = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const {
      userId,
      userName,
      userMail,
      message,
      inTime,
      // outTime,
      totalBreakTime,
    } = req.body;

    const subject = `Status Update By ${userName} - ${currentDate}`;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const userEntries = await Time.find({
      userId: req.body.userId,
      inTime: { $gte: today, $lt: tomorrow },
    });

    // Fetch the most recent entry for the user
    const userOutTime = userEntries.sort((a, b) => {
      const bTime = b.outTime ? new Date(b.outTime).getTime() : 0;
      const aTime = a.outTime ? new Date(a.outTime).getTime() : 0;
      return bTime - aTime;
    })[0]?.outTime;

    const formattedOutTime = userOutTime
      ? new Date(userOutTime).toLocaleTimeString([], {
          timeZone: "Asia/Kolkata",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      : "N/A";

    let totalWorkingTimeInSeconds = 0;
    userEntries.forEach((userEntry) => {
      if (userEntry.workingHours) {
        const [hours, minutes, seconds] = userEntry.workingHours
          .split(":")
          .map(Number);

        totalWorkingTimeInSeconds += hours * 3600 + minutes * 60 + seconds;
      }
    });

    const totalHours = Math.floor(totalWorkingTimeInSeconds / 3600);
    const totalMinutes = Math.floor((totalWorkingTimeInSeconds % 3600) / 60);
    const totalSeconds = totalWorkingTimeInSeconds % 60;

    const totalWorkingTime = `${String(totalHours).padStart(2, "0")}:${String(
      totalMinutes
    ).padStart(2, "0")}:${String(totalSeconds).padStart(2, "0")}`;

    const template = `
Hello Admin,
I wanted to share my status update as of today:

Status Message:

${message}

Time Summary:
- In Time: ${inTime}
- Out Time: ${formattedOutTime}
- Break Time: ${totalBreakTime}
- Working Time: ${totalWorkingTime}

Regards,
Sparkle Time Tracker
`.trim();

    await Status.create({
      userId: userId,
      workingHours: totalWorkingTime,
      statusReport: message,
      date: new Date(),
    });

    const mailOptions = {
      from: `"Time Tracker" <hg.sparkle015@gmail.com>`,
      to: ADMIN_EMAIL,
      cc: userMail,
      subject: subject,
      text: template,
    };

    await transporter.sendMail(mailOptions);

    // res
    //   .status(200)
    //   .json({ success: true, message: "Status email sent and status stored" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Error sending status update" });
  }
};

// GET /api/status/mail-info
export const getStatusMailInfo = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any | void> => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(400).json({ error: "Token is required" });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined in environment variables");
    }
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET);
    const userMail = decoded.email;

    const user = await User.findOne({ email: userMail });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const userName = user.fullName;

    const currentDate = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const subject = `Status Update By ${userName} - ${currentDate}`;
    const adminEmail = process.env.ADMIN_EMAIL;
    res.status(200).json({ adminEmail, subject });
  } catch (error) {
    next(error);
  }
};

export const getStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any | void> => {
  try {
    const { startDate, endDate, username } = req.query;

    const filter: any = {};

    // Filter by date
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        filter.date.$gte = new Date(startDate as string);
      }
      if (endDate) {
        filter.date.$lte = new Date(
          new Date(endDate as string).setHours(23, 59, 59, 999)
        );
      }
    }

    // Filter by username
    if (username) {
      const matchedUsers = await User.find({
        fullName: { $regex: username as string, $options: "i" },
      }).select("_id");

      const userIdsToFilter = matchedUsers.map((u) => u._id);

      if (userIdsToFilter.length === 0) {
        return res.status(200).json([]);
      }

      filter.userId = { $in: userIdsToFilter };
    }

    const statuses = await Status.find(filter).sort({ date: -1 });
    res.status(200).json(statuses);
  } catch (error) {
    next(error);
  }
};