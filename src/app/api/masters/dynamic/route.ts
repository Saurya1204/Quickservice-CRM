import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { MasterEntity } from '@/models/MasterEntity';

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get('type');
    const search = searchParams.get('search');

    if (!entityType) {
      return NextResponse.json({ success: false, message: 'Type is required' }, { status: 400 });
    }

    const query: any = { entityType };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    const items = await MasterEntity.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: items });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    if (!body.entityType || !body.name) {
      return NextResponse.json(
        { success: false, message: 'Entity Type and Name are required' },
        { status: 400 }
      );
    }

    if (!body.code) {
      const count = await MasterEntity.countDocuments({ entityType: body.entityType });
      const prefix = body.entityType.substring(0, 3).toUpperCase();
      body.code = `${prefix}${String(count + 1).padStart(4, '0')}`;
    }

    const item = await MasterEntity.create(body);
    return NextResponse.json({ success: true, data: item, message: 'Created successfully' });
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
      return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 });
    }

    const updated = await MasterEntity.findByIdAndUpdate(id, updateData, { new: true });
    return NextResponse.json({ success: true, data: updated, message: 'Updated successfully' });
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

    await MasterEntity.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
