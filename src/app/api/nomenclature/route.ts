import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { NomenclatureConfig } from '@/models/NomenclatureConfig';
import { NomenclatureService } from '@/lib/nomenclatureService';
import { AuditLog } from '@/models/AuditLog';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await connectDB();
    await NomenclatureService.seedDefaults();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const query: any = {};
    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [{ moduleName: regex }, { entityName: regex }, { prefix: regex }];
    }
    if (status && status !== 'all') {
      query.status = status;
    }

    const configs = await NomenclatureConfig.find(query).sort({ moduleName: 1 });

    // Format list with preview of next code
    const enhancedConfigs = configs.map((c) => {
      const nextSeq = Math.max(c.currentSequence + 1, c.startingSequence);
      const preview = NomenclatureService.formatCode(
        c.prefix,
        c.separator,
        nextSeq,
        c.numberPadding
      );
      return {
        ...c.toObject(),
        nextPreview: preview,
      };
    });

    return NextResponse.json({
      success: true,
      data: enhancedConfigs,
      total: enhancedConfigs.length,
    });
  } catch (error: any) {
    console.error('Error in GET /api/nomenclature:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    if (!body.moduleName || !body.entityName || !body.prefix) {
      return NextResponse.json(
        { success: false, message: 'Module Name, Entity Name, and Prefix are required' },
        { status: 400 }
      );
    }

    const existing = await NomenclatureConfig.findOne({
      entityName: body.entityName.trim(),
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: `Nomenclature for "${body.entityName}" already exists.` },
        { status: 409 }
      );
    }

    const startingSeq = parseInt(body.startingSequence || '1', 10);
    const currentSeq = body.currentSequence !== undefined ? parseInt(body.currentSequence, 10) : startingSeq - 1;
    const padding = parseInt(body.numberPadding || '3', 10);

    const newConfig = await NomenclatureConfig.create({
      moduleName: body.moduleName.trim(),
      entityName: body.entityName.trim(),
      prefix: body.prefix.trim().toUpperCase(),
      separator: body.separator || '',
      startingSequence: startingSeq,
      currentSequence: currentSeq,
      numberPadding: padding,
      generatedCodeFormat: body.generatedCodeFormat || `{PREFIX}${body.separator || ''}{NUMBER}`,
      status: body.status || 'Active',
      effectiveDate: body.effectiveDate ? new Date(body.effectiveDate) : new Date(),
      createdBy: body.createdBy || 'Super Admin',
      updatedBy: body.updatedBy || 'Super Admin',
      auditLogs: [
        {
          previousPrefix: 'None',
          newPrefix: body.prefix.trim().toUpperCase(),
          previousSequence: 0,
          newSequence: currentSeq,
          changedBy: body.createdBy || 'Super Admin',
          changeDate: new Date(),
          reason: 'Initial creation',
          affectedModule: body.moduleName.trim(),
        },
      ],
    });

    await AuditLog.create({
      action: 'CREATE_NOMENCLATURE',
      module: 'NOMENCLATURE_MANAGEMENT',
      performedBy: body.createdBy || 'Super Admin',
      entityId: newConfig._id.toString(),
      details: `Created nomenclature for ${newConfig.moduleName} (${newConfig.prefix})`,
    }).catch(() => null);

    return NextResponse.json(
      {
        success: true,
        data: newConfig,
        message: `Nomenclature for ${newConfig.entityName} created successfully!`,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error in POST /api/nomenclature:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { id, reason, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 });
    }

    const existing = await NomenclatureConfig.findById(id);
    if (!existing) {
      return NextResponse.json({ success: false, message: 'Configuration not found' }, { status: 404 });
    }

    const prevPrefix = existing.prefix;
    const prevSeq = existing.currentSequence;
    const newPrefix = updateData.prefix ? updateData.prefix.trim().toUpperCase() : prevPrefix;
    const newSeq = updateData.currentSequence !== undefined ? parseInt(updateData.currentSequence, 10) : prevSeq;

    if (updateData.prefix) updateData.prefix = newPrefix;
    if (updateData.numberPadding) updateData.numberPadding = parseInt(updateData.numberPadding, 10);
    if (updateData.startingSequence) updateData.startingSequence = parseInt(updateData.startingSequence, 10);
    if (updateData.currentSequence !== undefined) updateData.currentSequence = newSeq;

    // Log the change in auditLogs
    const auditEntry = {
      previousPrefix: prevPrefix,
      newPrefix: newPrefix,
      previousSequence: prevSeq,
      newSequence: newSeq,
      changedBy: body.updatedBy || 'Super Admin',
      changeDate: new Date(),
      reason: reason || body.reason || 'Settings updated by Super Admin',
      affectedModule: existing.moduleName,
    };

    existing.auditLogs.push(auditEntry);
    Object.assign(existing, updateData);
    existing.updatedBy = body.updatedBy || 'Super Admin';
    await existing.save();

    await AuditLog.create({
      action: 'UPDATE_NOMENCLATURE',
      module: 'NOMENCLATURE_MANAGEMENT',
      performedBy: body.updatedBy || 'Super Admin',
      entityId: id,
      details: `Updated nomenclature for ${existing.moduleName}: Prefix "${prevPrefix}" -> "${newPrefix}", Seq ${prevSeq} -> ${newSeq}`,
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      data: existing,
      message: `Nomenclature for ${existing.entityName} updated successfully!`,
    });
  } catch (error: any) {
    console.error('Error in PUT /api/nomenclature:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 });
    }

    const existing = await NomenclatureConfig.findById(id);
    if (!existing) {
      return NextResponse.json({ success: false, message: 'Configuration not found' }, { status: 404 });
    }

    // Rather than hard deletion if records already used it, safely toggle to Inactive
    existing.status = existing.status === 'Active' ? 'Inactive' : 'Active';
    await existing.save();

    return NextResponse.json({
      success: true,
      data: existing,
      message: `Nomenclature status changed to ${existing.status}!`,
    });
  } catch (error: any) {
    console.error('Error in DELETE /api/nomenclature:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
