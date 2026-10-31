import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPartConsumption extends Document {
  consumptionId: string;
  consumptionDate: Date;
  callNo: string;
  clientName: string;
  productName: string;
  modelNo: string;
  spareName: string;
  partCode: string;
  quantityConsumed: number;
  stockLocation: string;
  engineer: string;
  transactionReference: string;
  createdAt: Date;
  updatedAt: Date;
}

const PartConsumptionSchema = new Schema<IPartConsumption>(
  {
    consumptionId: { type: String, required: true, unique: true, uppercase: true },
    consumptionDate: { type: Date, default: Date.now, index: true },
    callNo: { type: String, required: true, uppercase: true, index: true },
    clientName: { type: String, required: true },
    productName: { type: String, required: true },
    modelNo: { type: String, required: true },
    spareName: { type: String, required: true },
    partCode: { type: String, required: true },
    quantityConsumed: { type: Number, required: true, default: 1 },
    stockLocation: { type: String, default: 'SF Hub - Central' },
    engineer: { type: String, default: 'Assigned Engineer' },
    transactionReference: { type: String, default: '' },
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.PartConsumption) {
  delete (mongoose.models as any).PartConsumption;
}

export const PartConsumption: Model<IPartConsumption> =
  mongoose.models.PartConsumption ||
  mongoose.model<IPartConsumption>('PartConsumption', PartConsumptionSchema);
