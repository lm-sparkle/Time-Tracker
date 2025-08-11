import express from "express";
import { addHoliday, getHolidays } from "../controllers/holiday.controller";

const router = express.Router();

router.post("/add-holiday", addHoliday);
router.get("/holidays", getHolidays);

export default router;
