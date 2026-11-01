import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { MasterEntity } from '@/models/MasterEntity';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get('type');
    const search = searchParams.get('search');

    if (!entityType) {
      return NextResponse.json({ success: false, message: 'Type is required' }, { status: 400 });
    }

    const query: any = {};
    if (entityType.includes(',')) {
      query.entityType = { $in: entityType.split(',').map((s) => s.trim()) };
    } else if (entityType.endsWith('*')) {
      query.entityType = { $regex: `^${entityType.replace('*', '')}`, $options: 'i' };
    } else {
      query.entityType = entityType;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    const items = await MasterEntity.find(query).sort({ createdAt: 1 }).lean();
    return NextResponse.json(
      { success: true, data: items },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
        },
      }
    );
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

    // Check if duplicate already exists for this entityType & name
    const existing = await MasterEntity.findOne({
      entityType: body.entityType,
      name: { $regex: `^${body.name.trim()}$`, $options: 'i' },
    });
    if (existing) {
      return NextResponse.json({ success: true, data: existing, message: 'Option already exists' });
    }

    const item = await MasterEntity.create({
      ...body,
      name: body.name.trim(),
      status: body.status || 'Active',
    });
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

    const updated = await MasterEntity.findByIdAndUpdate(id, updateData, { new: true }).lean();
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
    const entityType = searchParams.get('type');
    const name = searchParams.get('name');

    if (id) {
      await MasterEntity.findByIdAndDelete(id);
      return NextResponse.json({ success: true, message: 'Deleted successfully' });
    }

    if (entityType && name) {
      await MasterEntity.deleteMany({
        entityType,
        name: { $regex: `^${name.trim()}$`, $options: 'i' },
      });
      return NextResponse.json({ success: true, message: 'Deleted successfully' });
    }

    return NextResponse.json({ success: false, message: 'ID or (type and name) is required' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
