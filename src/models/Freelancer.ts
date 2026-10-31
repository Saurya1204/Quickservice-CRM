import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFreelancer extends Document {
  freelancerCode: string;
  freelancerName: string;
  branchName?: string;
  branchId?: string;
  region: string;
  contactNumber: string;
  emailId?: string;
  residentialAddress?: string;
  landmark?: string;
  pincode: string;
  state: string;
  district: string;
  city: string;
  locality?: string;
  aadhaarCardNumber?: string;
  panCardNumber?: string;
  voterIdNumber?: string;
  drivingLicenseNumber?: string;
  highestQualification?: string;
  technicalQualification?: string;
  languages?: string;
  skillSet?: string;
  smartphoneAvailability?: string;
  bankName?: string;
  bankBranch?: string;
  accountNumber?: string;
  ifscCode?: string;
  accountHolderName?: string;
  dateOfJoining?: string;
  experienceInYears?: number;
  status: 'A' | 'I';
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FreelancerSchema = new Schema<IFreelancer>(
  {
    freelancerCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    freelancerName: { type: String, required: true, trim: true },
    branchName: { type: String, default: '' },
    branchId: { type: String, default: '' },
    region: { type: String, required: true, default: 'North' },
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
    voterIdNumber: { type: String, default: '' },
    drivingLicenseNumber: { type: String, default: '' },
    highestQualification: { type: String, default: '' },
    technicalQualification: { type: String, default: '' },
    languages: { type: String, default: 'Hindi English' },
    skillSet: { type: String, default: '' },
    smartphoneAvailability: { type: String, default: 'Yes' },
    bankName: { type: String, default: '' },
    bankBranch: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    ifscCode: { type: String, default: '' },
    accountHolderName: { type: String, default: '' },
    dateOfJoining: { type: String, default: '' },
    experienceInYears: { type: Number, default: 0 },
    status: { type: String, enum: ['A', 'I'], default: 'A' },
    createdBy: { type: String, default: 'Super Admin' },
    updatedBy: { type: String, default: 'Super Admin' },
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.Freelancer) {
  delete (mongoose.models as any).Freelancer;
}

export const Freelancer: Model<IFreelancer> =
  mongoose.models.Freelancer || mongoose.model<IFreelancer>('Freelancer', FreelancerSchema);
