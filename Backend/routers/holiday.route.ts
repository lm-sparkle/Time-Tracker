import express from "express";
import { addHoliday, deleteHoliday, getHolidays, updateHoliday } from "../controllers/holiday.controller";

const router = express.Router();

router.post("/add-holiday", addHoliday);
router.get("/holidays", getHolidays);
router.put("/edit-holiday/:id", updateHoliday); 
router.delete("/delete-holiday/:id", deleteHoliday);

export default router;
