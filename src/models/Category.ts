import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICategory extends Document {
  categoryCode: string;
  categoryName: string;
  description?: string;
  status: 'A' | 'I';
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    categoryCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    categoryName: { type: String, required: true, trim: true },
    description: { type: String },
    status: { type: String, enum: ['A', 'I'], default: 'A' },
  },
  { timestamps: true }
);

export const Category: Model<ICategory> =
  mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);
