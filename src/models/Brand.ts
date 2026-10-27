import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBrand extends Document {
  brandCode: string;
  brandName: string;
  clientId: mongoose.Types.ObjectId;
  clientName?: string;
  status: 'A' | 'I';
  createdAt: Date;
  updatedAt: Date;
}

const BrandSchema = new Schema<IBrand>(
  {
    brandCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    brandName: { type: String, required: true, trim: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    clientName: { type: String },
    status: { type: String, enum: ['A', 'I'], default: 'A' },
  },
  { timestamps: true }
);

export const Brand: Model<IBrand> =
  mongoose.models.Brand || mongoose.model<IBrand>('Brand', BrandSchema);
