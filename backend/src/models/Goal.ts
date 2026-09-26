import mongoose, { Document, Schema } from 'mongoose';

export interface IGoalLog {
  date: Date;
  minutes: number;
  note?: string;
}

export interface IGoal extends Document {
  studentId: mongoose.Types.ObjectId;
  title: string;
  subject: string;
  module?: string;
  targetDate?: Date;
  targetHours: number;
  status: 'active' | 'completed';
  logs: IGoalLog[];
}

const goalSchema = new Schema<IGoal>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    module: { type: String, trim: true },
    targetDate: { type: Date },
    targetHours: { type: Number, default: 10, min: 1 },
    status: { type: String, enum: ['active', 'completed'], default: 'active' },
    logs: [
      {
        date: { type: Date, default: Date.now },
        minutes: { type: Number, required: true, min: 1 },
        note: { type: String },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model<IGoal>('Goal', goalSchema);
