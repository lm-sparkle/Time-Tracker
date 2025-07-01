import { Router } from "express";
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  activateUser,
  getUsers,
} from "../controllers/user.controller";

const router = Router();

router.get("/", getAllUsers);
router.get("/all", getUsers); // Alias for getAllUsers
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.put("/status/:id", activateUser);
router.delete("/:id", deleteUser);

export default router;
