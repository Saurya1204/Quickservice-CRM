import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Escalation } from '@/models/Escalation';
import { seedInitialEscalationData } from '@/lib/escalationService';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await connectDB();
    await seedInitialEscalationData();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const userRole = searchParams.get('userRole') || '';
    const userRoleCode = (searchParams.get('roleCode') || userRole).toUpperCase().replace(/\s+/g, '_');
    const branch = searchParams.get('branch');
    const zone = searchParams.get('zone');

    const isSuperAdmin = userRoleCode === 'SUPER_ADMIN' || userRole.toLowerCase() === 'super admin';
    const isManagerRole =
      ['ADMIN', 'HOD', 'ZSM', 'BSM', 'BRANCH_MANAGER', 'ZONE_MANAGER', 'FRANCHISE_MANAGER'].includes(userRoleCode);

    const baseQuery: any = {};
    if (!isSuperAdmin) {
      if (userRoleCode.includes('CLIENT') && userId) {
        baseQuery.requesterUserId = new mongoose.Types.ObjectId(userId);
      } else if (userRoleCode === 'TECHNICIAN' && userId) {
        baseQuery.requesterUserId = new mongoose.Types.ObjectId(userId);
      } else if (isManagerRole && userId) {
        baseQuery.$or = [
          { assignedManagerId: new mongoose.Types.ObjectId(userId) },
          { requesterUserId: new mongoose.Types.ObjectId(userId) },
        ];
      }
    }

    if (branch && branch !== 'ALL' && branch !== 'All' && !baseQuery.$or) {
      baseQuery.branch = branch;
    }
    if (zone && zone !== 'ALL' && zone !== 'All') {
      baseQuery.zone = zone;
    }

    const now = new Date();

    const [
      total,
      pending,
      underReview,
      approved,
      rejected,
      inProgress,
      completed,
      overdue,
      allEscalations,
    ] = await Promise.all([
      Escalation.countDocuments(baseQuery),
      Escalation.countDocuments({ ...baseQuery, status: 'PENDING_APPROVAL' }),
      Escalation.countDocuments({ ...baseQuery, status: 'UNDER_REVIEW' }),
      Escalation.countDocuments({ ...baseQuery, status: 'APPROVED' }),
      Escalation.countDocuments({ ...baseQuery, status: 'REJECTED' }),
      Escalation.countDocuments({ ...baseQuery, status: 'IN_PROGRESS' }),
      Escalation.countDocuments({ ...baseQuery, status: 'COMPLETED' }),
      Escalation.countDocuments({
        ...baseQuery,
        status: { $in: ['PENDING_APPROVAL', 'UNDER_REVIEW', 'INFO_REQUIRED'] },
        dueDate: { $lt: now },
      }),
      Escalation.find(baseQuery).select('productCategory categoryName subcategoryName assignedManagerName branch status createdAt').lean(),
    ]);

    // Product Category breakdown
    const productWiseMap: Record<string, number> = {};
    const categoryWiseMap: Record<string, number> = {};
    const subcategoryWiseMap: Record<string, number> = {};
    const managerPendingMap: Record<string, number> = {};
    const branchWiseMap: Record<string, number> = {};

    for (const esc of allEscalations) {
      const prod = esc.productCategory || 'Other';
      productWiseMap[prod] = (productWiseMap[prod] || 0) + 1;

      const cat = esc.categoryName || 'Other';
      categoryWiseMap[cat] = (categoryWiseMap[cat] || 0) + 1;

      const sub = esc.subcategoryName || 'Other';
      subcategoryWiseMap[sub] = (subcategoryWiseMap[sub] || 0) + 1;

      if (esc.status === 'PENDING_APPROVAL' || esc.status === 'UNDER_REVIEW') {
        const mgr = esc.assignedManagerName || 'Unassigned';
        managerPendingMap[mgr] = (managerPendingMap[mgr] || 0) + 1;
      }

      if (esc.branch) {
        branchWiseMap[esc.branch] = (branchWiseMap[esc.branch] || 0) + 1;
      }
    }

    const decisionTotal = approved + rejected;
    const approvalRate = decisionTotal > 0 ? Math.round((approved / decisionTotal) * 100) : 0;

    return NextResponse.json({
      success: true,
      data: {
        kpi: {
          totalEscalations: total,
          pendingApproval: pending,
          underReview,
          approved,
          rejected,
          inProgress,
          completed,
          overdueCount: overdue,
          approvalRate: `${approvalRate}%`,
        },
        productWise: Object.entries(productWiseMap).map(([name, count]) => ({ name, count })),
        categoryWise: Object.entries(categoryWiseMap).map(([name, count]) => ({ name, count })),
        subcategoryWise: Object.entries(subcategoryWiseMap).map(([name, count]) => ({ name, count })),
        managerPending: Object.entries(managerPendingMap).map(([name, count]) => ({ name, count })),
        branchWise: Object.entries(branchWiseMap).map(([name, count]) => ({ name, count })),
      },
    });
  } catch (error: any) {
    console.error('Error fetching escalation stats:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

