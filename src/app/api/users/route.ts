import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { Role } from '@/models/Role';
import { AuditLog } from '@/models/AuditLog';
import bcrypt from 'bcryptjs';

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const role = searchParams.get('role');
    const branch = searchParams.get('branch');

    const query: any = {};
    if (role && role !== 'ALL') {
      query.role = role;
    }
    if (branch && branch !== 'ALL') {
      query.$or = [{ assignedBranch: branch }, { branch: branch }];
    }
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query, '-passwordHash').sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: users });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const {
      username,
      password,
      fullName,
      role,
      roleId,
      reportingTo,
      assignedZone,
      assignedBranch,
      assignedArea,
      branch,
      categoryClientRegion,
      address,
      landmark,
      pincode,
      state,
      district,
      city,
      locality,
      mobile,
      email,
      status,
      createdBy,
    } = body;

    if (!username || !password || !fullName) {
      return NextResponse.json(
        { success: false, message: 'Username, password and full name are mandatory.' },
        { status: 400 }
      );
    }

    const existing = await User.findOne({ username: username.trim() });
    if (existing) {
      return NextResponse.json(
        { success: false, message: `Username "${username}" is already taken.` },
        { status: 400 }
      );
    }

    // Resolve roleId if not provided
    let resolvedRoleId = roleId;
    if (!resolvedRoleId && role) {
      const foundRole = await Role.findOne({
        $or: [{ name: role }, { code: role.toUpperCase().replace(/\s+/g, '_') }],
      });
      if (foundRole) resolvedRoleId = foundRole._id;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      username: username.trim(),
      passwordHash,
      fullName: fullName.trim(),
      role: role || 'Super Admin',
      roleId: resolvedRoleId,
      reportingTo: reportingTo || '',
      assignedZone: assignedZone || '',
      assignedBranch: assignedBranch || branch || '',
      assignedArea: assignedArea || '',
      branch: branch || assignedBranch || '',
      categoryClientRegion: categoryClientRegion || assignedZone || '',
      address: address || '',
      landmark: landmark || '',
      pincode: pincode || '',
      state: state || '',
      district: district || '',
      city: city || '',
      locality: locality || '',
      mobile: mobile || '',
      email: email || '',
      status: status || 'ACTIVE',
    });

    await AuditLog.create({
      action: 'USER_CREATE',
      module: 'users',
      entityId: newUser._id.toString(),
      entityName: newUser.username,
      performedBy: createdBy || 'Super Admin',
      details: { role: newUser.role, assignedBranch: newUser.assignedBranch },
    });

    return NextResponse.json({
      success: true,
      message: `User "${newUser.username}" created successfully!`,
      data: {
        _id: newUser._id,
        username: newUser.username,
        fullName: newUser.fullName,
        role: newUser.role,
        status: newUser.status,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const {
      id,
      fullName,
      role,
      roleId,
      reportingTo,
      assignedZone,
      assignedBranch,
      assignedArea,
      branch,
      categoryClientRegion,
      address,
      landmark,
      pincode,
      state,
      district,
      city,
      locality,
      mobile,
      email,
      status,
      password,
      updatedBy,
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'User ID is required' }, { status: 400 });
    }

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // Prevent deactivating or demoting the primary admin if it's the only one
    if (user.username === 'admin' && status === 'INACTIVE') {
      return NextResponse.json(
        { success: false, message: 'The primary admin account cannot be deactivated.' },
        { status: 403 }
      );
    }

    const updateData: any = {
      fullName,
      role,
      reportingTo,
      assignedZone,
      assignedBranch: assignedBranch || branch,
      assignedArea,
      branch: branch || assignedBranch,
      categoryClientRegion: categoryClientRegion || assignedZone,
      address,
      landmark,
      pincode,
      state,
      district,
      city,
      locality,
      mobile,
      email,
      status,
    };

    if (roleId) {
      updateData.roleId = roleId;
    } else if (role) {
      const foundRole = await Role.findOne({
        $or: [{ name: role }, { code: role.toUpperCase().replace(/\s+/g, '_') }],
      });
      if (foundRole) updateData.roleId = foundRole._id;
    }

    if (password && password.trim()) {
      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(password, salt);
    }

    const updated = await User.findByIdAndUpdate(id, updateData, { new: true }).select('-passwordHash');

    await AuditLog.create({
      action: 'USER_UPDATE',
      module: 'users',
      entityId: id,
      entityName: updated?.username,
      performedBy: updatedBy || 'Super Admin',
      details: { role: updated?.role, status: updated?.status },
    });

    return NextResponse.json({
      success: true,
      message: `User "${updated?.username}" updated successfully!`,
      data: updated,
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
      return NextResponse.json({ success: false, message: 'User ID is required' }, { status: 400 });
    }

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    if (user.username === 'admin') {
      return NextResponse.json(
        { success: false, message: 'The primary system admin account cannot be deleted.' },
        { status: 403 }
      );
    }

    await User.findByIdAndDelete(id);

    await AuditLog.create({
      action: 'USER_DELETE',
      module: 'users',
      entityId: id,
      entityName: user.username,
      performedBy: 'Super Admin',
    });

    return NextResponse.json({ success: true, message: `User "${user.username}" deleted successfully.` });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
