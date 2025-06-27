import { Router } from "express";
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  activateUser,
  getUsers,
} from "../controllers/user.controller";
import { authenticateJWT } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", authenticateJWT, getAllUsers);
router.get("/all", authenticateJWT, getUsers); // Alias for getAllUsers
router.get("/:id", authenticateJWT, getUserById);
router.put("/:id", authenticateJWT, updateUser);
router.put("/status/:id", authenticateJWT, activateUser);
router.delete("/:id", authenticateJWT, deleteUser);

export default router;
