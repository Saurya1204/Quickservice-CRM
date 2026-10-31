import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Role } from '@/models/Role';
import { User } from '@/models/User';
import { AuditLog } from '@/models/AuditLog';
import { SYSTEM_MODULES, generateDefaultPermissions } from '@/lib/rbac';
import { ensurePredefinedRoles } from '@/lib/initRoles';

export async function GET() {
  try {
    await connectDB();
    await ensurePredefinedRoles();

    const roles = await Role.find({}).sort({ hierarchyLevel: 1, createdAt: 1 });
    return NextResponse.json({
      success: true,
      data: roles,
      modules: SYSTEM_MODULES,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    const { name, code, description, hierarchyLevel, reportingTo, permissions, createdBy } = body;

    if (!name || !code) {
      return NextResponse.json(
        { success: false, message: 'Role Name and Role Code are required.' },
        { status: 400 }
      );
    }

    const cleanCode = code.trim().toUpperCase().replace(/\s+/g, '_');

    // Check duplicate
    const existing = await Role.findOne({
      $or: [{ code: cleanCode }, { name: name.trim() }],
    });
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'A role with this name or code already exists.' },
        { status: 400 }
      );
    }

    const rolePermissions =
      permissions && Array.isArray(permissions) && permissions.length > 0
        ? permissions
        : generateDefaultPermissions(cleanCode);

    const newRole = await Role.create({
      name: name.trim(),
      code: cleanCode,
      description: description || '',
      hierarchyLevel: Number(hierarchyLevel) || 5,
      reportingTo: reportingTo || '',
      status: 'ACTIVE',
      isSystem: false,
      permissions: rolePermissions,
      createdBy: createdBy || 'Super Admin',
      updatedBy: createdBy || 'Super Admin',
    });

    // Audit log
    await AuditLog.create({
      action: 'ROLE_CREATE',
      module: 'roleMaster',
      entityId: newRole._id.toString(),
      entityName: newRole.name,
      performedBy: createdBy || 'Super Admin',
      details: { code: cleanCode, hierarchyLevel: newRole.hierarchyLevel },
    });

    return NextResponse.json({
      success: true,
      data: newRole,
      message: 'Role created successfully',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { id, name, description, hierarchyLevel, reportingTo, status, permissions, updatedBy } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Role ID is required' }, { status: 400 });
    }

    const existingRole = await Role.findById(id);
    if (!existingRole) {
      return NextResponse.json({ success: false, message: 'Role not found' }, { status: 404 });
    }

    // Super Admin protection
    if (existingRole.isSystem && existingRole.code === 'SUPER_ADMIN') {
      if (status === 'INACTIVE') {
        return NextResponse.json(
          { success: false, message: 'Super Admin role cannot be deactivated.' },
          { status: 403 }
        );
      }
    }

    const updateFields: any = {
      updatedBy: updatedBy || 'Super Admin',
    };

    if (name) updateFields.name = name.trim();
    if (description !== undefined) updateFields.description = description;
    if (hierarchyLevel !== undefined) updateFields.hierarchyLevel = Number(hierarchyLevel);
    if (reportingTo !== undefined) updateFields.reportingTo = reportingTo;
    if (status) updateFields.status = status;
    if (permissions && Array.isArray(permissions)) updateFields.permissions = permissions;

    const updatedRole = await Role.findByIdAndUpdate(id, updateFields, { new: true });

    // Audit log
    await AuditLog.create({
      action: 'ROLE_UPDATE',
      module: 'roleMaster',
      entityId: id,
      entityName: updatedRole?.name,
      performedBy: updatedBy || 'Super Admin',
      details: { status: updatedRole?.status, hierarchyLevel: updatedRole?.hierarchyLevel },
    });

    return NextResponse.json({
      success: true,
      data: updatedRole,
      message: 'Role updated successfully',
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
      return NextResponse.json({ success: false, message: 'Role ID is required' }, { status: 400 });
    }

    const role = await Role.findById(id);
    if (!role) {
      return NextResponse.json({ success: false, message: 'Role not found' }, { status: 404 });
    }

    if (role.isSystem || role.code === 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, message: 'System role (Super Admin) cannot be deleted.' },
        { status: 403 }
      );
    }

    // Check if any user is currently assigned this role
    const assignedUsers = await User.countDocuments({
      $or: [{ role: role.name }, { role: role.code }, { roleId: role._id }],
    });
    if (assignedUsers > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot delete role "${role.name}". It is currently assigned to ${assignedUsers} user(s). Reassign them first.`,
        },
        { status: 400 }
      );
    }

    await Role.findByIdAndDelete(id);

    // Audit log
    await AuditLog.create({
      action: 'ROLE_DELETE',
      module: 'roleMaster',
      entityId: id,
      entityName: role.name,
      performedBy: 'Super Admin',
    });

    return NextResponse.json({ success: true, message: `Role "${role.name}" deleted successfully.` });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
