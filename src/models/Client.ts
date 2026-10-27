import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IClient extends Document {
  clientCode: string;
  clientName: string;
  proprietorName?: string;
  status: 'A' | 'I';
  serviceArea?: string;
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
  callCenter?: string;
  noOfCallCentreSeat?: number;
  callCentreSeatCharge?: number;
  crmCharges?: number;
  crmExtraUserCharges?: number;
  warehouseChargePM?: number;
  minimumGuarantyPM?: number;
  managementFeeYearly?: number;
  localConveyanceChargePerKM?: string;
  paymentTerms?: string;
  creditLimit?: string;
  creditPeriod?: string;
  agreementStartDate?: string;
  agreementRenewalDate?: string;
  reconciliationPeriod?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ClientSchema = new Schema<IClient>(
  {
    clientCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    clientName: { type: String, required: true, trim: true },
    proprietorName: { type: String, default: '' },
    status: { type: String, enum: ['A', 'I'], default: 'A' },
    serviceArea: { type: String, default: 'Pan India' },
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
    callCenter: { type: String, default: 'Quickserves' },
    noOfCallCentreSeat: { type: Number, default: 0 },
    callCentreSeatCharge: { type: Number, default: 0 },
    crmCharges: { type: Number, default: 0 },
    crmExtraUserCharges: { type: Number, default: 0 },
    warehouseChargePM: { type: Number, default: 0 },
    minimumGuarantyPM: { type: Number, default: 0 },
    managementFeeYearly: { type: Number, default: 0 },
    localConveyanceChargePerKM: { type: String, default: '' },
    paymentTerms: { type: String, default: 'Within 15 Days' },
    creditLimit: { type: String, default: '6 Lac' },
    creditPeriod: { type: String, default: '' },
    agreementStartDate: { type: String, default: '' },
    agreementRenewalDate: { type: String, default: '' },
    reconciliationPeriod: { type: String, default: '' },
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.Client) {
  delete (mongoose.models as any).Client;
}

export const Client: Model<IClient> =
  mongoose.models.Client || mongoose.model<IClient>('Client', ClientSchema);
