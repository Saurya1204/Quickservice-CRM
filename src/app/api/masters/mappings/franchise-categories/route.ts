import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Franchise } from '@/models/Franchise';
import { Category } from '@/models/Category';
import { FranchiseCategoryMapping } from '@/models/FranchiseCategoryMapping';
import { AuditLog } from '@/models/AuditLog';

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const franchiseId = searchParams.get('franchiseId');

    // Fetch all active categories from Category Master
    const allCategories = await Category.find({ status: { $ne: 'INACTIVE' } })
      .sort({ categoryName: 1 })
      .lean();

    if (franchiseId) {
      const assigned = await FranchiseCategoryMapping.find({
        franchiseId,
        isActive: true,
      }).lean();

      const assignedCategoryIds = new Set(assigned.map((m) => m.categoryId.toString()));

      const assignedCategories = allCategories.filter((c: any) =>
        assignedCategoryIds.has(c._id.toString())
      );
      const availableCategories = allCategories.filter(
        (c: any) => !assignedCategoryIds.has(c._id.toString())
      );

      return NextResponse.json({
        success: true,
        data: {
          assignedCategories,
          availableCategories,
          totalAssigned: assignedCategories.length,
          totalAvailable: availableCategories.length,
        },
      });
    }

    // Return all franchise category mappings summary and default available categories
    const allMappings = await FranchiseCategoryMapping.find({ isActive: true })
      .sort({ franchiseName: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        assignedCategories: [],
        availableCategories: allCategories,
        totalAssigned: 0,
        totalAvailable: allCategories.length,
        allMappings,
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
    const { franchiseId, categoryIds, updatedBy } = body;

    if (!franchiseId || !Array.isArray(categoryIds)) {
      return NextResponse.json(
        { success: false, message: 'franchiseId and categoryIds array are required' },
        { status: 400 }
      );
    }

    const franchise = await Franchise.findById(franchiseId).lean();
    if (!franchise) {
      return NextResponse.json({ success: false, message: 'Franchise not found' }, { status: 404 });
    }

    // Remove existing assignments not in the new categoryIds list
    await FranchiseCategoryMapping.deleteMany({
      franchiseId,
      categoryId: { $nin: categoryIds },
    });

    if (categoryIds.length > 0) {
      // Fetch selected categories
      const categories = await Category.find({ _id: { $in: categoryIds } }).lean();

      const bulkOps = categories.map((c: any) => ({
        updateOne: {
          filter: { franchiseId, categoryId: c._id },
          update: {
            $set: {
              franchiseCode: franchise.crmCode || 'FRN',
              franchiseName: franchise.firmName,
              categoryCode: c.categoryCode || '',
              categoryName: c.categoryName,
              isActive: true,
              updatedBy: updatedBy || 'Super Admin',
            },
            $setOnInsert: {
              createdBy: updatedBy || 'Super Admin',
            },
          },
          upsert: true,
        },
      }));

      await FranchiseCategoryMapping.bulkWrite(bulkOps);
    }

    await AuditLog.create({
      action: 'UPDATE_FRANCHISE_CATEGORIES',
      module: 'mapping',
      entityId: franchiseId,
      entityName: `Franchise Category Mapping: ${franchise.firmName}`,
      performedBy: updatedBy || 'Super Admin',
      details: { assignedCount: categoryIds.length },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully updated category mapping for ${franchise.firmName}! (${categoryIds.length} categories assigned)`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const franchiseId = searchParams.get('franchiseId');

    if (!franchiseId) {
      return NextResponse.json({ success: false, message: 'franchiseId is required' }, { status: 400 });
    }

    await FranchiseCategoryMapping.deleteMany({ franchiseId });

    return NextResponse.json({
      success: true,
      message: 'All category assignments for this franchise have been removed.',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

