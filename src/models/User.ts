import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  username: string;
  passwordHash: string;
  fullName: string;
  role: string;
  roleId?: mongoose.Types.ObjectId;
  reportingTo?: string;
  assignedZone?: string;
  assignedBranch?: string;
  assignedArea?: string;
  branch?: string;
  categoryClientRegion?: string;
  address?: string;
  landmark?: string;
  pincode?: string;
  state?: string;
  district?: string;
  city?: string;
  locality?: string;
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
      default: 'Super Admin',
    },
    roleId: { type: Schema.Types.ObjectId, ref: 'Role' },
    reportingTo: { type: String, default: '' },
    assignedZone: { type: String, default: '' },
    assignedBranch: { type: String, default: '' },
    assignedArea: { type: String, default: '' },
    branch: { type: String, default: '' },
    categoryClientRegion: { type: String, default: '' },
    address: { type: String, default: '' },
    landmark: { type: String, default: '' },
    pincode: { type: String, default: '' },
    state: { type: String, default: '' },
    district: { type: String, default: '' },
    city: { type: String, default: '' },
    locality: { type: String, default: '' },
    mobile: { type: String, default: '' },
    email: { type: String, default: '' },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.User) {
  delete (mongoose.models as any).User;
}

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
