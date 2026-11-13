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
    const clientId = searchParams.get('clientId');
    const franchiseId = searchParams.get('franchiseId');
    const scope = searchParams.get('scope');

    const query: any = {};
    if (role && role !== 'ALL') {
      query.role = role;
    }
    if (branch && branch !== 'ALL') {
      query.$or = [{ assignedBranch: branch }, { branch: branch }, { branchName: branch }];
    }
    if (clientId) {
      query.clientId = clientId;
    }
    if (franchiseId) {
      query.franchiseId = franchiseId;
    }
    if (scope && scope !== 'ALL') {
      query.organizationalScope = scope;
    }
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { clientName: { $regex: search, $options: 'i' } },
        { branchName: { $regex: search, $options: 'i' } },
        { franchiseName: { $regex: search, $options: 'i' } },
        { technicianName: { $regex: search, $options: 'i' } },
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
      roleCode,
      roleId,
      reportingTo,
      reportingManagerId,
      organizationalScope,
      // Client Scope
      clientId,
      clientName,
      brandId,
      brandName,
      assignedBrands,
      // Branch Scope
      branchId,
      branchName,
      // Zone Scope
      zoneId,
      zoneName,
      // Franchise Scope
      franchiseId,
      franchiseName,
      // Technician Scope
      technicianId,
      technicianName,
      // Address & Personal
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
      status = 'ACTIVE',
      accountStatus,
      createdBy,
    } = body;

    if (!username || !password || !fullName || !role) {
      return NextResponse.json(
        { success: false, message: 'Username, password, full name and assigned role are mandatory.' },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim();
    const existing = await User.findOne({ username: cleanUsername });
    if (existing) {
      return NextResponse.json(
        { success: false, message: `Username "${cleanUsername}" is already taken. Please choose another.` },
        { status: 400 }
      );
    }

    // Role resolution
    let resolvedRoleId = roleId;
    let resolvedRoleCode = roleCode;
    let foundRole = null;
    if (resolvedRoleId) {
      foundRole = await Role.findById(resolvedRoleId);
    }
    if (!foundRole && role) {
      foundRole = await Role.findOne({
        $or: [{ name: role }, { code: role.toUpperCase().replace(/\s+/g, '_') }],
      });
    }
    if (foundRole) {
      resolvedRoleId = foundRole._id;
      resolvedRoleCode = foundRole.code;
    }

    // Derive organizational scope from role code if not explicitly given
    const normalizedRole = (resolvedRoleCode || role).toUpperCase().replace(/\s+/g, '_');
    let scope = organizationalScope;
    if (!scope) {
      if (normalizedRole.includes('CLIENT')) {
        scope = 'CLIENT';
      } else if (normalizedRole.includes('BRANCH') || normalizedRole === 'BSM') {
        scope = 'BRANCH';
      } else if (normalizedRole.includes('ZONE') || normalizedRole === 'ZSM') {
        scope = 'ZONE';
      } else if (normalizedRole.includes('FRANCHISE')) {
        scope = 'FRANCHISE';
      } else if (normalizedRole.includes('TECH') || normalizedRole === 'ENGINEER') {
        scope = 'TECHNICIAN';
      } else {
        scope = 'NATIONAL';
      }
    }

    // Role-to-Entity Validations
    if (scope === 'CLIENT' && !clientId) {
      return NextResponse.json(
        { success: false, message: 'Selecting an organizational Client is mandatory for Client roles.' },
        { status: 400 }
      );
    }
    if (scope === 'BRANCH' && !branchId && !branchName && !assignedBranch) {
      return NextResponse.json(
        { success: false, message: 'Selecting an assigned Branch is mandatory for Branch Manager roles.' },
        { status: 400 }
      );
    }
    if (scope === 'FRANCHISE' && !franchiseId && !franchiseName) {
      return NextResponse.json(
        { success: false, message: 'Selecting an assigned Franchise partner is mandatory for Franchise Manager roles.' },
        { status: 400 }
      );
    }
    if (scope === 'TECHNICIAN' && !technicianId && !technicianName) {
      return NextResponse.json(
        { success: false, message: 'Selecting an assigned Technician profile is mandatory for Technician / Engineer roles.' },
        { status: 400 }
      );
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const effectiveStatus = accountStatus || status || 'ACTIVE';

    const newUser = await User.create({
      username: cleanUsername,
      passwordHash,
      fullName: fullName.trim(),
      role: role || 'Super Admin',
      roleCode: resolvedRoleCode || normalizedRole,
      roleId: resolvedRoleId,
      reportingTo: reportingTo || '',
      reportingManagerId: reportingManagerId || undefined,

      organizationalScope: scope,
      // Client
      clientId: clientId || undefined,
      clientName: clientName || '',
      brandId: brandId || undefined,
      brandName: brandName || '',
      assignedBrands: Array.isArray(assignedBrands) ? assignedBrands : brandName ? [brandName] : [],

      // Branch
      branchId: branchId || undefined,
      branchName: branchName || assignedBranch || branch || '',

      // Zone
      zoneId: zoneId || '',
      zoneName: zoneName || assignedZone || '',

      // Franchise
      franchiseId: franchiseId || undefined,
      franchiseName: franchiseName || '',

      // Technician
      technicianId: technicianId || undefined,
      technicianName: technicianName || '',

      // Legacy
      assignedZone: assignedZone || zoneName || '',
      assignedBranch: assignedBranch || branchName || branch || '',
      assignedArea: assignedArea || city || '',
      branch: branch || branchName || assignedBranch || '',
      categoryClientRegion: categoryClientRegion || assignedZone || '',

      // Address
      address: address || '',
      landmark: landmark || '',
      pincode: pincode || '',
      state: state || '',
      district: district || '',
      city: city || '',
      locality: locality || '',
      mobile: mobile || '',
      email: email || '',

      status: effectiveStatus,
      accountStatus: effectiveStatus,
      createdBy: createdBy || 'Super Admin',
    });

    await AuditLog.create({
      action: 'USER_CREATE',
      module: 'users',
      entityId: newUser._id.toString(),
      entityName: newUser.username,
      performedBy: createdBy || 'Super Admin',
      details: {
        role: newUser.role,
        scope: newUser.organizationalScope,
        clientName: newUser.clientName,
        branchName: newUser.branchName,
        franchiseName: newUser.franchiseName,
        technicianName: newUser.technicianName,
      },
    });

    return NextResponse.json({
      success: true,
      message: `User "${newUser.username}" created successfully with role ${newUser.role} and scope ${newUser.organizationalScope}!`,
      data: {
        _id: newUser._id,
        username: newUser.username,
        fullName: newUser.fullName,
        role: newUser.role,
        roleCode: newUser.roleCode,
        organizationalScope: newUser.organizationalScope,
        clientName: newUser.clientName,
        status: newUser.status,
      },
    });
  } catch (error: any) {
    console.error('Error in POST /api/users:', error);
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
      roleCode,
      roleId,
      reportingTo,
      reportingManagerId,
      organizationalScope,
      // Client
      clientId,
      clientName,
      brandId,
      brandName,
      assignedBrands,
      // Branch
      branchId,
      branchName,
      // Zone
      zoneId,
      zoneName,
      // Franchise
      franchiseId,
      franchiseName,
      // Technician
      technicianId,
      technicianName,
      // Address & Personal
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
      accountStatus,
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

    // Prevent deactivating or demoting the primary admin
    if (user.username === 'admin' && (status === 'INACTIVE' || accountStatus === 'INACTIVE')) {
      return NextResponse.json(
        { success: false, message: 'The primary admin account cannot be deactivated.' },
        { status: 403 }
      );
    }

    const effectiveStatus = accountStatus || status || user.status;

    const updateData: any = {
      fullName: fullName !== undefined ? fullName : user.fullName,
      role: role !== undefined ? role : user.role,
      roleCode: roleCode !== undefined ? roleCode : user.roleCode,
      reportingTo: reportingTo !== undefined ? reportingTo : user.reportingTo,
      reportingManagerId: reportingManagerId !== undefined ? reportingManagerId : user.reportingManagerId,
      organizationalScope: organizationalScope !== undefined ? organizationalScope : user.organizationalScope,

      // Client
      clientId: clientId !== undefined ? clientId : user.clientId,
      clientName: clientName !== undefined ? clientName : user.clientName,
      brandId: brandId !== undefined ? brandId : user.brandId,
      brandName: brandName !== undefined ? brandName : user.brandName,
      assignedBrands: assignedBrands !== undefined ? assignedBrands : user.assignedBrands,

      // Branch
      branchId: branchId !== undefined ? branchId : user.branchId,
      branchName: branchName !== undefined ? branchName : user.branchName || assignedBranch,

      // Zone
      zoneId: zoneId !== undefined ? zoneId : user.zoneId,
      zoneName: zoneName !== undefined ? zoneName : user.zoneName || assignedZone,

      // Franchise
      franchiseId: franchiseId !== undefined ? franchiseId : user.franchiseId,
      franchiseName: franchiseName !== undefined ? franchiseName : user.franchiseName,

      // Technician
      technicianId: technicianId !== undefined ? technicianId : user.technicianId,
      technicianName: technicianName !== undefined ? technicianName : user.technicianName,

      // Legacy
      assignedZone: assignedZone || zoneName || user.assignedZone,
      assignedBranch: assignedBranch || branchName || branch || user.assignedBranch,
      assignedArea: assignedArea !== undefined ? assignedArea : user.assignedArea,
      branch: branch || branchName || assignedBranch || user.branch,
      categoryClientRegion: categoryClientRegion || assignedZone || user.categoryClientRegion,

      // Address
      address: address !== undefined ? address : user.address,
      landmark: landmark !== undefined ? landmark : user.landmark,
      pincode: pincode !== undefined ? pincode : user.pincode,
      state: state !== undefined ? state : user.state,
      district: district !== undefined ? district : user.district,
      city: city !== undefined ? city : user.city,
      locality: locality !== undefined ? locality : user.locality,
      mobile: mobile !== undefined ? mobile : user.mobile,
      email: email !== undefined ? email : user.email,

      status: effectiveStatus,
      accountStatus: effectiveStatus,
      updatedBy: updatedBy || 'Super Admin',
    };

    if (roleId) {
      updateData.roleId = roleId;
    } else if (role) {
      const foundRole = await Role.findOne({
        $or: [{ name: role }, { code: role.toUpperCase().replace(/\s+/g, '_') }],
      });
      if (foundRole) {
        updateData.roleId = foundRole._id;
        updateData.roleCode = foundRole.code;
      }
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
      details: {
        role: updated?.role,
        scope: updated?.organizationalScope,
        clientName: updated?.clientName,
        status: updated?.status,
      },
    });

    return NextResponse.json({
      success: true,
      message: `User "${updated?.username}" updated successfully!`,
      data: updated,
    });
  } catch (error: any) {
    console.error('Error in PUT /api/users:', error);
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
      return NextResponse.json({ success: false, message: 'Primary administrator account cannot be deleted.' }, { status: 403 });
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
