import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFranchiseBrandMapping extends Document {
  franchiseId: mongoose.Types.ObjectId;
  franchiseCode: string;
  franchiseName: string;
  brandId: mongoose.Types.ObjectId;
  brandCode?: string;
  brandName: string;
  isActive: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FranchiseBrandMappingSchema = new Schema<IFranchiseBrandMapping>(
  {
    franchiseId: {
      type: Schema.Types.ObjectId,
      ref: 'Franchise',
      required: true,
      index: true,
    },
    franchiseCode: {
      type: String,
      required: true,
      trim: true,
    },
    franchiseName: {
      type: String,
      required: true,
      trim: true,
    },
    brandId: {
      type: Schema.Types.ObjectId,
      ref: 'Brand',
      required: true,
      index: true,
    },
    brandCode: {
      type: String,
      default: '',
    },
    brandName: {
      type: String,
      required: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: String,
      default: 'Super Admin',
    },
    updatedBy: {
      type: String,
      default: 'Super Admin',
    },
  },
  { timestamps: true }
);

// Enforce unique franchise-brand pair
FranchiseBrandMappingSchema.index({ franchiseId: 1, brandId: 1 }, { unique: true });

if (mongoose.models && mongoose.models.FranchiseBrandMapping) {
  delete (mongoose.models as any).FranchiseBrandMapping;
}

export const FranchiseBrandMapping: Model<IFranchiseBrandMapping> =
  mongoose.models.FranchiseBrandMapping ||
  mongoose.model<IFranchiseBrandMapping>('FranchiseBrandMapping', FranchiseBrandMappingSchema);

