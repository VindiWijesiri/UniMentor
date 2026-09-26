import mongoose, { Document, Schema } from 'mongoose';

export interface IComplaint extends Document {
  reporterId: mongoose.Types.ObjectId;
  againstUserId?: mongoose.Types.ObjectId;
  category: 'tutor_conduct' | 'ghostwriting' | 'copyright' | 'assignment' | 'other';
  title: string;
  details: string;
  evidenceUrl?: string;
  status: 'open' | 'reviewing' | 'resolved' | 'dismissed';
  resolutionNote?: string;
}

const complaintSchema = new Schema<IComplaint>(
  {
    reporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    againstUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    category: {
      type: String,
      enum: ['tutor_conduct', 'ghostwriting', 'copyright', 'assignment', 'other'],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    details: { type: String, required: true },
    evidenceUrl: { type: String },
    status: {
      type: String,
      enum: ['open', 'reviewing', 'resolved', 'dismissed'],
      default: 'open',
    },
    resolutionNote: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IComplaint>('Complaint', complaintSchema);
