import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Branch } from '@/models/Branch';
import { AuditLog } from '@/models/AuditLog';

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const region = searchParams.get('region');
    const status = searchParams.get('status');

    const query: any = {};
    if (region && region !== 'ALL') {
      query.region = region;
    }
    if (status && status !== 'ALL') {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { branchName: { $regex: search, $options: 'i' } },
        { crmCode: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { district: { $regex: search, $options: 'i' } },
        { pincode: { $regex: search, $options: 'i' } },
        { branchManagerName: { $regex: search, $options: 'i' } },
      ];
    }

    const branches = await Branch.find(query).sort({ createdAt: -1 });
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
        { success: false, message: 'Branch Name and Region are mandatory fields.' },
        { status: 400 }
      );
    }

    // Check for duplicate branch name in same region
    const duplicate = await Branch.findOne({
      branchName: { $regex: new RegExp(`^${body.branchName.trim()}$`, 'i') },
      region: body.region,
    });
    if (duplicate) {
      return NextResponse.json(
        { success: false, message: `Branch "${body.branchName}" already exists in the ${body.region} region.` },
        { status: 400 }
      );
    }

    if (!body.crmCode) {
      const count = await Branch.countDocuments();
      body.crmCode = `QSBR${String(count + 1).padStart(3, '0')}`;
    }

    const newBranch = await Branch.create(body);

    await AuditLog.create({
      action: 'BRANCH_CREATE',
      module: 'branchMaster',
      entityId: newBranch._id.toString(),
      entityName: newBranch.branchName,
      performedBy: body.createdBy || 'Super Admin',
      details: { crmCode: newBranch.crmCode, region: newBranch.region },
    });

    return NextResponse.json({
      success: true,
      data: newBranch,
      message: `Branch "${newBranch.branchName}" (${newBranch.crmCode}) created successfully!`,
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
      return NextResponse.json({ success: false, message: 'Branch ID is required' }, { status: 400 });
    }

    const updated = await Branch.findByIdAndUpdate(id, updateData, { new: true });
    if (!updated) {
      return NextResponse.json({ success: false, message: 'Branch not found' }, { status: 404 });
    }

    await AuditLog.create({
      action: 'BRANCH_UPDATE',
      module: 'branchMaster',
      entityId: id,
      entityName: updated.branchName,
      performedBy: updateData.updatedBy || 'Super Admin',
      details: { crmCode: updated.crmCode, status: updated.status },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Branch "${updated.branchName}" updated successfully!`,
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
      return NextResponse.json({ success: false, message: 'Branch ID is required' }, { status: 400 });
    }

    const branch = await Branch.findById(id);
    if (!branch) {
      return NextResponse.json({ success: false, message: 'Branch not found' }, { status: 404 });
    }

    await Branch.findByIdAndDelete(id);

    await AuditLog.create({
      action: 'BRANCH_DELETE',
      module: 'branchMaster',
      entityId: id,
      entityName: branch.branchName,
      performedBy: 'Super Admin',
    });

    return NextResponse.json({ success: true, message: `Branch "${branch.branchName}" deleted successfully.` });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
