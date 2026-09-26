import mongoose, { Document, Schema } from 'mongoose';

export const QUESTION_TYPES = [
  'mcq',
  'true_false',
  'short_answer',
  'matching',
  'fill_blank',
  'ordering',
  'essay',
  'coding',
  'file',
  'drag_drop',
  'case_study',
] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];

export interface IQuestion {
  type: QuestionType;
  prompt: string;
  points: number;
  options?: string[];
  correctIndex?: number;
  correctBoolean?: boolean;
  acceptedAnswers?: string[];
  pairs?: { left: string; right: string }[];
  orderItems?: string[];
  starterCode?: string;
  rubric?: string;
  buckets?: string[];
  tokens?: { label: string; bucket: string }[];
  scenario?: string;
}

export interface IAssessment extends Document {
  mentorId: mongoose.Types.ObjectId;
  title: string;
  subject: string;
  module?: string;
  instructions?: string;
  durationMinutes: number;
  dueAt?: Date;
  published: boolean;
  questions: IQuestion[];
}

const questionSchema = new Schema<IQuestion>(
  {
    type: { type: String, enum: QUESTION_TYPES, required: true },
    prompt: { type: String, required: true },
    points: { type: Number, default: 1, min: 0 },
    options: [{ type: String }],
    correctIndex: { type: Number },
    correctBoolean: { type: Boolean },
    acceptedAnswers: [{ type: String }],
    pairs: [{ left: String, right: String }],
    orderItems: [{ type: String }],
    starterCode: { type: String },
    rubric: { type: String },
    buckets: [{ type: String }],
    tokens: [{ label: String, bucket: String }],
    scenario: { type: String },
  },
  { _id: false }
);

const assessmentSchema = new Schema<IAssessment>(
  {
    mentorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    module: { type: String, trim: true },
    instructions: { type: String },
    durationMinutes: { type: Number, default: 30, min: 1 },
    dueAt: { type: Date },
    published: { type: Boolean, default: true },
    questions: { type: [questionSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model<IAssessment>('Assessment', assessmentSchema);
