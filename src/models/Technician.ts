import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITechnician extends Document {
  crmCode: string;
  region: string;
  technicianName: string;
  contactNumber: string;
  emailId?: string;
  status: 'A' | 'I';
  residentialAddress: string;
  landmark?: string;
  pincode: string;
  state: string;
  district: string;
  city: string;
  locality: string;
  educationalQualification?: string;
  technicalQualification?: string;
  identityProofNumber?: string;
  panCardNumber?: string;
  drivingLicenceNumber?: string;
  bankName?: string;
  bankBranch?: string;
  accountNumber?: string;
  ifscCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TechnicianSchema = new Schema<ITechnician>(
  {
    crmCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    region: { type: String, required: true },
    technicianName: { type: String, required: true, trim: true },
    contactNumber: { type: String, required: true, trim: true },
    emailId: { type: String, trim: true },
    status: { type: String, enum: ['A', 'I'], default: 'A' },
    residentialAddress: { type: String, default: '' },
    landmark: { type: String, default: '' },
    pincode: { type: String, default: '' },
    state: { type: String, default: '' },
    district: { type: String, default: '' },
    city: { type: String, default: '' },
    locality: { type: String, default: '' },
    educationalQualification: { type: String },
    technicalQualification: { type: String },
    identityProofNumber: { type: String },
    panCardNumber: { type: String },
    drivingLicenceNumber: { type: String },
    bankName: { type: String },
    bankBranch: { type: String },
    accountNumber: { type: String },
    ifscCode: { type: String },
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.Technician) {
  delete (mongoose.models as any).Technician;
}

export const Technician: Model<ITechnician> =
  mongoose.models.Technician || mongoose.model<ITechnician>('Technician', TechnicianSchema);
