import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Technician } from '@/models/Technician';

export async function GET() {
  try {
    await connectDB();
    const technicians = await Technician.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: technicians });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    if (!body.technicianName || !body.contactNumber) {
      return NextResponse.json(
        { success: false, message: 'Technician Name and Contact Number are required' },
        { status: 400 }
      );
    }

    if (!body.crmCode) {
      const count = await Technician.countDocuments();
      body.crmCode = `QSSFT${String(count + 1).padStart(4, '0')}`;
    }

    const newTechnician = await Technician.create(body);
    return NextResponse.json({
      success: true,
      data: newTechnician,
      message: 'Technician created successfully',
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
      return NextResponse.json({ success: false, message: 'Technician ID is required' }, { status: 400 });
    }

    const updated = await Technician.findByIdAndUpdate(id, updateData, { new: true });
    return NextResponse.json({ success: true, data: updated, message: 'Technician updated successfully' });
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

    await Technician.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Technician deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
