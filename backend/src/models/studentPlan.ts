import mongoose, { Document, Schema, Types } from 'mongoose';

export type PlanCode = 'free' | 'plus' | 'pro';

export interface IStudentPlan extends Document {
  studentId: Types.ObjectId;
  code: PlanCode;
  createdAt: Date;
  updatedAt: Date;
}

const studentPlanSchema = new Schema<IStudentPlan>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    code: { type: String, enum: ['free', 'plus', 'pro'], required: true },
  },
  { timestamps: true },
);

export const StudentPlan = mongoose.model<IStudentPlan>('StudentPlan', studentPlanSchema);
