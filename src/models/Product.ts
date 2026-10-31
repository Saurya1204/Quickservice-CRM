import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProduct extends Document {
  productCode: string;
  productName: string;
  clientId: mongoose.Types.ObjectId;
  clientName?: string;
  brandId: mongoose.Types.ObjectId;
  brandName?: string;
  categoryId: mongoose.Types.ObjectId;
  categoryName?: string;
  productCatalogueId?: mongoose.Types.ObjectId;
  description?: string;
  warrantyMonths?: number;
  status: 'A' | 'I';
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    productCode: { type: String, required: true, uppercase: true, trim: true },
    productName: { type: String, required: true, trim: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    clientName: { type: String, default: '' },
    brandId: { type: Schema.Types.ObjectId, ref: 'Brand', required: true, index: true },
    brandName: { type: String, default: '' },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    categoryName: { type: String, default: '' },
    productCatalogueId: { type: Schema.Types.ObjectId, ref: 'ProductCatalogue' },
    description: { type: String, default: '' },
    warrantyMonths: { type: Number, default: 12 },
    status: { type: String, enum: ['A', 'I'], default: 'A' },
    createdBy: { type: String, default: 'Super Admin' },
    updatedBy: { type: String, default: 'Super Admin' },
  },
  { timestamps: true }
);

ProductSchema.index({ clientId: 1, brandId: 1, categoryId: 1, productName: 1 }, { unique: true });

if (mongoose.models && mongoose.models.Product) {
  delete (mongoose.models as any).Product;
}

export const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
