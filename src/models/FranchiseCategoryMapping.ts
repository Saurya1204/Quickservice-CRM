import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFranchiseCategoryMapping extends Document {
  franchiseId: mongoose.Types.ObjectId;
  franchiseCode: string;
  franchiseName: string;
  categoryId: mongoose.Types.ObjectId;
  categoryCode?: string;
  categoryName: string;
  isActive: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FranchiseCategoryMappingSchema = new Schema<IFranchiseCategoryMapping>(
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
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    categoryCode: {
      type: String,
      default: '',
    },
    categoryName: {
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

// Enforce unique franchise-category pair
FranchiseCategoryMappingSchema.index({ franchiseId: 1, categoryId: 1 }, { unique: true });

if (mongoose.models && mongoose.models.FranchiseCategoryMapping) {
  delete (mongoose.models as any).FranchiseCategoryMapping;
}

export const FranchiseCategoryMapping: Model<IFranchiseCategoryMapping> =
  mongoose.models.FranchiseCategoryMapping ||
  mongoose.model<IFranchiseCategoryMapping>('FranchiseCategoryMapping', FranchiseCategoryMappingSchema);

