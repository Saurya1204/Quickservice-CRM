import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Franchise } from '@/models/Franchise';
import { FranchisePincodeMapping } from '@/models/FranchisePincodeMapping';
import { AuditLog } from '@/models/AuditLog';

// Helper to sanitize and deduplicate PIN codes
function parsePincodes(input: string | string[]): string[] {
  let list: string[] = [];
  if (Array.isArray(input)) {
    list = input;
  } else if (typeof input === 'string') {
    list = input.split(/[\s,;\n\r]+/).filter(Boolean);
  }
  const unique = new Set<string>();
  for (const item of list) {
    const clean = item.replace(/\D/g, '').trim();
    if (clean.length === 6) {
      unique.add(clean);
    }
  }
  return Array.from(unique);
}

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const franchiseId = searchParams.get('franchiseId');
    const pincode = searchParams.get('pincode');
    const search = searchParams.get('search');

    const query: any = { isActive: true };

    if (franchiseId) {
      query.franchiseId = franchiseId;
    }
    if (pincode) {
      query.pincode = pincode.trim();
    }
    if (search && search.trim()) {
      const sRegex = { $regex: search.trim(), $options: 'i' };
      query.$or = [
        { pincode: sRegex },
        { franchiseName: sRegex },
        { franchiseCode: sRegex },
        { city: sRegex },
        { district: sRegex },
        { state: sRegex },
        { locality: sRegex },
      ];
    }

    const mappings = await FranchisePincodeMapping.find(query)
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: mappings,
      count: mappings.length,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const {
      action = 'add', // 'checkLocality' | 'add' | 'update' | 'checkConflicts'
      franchiseId,
      pincodesInput,
      forceReassign = false,
      updatedBy = 'Super Admin',
      localityDetails = {}, // optional pre-resolved details per pincode { [pin]: { state, district, city, locality } }
    } = body;

    const pincodes = parsePincodes(pincodesInput);

    if (pincodes.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Please provide at least one valid 6-digit Indian PIN Code.' },
        { status: 400 }
      );
    }

    // 1. Action: Check Locality / Check Conflicts
    if (action === 'checkLocality' || action === 'checkConflicts') {
      const existingMappings = await FranchisePincodeMapping.find({
        pincode: { $in: pincodes },
        isActive: true,
      }).lean();

      const existingMap = new Map(existingMappings.map((m) => [m.pincode, m]));

      const results = pincodes.map((pin) => {
        const existing = existingMap.get(pin);
        const resolved = localityDetails[pin] || null;
        return {
          pincode: pin,
          isMapped: !!existing,
          currentFranchiseId: existing?.franchiseId?.toString() || null,
          currentFranchiseCode: existing?.franchiseCode || null,
          currentFranchiseName: existing?.franchiseName || null,
          state: existing?.state || resolved?.state || '',
          district: existing?.district || resolved?.district || '',
          city: existing?.city || resolved?.city || '',
          locality: existing?.locality || resolved?.locality || '',
        };
      });

      const conflicts = results.filter(
        (r) => r.isMapped && (!franchiseId || r.currentFranchiseId !== franchiseId)
      );

      return NextResponse.json({
        success: true,
        data: {
          totalChecked: pincodes.length,
          results,
          hasConflicts: conflicts.length > 0,
          conflicts,
        },
      });
    }

    // 2. Action: Add or Update Mapping to Franchise
    if (!franchiseId) {
      return NextResponse.json(
        { success: false, message: 'Franchise selection is required to map pincodes.' },
        { status: 400 }
      );
    }

    const franchise = await Franchise.findById(franchiseId).lean();
    if (!franchise) {
      return NextResponse.json({ success: false, message: 'Franchise not found' }, { status: 404 });
    }

    // Check existing conflicts
    const existingMappings = await FranchisePincodeMapping.find({
      pincode: { $in: pincodes },
      isActive: true,
    }).lean();

    const conflicts = existingMappings.filter(
      (m) => m.franchiseId.toString() !== franchiseId
    );

    if (conflicts.length > 0 && !forceReassign) {
      return NextResponse.json({
        success: false,
        requiresConfirmation: true,
        message: `${conflicts.length} pincode(s) are already mapped to other franchises. Reassignment confirmation required.`,
        conflicts: conflicts.map((c) => ({
          pincode: c.pincode,
          franchiseCode: c.franchiseCode,
          franchiseName: c.franchiseName,
        })),
      });
    }

    const now = new Date();
    const existingByPin = new Map(existingMappings.map((m) => [m.pincode, m]));

    // Batch upsert each pincode with history tracking
    const bulkOps = pincodes.map((pin) => {
      const existing = existingByPin.get(pin);
      const loc = localityDetails[pin] || {};

      const historyEntry = existing && existing.franchiseId.toString() !== franchiseId
        ? {
            previousFranchiseId: existing.franchiseId,
            previousFranchiseCode: existing.franchiseCode,
            previousFranchiseName: existing.franchiseName,
            newFranchiseId: franchise._id,
            newFranchiseCode: franchise.crmCode || 'FRN',
            newFranchiseName: franchise.firmName,
            updatedBy,
            updatedAt: now,
            remarks: 'Reassigned via Franchise Pincode Mapping',
          }
        : null;

      const updateDoc: any = {
        $set: {
          franchiseId: franchise._id,
          franchiseCode: franchise.crmCode || 'FRN',
          franchiseName: franchise.firmName,
          state: loc.state || existing?.state || franchise.state || '',
          district: loc.district || existing?.district || franchise.district || '',
          city: loc.city || existing?.city || franchise.city || '',
          locality: loc.locality || existing?.locality || franchise.locality || '',
          isActive: true,
          updatedBy,
          updatedAt: now,
        },
        $setOnInsert: {
          createdBy: updatedBy,
          createdAt: now,
        },
      };

      if (historyEntry) {
        updateDoc.$push = { history: historyEntry };
      }

      return {
        updateOne: {
          filter: { pincode: pin },
          update: updateDoc,
          upsert: true,
        },
      };
    });

    await FranchisePincodeMapping.bulkWrite(bulkOps);

    await AuditLog.create({
      action: action === 'update' ? 'UPDATE_PINCODE_MAPPING' : 'ADD_PINCODE_MAPPING',
      module: 'mapping',
      entityId: franchiseId,
      entityName: `Franchise Pincode Mapping: ${franchise.firmName}`,
      performedBy: updatedBy,
      details: {
        pincodesCount: pincodes.length,
        pincodes,
        reassignedCount: conflicts.length,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully mapped ${pincodes.length} PIN codes to ${franchise.firmName}!`,
      count: pincodes.length,
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
    const pincode = searchParams.get('pincode');
    const id = searchParams.get('id');

    if (id) {
      await FranchisePincodeMapping.findByIdAndDelete(id);
      return NextResponse.json({ success: true, message: 'Pincode mapping removed successfully.' });
    }

    if (pincode) {
      await FranchisePincodeMapping.findOneAndDelete({ pincode: pincode.trim() });
      return NextResponse.json({ success: true, message: `Pincode ${pincode} unmapped successfully.` });
    }

    if (franchiseId) {
      const res = await FranchisePincodeMapping.deleteMany({ franchiseId });
      return NextResponse.json({
        success: true,
        message: `Entire pincode mapping deleted for this franchise (${res.deletedCount} pincodes removed).`,
      });
    }

    return NextResponse.json(
      { success: false, message: 'franchiseId, pincode, or id is required.' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

