import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMasterEntity extends Document {
  entityType: string;
  code: string;
  name: string;
  category?: string;
  subText?: string;
  field1?: string;
  field2?: string;
  field3?: string;
  status: 'Active' | 'Inactive';
  createdAt: Date;
  updatedAt: Date;
}

const MasterEntitySchema = new Schema<IMasterEntity>(
  {
    entityType: { type: String, required: true, index: true },
    code: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, trim: true },
    subText: { type: String, trim: true },
    field1: { type: String, trim: true },
    field2: { type: String, trim: true },
    field3: { type: String, trim: true },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  },
  { timestamps: true }
);

MasterEntitySchema.index({ entityType: 1, code: 1 });

export const MasterEntity: Model<IMasterEntity> =
  mongoose.models.MasterEntity || mongoose.model<IMasterEntity>('MasterEntity', MasterEntitySchema);
