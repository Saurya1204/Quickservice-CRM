import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProductCatalogue extends Document {
  productCode: string;
  productName: string;
  description?: string;
  categoryId?: mongoose.Types.ObjectId;
  categoryName?: string;
  status: 'A' | 'I';
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProductCatalogueSchema = new Schema<IProductCatalogue>(
  {
    productCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    productName: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
    categoryName: { type: String, default: '' },
    status: { type: String, enum: ['A', 'I'], default: 'A' },
    createdBy: { type: String, default: 'Super Admin' },
    updatedBy: { type: String, default: 'Super Admin' },
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.ProductCatalogue) {
  delete (mongoose.models as any).ProductCatalogue;
}

export const ProductCatalogue: Model<IProductCatalogue> =
  mongoose.models.ProductCatalogue ||
  mongoose.model<IProductCatalogue>('ProductCatalogue', ProductCatalogueSchema);
