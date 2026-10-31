import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INomenclatureAudit {
  previousPrefix: string;
  newPrefix: string;
  previousSequence: number;
  newSequence: number;
  changedBy: string;
  changeDate: Date;
  reason?: string;
  affectedModule?: string;
}

export interface INomenclatureConfig extends Document {
  moduleName: string;
  entityName: string;
  prefix: string;
  separator: string;
  startingSequence: number;
  currentSequence: number;
  numberPadding: number;
  generatedCodeFormat: string;
  status: 'Active' | 'Inactive';
  effectiveDate: Date;
  createdBy: string;
  updatedBy: string;
  auditLogs: INomenclatureAudit[];
  createdAt: Date;
  updatedAt: Date;
}

const NomenclatureAuditSchema = new Schema<INomenclatureAudit>(
  {
    previousPrefix: { type: String, required: true },
    newPrefix: { type: String, required: true },
    previousSequence: { type: Number, required: true },
    newSequence: { type: Number, required: true },
    changedBy: { type: String, default: 'Super Admin' },
    changeDate: { type: Date, default: Date.now },
    reason: { type: String, default: 'Configuration update' },
    affectedModule: { type: String, default: '' },
  },
  { _id: false }
);

const NomenclatureConfigSchema = new Schema<INomenclatureConfig>(
  {
    moduleName: { type: String, required: true, trim: true },
    entityName: { type: String, required: true, trim: true, unique: true },
    prefix: { type: String, required: true, uppercase: true, trim: true },
    separator: { type: String, default: '' },
    startingSequence: { type: Number, default: 1, min: 1 },
    currentSequence: { type: Number, default: 1, min: 0 },
    numberPadding: { type: Number, default: 3, min: 1, max: 10 },
    generatedCodeFormat: { type: String, default: '{PREFIX}{NUMBER}' },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    effectiveDate: { type: Date, default: Date.now },
    createdBy: { type: String, default: 'Super Admin' },
    updatedBy: { type: String, default: 'Super Admin' },
    auditLogs: { type: [NomenclatureAuditSchema], default: [] },
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.NomenclatureConfig) {
  delete (mongoose.models as any).NomenclatureConfig;
}

export const NomenclatureConfig: Model<INomenclatureConfig> =
  mongoose.models.NomenclatureConfig ||
  mongoose.model<INomenclatureConfig>('NomenclatureConfig', NomenclatureConfigSchema);
