import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Franchise } from '@/models/Franchise';

export async function GET() {
  try {
    await connectDB();
    const franchises = await Franchise.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: franchises });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    if (!body.firmName || !body.region) {
      return NextResponse.json(
        { success: false, message: 'Firm Name and Region are required' },
        { status: 400 }
      );
    }

    if (!body.crmCode) {
      const count = await Franchise.countDocuments();
      body.crmCode = `QSSF${String(count + 1).padStart(3, '0')}`;
    }

    const newFranchise = await Franchise.create(body);
    return NextResponse.json({ success: true, data: newFranchise, message: 'Franchise created successfully' });
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
      return NextResponse.json({ success: false, message: 'Franchise ID is required' }, { status: 400 });
    }

    const updated = await Franchise.findByIdAndUpdate(id, updateData, { new: true });
    return NextResponse.json({ success: true, data: updated, message: 'Franchise updated successfully' });
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

    await Franchise.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Franchise deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
