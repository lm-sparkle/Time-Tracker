import { Router } from "express";
import {
  sendStatusUpdate,
  getStatusMailInfo,
  getStatus
} from "../controllers/status.controller";
import { authenticateJWT } from "../middlewares/auth.middleware";

const router = Router();

router.post("/send-update",authenticateJWT, sendStatusUpdate);
router.get("/mail-info",authenticateJWT, getStatusMailInfo);
router.get("/all-status", authenticateJWT, getStatus);

export default router;