import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReopenRecord {
  reopenedBy: string;
  reopenedAt: Date;
  reason: string;
  previousStatus: string;
}

export interface IServiceCall extends Document {
  callNo: string;
  customerName: string;
  customerMobile: string;
  customerAddress: string;
  city: string;
  state: string;
  pincode: string;
  clientName: string;
  brandName: string;
  categoryName: string;
  reportedFault: string;
  technicianName?: string;
  branch?: string;
  region?: string;
  productName?: string;
  modelNo?: string;
  serialNo?: string;
  symptomName?: string;
  causeName?: string;
  analysisName?: string;
  completedDate?: Date;
  serviceRemarks?: string;
  sparePartsUsed?: string;
  cancelledDate?: Date;
  cancellationReason?: string;
  cancelledBy?: string;
  replacementDetails?: {
    replacementType?: string;
    oldPartOrProduct?: string;
    newPartOrProduct?: string;
    replacementReason?: string;
    replacementDate?: Date;
  };
  callStatus: 'OPEN' | 'APPOINTMENT' | 'ALLOTED' | 'PART_PENDING' | 'COMPLETED' | 'CANCEL' | 'REOPENED';
  appointmentDate?: Date;
  daysPending: number;
  reopenHistory: IReopenRecord[];
  createdAt: Date;
  updatedAt: Date;
}

const ReopenRecordSchema = new Schema<IReopenRecord>(
  {
    reopenedBy: { type: String, required: true },
    reopenedAt: { type: Date, default: Date.now },
    reason: { type: String, required: true },
    previousStatus: { type: String, required: true },
  },
  { _id: false }
);

const ServiceCallSchema = new Schema<IServiceCall>(
  {
    callNo: { type: String, required: true, unique: true, uppercase: true },
    customerName: { type: String, required: true },
    customerMobile: { type: String, required: true },
    customerAddress: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    clientName: { type: String, required: true },
    brandName: { type: String, required: true },
    categoryName: { type: String, required: true },
    reportedFault: { type: String, required: true },
    technicianName: { type: String },
    branch: { type: String, default: '' },
    region: { type: String, default: 'North' },
    productName: { type: String, default: '' },
    modelNo: { type: String, default: '' },
    serialNo: { type: String, default: '' },
    symptomName: { type: String, default: '' },
    causeName: { type: String, default: '' },
    analysisName: { type: String, default: '' },
    completedDate: { type: Date },
    serviceRemarks: { type: String, default: '' },
    sparePartsUsed: { type: String, default: '' },
    cancelledDate: { type: Date },
    cancellationReason: { type: String, default: '' },
    cancelledBy: { type: String, default: '' },
    replacementDetails: {
      replacementType: { type: String, default: '' },
      oldPartOrProduct: { type: String, default: '' },
      newPartOrProduct: { type: String, default: '' },
      replacementReason: { type: String, default: '' },
      replacementDate: { type: Date },
    },
    callStatus: {
      type: String,
      enum: ['OPEN', 'APPOINTMENT', 'ALLOTED', 'PART_PENDING', 'COMPLETED', 'CANCEL', 'REOPENED'],
      default: 'OPEN',
    },
    appointmentDate: { type: Date },
    daysPending: { type: Number, default: 0 },
    reopenHistory: { type: [ReopenRecordSchema], default: [] },
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.ServiceCall) {
  delete (mongoose.models as any).ServiceCall;
}

export const ServiceCall: Model<IServiceCall> =
  mongoose.models.ServiceCall || mongoose.model<IServiceCall>('ServiceCall', ServiceCallSchema);
