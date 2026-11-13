import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEscalationModuleMapping extends Document {
  moduleKey: string;
  moduleName: string;
  description: string;
  enabled: boolean;
  allowedCategories: mongoose.Types.ObjectId[];
  allowedRoles: string[];
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EscalationModuleMappingSchema = new Schema<IEscalationModuleMapping>(
  {
    moduleKey: { type: String, required: true, unique: true, trim: true },
    moduleName: { type: String, required: true },
    description: { type: String, default: '' },
    enabled: { type: Boolean, default: true },
    allowedCategories: [{ type: Schema.Types.ObjectId, ref: 'EscalationCategory' }],
    allowedRoles: { type: [String], default: ['*'] },
    updatedBy: { type: String, default: 'Super Admin' },
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.EscalationModuleMapping) {
  delete (mongoose.models as any).EscalationModuleMapping;
}

export const EscalationModuleMapping: Model<IEscalationModuleMapping> =
  mongoose.models.EscalationModuleMapping ||
  mongoose.model<IEscalationModuleMapping>('EscalationModuleMapping', EscalationModuleMappingSchema);
export default EscalationModuleMapping;

