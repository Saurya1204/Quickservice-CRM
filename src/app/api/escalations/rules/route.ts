import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { EscalationAssignmentRule } from '@/models/EscalationAssignmentRule';
import { EscalationCategory } from '@/models/EscalationCategory';
import { EscalationSubcategory } from '@/models/EscalationSubcategory';
import { User } from '@/models/User';
import { AuditLog } from '@/models/AuditLog';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');
    const status = searchParams.get('status');

    const query: any = {};
    if (categoryId && categoryId !== 'ALL') {
      query.categoryId = categoryId;
    }
    if (status && status !== 'ALL') {
      query.status = status;
    }

    const rules = await EscalationAssignmentRule.find(query)
      .sort({ rulePriority: 1, createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: rules });
  } catch (error: any) {
    console.error('Error fetching assignment rules:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    const {
      ruleName,
      categoryId,
      subcategoryId,
      productCategoryName,
      productCategoryId,
      productName,
      productId,
      brandName,
      managerUserId,
      backupManagerId,
      branch,
      zone,
      franchise,
      priority,
      slaHours,
      rulePriority,
      status,
      createdBy,
    } = body;

    if (!ruleName || !categoryId || !managerUserId) {
      return NextResponse.json(
        { success: false, message: 'Rule Name, Category, and Manager User are required' },
        { status: 400 }
      );
    }

    const [cat, mgr] = await Promise.all([
      EscalationCategory.findById(categoryId),
      User.findById(managerUserId),
    ]);

    if (!cat) {
      return NextResponse.json({ success: false, message: 'Category not found' }, { status: 404 });
    }
    if (!mgr) {
      return NextResponse.json({ success: false, message: 'Manager user not found' }, { status: 404 });
    }

    let subcatName = 'All';
    if (subcategoryId) {
      const sub = await EscalationSubcategory.findById(subcategoryId);
      if (sub) subcatName = sub.name;
    }

    let backupMgrName = '';
    if (backupManagerId) {
      const bMgr = await User.findById(backupManagerId);
      if (bMgr) backupMgrName = bMgr.fullName || bMgr.username;
    }

    const newRule = await EscalationAssignmentRule.create({
      ruleName: ruleName.trim(),
      categoryId: cat._id,
      categoryName: cat.name,
      subcategoryId: subcategoryId || undefined,
      subcategoryName: subcatName,
      productCategoryName: productCategoryName || 'All',
      productCategoryId: productCategoryId || undefined,
      productName: productName || 'All',
      productId: productId || undefined,
      brandName: brandName || 'All',
      managerUserId: mgr._id,
      managerName: mgr.fullName || mgr.username,
      backupManagerId: backupManagerId || undefined,
      backupManagerName: backupMgrName,
      branch: branch || 'All',
      zone: zone || 'All',
      franchise: franchise || 'All',
      priority: priority || 'HIGH',
      slaHours: slaHours || 48,
      rulePriority: Number(rulePriority) || 10,
      status: status || 'ACTIVE',
      createdBy: createdBy || 'Super Admin',
    });

    await AuditLog.create({
      action: 'CREATE_ESCALATION_RULE',
      module: 'escalationManagement',
      entityId: newRule._id.toString(),
      entityName: newRule.ruleName,
      performedBy: createdBy || 'Super Admin',
      details: {
        category: cat.name,
        manager: mgr.fullName,
        productCategory: productCategoryName,
      },
    });

    return NextResponse.json({ success: true, data: newRule, message: 'Assignment rule created successfully' });
  } catch (error: any) {
    console.error('Error creating assignment rule:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { id, ...updateFields } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Rule ID required' }, { status: 400 });
    }

    // Refresh manager name if managerUserId changed
    if (updateFields.managerUserId) {
      const mgr = await User.findById(updateFields.managerUserId);
      if (mgr) updateFields.managerName = mgr.fullName || mgr.username;
    }
    if (updateFields.backupManagerId) {
      const bmgr = await User.findById(updateFields.backupManagerId);
      if (bmgr) updateFields.backupManagerName = bmgr.fullName || bmgr.username;
    }

    const updated = await EscalationAssignmentRule.findByIdAndUpdate(id, updateFields, { new: true });
    if (!updated) {
      return NextResponse.json({ success: false, message: 'Rule not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated, message: 'Assignment rule updated successfully' });
  } catch (error: any) {
    console.error('Error updating assignment rule:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Rule ID required' }, { status: 400 });
    }

    await EscalationAssignmentRule.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: 'Assignment rule deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting assignment rule:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

