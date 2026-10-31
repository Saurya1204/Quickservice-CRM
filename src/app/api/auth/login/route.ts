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

    // Default to Super Admin permissions if user is admin or role not found
    const isSuperAdmin =
      !roleDoc ||
      roleDoc.code === 'SUPER_ADMIN' ||
      user.role === 'SUPER_ADMIN' ||
      user.role === 'Super Admin';

    const roleCode = roleDoc ? roleDoc.code : isSuperAdmin ? 'SUPER_ADMIN' : 'CCO';
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
        assignedZone: user.assignedZone || user.categoryClientRegion || '',
        assignedBranch: user.assignedBranch || user.branch || '',
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
