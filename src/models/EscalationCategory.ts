import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEscalationCategory extends Document {
  name: string;
  code: string;
  description?: string;
  department?: string;
  associatedProductCategory?: string;
  defaultManagerId?: mongoose.Types.ObjectId;
  defaultManagerName?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  approvalRequired: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EscalationCategorySchema = new Schema<IEscalationCategory>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, default: '' },
    department: { type: String, default: 'Technical Services' },
    associatedProductCategory: { type: String, default: 'All' },
    defaultManagerId: { type: Schema.Types.ObjectId, ref: 'User' },
    defaultManagerName: { type: String, default: '' },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
    },
    approvalRequired: { type: Boolean, default: true },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
    createdBy: { type: String, default: 'Super Admin' },
    updatedBy: { type: String, default: 'Super Admin' },
  },
  { timestamps: true }
);

EscalationCategorySchema.index({ status: 1, name: 1 });

if (mongoose.models && mongoose.models.EscalationCategory) {
  delete (mongoose.models as any).EscalationCategory;
}

export const EscalationCategory: Model<IEscalationCategory> =
  mongoose.models.EscalationCategory ||
  mongoose.model<IEscalationCategory>('EscalationCategory', EscalationCategorySchema);
export default EscalationCategory;

