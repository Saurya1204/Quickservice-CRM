import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEscalationAssignmentRule extends Document {
  ruleName: string;
  categoryId: mongoose.Types.ObjectId;
  categoryName: string;
  subcategoryId?: mongoose.Types.ObjectId;
  subcategoryName?: string;
  productCategoryName?: string; // e.g. Television, Refrigerator, AC, All
  productCategoryId?: mongoose.Types.ObjectId;
  productName?: string;
  productId?: mongoose.Types.ObjectId;
  brandName?: string;
  managerUserId: mongoose.Types.ObjectId;
  managerName: string;
  backupManagerId?: mongoose.Types.ObjectId;
  backupManagerName?: string;
  branch?: string; // 'All' or specific branch
  zone?: string; // 'All' or specific zone
  franchise?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  slaHours: number;
  rulePriority: number; // lower number = higher evaluation precedence (e.g. 1, 2, 3...)
  status: 'ACTIVE' | 'INACTIVE';
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EscalationAssignmentRuleSchema = new Schema<IEscalationAssignmentRule>(
  {
    ruleName: { type: String, required: true, trim: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'EscalationCategory', required: true, index: true },
    categoryName: { type: String, required: true },
    subcategoryId: { type: Schema.Types.ObjectId, ref: 'EscalationSubcategory' },
    subcategoryName: { type: String, default: 'All' },
    productCategoryName: { type: String, default: 'All', index: true },
    productCategoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
    productName: { type: String, default: 'All' },
    productId: { type: Schema.Types.ObjectId, ref: 'Product' },
    brandName: { type: String, default: 'All' },
    managerUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    managerName: { type: String, required: true },
    backupManagerId: { type: Schema.Types.ObjectId, ref: 'User' },
    backupManagerName: { type: String, default: '' },
    branch: { type: String, default: 'All' },
    zone: { type: String, default: 'All' },
    franchise: { type: String, default: 'All' },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'HIGH',
    },
    slaHours: { type: Number, default: 48 },
    rulePriority: { type: Number, default: 10, index: true },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE', index: true },
    createdBy: { type: String, default: 'Super Admin' },
  },
  { timestamps: true }
);

EscalationAssignmentRuleSchema.index({ status: 1, rulePriority: 1 });

if (mongoose.models && mongoose.models.EscalationAssignmentRule) {
  delete (mongoose.models as any).EscalationAssignmentRule;
}

export const EscalationAssignmentRule: Model<IEscalationAssignmentRule> =
  mongoose.models.EscalationAssignmentRule ||
  mongoose.model<IEscalationAssignmentRule>('EscalationAssignmentRule', EscalationAssignmentRuleSchema);
export default EscalationAssignmentRule;

