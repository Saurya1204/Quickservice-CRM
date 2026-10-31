import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBrand extends Document {
  brandCode: string;
  brandName: string;
  normalizedBrandName?: string;
  brandLogo?: string;
  clientId: mongoose.Types.ObjectId;
  clientName?: string;
  status: 'A' | 'I';
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BrandSchema = new Schema<IBrand>(
  {
    brandCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    brandName: { type: String, required: true, trim: true },
    normalizedBrandName: { type: String, lowercase: true, trim: true },
    brandLogo: { type: String, default: '' },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    clientName: { type: String, default: '' },
    status: { type: String, enum: ['A', 'I'], default: 'A' },
    createdBy: { type: String, default: 'Super Admin' },
    updatedBy: { type: String, default: 'Super Admin' },
  },
  { timestamps: true }
);

BrandSchema.pre('save', function (next) {
  if (this.brandName) {
    this.normalizedBrandName = this.brandName.toLowerCase().trim();
  }
  next();
});

BrandSchema.index({ clientId: 1, normalizedBrandName: 1 }, { unique: true });

if (mongoose.models && mongoose.models.Brand) {
  delete (mongoose.models as any).Brand;
}

export const Brand: Model<IBrand> =
  mongoose.models.Brand || mongoose.model<IBrand>('Brand', BrandSchema);
