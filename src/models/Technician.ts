import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITechnician extends Document {
  crmCode: string;
  region: string;
  branchName?: string;
  branchId?: string;
  technicianName: string;
  contactNumber: string;
  emailId?: string;
  residentialAddress: string;
  landmark?: string;
  pincode: string;
  state: string;
  district: string;
  city: string;
  locality: string;
  aadhaarCardNumber?: string;
  panCardNumber?: string;
  vehicleNumber?: string;
  drivingLicenseNumber?: string;
  voterIdNumber?: string;
  smartphoneAvailability?: string;
  highestQualification?: string;
  technicalQualification?: string;
  languages?: string;
  personalInsurance?: string;
  skillSet?: string;
  bankName?: string;
  bankBranch?: string;
  accountNumber?: string;
  ifscCode?: string;
  accountHolderName?: string;
  baseLocation?: string;
  branchManagerName?: string;
  branchManagerContact?: string;
  branchManagerEmail?: string;
  ccoName?: string;
  ccoContact?: string;
  ccoEmail?: string;
  dateOfJoining?: string;
  experienceInYears?: number;
  status: 'A' | 'I';
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TechnicianSchema = new Schema<ITechnician>(
  {
    crmCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    region: { type: String, required: true, default: 'North' },
    branchName: { type: String, default: '' },
    branchId: { type: String, default: '' },
    technicianName: { type: String, required: true, trim: true },
    contactNumber: { type: String, required: true, trim: true },
    emailId: { type: String, default: '', trim: true },
    residentialAddress: { type: String, default: '' },
    landmark: { type: String, default: '' },
    pincode: { type: String, default: '' },
    state: { type: String, default: '' },
    district: { type: String, default: '' },
    city: { type: String, default: '' },
    locality: { type: String, default: '' },
    aadhaarCardNumber: { type: String, default: '' },
    panCardNumber: { type: String, default: '' },
    vehicleNumber: { type: String, default: '' },
    drivingLicenseNumber: { type: String, default: '' },
    voterIdNumber: { type: String, default: '' },
    smartphoneAvailability: { type: String, default: 'Yes' },
    highestQualification: { type: String, default: '' },
    technicalQualification: { type: String, default: '' },
    languages: { type: String, default: 'Hindi English' },
    personalInsurance: { type: String, default: '' },
    skillSet: { type: String, default: '' },
    bankName: { type: String, default: '' },
    bankBranch: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    ifscCode: { type: String, default: '' },
    accountHolderName: { type: String, default: '' },
    baseLocation: { type: String, default: '' },
    branchManagerName: { type: String, default: '' },
    branchManagerContact: { type: String, default: '' },
    branchManagerEmail: { type: String, default: '' },
    ccoName: { type: String, default: '' },
    ccoContact: { type: String, default: '' },
    ccoEmail: { type: String, default: '' },
    dateOfJoining: { type: String, default: '' },
    experienceInYears: { type: Number, default: 0 },
    status: { type: String, enum: ['A', 'I'], default: 'A' },
    createdBy: { type: String, default: 'Super Admin' },
    updatedBy: { type: String, default: 'Super Admin' },
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.Technician) {
  delete (mongoose.models as any).Technician;
}

export const Technician: Model<ITechnician> =
  mongoose.models.Technician || mongoose.model<ITechnician>('Technician', TechnicianSchema);
