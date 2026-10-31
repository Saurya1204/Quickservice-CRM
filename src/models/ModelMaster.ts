import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IModelMaster extends Document {
  modelCode: string;
  modelNo: string;
  modelDescription?: string;
  clientId: mongoose.Types.ObjectId;
  clientName?: string;
  brandId: mongoose.Types.ObjectId;
  brandName?: string;
  categoryId: mongoose.Types.ObjectId;
  categoryName?: string;
  productId: mongoose.Types.ObjectId;
  productName?: string;
  sizeCapacity?: string;
  colour?: string;
  manufacturingStartDate?: Date;
  manufacturingStopDate?: Date;
  serialNumberLimitMin?: number;
  serialNumberLimitMax?: number;
  warrantyPeriod?: number;
  warrantyType?: 'Comprehensive' | 'Non Comprehensive';
  specificWarranty?: string;
  specificWarrantyType?: string;
  specificParts?: string;
  specificPeriod?: string;
  status: 'A' | 'I';
  legacyModelId?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ModelMasterSchema = new Schema<IModelMaster>(
  {
    modelCode: { type: String, required: true, uppercase: true, trim: true },
    modelNo: { type: String, required: true, trim: true },
    modelDescription: { type: String, default: '' },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    clientName: { type: String, default: '' },
    brandId: { type: Schema.Types.ObjectId, ref: 'Brand', required: true, index: true },
    brandName: { type: String, default: '' },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    categoryName: { type: String, default: '' },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    productName: { type: String, default: '' },
    sizeCapacity: { type: String, default: '' },
    colour: { type: String, default: '' },
    manufacturingStartDate: { type: Date },
    manufacturingStopDate: { type: Date },
    serialNumberLimitMin: { type: Number, default: 0 },
    serialNumberLimitMax: { type: Number, default: 99999999 },
    warrantyPeriod: { type: Number, default: 12 },
    warrantyType: { type: String, enum: ['Comprehensive', 'Non Comprehensive'], default: 'Comprehensive' },
    specificWarranty: { type: String, default: '' },
    specificWarrantyType: { type: String, default: '' },
    specificParts: { type: String, default: '' },
    specificPeriod: { type: String, default: '' },
    status: { type: String, enum: ['A', 'I'], default: 'A' },
    legacyModelId: { type: String, default: '' },
    createdBy: { type: String, default: 'Super Admin' },
    updatedBy: { type: String, default: 'Super Admin' },
  },
  { timestamps: true }
);

ModelMasterSchema.index({ clientId: 1, brandId: 1, categoryId: 1, productId: 1, modelNo: 1 }, { unique: true });

if (mongoose.models && mongoose.models.ModelMaster) {
  delete (mongoose.models as any).ModelMaster;
}

export const ModelMaster: Model<IModelMaster> =
  mongoose.models.ModelMaster || mongoose.model<IModelMaster>('ModelMaster', ModelMasterSchema);
