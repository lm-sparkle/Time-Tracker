import mongoose, { Schema, Document } from "mongoose";

export interface IHoliday extends Document {
  date: Date; 
  name: string;
}

const HolidaySchema = new Schema<IHoliday>({
  date: { type: Date, required: true, unique: true },
  name: { type: String, required: true },
});

export default mongoose.model<IHoliday>("Holiday", HolidaySchema);
