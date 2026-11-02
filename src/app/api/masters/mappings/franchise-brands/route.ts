import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Franchise } from '@/models/Franchise';
import { Brand } from '@/models/Brand';
import { FranchiseBrandMapping } from '@/models/FranchiseBrandMapping';
import { AuditLog } from '@/models/AuditLog';

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const franchiseId = searchParams.get('franchiseId');

    // Fetch all active brands
    let allBrands = await Brand.find({ status: { $ne: 'INACTIVE' } })
      .sort({ brandName: 1 })
      .lean();

    // Auto-seed older CRM reference brands if empty
    if (allBrands.length === 0) {
      const defaultBrands = [
        { brandName: 'HIND POWER', brandCode: 'HIND01', status: 'ACTIVE' },
        { brandName: 'Trumate', brandCode: 'TRUM01', status: 'ACTIVE' },
        { brandName: 'BREVILLE', brandCode: 'BREV01', status: 'ACTIVE' },
        { brandName: 'JYOMIX', brandCode: 'JYOM01', status: 'ACTIVE' },
        { brandName: 'HUMINEX', brandCode: 'HUMI01', status: 'ACTIVE' },
        { brandName: 'ZOOM', brandCode: 'ZOOM01', status: 'ACTIVE' },
        { brandName: 'ALTINO', brandCode: 'ALTI01', status: 'ACTIVE' },
        { brandName: 'MAPY', brandCode: 'MAPY01', status: 'ACTIVE' },
      ];
      try {
        await Brand.insertMany(defaultBrands);
        allBrands = await Brand.find({ status: { $ne: 'INACTIVE' } }).sort({ brandName: 1 }).lean();
      } catch (seedErr) {
        console.warn('Brand seed skipped:', seedErr);
      }
    }

    if (franchiseId) {
      const assigned = await FranchiseBrandMapping.find({
        franchiseId,
        isActive: true,
      }).lean();

      const assignedBrandIds = new Set(assigned.map((m) => m.brandId.toString()));

      const assignedBrands = allBrands.filter((b: any) =>
        assignedBrandIds.has(b._id.toString())
      );
      const availableBrands = allBrands.filter(
        (b: any) => !assignedBrandIds.has(b._id.toString())
      );

      return NextResponse.json({
        success: true,
        data: {
          assignedBrands,
          availableBrands,
          totalAssigned: assignedBrands.length,
          totalAvailable: availableBrands.length,
        },
      });
    }

    // If no franchiseId selected, return allBrands as available, and all current mappings summary
    const allMappings = await FranchiseBrandMapping.find({ isActive: true })
      .sort({ franchiseName: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        assignedBrands: [],
        availableBrands: allBrands,
        totalAssigned: 0,
        totalAvailable: allBrands.length,
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
    const { franchiseId, brandIds, updatedBy } = body;

    if (!franchiseId || !Array.isArray(brandIds)) {
      return NextResponse.json(
        { success: false, message: 'franchiseId and brandIds array are required' },
        { status: 400 }
      );
    }

    const franchise = await Franchise.findById(franchiseId).lean();
    if (!franchise) {
      return NextResponse.json({ success: false, message: 'Franchise not found' }, { status: 404 });
    }

    // Remove existing assignments not in the new brandIds list
    await FranchiseBrandMapping.deleteMany({
      franchiseId,
      brandId: { $nin: brandIds },
    });

    if (brandIds.length > 0) {
      // Fetch details of selected brands
      const brands = await Brand.find({ _id: { $in: brandIds } }).lean();

      const bulkOps = brands.map((b: any) => ({
        updateOne: {
          filter: { franchiseId, brandId: b._id },
          update: {
            $set: {
              franchiseCode: franchise.crmCode || 'FRN',
              franchiseName: franchise.firmName,
              brandCode: b.brandCode || '',
              brandName: b.brandName,
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

      await FranchiseBrandMapping.bulkWrite(bulkOps);
    }

    await AuditLog.create({
      action: 'UPDATE_FRANCHISE_BRANDS',
      module: 'mapping',
      entityId: franchiseId,
      entityName: `Franchise Brand Mapping: ${franchise.firmName}`,
      performedBy: updatedBy || 'Super Admin',
      details: { assignedCount: brandIds.length },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully updated brand mapping for ${franchise.firmName}! (${brandIds.length} brands assigned)`,
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

    await FranchiseBrandMapping.deleteMany({ franchiseId });

    return NextResponse.json({
      success: true,
      message: 'All brand assignments for this franchise have been removed.',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

