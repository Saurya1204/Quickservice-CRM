import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFranchise extends Document {
  crmCode: string;
  region: string;
  firmType?: string;
  firmName: string;
  numberOfPartners?: number;
  contactNumber: string;
  emailId: string;
  status: 'A' | 'I';
  firmAddress: string;
  landmark?: string;
  pincode: string;
  state: string;
  district: string;
  city: string;
  locality: string;
  gstNumber?: string;
  panCardNo?: string;
  shopEstablishmentReg?: string;
  establishmentMonthYear?: string;
  proprietorName: string;
  propContactNumber: string;
  propEmailId?: string;
  propResidentialAddress?: string;
  propPanCardNo?: string;
  propAadharCardNo?: string;
  smartphoneAvailability?: string;
  bankName?: string;
  bankBranch?: string;
  accountHolderName?: string;
  accountNumber?: string;
  ifscCode?: string;
  securityAmount?: number;
  turnOver?: number;
  spaceOwnership?: string;
  serviceCentreSpace?: string;
  agreementDate?: Date;
  validityDate?: Date;
  systemAvailability?: string;
  printerAvailability?: string;
  ccoName?: string;
  ccoContactNumber?: string;
  ccoEmailId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FranchiseSchema = new Schema<IFranchise>(
  {
    crmCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    region: { type: String, required: true },
    firmType: { type: String },
    firmName: { type: String, required: true, trim: true },
    numberOfPartners: { type: Number },
    contactNumber: { type: String, required: true, trim: true },
    emailId: { type: String, required: true, trim: true },
    status: { type: String, enum: ['A', 'I'], default: 'A' },
    firmAddress: { type: String, default: '' },
    landmark: { type: String, default: '' },
    pincode: { type: String, default: '' },
    state: { type: String, default: '' },
    district: { type: String, default: '' },
    city: { type: String, default: '' },
    locality: { type: String, default: '' },
    gstNumber: { type: String },
    panCardNo: { type: String },
    shopEstablishmentReg: { type: String },
    establishmentMonthYear: { type: String },
    proprietorName: { type: String, required: true },
    propContactNumber: { type: String, required: true },
    propEmailId: { type: String },
    propResidentialAddress: { type: String },
    propPanCardNo: { type: String },
    propAadharCardNo: { type: String },
    smartphoneAvailability: { type: String, default: 'Yes' },
    bankName: { type: String },
    bankBranch: { type: String },
    accountHolderName: { type: String },
    accountNumber: { type: String },
    ifscCode: { type: String },
    securityAmount: { type: Number },
    turnOver: { type: Number },
    spaceOwnership: { type: String },
    serviceCentreSpace: { type: String },
    agreementDate: { type: Date },
    validityDate: { type: Date },
    systemAvailability: { type: String, default: 'Yes' },
    printerAvailability: { type: String, default: 'Yes' },
    ccoName: { type: String },
    ccoContactNumber: { type: String },
    ccoEmailId: { type: String },
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.Franchise) {
  delete (mongoose.models as any).Franchise;
}

export const Franchise: Model<IFranchise> =
  mongoose.models.Franchise || mongoose.model<IFranchise>('Franchise', FranchiseSchema);
