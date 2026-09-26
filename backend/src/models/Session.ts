import crypto from 'crypto';
import mongoose, { Document, Schema } from 'mongoose';

export interface ISession extends Document {
  mentorId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  subject: string;
  scheduledAt: Date;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  verificationCode: string;
  verifiedAt?: Date;
  meetingLink?: string;
}

const sessionSchema = new Schema<ISession>(
  {
    mentorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true },
    scheduledAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
    },
    notes: { type: String },
    verificationCode: {
      type: String,
      default: () => String(crypto.randomInt(100000, 999999)),
    },
    verifiedAt: { type: Date },
    meetingLink: { type: String },
  },
  { timestamps: true }
);

sessionSchema.index({ mentorId: 1, scheduledAt: -1 });
sessionSchema.index({ studentId: 1, scheduledAt: -1 });

export default mongoose.model<ISession>('Session', sessionSchema);
