import mongoose, { Document, Schema } from 'mongoose';

export interface IAnswer {
  questionIndex: number;
  selectedIndex?: number;
  booleanValue?: boolean;
  text?: string;
  matches?: { left: string; right: string }[];
  order?: string[];
  fileUrl?: string;
}

export interface ISubmission extends Document {
  assessmentId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  answers: IAnswer[];
  score?: number;
  maxScore: number;
  status: 'submitted' | 'graded';
  feedback?: string;
  autoGraded: boolean;
}

const submissionSchema = new Schema<ISubmission>(
  {
    assessmentId: { type: Schema.Types.ObjectId, ref: 'Assessment', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    answers: { type: Schema.Types.Mixed, default: [] },
    score: { type: Number },
    maxScore: { type: Number, required: true },
    status: { type: String, enum: ['submitted', 'graded'], default: 'submitted' },
    feedback: { type: String },
    autoGraded: { type: Boolean, default: false },
  },
  { timestamps: true }
);

submissionSchema.index({ assessmentId: 1, studentId: 1 }, { unique: true });

export default mongoose.model<ISubmission>('Submission', submissionSchema);
