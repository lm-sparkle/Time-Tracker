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

const router = Router();

router.post("/clock-in", clockIn);
router.put("/clock-out/:id", clockOut);
router.put("/final-clock-out/:id", finalClockOut);
router.get("/userTime", getTimeEntries);
router.get("/user/:userId", getUserTimeEntries);
router.get("/user/latest/:userId", getUserLatestEntry);
router.get("/all-entry-month", getAllEntriesForDateRange);
router.put("/update/attendance-status/:id", updateAttendanceStatus);


export default router;