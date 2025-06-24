import { Router } from "express";
import {
  clockIn,
  clockOut,
  finalClockOut,
  getTimeEntries,
  getUserLatestEntry,
  getUserTimeEntries,
  getFirstEntryEachDayForDateRange,
  getAggregatedWorkingHoursPerDay,
  updateAttendanceStatus
} from "../controllers/time.controller";
import { authenticateJWT } from "../middlewares/auth.middleware";

const router = Router();

router.post("/clock-in",authenticateJWT, clockIn);
router.put("/clock-out/:id",authenticateJWT, clockOut);
router.put("/final-clock-out/:id",authenticateJWT, finalClockOut);
router.get("/userTime",authenticateJWT, getTimeEntries);
router.get("/user/:userId",authenticateJWT, getUserTimeEntries);
router.get("/user/latest/:userId",authenticateJWT, getUserLatestEntry);
router.get("/first-entry-month",authenticateJWT, getFirstEntryEachDayForDateRange);
router.get("/aggregated-working-hours",authenticateJWT, getAggregatedWorkingHoursPerDay);
router.put("/update/attendance-status/:id",authenticateJWT, updateAttendanceStatus);


export default router;