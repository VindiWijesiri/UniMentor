import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { USER_ROLES, UserRole } from '../types/roles';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  profilePicture?: string;
  bio?: string;
  subjects?: string[];
  rating?: number;
  reviewCount?: number;
  createdAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: USER_ROLES, required: true },
    profilePicture: { type: String },
    bio: { type: String },
    subjects: [{ type: String }],
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete (ret as { password?: string }).password;
    return ret;
  },
});

export default mongoose.model<IUser>('User', userSchema);
