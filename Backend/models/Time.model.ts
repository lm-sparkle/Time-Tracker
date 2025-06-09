import { Schema, model, Document } from "mongoose";

export type Status = "not_clocked_in" | "clocked_in" | "clocked_out" | "clocked_out_for_break";

export interface ITime extends Document {
  userId: string;
  status: Status;
  inTime: Date;
  clockInCount: number;
  outTime: Date | null;
  clockOutCount: number;
  workingHours: string | null;
}

const timeSchema = new Schema<ITime>({
  userId: { type: String, required: true },
  status: { type: String, required: true, default: "not_clocked_in" },
  inTime: { type: Date, required: true },
  clockInCount: { type: Number, default: 0 },
  outTime: { type: Date, default: null },
  clockOutCount: { type: Number, default: 0 },
  workingHours: { type: String, default: null },
}, { timestamps: true });

export default model<ITime>("Time", timeSchema);
