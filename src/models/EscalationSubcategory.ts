import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEscalationSubcategory extends Document {
  name: string;
  code: string;
  categoryId: mongoose.Types.ObjectId;
  categoryName: string;
  categoryCode: string;
  productCategoryId?: mongoose.Types.ObjectId;
  productCategoryName?: string;
  productId?: mongoose.Types.ObjectId;
  productName?: string;
  description?: string;
  responsibleManagerId?: mongoose.Types.ObjectId;
  responsibleManagerName?: string;
  backupManagerId?: mongoose.Types.ObjectId;
  backupManagerName?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  slaHours: number;
  requiredAttachments: string[];
  mandatoryFields: string[];
  workflow: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EscalationSubcategorySchema = new Schema<IEscalationSubcategory>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'EscalationCategory', required: true, index: true },
    categoryName: { type: String, required: true },
    categoryCode: { type: String, required: true },
    productCategoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
    productCategoryName: { type: String, default: 'All' },
    productId: { type: Schema.Types.ObjectId, ref: 'Product' },
    productName: { type: String, default: 'All' },
    description: { type: String, default: '' },
    responsibleManagerId: { type: Schema.Types.ObjectId, ref: 'User' },
    responsibleManagerName: { type: String, default: '' },
    backupManagerId: { type: Schema.Types.ObjectId, ref: 'User' },
    backupManagerName: { type: String, default: '' },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'HIGH',
    },
    slaHours: { type: Number, default: 48 },
    requiredAttachments: { type: [String], default: [] },
    mandatoryFields: { type: [String], default: ['technicalDiagnosis', 'requestedPart'] },
    workflow: { type: String, default: 'STANDARD_APPROVAL' },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
    createdBy: { type: String, default: 'Super Admin' },
    updatedBy: { type: String, default: 'Super Admin' },
  },
  { timestamps: true }
);

EscalationSubcategorySchema.index({ categoryId: 1, name: 1 }, { unique: true });
EscalationSubcategorySchema.index({ productCategoryName: 1, status: 1 });

if (mongoose.models && mongoose.models.EscalationSubcategory) {
  delete (mongoose.models as any).EscalationSubcategory;
}

export const EscalationSubcategory: Model<IEscalationSubcategory> =
  mongoose.models.EscalationSubcategory ||
  mongoose.model<IEscalationSubcategory>('EscalationSubcategory', EscalationSubcategorySchema);
export default EscalationSubcategory;

