import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Brand } from '@/models/Brand';
import { Client } from '@/models/Client';

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');

    const query: any = {};
    if (clientId) {
      query.clientId = clientId;
    }

    const brands = await Brand.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: brands });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    if (!body.brandName || !body.clientId) {
      return NextResponse.json(
        { success: false, message: 'Brand Name and Client are required' },
        { status: 400 }
      );
    }

    const client = await Client.findById(body.clientId);
    if (client) {
      body.clientName = client.clientName;
    }

    if (!body.brandCode) {
      const count = await Brand.countDocuments();
      body.brandCode = `QSBRD${String(count + 1).padStart(3, '0')}`;
    }

    const newBrand = await Brand.create(body);
    return NextResponse.json({
      success: true,
      data: newBrand,
      message: 'Brand created successfully',
    });
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
      return NextResponse.json({ success: false, message: 'Brand ID is required' }, { status: 400 });
    }

    if (updateData.clientId) {
      const client = await Client.findById(updateData.clientId);
      if (client) {
        updateData.clientName = client.clientName;
      }
    }

    const updated = await Brand.findByIdAndUpdate(id, updateData, { new: true });
    return NextResponse.json({ success: true, data: updated, message: 'Brand updated successfully' });
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

    await Brand.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Brand deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
