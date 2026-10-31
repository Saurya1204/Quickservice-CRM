import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IClient extends Document {
  clientCode: string;
  legacyClientCode?: string;
  clientName: string;
  proprietorName?: string;
  status: 'A' | 'I';
  serviceArea?: string;
  serviceAreas?: string[];
  registeredAddress?: string;
  landmark?: string;
  pincode?: string;
  state?: string;
  district?: string;
  city?: string;
  locality?: string;
  contactPerson?: string;
  mobileNumber: string;
  landlineNumber?: string;
  emailId?: string;
  tollFreeNumber?: string;
  cinNumber?: string;
  panNumber?: string;
  gstNumber?: string;
  callCenter?: 'Company Own' | 'Quick Serves' | 'Third Party' | string;
  noOfCallCentreSeat?: number;
  callCentreSeatCharge?: number;
  crmCharges?: number;
  crmExtraUserCharges?: number;
  warehouseChargePM?: number;
  minimumGuarantyPM?: number;
  managementFeeYearly?: number;
  localConveyanceChargePerKM?: number | string;
  paymentTerms?: string;
  creditLimit?: number | string;
  creditPeriod?: number | string;
  agreementStartDate?: string;
  agreementRenewalDate?: string;
  reconciliationPeriod?: 'Quarterly' | 'Half Yearly' | 'Yearly' | string;
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ClientSchema = new Schema<IClient>(
  {
    clientCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    legacyClientCode: { type: String, default: '' },
    clientName: { type: String, required: true, trim: true },
    proprietorName: { type: String, default: '' },
    status: { type: String, enum: ['A', 'I'], default: 'A' },
    serviceArea: { type: String, default: 'Pan India' },
    serviceAreas: [{ type: String }],
    registeredAddress: { type: String, default: '' },
    landmark: { type: String, default: '' },
    pincode: { type: String, default: '' },
    state: { type: String, default: 'DELHI' },
    district: { type: String, default: '' },
    city: { type: String, default: 'NEW DELHI' },
    locality: { type: String, default: '' },
    contactPerson: { type: String, default: '' },
    mobileNumber: { type: String, required: true, trim: true },
    landlineNumber: { type: String, default: '' },
    emailId: { type: String, default: '' },
    tollFreeNumber: { type: String, default: '' },
    cinNumber: { type: String, default: '' },
    panNumber: { type: String, default: '' },
    gstNumber: { type: String, default: '' },
    callCenter: { type: String, default: 'Quick Serves' },
    noOfCallCentreSeat: { type: Number, default: 0 },
    callCentreSeatCharge: { type: Number, default: 0 },
    crmCharges: { type: Number, default: 0 },
    crmExtraUserCharges: { type: Number, default: 0 },
    warehouseChargePM: { type: Number, default: 0 },
    minimumGuarantyPM: { type: Number, default: 0 },
    managementFeeYearly: { type: Number, default: 0 },
    localConveyanceChargePerKM: { type: Schema.Types.Mixed, default: 0 },
    paymentTerms: { type: String, default: 'Within 15 Days' },
    creditLimit: { type: Schema.Types.Mixed, default: '600000' },
    creditPeriod: { type: Schema.Types.Mixed, default: '30' },
    agreementStartDate: { type: String, default: '' },
    agreementRenewalDate: { type: String, default: '' },
    reconciliationPeriod: { type: String, default: 'Quarterly' },
    createdBy: { type: String, default: 'Super Admin' },
    updatedBy: { type: String, default: 'Super Admin' },
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.Client) {
  delete (mongoose.models as any).Client;
}

export const Client: Model<IClient> =
  mongoose.models.Client || mongoose.model<IClient>('Client', ClientSchema);
