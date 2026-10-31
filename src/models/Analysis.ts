import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAnalysis extends Document {
  analysisCode: string;
  categoryId: mongoose.Types.ObjectId;
  categoryName?: string;
  symptomId: mongoose.Types.ObjectId;
  symptomName?: string;
  causeId: mongoose.Types.ObjectId;
  causeName?: string;
  analysisName: string;
  status: 'A' | 'I';
  legacyAnalysisId?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AnalysisSchema = new Schema<IAnalysis>(
  {
    analysisCode: { type: String, required: true, uppercase: true, trim: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    categoryName: { type: String, default: '' },
    symptomId: { type: Schema.Types.ObjectId, ref: 'Symptom', required: true, index: true },
    symptomName: { type: String, default: '' },
    causeId: { type: Schema.Types.ObjectId, ref: 'Cause', required: true, index: true },
    causeName: { type: String, default: '' },
    analysisName: { type: String, required: true, trim: true },
    status: { type: String, enum: ['A', 'I'], default: 'A' },
    legacyAnalysisId: { type: String, default: '' },
    createdBy: { type: String, default: 'Super Admin' },
    updatedBy: { type: String, default: 'Super Admin' },
  },
  { timestamps: true }
);

AnalysisSchema.index({ causeId: 1, analysisName: 1 }, { unique: true });

if (mongoose.models && mongoose.models.Analysis) {
  delete (mongoose.models as any).Analysis;
}

export const Analysis: Model<IAnalysis> =
  mongoose.models.Analysis || mongoose.model<IAnalysis>('Analysis', AnalysisSchema);
