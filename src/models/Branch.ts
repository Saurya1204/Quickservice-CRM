import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBranch extends Document {
  crmCode: string;
  region: string;
  branchName: string;
  contactNumber: string;
  emailId: string;
  status: 'A' | 'I';
  address: string;
  landmark?: string;
  pincode: string;
  state: string;
  district: string;
  city: string;
  locality: string;
  gstNumber?: string;
  panNumber?: string;
  bankName?: string;
  bankBranch?: string;
  accountNumber?: string;
  ifscCode?: string;
  branchManagerName: string;
  managerContactNumber: string;
  managerEmailId: string;
  createdAt: Date;
  updatedAt: Date;
}

const BranchSchema = new Schema<IBranch>(
  {
    crmCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    region: { type: String, required: true, enum: ['North', 'South', 'East', 'West', 'Central'] },
    branchName: { type: String, required: true, trim: true },
    contactNumber: { type: String, required: true, trim: true },
    emailId: { type: String, required: true, trim: true },
    status: { type: String, enum: ['A', 'I'], default: 'A' },
    address: { type: String, default: '' },
    landmark: { type: String, default: '' },
    pincode: { type: String, default: '' },
    state: { type: String, default: '' },
    district: { type: String, default: '' },
    city: { type: String, default: '' },
    locality: { type: String, default: '' },
    gstNumber: { type: String },
    panNumber: { type: String },
    bankName: { type: String },
    bankBranch: { type: String },
    accountNumber: { type: String },
    ifscCode: { type: String },
    branchManagerName: { type: String, default: '' },
    managerContactNumber: { type: String, default: '' },
    managerEmailId: { type: String, default: '' },
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.Branch) {
  delete (mongoose.models as any).Branch;
}

export const Branch: Model<IBranch> = mongoose.models.Branch || mongoose.model<IBranch>('Branch', BranchSchema);
