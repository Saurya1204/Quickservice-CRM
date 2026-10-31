import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPartDemand extends Document {
  callNo: string;
  demandDate: Date;
  clientName: string;
  productName: string;
  modelNo: string;
  spareName: string;
  partCode: string;
  quantityDemanded: number;
  quantityApproved: number;
  quantityIssued: number;
  outstandingQuantity: number;
  demandStatus: 'Pending' | 'Approved' | 'Partially Issued' | 'Issued' | 'Rejected';
  createdAt: Date;
  updatedAt: Date;
}

const PartDemandSchema = new Schema<IPartDemand>(
  {
    callNo: { type: String, required: true, uppercase: true, index: true },
    demandDate: { type: Date, default: Date.now, index: true },
    clientName: { type: String, required: true },
    productName: { type: String, required: true },
    modelNo: { type: String, required: true },
    spareName: { type: String, required: true },
    partCode: { type: String, required: true },
    quantityDemanded: { type: Number, required: true, default: 1 },
    quantityApproved: { type: Number, default: 0 },
    quantityIssued: { type: Number, default: 0 },
    outstandingQuantity: { type: Number, default: 1 },
    demandStatus: {
      type: String,
      enum: ['Pending', 'Approved', 'Partially Issued', 'Issued', 'Rejected'],
      default: 'Pending',
    },
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.PartDemand) {
  delete (mongoose.models as any).PartDemand;
}

export const PartDemand: Model<IPartDemand> =
  mongoose.models.PartDemand ||
  mongoose.model<IPartDemand>('PartDemand', PartDemandSchema);
