import { Request, Response, NextFunction } from 'express'
import nodemailer from 'nodemailer'
import Time from '../models/Time.model'
import User from '../models/User.model'
import jwt from 'jsonwebtoken'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

const ADMIN_EMAIL = process.env.ADMIN_EMAIL

// POST /api/status/send-update
export const sendStatusUpdate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const currentDate = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })

    const {
      userName,
      userMail,
      message,
      inTime,
      outTime,
      totalBreakTime,
    } = req.body
    const subject = `Status Update By ${userName} - ${currentDate}`

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)

    const userEntries = await Time.find({
      userId: req.body.userId,
      inTime: { $gte: today, $lt: tomorrow },
    }).sort({ inTime: -1 })

    const userOutTime = userEntries[0].outTime
      ? new Date(userEntries[0].outTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      : 'N/A';


    let totalWorkingTimeInSeconds = 0
    userEntries.forEach((userEntry) => {
      if (userEntry.workingHours) {
        const [hours, minutes, seconds] = userEntry.workingHours
          .split(':')
          .map(Number)

        totalWorkingTimeInSeconds += hours * 3600 + minutes * 60 + seconds
      }
    })

    const totalHours = Math.floor(totalWorkingTimeInSeconds / 3600)
    const totalMinutes = Math.floor((totalWorkingTimeInSeconds % 3600) / 60)
    const totalSeconds = totalWorkingTimeInSeconds % 60

    const totalWorkingTime = `${String(totalHours).padStart(2, '0')}:${String(
      totalMinutes,
    ).padStart(2, '0')}:${String(totalSeconds).padStart(2, '0')}`

    const template = `
Hello Admin,
I wanted to share my status update as of today:

Status Message:

${message}

Time Summary:
- In Time: ${inTime}
- Out Time: ${userOutTime}
- Break Time: ${totalBreakTime}
- Working Time: ${totalWorkingTime}

Regards,
Sparkle Time Tracker
`.trim()

    // Send the email
    const mailOptions = {
      from: `"Time Tracker" <hg.sparkle015@gmail.com>`,
      to: ADMIN_EMAIL,
      cc: userMail,
      subject: subject,
      text: template,
    }

    await transporter.sendMail(mailOptions)
    // res.status(200).json({ success: true, message: "Status email sent" });
  } catch (error) {
    console.error(error)
    res
      .status(500)
      .json({ success: false, message: 'Error sending status update' })
  }
}

// GET /api/status/mail-info
export const getStatusMailInfo = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<any | void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1]

    if (!token) {
      return res.status(400).json({ error: 'Token is required' })
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined in environment variables')
    }
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET)
    const userMail = decoded.email

    const user = await User.findOne({ email: userMail })
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    const userName = user.fullName

    const currentDate = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })

    const subject = `Status Update By ${userName} - ${currentDate}`
    const adminEmail = process.env.ADMIN_EMAIL
    res.status(200).json({ adminEmail, subject })
  } catch (error) {
    next(error)
  }
}
