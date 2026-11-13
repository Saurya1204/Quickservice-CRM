import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { Role } from '@/models/Role';
import { generateDefaultPermissions } from '@/lib/rbac';
import { ensurePredefinedRoles } from '@/lib/initRoles';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    await connectDB();
    await ensurePredefinedRoles();

    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'Username and password are required' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ username: username.trim() });
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid username or password' },
        { status: 401 }
      );
    }

    if (user.status === 'INACTIVE') {
      return NextResponse.json(
        { success: false, message: 'This user account is deactivated. Contact Administrator.' },
        { status: 403 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Resolve user's role and permissions
    let roleDoc = null;
    if (user.roleId) {
      roleDoc = await Role.findById(user.roleId);
    }

    if (!roleDoc && user.role) {
      const normalizedRole = user.role.toUpperCase().replace(/\s+/g, '_');
      roleDoc = await Role.findOne({
        $or: [
          { code: normalizedRole },
          { name: { $regex: new RegExp(`^${user.role}$`, 'i') } },
          { code: user.role.toUpperCase() },
        ],
      });
    }

    // Resolve whether user is Super Admin
    const userRoleLower = (user.role || '').toLowerCase();
    const isSuperAdmin =
      (roleDoc && roleDoc.code === 'SUPER_ADMIN') ||
      userRoleLower === 'super admin' ||
      user.username === 'admin';

    const roleCode = roleDoc
      ? roleDoc.code
      : user.roleCode || (isSuperAdmin ? 'SUPER_ADMIN' : user.role.toUpperCase().replace(/\s+/g, '_'));

    const permissions =
      roleDoc && roleDoc.permissions && roleDoc.permissions.length > 0
        ? roleDoc.permissions
        : generateDefaultPermissions(roleCode);

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        role: roleDoc ? roleDoc.name : user.role,
        roleCode: roleCode,
        hierarchyLevel: roleDoc ? roleDoc.hierarchyLevel : isSuperAdmin ? 1 : 7,
        organizationalScope: user.organizationalScope || 'NATIONAL',
        clientId: user.clientId || null,
        clientName: user.clientName || '',
        brandId: user.brandId || null,
        brandName: user.brandName || '',
        assignedBrands: user.assignedBrands || [],
        branchId: user.branchId || null,
        branchName: user.branchName || user.assignedBranch || user.branch || '',
        zoneId: user.zoneId || '',
        zoneName: user.zoneName || user.assignedZone || '',
        franchiseId: user.franchiseId || null,
        franchiseName: user.franchiseName || '',
        technicianId: user.technicianId || null,
        technicianName: user.technicianName || '',
        assignedZone: user.assignedZone || user.zoneName || '',
        assignedBranch: user.assignedBranch || user.branchName || '',
        assignedArea: user.assignedArea || '',
        permissions,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
