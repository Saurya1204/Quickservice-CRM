import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPurchaseOrder extends Document {
  poNumber: string;
  poDate: Date;
  vendorId?: mongoose.Types.ObjectId;
  vendorName: string;
  vendorType: string;
  clientId?: mongoose.Types.ObjectId;
  clientName: string;
  sparePartId?: mongoose.Types.ObjectId;
  spareName: string;
  partCode: string;
  quantityOrdered: number;
  unitPrice: number;
  totalAmount: number;
  expectedDeliveryDate?: Date;
  poStatus: 'Pending' | 'Approved' | 'Dispatched' | 'Delivered' | 'Cancelled';
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseOrderSchema = new Schema<IPurchaseOrder>(
  {
    poNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    poDate: { type: Date, default: Date.now, index: true },
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor' },
    vendorName: { type: String, required: true },
    vendorType: { type: String, default: 'Supplier' },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client' },
    clientName: { type: String, required: true },
    sparePartId: { type: Schema.Types.ObjectId, ref: 'SparePart' },
    spareName: { type: String, required: true },
    partCode: { type: String, required: true },
    quantityOrdered: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    expectedDeliveryDate: { type: Date },
    poStatus: {
      type: String,
      enum: ['Pending', 'Approved', 'Dispatched', 'Delivered', 'Cancelled'],
      default: 'Approved',
    },
    createdBy: { type: String, default: 'Super Admin' },
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.PurchaseOrder) {
  delete (mongoose.models as any).PurchaseOrder;
}

export const PurchaseOrder: Model<IPurchaseOrder> =
  mongoose.models.PurchaseOrder ||
  mongoose.model<IPurchaseOrder>('PurchaseOrder', PurchaseOrderSchema);
