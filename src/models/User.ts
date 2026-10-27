import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  username: string;
  passwordHash: string;
  fullName: string;
  role: string;
  branch?: string;
  categoryClientRegion?: string;
  address?: string;
  mobile?: string;
  email?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    fullName: { type: String, required: true },
    role: {
      type: String,
      default: 'SUPER_ADMIN',
    },
    branch: { type: String, default: '' },
    categoryClientRegion: { type: String, default: '' },
    address: { type: String, default: '' },
    mobile: { type: String, default: '' },
    email: { type: String, default: '' },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
