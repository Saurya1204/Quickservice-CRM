import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Branch } from '@/models/Branch';

export async function GET() {
  try {
    await connectDB();
    const branches = await Branch.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: branches });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    if (!body.branchName || !body.region) {
      return NextResponse.json(
        { success: false, message: 'Branch Name and Region are required' },
        { status: 400 }
      );
    }

    if (!body.crmCode) {
      const count = await Branch.countDocuments();
      body.crmCode = `QSBR${String(count + 1).padStart(3, '0')}`;
    }

    const newBranch = await Branch.create(body);
    return NextResponse.json({ success: true, data: newBranch, message: 'Branch created successfully' });
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
      return NextResponse.json({ success: false, message: 'Branch ID is required' }, { status: 400 });
    }

    const updated = await Branch.findByIdAndUpdate(id, updateData, { new: true });
    return NextResponse.json({ success: true, data: updated, message: 'Branch updated successfully' });
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

    await Branch.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Branch deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
