import { Router } from "express";
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "../controllers/user.controller";
import { authenticateJWT } from "../middlewares/auth.middleware";

const router = Router();

// Protect routes with JWT if desired
router.get("/", authenticateJWT, getAllUsers);
router.get("/:id", authenticateJWT, getUserById);
router.put("/:id", authenticateJWT, updateUser);
router.delete("/:id", authenticateJWT, deleteUser);

export default router;
