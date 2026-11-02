import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { Role } from '@/models/Role';
import { ReportingHierarchy } from '@/models/ReportingHierarchy';
import { UserReportingAssignment } from '@/models/UserReportingAssignment';
import { AuditLog } from '@/models/AuditLog';

// Cycle check for user-level reporting
function wouldCreateUserCycle(
  currentAssignments: Map<string, string>, // userId -> managerId
  userId: string,
  newManagerId: string
): boolean {
  if (!newManagerId) return false;
  if (userId === newManagerId) return true;

  let curr: string | undefined = newManagerId;
  const visited = new Set<string>();

  while (curr) {
    if (curr === userId) return true;
    if (visited.has(curr)) break;
    visited.add(curr);
    curr = currentAssignments.get(curr);
  }

  return false;
}

export async function GET(req: Request) {
  try {
    await connectDB();
    const users = await User.find({ status: 'ACTIVE' })
      .select('_id username fullName email mobile role roleId reportingTo status')
      .lean();

    const roles = await Role.find({ status: 'ACTIVE' }).lean();
    const hierarchies = await ReportingHierarchy.find({ isActive: true }).lean();
    const assignments = await UserReportingAssignment.find({ isActive: true }).lean();

    const hierarchyByRole = new Map(hierarchies.map((h) => [h.roleCode, h.parentRoleCode]));
    const roleByName = new Map(roles.map((r) => [r.name, r]));
    const roleByCode = new Map(roles.map((r) => [r.code, r]));
    const assignmentByUser = new Map(assignments.map((a) => [a.userId.toString(), a]));
    const userById = new Map(users.map((u: any) => [u._id.toString(), u]));

    // Construct enriched user reporting status
    const enrichedUsers = users.map((u: any) => {
      const uId = u._id.toString();
      const assignment = assignmentByUser.get(uId);

      // Resolve role code
      let rCode = '';
      if (u.role) {
        const found = roleByName.get(u.role) || roleByCode.get(u.role);
        rCode = found ? found.code : u.role.toUpperCase().replace(/\s+/g, '_');
      }

      // Identify eligible parent roles based on hierarchy
      const parentRoleCode = hierarchyByRole.get(rCode);

      // Find eligible managers (users with parentRoleCode or SUPER_ADMIN or higher)
      const eligibleManagers = users
        .filter((other: any) => {
          if (other._id.toString() === uId) return false;
          const otherRole = roleByName.get(other.role) || roleByCode.get(other.role);
          const otherCode = otherRole ? otherRole.code : other.role;
          if (otherCode === 'SUPER_ADMIN' || other.role === 'Super Admin') return true;
          if (parentRoleCode && (otherCode === parentRoleCode || other.role === parentRoleCode)) {
            return true;
          }
          return false;
        })
        .map((m: any) => ({
          _id: m._id.toString(),
          fullName: m.fullName,
          username: m.username,
          role: m.role,
        }));

      // Current manager display
      const currentMgrId = assignment?.reportingManagerId?.toString();
      const currentMgr = currentMgrId ? userById.get(currentMgrId) : null;
      const currentMgrName = currentMgr ? currentMgr.fullName : (assignment?.reportingManagerName || u.reportingTo || '');

      return {
        _id: uId,
        username: u.username,
        fullName: u.fullName,
        email: u.email || '',
        mobile: u.mobile || '',
        role: u.role,
        roleCode: rCode,
        parentRoleCode: parentRoleCode || '',
        reportingManagerId: currentMgrId || null,
        reportingManagerName: currentMgrName,
        eligibleManagers,
        history: assignment?.history || [],
      };
    });

    return NextResponse.json({
      success: true,
      data: enrichedUsers,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { userId, reportingManagerId, updatedBy = 'Super Admin', reason } = body;

    if (!userId) {
      return NextResponse.json({ success: false, message: 'userId is required' }, { status: 400 });
    }

    if (userId === reportingManagerId) {
      return NextResponse.json(
        { success: false, message: 'Validation Error: A user cannot report to themselves.' },
        { status: 400 }
      );
    }

    const user = await User.findById(userId).lean();
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    let manager: any = null;
    if (reportingManagerId) {
      manager = await User.findById(reportingManagerId).lean();
      if (!manager) {
        return NextResponse.json({ success: false, message: 'Selected manager not found' }, { status: 404 });
      }
      if (manager.status !== 'ACTIVE') {
        return NextResponse.json(
          { success: false, message: 'Inactive users cannot be selected as reporting managers.' },
          { status: 400 }
        );
      }
    }

    // Check user cycle
    const currentAssignments = new Map<string, string>();
    const allAssignments = await UserReportingAssignment.find({ isActive: true }).lean();
    for (const a of allAssignments) {
      if (a.reportingManagerId) {
        currentAssignments.set(a.userId.toString(), a.reportingManagerId.toString());
      }
    }

    if (reportingManagerId && wouldCreateUserCycle(currentAssignments, userId, reportingManagerId)) {
      return NextResponse.json(
        {
          success: false,
          message: `Circular Reporting Error: Assigning '${manager.fullName}' as manager to '${user.fullName}' creates a circular reporting loop.`,
        },
        { status: 400 }
      );
    }

    const existing = await UserReportingAssignment.findOne({ userId });
    const historyEntry = {
      previousManagerId: existing?.reportingManagerId,
      previousManagerName: existing?.reportingManagerName || user.reportingTo || '',
      previousManagerRole: existing?.reportingManagerRole || '',
      newManagerId: manager ? manager._id : null,
      newManagerName: manager ? manager.fullName : 'None',
      newManagerRole: manager ? manager.role : '',
      changedBy: updatedBy,
      changedAt: new Date(),
      reason: reason || 'Manager assignment updated by Super Admin',
    };

    await UserReportingAssignment.findOneAndUpdate(
      { userId },
      {
        $set: {
          userName: user.fullName,
          userEmail: user.email || '',
          userMobile: user.mobile || '',
          roleCode: user.role,
          roleName: user.role,
          reportingManagerId: manager ? manager._id : null,
          reportingManagerName: manager ? manager.fullName : '',
          reportingManagerRole: manager ? manager.role : '',
          isActive: true,
          updatedBy,
        },
        $push: { history: historyEntry },
        $setOnInsert: { effectiveFrom: new Date() },
      },
      { upsert: true, new: true }
    );

    // Sync User model reportingTo field
    await User.findByIdAndUpdate(userId, {
      $set: { reportingTo: manager ? manager.fullName : '' },
    });

    await AuditLog.create({
      action: 'UPDATE_USER_REPORTING',
      module: 'users',
      entityId: userId,
      entityName: `User Reporting: ${user.fullName}`,
      performedBy: updatedBy,
      details: {
        userId,
        reportingManagerId: manager ? manager._id.toString() : null,
        managerName: manager ? manager.fullName : 'None',
      },
    });

    return NextResponse.json({
      success: true,
      message: `Reporting manager for '${user.fullName}' updated to '${manager ? manager.fullName : 'None'}' successfully!`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
