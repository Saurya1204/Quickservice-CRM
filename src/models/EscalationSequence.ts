import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEscalationSequence extends Document {
  year: number;
  lastSequence: number;
}

const EscalationSequenceSchema = new Schema<IEscalationSequence>(
  {
    year: { type: Number, required: true, unique: true },
    lastSequence: { type: Number, default: 0 },
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.EscalationSequence) {
  delete (mongoose.models as any).EscalationSequence;
}

export const EscalationSequence: Model<IEscalationSequence> =
  mongoose.models.EscalationSequence ||
  mongoose.model<IEscalationSequence>('EscalationSequence', EscalationSequenceSchema);
export default EscalationSequence;

