import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { EscalationModuleMapping } from '@/models/EscalationModuleMapping';
import { seedInitialEscalationData } from '@/lib/escalationService';
import { AuditLog } from '@/models/AuditLog';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    await seedInitialEscalationData();

    const mappings = await EscalationModuleMapping.find({}).sort({ moduleName: 1 }).lean();
    return NextResponse.json({ success: true, data: mappings });
  } catch (error: any) {
    console.error('Error fetching module mappings:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { moduleKey, enabled, allowedCategories, allowedRoles, updatedBy } = body;

    if (!moduleKey) {
      return NextResponse.json({ success: false, message: 'Module Key is required' }, { status: 400 });
    }

    const mapping = await EscalationModuleMapping.findOneAndUpdate(
      { moduleKey },
      {
        enabled: enabled !== false,
        ...(allowedCategories ? { allowedCategories } : {}),
        ...(allowedRoles ? { allowedRoles } : {}),
        updatedBy: updatedBy || 'Super Admin',
      },
      { new: true, upsert: true }
    );

    await AuditLog.create({
      action: 'UPDATE_ESCALATION_MODULE_MAPPING',
      module: 'escalationManagement',
      entityId: mapping._id.toString(),
      entityName: mapping.moduleName,
      performedBy: updatedBy || 'Super Admin',
      details: { moduleKey, enabled },
    });

    return NextResponse.json({
      success: true,
      data: mapping,
      message: `Module "${mapping.moduleName}" integration updated successfully`,
    });
  } catch (error: any) {
    console.error('Error updating module mapping:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

