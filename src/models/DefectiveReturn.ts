import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDefectiveReturn extends Document {
  returnReference: string;
  callNo: string;
  returnDate: Date;
  clientName: string;
  vendorName: string;
  productName: string;
  modelNo: string;
  spareName: string;
  partCode: string;
  defectiveQuantity: number;
  returnReason: string;
  returnStatus: 'Pending Return' | 'In Transit' | 'Received by Vendor' | 'Credit Processed' | 'Closed';
  createdAt: Date;
  updatedAt: Date;
}

const DefectiveReturnSchema = new Schema<IDefectiveReturn>(
  {
    returnReference: { type: String, required: true, unique: true, uppercase: true },
    callNo: { type: String, required: true, uppercase: true },
    returnDate: { type: Date, default: Date.now, index: true },
    clientName: { type: String, required: true },
    vendorName: { type: String, required: true },
    productName: { type: String, required: true },
    modelNo: { type: String, required: true },
    spareName: { type: String, required: true },
    partCode: { type: String, required: true },
    defectiveQuantity: { type: Number, required: true, default: 1 },
    returnReason: { type: String, default: 'Internal Coil/Capacitor Burnt' },
    returnStatus: {
      type: String,
      enum: ['Pending Return', 'In Transit', 'Received by Vendor', 'Credit Processed', 'Closed'],
      default: 'Pending Return',
    },
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.DefectiveReturn) {
  delete (mongoose.models as any).DefectiveReturn;
}

export const DefectiveReturn: Model<IDefectiveReturn> =
  mongoose.models.DefectiveReturn ||
  mongoose.model<IDefectiveReturn>('DefectiveReturn', DefectiveReturnSchema);
