import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { Role } from '@/models/Role';
import { generateDefaultPermissions } from '@/lib/rbac';

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const username = searchParams.get('username');

    if (!userId && !username) {
      return NextResponse.json({ success: false, message: 'User identifier required' }, { status: 400 });
    }

    const query: any = {};
    if (userId) query._id = userId;
    else if (username) query.username = username;

    const user = await User.findOne(query);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

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
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        role: roleDoc ? roleDoc.name : user.role,
        roleCode,
        hierarchyLevel: roleDoc ? roleDoc.hierarchyLevel : isSuperAdmin ? 1 : 7,
        assignedZone: user.assignedZone || user.categoryClientRegion || '',
        assignedBranch: user.assignedBranch || user.branch || '',
        assignedArea: user.assignedArea || '',
        permissions,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
