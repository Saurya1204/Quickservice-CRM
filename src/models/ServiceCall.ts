import mongoose, { Schema, Document, Model } from 'mongoose';

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
  callStatus: 'OPEN' | 'APPOINTMENT' | 'ALLOTED' | 'PART_PENDING' | 'COMPLETED' | 'CANCEL';
  appointmentDate?: Date;
  daysPending: number;
  createdAt: Date;
  updatedAt: Date;
}

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
    callStatus: {
      type: String,
      enum: ['OPEN', 'APPOINTMENT', 'ALLOTED', 'PART_PENDING', 'COMPLETED', 'CANCEL'],
      default: 'OPEN',
    },
    appointmentDate: { type: Date },
    daysPending: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const ServiceCall: Model<IServiceCall> =
  mongoose.models.ServiceCall || mongoose.model<IServiceCall>('ServiceCall', ServiceCallSchema);
