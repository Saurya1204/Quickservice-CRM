import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBranch extends Document {
  crmCode: string;
  region: 'North' | 'South' | 'East' | 'West' | 'Central' | string;
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

  // Section B. GST Details
  shopEstablishmentReg?: string;
  gstNumber?: string;

  // Section C. Premises Details
  premisesOwnership?: 'Company' | 'Rented' | string;
  rentAgreement?: 'Yes' | 'No' | string;
  agreementPeriod?: string;
  renewalDate?: Date;
  rentDate?: Date;
  areaSqFt?: number;
  warehouse?: 'Yes' | 'No' | string;

  // Section D. Connection Details
  broadbandConnection?: 'Yes' | 'No' | string;
  alternateConnection?: 'Yes' | 'No' | string;
  systemAvailability?: 'Yes' | 'No' | string;
  printerAvailability?: 'Yes' | 'No' | string;
  landlineNumber?: string;
  billingDueDate?: Date;

  // Section E. Power Details
  electricityConnection?: 'Own' | 'Landlord' | string;
  wattage?: number;
  inverterAvailability?: 'Yes' | 'No' | string;
  inverterCapacity?: number;
  fireSafetyNorms?: 'Yes' | 'No' | string;
  refillingDate?: Date;

  // Section F. Branch Manager Details
  branchManagerName: string;
  managerContactNumber: string;
  managerEmailId: string;

  // Section G. Store Manager Details
  storeManagerName?: string;
  storeManagerContactNumber?: string;
  storeManagerEmailId?: string;

  // Section H. Branch Coordinator Details
  branchCoordinatorName?: string;
  branchCoordinatorContactNumber?: string;
  branchCoordinatorEmailId?: string;

  // Existing banking details (optional backward compatibility)
  panNumber?: string;
  bankName?: string;
  bankBranch?: string;
  accountNumber?: string;
  ifscCode?: string;

  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BranchSchema = new Schema<IBranch>(
  {
    crmCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    region: { type: String, required: true, enum: ['North', 'South', 'East', 'West', 'Central'] },
    branchName: { type: String, required: true, trim: true },
    contactNumber: { type: String, default: '', trim: true },
    emailId: { type: String, default: '', trim: true },
    status: { type: String, enum: ['A', 'I'], default: 'A' },
    address: { type: String, default: '' },
    landmark: { type: String, default: '' },
    pincode: { type: String, default: '' },
    state: { type: String, default: '' },
    district: { type: String, default: '' },
    city: { type: String, default: '' },
    locality: { type: String, default: '' },

    // Section B. GST Details
    shopEstablishmentReg: { type: String, default: '' },
    gstNumber: { type: String, default: '' },

    // Section C. Premises Details
    premisesOwnership: { type: String, enum: ['Company', 'Rented', ''], default: 'Rented' },
    rentAgreement: { type: String, enum: ['Yes', 'No', ''], default: 'Yes' },
    agreementPeriod: { type: String, default: '' },
    renewalDate: { type: Date },
    rentDate: { type: Date },
    areaSqFt: { type: Number, default: 0 },
    warehouse: { type: String, enum: ['Yes', 'No', ''], default: 'No' },

    // Section D. Connection Details
    broadbandConnection: { type: String, enum: ['Yes', 'No', ''], default: 'Yes' },
    alternateConnection: { type: String, enum: ['Yes', 'No', ''], default: 'No' },
    systemAvailability: { type: String, enum: ['Yes', 'No', ''], default: 'Yes' },
    printerAvailability: { type: String, enum: ['Yes', 'No', ''], default: 'Yes' },
    landlineNumber: { type: String, default: '' },
    billingDueDate: { type: Date },

    // Section E. Power Details
    electricityConnection: { type: String, enum: ['Own', 'Landlord', ''], default: 'Landlord' },
    wattage: { type: Number, default: 0 },
    inverterAvailability: { type: String, enum: ['Yes', 'No', ''], default: 'Yes' },
    inverterCapacity: { type: Number, default: 0 },
    fireSafetyNorms: { type: String, enum: ['Yes', 'No', ''], default: 'Yes' },
    refillingDate: { type: Date },

    // Section F. Branch Manager Details
    branchManagerName: { type: String, default: '' },
    managerContactNumber: { type: String, default: '' },
    managerEmailId: { type: String, default: '' },

    // Section G. Store Manager Details
    storeManagerName: { type: String, default: '' },
    storeManagerContactNumber: { type: String, default: '' },
    storeManagerEmailId: { type: String, default: '' },

    // Section H. Branch Coordinator Details
    branchCoordinatorName: { type: String, default: '' },
    branchCoordinatorContactNumber: { type: String, default: '' },
    branchCoordinatorEmailId: { type: String, default: '' },

    // Existing banking details
    panNumber: { type: String },
    bankName: { type: String },
    bankBranch: { type: String },
    accountNumber: { type: String },
    ifscCode: { type: String },

    createdBy: { type: String, default: 'SYSTEM' },
    updatedBy: { type: String, default: 'SYSTEM' },
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.Branch) {
  delete (mongoose.models as any).Branch;
}

export const Branch: Model<IBranch> = mongoose.models.Branch || mongoose.model<IBranch>('Branch', BranchSchema);
