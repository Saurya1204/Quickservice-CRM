import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFranchise extends Document {
  crmCode: string;

  // Section A. Basic Franchise Details
  region: string;
  firmType: 'Proprietor' | 'Partnership' | string;
  firmName: string;
  firmAddress: string;
  landmark?: string;
  pincode: string;
  state: string;
  district: string;
  city: string;
  locality: string;
  contactNumber: string;
  emailId: string;

  // Section B. Government Details
  gstNumber?: string;
  panCardNo?: string;
  shopEstablishmentReg?: string;
  establishmentMonthYear?: string;

  // Section C. Proprietor Details
  proprietorName: string;
  propContactNumber?: string;
  propResidentialAddress?: string;
  propEmailId?: string;
  propPanCardNo?: string;
  propAadharCardNo?: string;
  propLanguages: string[];

  // Section D. Smartphone Availability
  smartphoneAvailability: 'Yes' | 'No';

  // Section E. Bank Details
  bankName?: string;
  bankBranch?: string;
  accountHolderName?: string;
  accountNumber?: string;
  ifscCode?: string;
  securityAmount?: number;
  turnOver?: number;

  // Section F. Infrastructure Information
  spaceOwnership?: string;
  serviceCentreSpace?: string;
  agreementDate?: string;
  validity?: string;
  systemAvailability?: 'Yes' | 'No';
  printerAvailability?: 'Yes' | 'No';
  internetConnectivity?: string;
  inverterAvailability?: 'Yes' | 'No';
  coveringArea?: string;
  numberOfTechnician?: number;
  brandHandling?: string;

  // Section G. Back End Stuff
  backendManagerName?: string;
  backendContactNumber?: string;
  backendEmailId?: string;
  backendLanguages: string[];

  // Section H. Reporting
  reportingBranch?: string;
  reportingBranchId?: string;
  areaManagerName?: string;
  managerEmailId?: string;
  managerContactNumber?: string;
  reportingCcoName?: string;
  ccoContactNumber?: string;
  ccoEmailId?: string;

  // Section I. SLA / TAT Performance
  installationResponseTime?: number;
  installationResolutionTime?: number;
  serviceResponseTime?: number;
  serviceResolutionTime?: number;
  asfCode?: string;

  status: 'A' | 'I';
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FranchiseSchema = new Schema<IFranchise>(
  {
    crmCode: { type: String, required: true, unique: true, uppercase: true, trim: true },

    // Section A
    region: { type: String, required: true, default: 'North' },
    firmType: { type: String, required: true, enum: ['Proprietor', 'Partnership', 'Proprietorship', 'Pvt Ltd'], default: 'Proprietor' },
    firmName: { type: String, required: true, trim: true },
    firmAddress: { type: String, required: true, trim: true },
    landmark: { type: String, default: '' },
    pincode: { type: String, required: true, trim: true },
    state: { type: String, required: true, default: 'UTTAR PRADESH' },
    district: { type: String, required: true, default: 'GHAZIABAD' },
    city: { type: String, required: true, default: 'GHAZIABAD' },
    locality: { type: String, default: '' },
    contactNumber: { type: String, required: true, trim: true },
    emailId: { type: String, required: true, trim: true },

    // Section B
    gstNumber: { type: String, default: '', trim: true },
    panCardNo: { type: String, default: '', trim: true },
    shopEstablishmentReg: { type: String, default: '' },
    establishmentMonthYear: { type: String, default: '' },

    // Section C
    proprietorName: { type: String, required: true, trim: true },
    propContactNumber: { type: String, default: '', trim: true },
    propResidentialAddress: { type: String, default: '' },
    propEmailId: { type: String, default: '', trim: true },
    propPanCardNo: { type: String, default: '', trim: true },
    propAadharCardNo: { type: String, default: '', trim: true },
    propLanguages: { type: [String], default: ['Hindi', 'English'] },

    // Section D
    smartphoneAvailability: { type: String, enum: ['Yes', 'No'], default: 'Yes' },

    // Section E
    bankName: { type: String, default: '' },
    bankBranch: { type: String, default: '' },
    accountHolderName: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    ifscCode: { type: String, default: '', trim: true },
    securityAmount: { type: Number, default: 0 },
    turnOver: { type: Number, default: 0 },

    // Section F
    spaceOwnership: { type: String, default: 'Rented' },
    serviceCentreSpace: { type: String, default: '500 Sq Ft' },
    agreementDate: { type: String, default: '' },
    validity: { type: String, default: '11 Months' },
    systemAvailability: { type: String, enum: ['Yes', 'No'], default: 'Yes' },
    printerAvailability: { type: String, enum: ['Yes', 'No'], default: 'Yes' },
    internetConnectivity: { type: String, default: 'Broadband' },
    inverterAvailability: { type: String, enum: ['Yes', 'No'], default: 'Yes' },
    coveringArea: { type: String, default: '20 Kms' },
    numberOfTechnician: { type: Number, default: 2 },
    brandHandling: { type: String, default: '' },

    // Section G
    backendManagerName: { type: String, default: '' },
    backendContactNumber: { type: String, default: '' },
    backendEmailId: { type: String, default: '' },
    backendLanguages: { type: [String], default: ['Hindi', 'English'] },

    // Section H
    reportingBranch: { type: String, default: '' },
    reportingBranchId: { type: String, default: '' },
    areaManagerName: { type: String, default: '' },
    managerEmailId: { type: String, default: '' },
    managerContactNumber: { type: String, default: '' },
    reportingCcoName: { type: String, default: '' },
    ccoContactNumber: { type: String, default: '' },
    ccoEmailId: { type: String, default: '' },

    // Section I
    installationResponseTime: { type: Number, default: 4 },
    installationResolutionTime: { type: Number, default: 24 },
    serviceResponseTime: { type: Number, default: 4 },
    serviceResolutionTime: { type: Number, default: 48 },
    asfCode: { type: String, default: '' },

    status: { type: String, enum: ['A', 'I'], default: 'A' },
    createdBy: { type: String, default: 'Super Admin' },
    updatedBy: { type: String, default: 'Super Admin' },
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.Franchise) {
  delete (mongoose.models as any).Franchise;
}

export const Franchise: Model<IFranchise> =
  mongoose.models.Franchise || mongoose.model<IFranchise>('Franchise', FranchiseSchema);
