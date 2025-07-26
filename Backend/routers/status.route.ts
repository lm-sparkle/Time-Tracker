import { Router } from "express";
import {
  sendStatusUpdate,
  getStatusMailInfo,
  getStatus,
  sendLunchWarning
} from "../controllers/status.controller";

const router = Router();

router.post("/send-update", sendStatusUpdate);
router.get("/mail-info", getStatusMailInfo);
router.get("/all-status",  getStatus);
router.post("/lunch-warning", sendLunchWarning);

export default router;