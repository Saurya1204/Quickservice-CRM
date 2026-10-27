import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Category } from '@/models/Category';
import { ClientBrandCategoryMapping } from '@/models/ClientBrandCategoryMapping';

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    const brandId = searchParams.get('brandId');

    if (!clientId || !brandId) {
      return NextResponse.json(
        { success: false, message: 'Both clientId and brandId are required' },
        { status: 400 }
      );
    }

    const allCategories = await Category.find({}).sort({ categoryName: 1 });
    const mapping = await ClientBrandCategoryMapping.findOne({ clientId, brandId });

    const assignedIds = new Set(
      mapping ? mapping.assignedCategoryIds.map((id: any) => id.toString()) : []
    );

    const assignedCategories = allCategories.filter((cat) =>
      assignedIds.has((cat._id as any).toString())
    );
    const availableCategories = allCategories.filter(
      (cat) => !assignedIds.has((cat._id as any).toString())
    );

    return NextResponse.json({
      success: true,
      data: {
        assignedCategories,
        availableCategories,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const { clientId, brandId, assignedCategoryIds } = await req.json();

    if (!clientId || !brandId || !Array.isArray(assignedCategoryIds)) {
      return NextResponse.json(
        { success: false, message: 'Invalid payload. clientId, brandId and assignedCategoryIds array are required' },
        { status: 400 }
      );
    }

    const updatedMapping = await ClientBrandCategoryMapping.findOneAndUpdate(
      { clientId, brandId },
      { assignedCategoryIds },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Product Category Mapping saved successfully!',
      data: updatedMapping,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
