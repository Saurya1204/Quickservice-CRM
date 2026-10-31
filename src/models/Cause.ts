import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICause extends Document {
  causeCode: string;
  categoryId: mongoose.Types.ObjectId;
  categoryName?: string;
  symptomId: mongoose.Types.ObjectId;
  symptomName?: string;
  causeName: string;
  status: 'A' | 'I';
  legacyCauseId?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CauseSchema = new Schema<ICause>(
  {
    causeCode: { type: String, required: true, uppercase: true, trim: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    categoryName: { type: String, default: '' },
    symptomId: { type: Schema.Types.ObjectId, ref: 'Symptom', required: true, index: true },
    symptomName: { type: String, default: '' },
    causeName: { type: String, required: true, trim: true },
    status: { type: String, enum: ['A', 'I'], default: 'A' },
    legacyCauseId: { type: String, default: '' },
    createdBy: { type: String, default: 'Super Admin' },
    updatedBy: { type: String, default: 'Super Admin' },
  },
  { timestamps: true }
);

CauseSchema.index({ symptomId: 1, causeName: 1 }, { unique: true });

if (mongoose.models && mongoose.models.Cause) {
  delete (mongoose.models as any).Cause;
}

export const Cause: Model<ICause> =
  mongoose.models.Cause || mongoose.model<ICause>('Cause', CauseSchema);
