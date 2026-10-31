import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IStockInventory extends Document {
  productName: string;
  modelNo: string;
  spareName: string;
  partCode: string;
  availableQuantity: number;
  reservedQuantity: number;
  issuedQuantity: number;
  stockLocation: string;
  status: 'A' | 'I';
  lastUpdatedDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const StockInventorySchema = new Schema<IStockInventory>(
  {
    productName: { type: String, required: true },
    modelNo: { type: String, required: true },
    spareName: { type: String, required: true },
    partCode: { type: String, required: true, uppercase: true, trim: true },
    availableQuantity: { type: Number, default: 0 },
    reservedQuantity: { type: Number, default: 0 },
    issuedQuantity: { type: Number, default: 0 },
    stockLocation: { type: String, default: 'SF Hub - Central' },
    status: { type: String, enum: ['A', 'I'], default: 'A' },
    lastUpdatedDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

if (mongoose.models && mongoose.models.StockInventory) {
  delete (mongoose.models as any).StockInventory;
}

export const StockInventory: Model<IStockInventory> =
  mongoose.models.StockInventory ||
  mongoose.model<IStockInventory>('StockInventory', StockInventorySchema);
