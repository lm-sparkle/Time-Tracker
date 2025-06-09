import { Schema, model, Document } from 'mongoose';

export interface IAdmin extends Document {
  fullName: string;
  email: string;
  password: string;
}

const AdminSchema = new Schema<IAdmin>({
  fullName: { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

export default model<IAdmin>('Admin', AdminSchema);
