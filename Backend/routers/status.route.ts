import { Router } from "express";
import {
  sendStatusUpdate,
  getStatusMailInfo,
} from "../controllers/status.controller";
import { authenticateJWT } from "../middlewares/auth.middleware";

const router = Router();

router.post("/send-update",authenticateJWT, sendStatusUpdate);
router.get("/mail-info",authenticateJWT, getStatusMailInfo);

export default router;
