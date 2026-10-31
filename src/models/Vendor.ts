import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IVendor extends Document {
  vendorId: string;
  vendorAs: 'Supplier' | 'Refurbish';
  vendorName: string;
  address?: string;
  pincode?: string;
  district?: string;
  state?: string;
  city?: string;
  landlineNumber?: string;
  gstNumber?: string;
  panNumber?: string;
  proprietorName?: string;
  proprietorContactNumbers?: string;
  proprietorEmailId?: string;
  bankName?: string;
  branch?: string;
  accountHolderName?: string;
  accountNumber?: string;
  ifscNumber?: string;
  paymentTerms?: string;
  otherClient?: string;
  status: 'Active' | 'Inactive' | 'Black Listed';
  isDeleted: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VendorSchema = new Schema<IVendor>(
  {
    vendorId: { type: String, required: true, unique: true, uppercase: true, trim: true },
    vendorAs: { type: String, enum: ['Supplier', 'Refurbish'], required: true, default: 'Supplier' },
    vendorName: { type: String, required: true, trim: true },
    address: { type: String, default: '' },
    pincode: { type: String, default: '' },
    district: { type: String, default: '' },
    state: { type: String, default: '' },
    city: { type: String, default: '' },
    landlineNumber: { type: String, default: '' },
    gstNumber: { type: String, default: '', uppercase: true, trim: true },
    panNumber: { type: String, default: '', uppercase: true, trim: true },
    proprietorName: { type: String, default: '' },
    proprietorContactNumbers: { type: String, default: '' },
    proprietorEmailId: { type: String, default: '', lowercase: true, trim: true },
    bankName: { type: String, default: '' },
    branch: { type: String, default: '' },
    accountHolderName: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    ifscNumber: { type: String, default: '', uppercase: true, trim: true },
    paymentTerms: { type: String, default: '' },
    otherClient: { type: String, default: '' },
    status: { type: String, enum: ['Active', 'Inactive', 'Black Listed'], default: 'Active' },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: String, default: 'Super Admin' },
    updatedBy: { type: String, default: 'Super Admin' },
  },
  { timestamps: true }
);

VendorSchema.index({ vendorName: 1, isDeleted: 1 });
VendorSchema.index({ status: 1 });

if (mongoose.models && mongoose.models.Vendor) {
  delete (mongoose.models as any).Vendor;
}

export const Vendor: Model<IVendor> =
  mongoose.models.Vendor || mongoose.model<IVendor>('Vendor', VendorSchema);
