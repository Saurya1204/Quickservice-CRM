import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPincodeMappingHistory {
  previousFranchiseId?: mongoose.Types.ObjectId;
  previousFranchiseCode?: string;
  previousFranchiseName?: string;
  newFranchiseId: mongoose.Types.ObjectId;
  newFranchiseCode: string;
  newFranchiseName: string;
  updatedBy: string;
  updatedAt: Date;
  remarks?: string;
}

export interface IFranchisePincodeMapping extends Document {
  pincode: string;
  franchiseId: mongoose.Types.ObjectId;
  franchiseCode: string;
  franchiseName: string;
  state?: string;
  district?: string;
  city?: string;
  locality?: string;
  isActive: boolean;
  history: IPincodeMappingHistory[];
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PincodeMappingHistorySchema = new Schema<IPincodeMappingHistory>(
  {
    previousFranchiseId: { type: Schema.Types.ObjectId, ref: 'Franchise' },
    previousFranchiseCode: { type: String, default: '' },
    previousFranchiseName: { type: String, default: '' },
    newFranchiseId: { type: Schema.Types.ObjectId, ref: 'Franchise', required: true },
    newFranchiseCode: { type: String, required: true },
    newFranchiseName: { type: String, required: true },
    updatedBy: { type: String, default: 'Super Admin' },
    updatedAt: { type: Date, default: Date.now },
    remarks: { type: String, default: '' },
  },
  { _id: false }
);

const FranchisePincodeMappingSchema = new Schema<IFranchisePincodeMapping>(
  {
    pincode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 6,
      index: true,
    },
    franchiseId: {
      type: Schema.Types.ObjectId,
      ref: 'Franchise',
      required: true,
      index: true,
    },
    franchiseCode: {
      type: String,
      required: true,
      trim: true,
    },
    franchiseName: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      default: '',
      trim: true,
    },
    district: {
      type: String,
      default: '',
      trim: true,
    },
    city: {
      type: String,
      default: '',
      trim: true,
    },
    locality: {
      type: String,
      default: '',
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    history: {
      type: [PincodeMappingHistorySchema],
      default: [],
    },
    createdBy: {
      type: String,
      default: 'Super Admin',
    },
    updatedBy: {
      type: String,
      default: 'Super Admin',
    },
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.FranchisePincodeMapping) {
  delete (mongoose.models as any).FranchisePincodeMapping;
}

export const FranchisePincodeMapping: Model<IFranchisePincodeMapping> =
  mongoose.models.FranchisePincodeMapping ||
  mongoose.model<IFranchisePincodeMapping>('FranchisePincodeMapping', FranchisePincodeMappingSchema);
