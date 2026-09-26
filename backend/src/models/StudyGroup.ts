import mongoose, { Document, Schema } from 'mongoose';

export interface IStudyGroup extends Document {
  name: string;
  description?: string;
  subject: string;
  ownerId: mongoose.Types.ObjectId;
  memberIds: mongoose.Types.ObjectId[];
  mentorIds: mongoose.Types.ObjectId[];
  materialIds: mongoose.Types.ObjectId[];
  inviteCode: string;
}

const studyGroupSchema = new Schema<IStudyGroup>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String },
    subject: { type: String, required: true, trim: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    memberIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    mentorIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    materialIds: [{ type: Schema.Types.ObjectId, ref: 'Material', default: [] }],
    inviteCode: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

export default mongoose.model<IStudyGroup>('StudyGroup', studyGroupSchema);
