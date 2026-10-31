import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISparePart extends Document {
  partCode: string;
  spareName: string;
  partDescription?: string;
  clientId: mongoose.Types.ObjectId;
  clientName?: string;
  brandId: mongoose.Types.ObjectId;
  brandName?: string;
  categoryId: mongoose.Types.ObjectId;
  categoryName?: string;
  productId: mongoose.Types.ObjectId;
  productName?: string;
  modelId: mongoose.Types.ObjectId;
  modelNo: string;
  partCategory: 'A. Returnable' | 'B. Non Returnable (To Be Scrap at Site)' | 'C. Consumable';
  returnable: 'Yes' | 'No';
  customerPrice: number;
  price: number;
  status: 'A' | 'I';
  legacyPartId?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SparePartSchema = new Schema<ISparePart>(
  {
    partCode: { type: String, required: true, uppercase: true, trim: true },
    spareName: { type: String, required: true, trim: true },
    partDescription: { type: String, default: '' },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    clientName: { type: String, default: '' },
    brandId: { type: Schema.Types.ObjectId, ref: 'Brand', required: true, index: true },
    brandName: { type: String, default: '' },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    categoryName: { type: String, default: '' },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    productName: { type: String, default: '' },
    modelId: { type: Schema.Types.ObjectId, ref: 'ModelMaster', required: true, index: true },
    modelNo: { type: String, required: true, trim: true },
    partCategory: {
      type: String,
      enum: ['A. Returnable', 'B. Non Returnable (To Be Scrap at Site)', 'C. Consumable'],
      default: 'A. Returnable',
    },
    returnable: { type: String, enum: ['Yes', 'No'], default: 'Yes' },
    customerPrice: { type: Number, default: 0 },
    price: { type: Number, default: 0 },
    status: { type: String, enum: ['A', 'I'], default: 'A' },
    legacyPartId: { type: String, default: '' },
    createdBy: { type: String, default: 'Super Admin' },
    updatedBy: { type: String, default: 'Super Admin' },
  },
  { timestamps: true }
);

SparePartSchema.index({ modelId: 1, partCode: 1, spareName: 1 }, { unique: true });

if (mongoose.models && mongoose.models.SparePart) {
  delete (mongoose.models as any).SparePart;
}

export const SparePart: Model<ISparePart> =
  mongoose.models.SparePart || mongoose.model<ISparePart>('SparePart', SparePartSchema);
