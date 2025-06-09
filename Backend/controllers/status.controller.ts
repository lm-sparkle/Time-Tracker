import { Request, Response, NextFunction } from "express";
import nodemailer from "nodemailer";
import Time from "../models/Time.model";

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
      timeZone: "Asia/Kolkata",
    });

    const { userMail, message, inTime, outTime, totalBreakTime } = req.body;
    const subject = `Status Update on ${currentDate} from ${userMail}`;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const userEntries = await Time.find({
      userId: req.body.userId,
      inTime: { $gte: today, $lt: tomorrow },
    });

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

    const totalWorkingTime = `${String(totalHours).padStart(
      2,
      "0"
    )}:${String(totalMinutes).padStart(2, "0")}:${String(totalSeconds).padStart(
      2,
      "0"
    )}`;

    // Email Template
    const template = `
      Daily Status Update

      Hello Admin,
      
      ${message}

      Time Summary:
      - In Time: ${inTime}
      - Out Time: ${outTime}
      - Break Time: ${totalBreakTime}
      - Working Time: ${totalWorkingTime}

      Regards,
      Time Tracker
    `;

    // Send the email
    const mailOptions = {
      from: `"Time Tracker" <hg.sparkle015@gmail.com>`,
      to: ADMIN_EMAIL,
      cc: userMail,
      subject: subject,
      text: template,
    };

    await transporter.sendMail(mailOptions);
    // res.status(200).json({ success: true, message: "Status email sent" });
  } catch (error) {
    console.log(error);
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
) => {
  try {
    const currentDate = new Date().toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
    });
    const subject = `Status Update on ${currentDate}`;
    const adminEmail = process.env.ADMIN_EMAIL;
    res.status(200).json({ adminEmail, subject });
  } catch (error) {
    next(error);
  }
};
