import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICallSequence extends Document {
  dateKey: string;      // YYMMDD format in IST, e.g., '261102'
  stateCode: string;    // 2-letter uppercase Indian state code, e.g., 'UP', 'DL', 'HR'
  lastSequence: number; // Incrementing counter (1, 2, 3...)
  createdAt: Date;
  updatedAt: Date;
}

const CallSequenceSchema = new Schema<ICallSequence>(
  {
    dateKey: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    stateCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      maxlength: 2,
    },
    lastSequence: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Compound unique index ensuring independent sequence counter per date + state combination
CallSequenceSchema.index({ dateKey: 1, stateCode: 1 }, { unique: true });

if (mongoose.models && mongoose.models.CallSequence) {
  delete (mongoose.models as any).CallSequence;
}

export const CallSequence: Model<ICallSequence> =
  mongoose.models.CallSequence || mongoose.model<ICallSequence>('CallSequence', CallSequenceSchema);

