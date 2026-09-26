import mongoose, { Document, Schema } from 'mongoose';

export interface IChatMessage extends Document {
  senderId: mongoose.Types.ObjectId;
  recipientId?: mongoose.Types.ObjectId;
  groupId?: mongoose.Types.ObjectId;
  body: string;
  read: boolean;
}

const chatMessageSchema = new Schema<IChatMessage>(
  {
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    recipientId: { type: Schema.Types.ObjectId, ref: 'User' },
    groupId: { type: Schema.Types.ObjectId, ref: 'StudyGroup' },
    body: { type: String, required: true, trim: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

chatMessageSchema.index({ senderId: 1, recipientId: 1, createdAt: -1 });
chatMessageSchema.index({ groupId: 1, createdAt: -1 });

export default mongoose.model<IChatMessage>('ChatMessage', chatMessageSchema);
