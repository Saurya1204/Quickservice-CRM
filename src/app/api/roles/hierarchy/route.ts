import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Role } from '@/models/Role';
import { ReportingHierarchy } from '@/models/ReportingHierarchy';
import { AuditLog } from '@/models/AuditLog';

// Helper to detect circular reporting
function wouldCreateCycle(
  currentHierarchy: Map<string, string>, // child -> parent
  childCode: string,
  newParentCode: string
): boolean {
  if (!newParentCode) return false;
  if (childCode === newParentCode) return true;

  let current: string | undefined = newParentCode;
  const visited = new Set<string>();

  while (current) {
    if (current === childCode) {
      return true;
    }
    if (visited.has(current)) {
      break;
    }
    visited.add(current);
    current = currentHierarchy.get(current);
  }

  return false;
}

export async function GET(req: Request) {
  try {
    await connectDB();
    const roles = await Role.find({ status: 'ACTIVE' }).sort({ hierarchyLevel: 1 }).lean();
    const hierarchies = await ReportingHierarchy.find({ isActive: true }).lean();

    const hierarchyMap = new Map(hierarchies.map((h) => [h.roleCode, h]));

    // Construct enriched roles with hierarchy info
    const enrichedRoles = roles.map((r: any) => {
      const h = hierarchyMap.get(r.code);
      return {
        _id: r._id,
        name: r.name,
        code: r.code,
        hierarchyLevel: h?.hierarchyLevel ?? r.hierarchyLevel ?? 5,
        reportingTo: h?.parentRoleCode || r.reportingTo || '',
        parentRoleName: h?.parentRoleName || '',
        isSystem: !!r.isSystem,
        description: r.description || '',
        history: h?.history || [],
      };
    });

    // Build hierarchical tree
    const roleByCode = new Map(enrichedRoles.map((r) => [r.code, { ...r, children: [] as any[] }]));
    const rootNodes: any[] = [];

    roleByCode.forEach((node) => {
      if (node.reportingTo && roleByCode.has(node.reportingTo)) {
        roleByCode.get(node.reportingTo)!.children.push(node);
      } else {
        rootNodes.push(node);
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        roles: enrichedRoles,
        tree: rootNodes,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { roleCode, parentRoleCode, hierarchyLevel, updatedBy = 'Super Admin', reason } = body;

    if (!roleCode) {
      return NextResponse.json({ success: false, message: 'roleCode is required' }, { status: 400 });
    }

    if (roleCode === parentRoleCode) {
      return NextResponse.json(
        { success: false, message: 'Validation Error: A role cannot report to itself.' },
        { status: 400 }
      );
    }

    // Load all active roles to validate and check cycles
    const allRoles = await Role.find({ status: 'ACTIVE' }).lean();
    const currentRole = allRoles.find((r: any) => r.code === roleCode);
    if (!currentRole) {
      return NextResponse.json({ success: false, message: `Role ${roleCode} not found` }, { status: 404 });
    }

    let parentRole = null;
    if (parentRoleCode) {
      parentRole = allRoles.find((r: any) => r.code === parentRoleCode);
      if (!parentRole) {
        return NextResponse.json(
          { success: false, message: `Parent role ${parentRoleCode} not found` },
          { status: 404 }
        );
      }
    }

    // Cycle detection
    const existingHierarchy = new Map<string, string>();
    const allHierarchies = await ReportingHierarchy.find({ isActive: true }).lean();
    for (const h of allHierarchies) {
      if (h.parentRoleCode) {
        existingHierarchy.set(h.roleCode, h.parentRoleCode);
      }
    }
    // Also include defaults from Role documents if not yet in ReportingHierarchy
    for (const r of allRoles) {
      if (r.reportingTo && !existingHierarchy.has(r.code)) {
        existingHierarchy.set(r.code, r.reportingTo);
      }
    }

    if (parentRoleCode && wouldCreateCycle(existingHierarchy, roleCode, parentRoleCode)) {
      return NextResponse.json(
        {
          success: false,
          message: `Circular Reporting Error: Setting '${roleCode}' to report to '${parentRoleCode}' would create a circular dependency loop in the hierarchy.`,
        },
        { status: 400 }
      );
    }

    // Determine existing parent
    const existingEntry = await ReportingHierarchy.findOne({ roleCode });
    const previousParentCode = existingEntry?.parentRoleCode || currentRole.reportingTo || '';
    const previousParentName = existingEntry?.parentRoleName || '';

    const historyEntry = {
      previousParentRoleCode: previousParentCode,
      previousParentRoleName: previousParentName,
      newParentRoleCode: parentRoleCode || '',
      newParentRoleName: parentRole ? parentRole.name : 'None (Top Level)',
      changedBy: updatedBy,
      changedAt: new Date(),
      reason: reason || 'Hierarchy updated by Super Admin',
    };

    // Update or create ReportingHierarchy document
    await ReportingHierarchy.findOneAndUpdate(
      { roleCode },
      {
        $set: {
          roleId: currentRole._id,
          roleName: currentRole.name,
          parentRoleId: parentRole ? parentRole._id : null,
          parentRoleCode: parentRoleCode || '',
          parentRoleName: parentRole ? parentRole.name : '',
          hierarchyLevel: hierarchyLevel ?? currentRole.hierarchyLevel ?? 5,
          isActive: true,
          updatedBy,
        },
        $push: { history: historyEntry },
        $setOnInsert: { createdBy: updatedBy },
      },
      { upsert: true, new: true }
    );

    // Sync with Role collection
    await Role.findOneAndUpdate(
      { code: roleCode },
      {
        $set: {
          reportingTo: parentRoleCode || '',
          reportingToRoleId: parentRole ? parentRole._id : null,
          hierarchyLevel: hierarchyLevel ?? currentRole.hierarchyLevel ?? 5,
          updatedBy,
        },
      }
    );

    await AuditLog.create({
      action: 'UPDATE_REPORTING_HIERARCHY',
      module: 'roleMaster',
      entityId: currentRole._id.toString(),
      entityName: `Role Hierarchy: ${currentRole.name}`,
      performedBy: updatedBy,
      details: {
        roleCode,
        parentRoleCode: parentRoleCode || 'TOP_LEVEL',
        previousParent: previousParentCode,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Reporting hierarchy for '${currentRole.name}' updated successfully!`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
