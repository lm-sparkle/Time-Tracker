import { Request, Response, NextFunction } from "express";
import Holiday from "../models/Holiday.model";

export const addHoliday = async (req: Request, res: Response, next: NextFunction): Promise<any | void> => {
  try {
    const { date, name } = req.body;
    if (!date || !name) {
      return res.status(400).json({ message: "date and name are required" });
    }

    const [year, month, day] = date.split("-").map(Number);
    const parsedDate = new Date(Date.UTC(year, month - 1, day));
    
    const holiday = await Holiday.findOneAndUpdate(
      { date: parsedDate },
      { date: parsedDate, name },
      { upsert: true, new: true }
    );

    res.status(200).json({ message: "Holiday saved", holiday });
  } catch (error) {
    next(error);
  }
};

export const getHolidays = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const holidays = await Holiday.find({});
    res.status(200).json(holidays);
  } catch (error) {
    next(error);
  }
};