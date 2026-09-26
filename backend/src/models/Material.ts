import mongoose, { Document, Schema } from 'mongoose';

export interface IMaterial extends Document {
  mentorId: mongoose.Types.ObjectId;
  title: string;
  subject: string;
  module?: string;
  description: string;
  resourceUrl?: string;
  price: number;
  published: boolean;
}

const materialSchema = new Schema<IMaterial>(
  {
    mentorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    module: { type: String, trim: true },
    description: { type: String, required: true },
    resourceUrl: { type: String, trim: true },
    price: { type: Number, default: 0, min: 0 },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IMaterial>('Material', materialSchema);
