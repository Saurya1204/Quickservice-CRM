import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISymptom extends Document {
  symptomCode: string;
  categoryId: mongoose.Types.ObjectId;
  categoryName?: string;
  symptomName: string;
  status: 'A' | 'I';
  legacySymptomId?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SymptomSchema = new Schema<ISymptom>(
  {
    symptomCode: { type: String, required: true, uppercase: true, trim: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    categoryName: { type: String, default: '' },
    symptomName: { type: String, required: true, trim: true },
    status: { type: String, enum: ['A', 'I'], default: 'A' },
    legacySymptomId: { type: String, default: '' },
    createdBy: { type: String, default: 'Super Admin' },
    updatedBy: { type: String, default: 'Super Admin' },
  },
  { timestamps: true }
);

SymptomSchema.index({ categoryId: 1, symptomName: 1 }, { unique: true });

if (mongoose.models && mongoose.models.Symptom) {
  delete (mongoose.models as any).Symptom;
}

export const Symptom: Model<ISymptom> =
  mongoose.models.Symptom || mongoose.model<ISymptom>('Symptom', SymptomSchema);
