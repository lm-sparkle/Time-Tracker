import { Router } from "express";
import {
  sendStatusUpdate,
  getStatusMailInfo,
  getStatus
} from "../controllers/status.controller";

const router = Router();

router.post("/send-update", sendStatusUpdate);
router.get("/mail-info", getStatusMailInfo);
router.get("/all-status",  getStatus);

export default router;