import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Category } from '@/models/Category';

export async function GET() {
  try {
    await connectDB();
    const categories = await Category.find({}).sort({ categoryName: 1 });
    return NextResponse.json({ success: true, data: categories });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    if (!body.categoryName) {
      return NextResponse.json(
        { success: false, message: 'Category Name is required' },
        { status: 400 }
      );
    }

    if (!body.categoryCode) {
      const count = await Category.countDocuments();
      body.categoryCode = `CAT${String(count + 1).padStart(3, '0')}`;
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
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 });
    }

    await Category.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Category deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Category ID is required' }, { status: 400 });
    }

    const updated = await Category.findByIdAndUpdate(id, updateData, { new: true });
    return NextResponse.json({ success: true, data: updated, message: 'Category updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
