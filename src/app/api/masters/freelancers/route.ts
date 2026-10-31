import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Freelancer } from '@/models/Freelancer';
import { AuditLog } from '@/models/AuditLog';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const branch = searchParams.get('branch') || '';
    const region = searchParams.get('region') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const query: any = {};
    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { freelancerName: regex },
        { freelancerCode: regex },
        { contactNumber: regex },
        { emailId: regex },
        { city: regex },
        { skillSet: regex },
      ];
    }
    if (branch && branch !== 'all') {
      query.branchName = branch;
    }
    if (region && region !== 'all') {
      query.region = region;
    }
    if (status && status !== 'all') {
      query.status = status;
    }

    const skip = (page - 1) * limit;
    const total = await Freelancer.countDocuments(query);
    const freelancers = await Freelancer.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return NextResponse.json({
      success: true,
      data: freelancers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error: any) {
    console.error('Error fetching freelancers:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    if (!body.freelancerName || !body.contactNumber) {
      return NextResponse.json(
        { success: false, message: 'Freelancer Name and Contact Number are required' },
        { status: 400 }
      );
    }

    if (!body.freelancerCode) {
      const count = await Freelancer.countDocuments();
      body.freelancerCode = `QSFL${String(count + 1).padStart(4, '0')}`;
    } else {
      const existing = await Freelancer.findOne({
        freelancerCode: body.freelancerCode.toUpperCase().trim(),
      });
      if (existing) {
        return NextResponse.json(
          { success: false, message: `Freelancer ID "${body.freelancerCode}" already exists.` },
          { status: 409 }
        );
      }
      body.freelancerCode = body.freelancerCode.toUpperCase().trim();
    }

    const newFreelancer = await Freelancer.create(body);

    await AuditLog.create({
      action: 'CREATE_FREELANCER',
      module: 'FREELANCE_MASTER',
      performedBy: body.createdBy || 'Super Admin',
      entityId: newFreelancer._id.toString(),
      details: `Created Freelancer "${newFreelancer.freelancerName}" (${newFreelancer.freelancerCode})`,
    }).catch(() => null);

    return NextResponse.json(
      {
        success: true,
        data: newFreelancer,
        message: `Freelancer "${newFreelancer.freelancerName}" (${newFreelancer.freelancerCode}) created successfully!`,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating freelancer:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Freelancer ID is required' }, { status: 400 });
    }

    const updated = await Freelancer.findByIdAndUpdate(id, updateData, { new: true });
    if (!updated) {
      return NextResponse.json({ success: false, message: 'Freelancer not found' }, { status: 404 });
    }

    await AuditLog.create({
      action: 'UPDATE_FREELANCER',
      module: 'FREELANCE_MASTER',
      performedBy: body.updatedBy || 'Super Admin',
      entityId: id,
      details: `Updated Freelancer "${updated.freelancerName}" (${updated.freelancerCode})`,
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Freelancer "${updated.freelancerName}" updated successfully!`,
    });
  } catch (error: any) {
    console.error('Error updating freelancer:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Freelancer ID is required' }, { status: 400 });
    }

    const freelancer = await Freelancer.findById(id);
    if (!freelancer) {
      return NextResponse.json({ success: false, message: 'Freelancer not found' }, { status: 404 });
    }

    await Freelancer.findByIdAndDelete(id);

    await AuditLog.create({
      action: 'DELETE_FREELANCER',
      module: 'FREELANCE_MASTER',
      performedBy: 'Super Admin',
      entityId: id,
      details: `Deleted Freelancer "${freelancer.freelancerName}" (${freelancer.freelancerCode})`,
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      message: `Freelancer "${freelancer.freelancerName}" deleted successfully!`,
    });
  } catch (error: any) {
    console.error('Error deleting freelancer:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
