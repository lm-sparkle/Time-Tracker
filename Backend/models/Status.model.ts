import { Schema, model, Document } from "mongoose";

export interface IStatus extends Document {
    userId: string;
    workingHours: string;
    statusReport: string;
    date: Date;
}

const StatusSchema = new Schema<IStatus>({
    userId: { type: String, required: true },
    workingHours: { type: String, required: true },
    statusReport: { type: String, required: true },
    date: { type: Date, required: true },
});

export default model<IStatus>("Status", StatusSchema);