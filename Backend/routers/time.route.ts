import { Router } from "express";
import {
  clockIn,
  clockOut,
  finalClockOut,
  getTimeEntries,
  getUserLatestEntry,
  getUserTimeEntries,
  getAllEntriesForDateRange,
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
router.get("/all-entry-month",authenticateJWT, getAllEntriesForDateRange);
router.put("/update/attendance-status/:id",authenticateJWT, updateAttendanceStatus);


export default router;