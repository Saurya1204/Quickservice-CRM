import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Category } from '@/models/Category';
import { ClientBrandCategoryMapping } from '@/models/ClientBrandCategoryMapping';

export async function GET() {
  try {
    await connectDB();
    const categories = await Category.find({}).sort({ categoryName: 1 }).lean();
    return NextResponse.json(
      { success: true, data: categories },
      { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' } }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    if (!body.categoryName || !body.categoryName.trim()) {
      return NextResponse.json(
        { success: false, message: 'Category Name is required' },
        { status: 400 }
      );
    }

    body.categoryName = body.categoryName.trim();

    if (!body.categoryCode || !body.categoryCode.trim()) {
      let seq = 1;
      let generatedCode = `CAT${String(seq).padStart(3, '0')}`;
      while (await Category.exists({ categoryCode: generatedCode })) {
        seq++;
        generatedCode = `CAT${String(seq).padStart(3, '0')}`;
      }
      body.categoryCode = generatedCode;
    } else {
      body.categoryCode = body.categoryCode.toUpperCase().trim();
      const existing = await Category.findOne({ categoryCode: body.categoryCode });
      if (existing) {
        return NextResponse.json(
          { success: false, message: `Category code "${body.categoryCode}" already exists` },
          { status: 400 }
        );
      }
    }

    if (!body.status) {
      body.status = 'A';
    }

    const newCategory = await Category.create(body);
    return NextResponse.json({
      success: true,
      data: newCategory,
      message: 'Category created successfully',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id');

    if (!id) {
      try {
        const body = await req.json();
        id = body.id || body._id;
      } catch (e) {}
    }

    if (!id) {
      return NextResponse.json({ success: false, message: 'Category ID is required' }, { status: 400 });
    }

    const deleted = await Category.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ success: false, message: 'Category not found' }, { status: 404 });
    }

    // Clean up mapping references
    try {
      await ClientBrandCategoryMapping.updateMany(
        { assignedCategoryIds: id },
        { $pull: { assignedCategoryIds: id } }
      );
    } catch (cleanErr) {
      console.warn('Notice: Error cleaning mapping references for deleted category:', cleanErr);
    }

    return NextResponse.json({ success: true, message: `Category "${deleted.categoryName}" deleted successfully` });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const targetId = body.id || body._id;

    if (!targetId) {
      return NextResponse.json({ success: false, message: 'Category ID is required' }, { status: 400 });
    }

    const { id, _id, ...updateData } = body;
    if (updateData.categoryCode) {
      updateData.categoryCode = updateData.categoryCode.toUpperCase().trim();
      const existing = await Category.findOne({
        categoryCode: updateData.categoryCode,
        _id: { $ne: targetId },
      });
      if (existing) {
        return NextResponse.json(
          { success: false, message: `Category code "${updateData.categoryCode}" already in use by another category` },
          { status: 400 }
        );
      }
    }
    if (updateData.categoryName) {
      updateData.categoryName = updateData.categoryName.trim();
    }

    const updated = await Category.findByIdAndUpdate(targetId, updateData, { new: true });
    if (!updated) {
      return NextResponse.json({ success: false, message: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated, message: 'Category updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
