import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IClientBrandCategoryMapping extends Document {
  clientId: mongoose.Types.ObjectId;
  brandId: mongoose.Types.ObjectId;
  assignedCategoryIds: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ClientBrandCategoryMappingSchema = new Schema<IClientBrandCategoryMapping>(
  {
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    brandId: { type: Schema.Types.ObjectId, ref: 'Brand', required: true },
    assignedCategoryIds: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
  },
  { timestamps: true }
);

ClientBrandCategoryMappingSchema.index({ clientId: 1, brandId: 1 }, { unique: true });

export const ClientBrandCategoryMapping: Model<IClientBrandCategoryMapping> =
  mongoose.models.ClientBrandCategoryMapping ||
  mongoose.model<IClientBrandCategoryMapping>(
    'ClientBrandCategoryMapping',
    ClientBrandCategoryMappingSchema
  );
