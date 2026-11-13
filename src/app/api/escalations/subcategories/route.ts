import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { EscalationSubcategory } from '@/models/EscalationSubcategory';
import { EscalationCategory } from '@/models/EscalationCategory';
import { AuditLog } from '@/models/AuditLog';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');
    const productCategory = searchParams.get('productCategory');
    const status = searchParams.get('status');

    const query: any = {};
    if (categoryId && categoryId !== 'ALL') {
      query.categoryId = categoryId;
    }
    if (productCategory && productCategory !== 'ALL' && productCategory !== 'All') {
      query.$or = [
        { productCategoryName: productCategory },
        { productCategoryName: 'All' },
      ];
    }
    if (status && status !== 'ALL') {
      query.status = status;
    }

    const subcategories = await EscalationSubcategory.find(query).sort({ categoryName: 1, name: 1 }).lean();
    return NextResponse.json({ success: true, data: subcategories });
  } catch (error: any) {
    console.error('Error fetching subcategories:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    const {
      name,
      code,
      categoryId,
      productCategoryId,
      productCategoryName,
      productId,
      productName,
      description,
      responsibleManagerId,
      responsibleManagerName,
      backupManagerId,
      backupManagerName,
      priority,
      slaHours,
      requiredAttachments,
      mandatoryFields,
      workflow,
      status,
      createdBy,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, message: 'Subcategory Name is required' }, { status: 400 });
    }
    if (!categoryId) {
      return NextResponse.json({ success: false, message: 'Parent Category is required' }, { status: 400 });
    }

    const catDoc = await EscalationCategory.findById(categoryId);
    if (!catDoc) {
      return NextResponse.json({ success: false, message: 'Parent Category not found' }, { status: 404 });
    }

    const formattedCode = (code || name)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');

    const existing = await EscalationSubcategory.findOne({
      categoryId: catDoc._id,
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: `Subcategory "${name}" already exists under ${catDoc.name}.` },
        { status: 400 }
      );
    }

    const newSubcat = await EscalationSubcategory.create({
      name: name.trim(),
      code: formattedCode,
      categoryId: catDoc._id,
      categoryName: catDoc.name,
      categoryCode: catDoc.code,
      productCategoryId: productCategoryId || undefined,
      productCategoryName: productCategoryName || 'All',
      productId: productId || undefined,
      productName: productName || 'All',
      description: description || '',
      responsibleManagerId: responsibleManagerId || catDoc.defaultManagerId,
      responsibleManagerName: responsibleManagerName || catDoc.defaultManagerName,
      backupManagerId: backupManagerId || undefined,
      backupManagerName: backupManagerName || '',
      priority: priority || 'HIGH',
      slaHours: slaHours || 48,
      requiredAttachments: Array.isArray(requiredAttachments) ? requiredAttachments : [],
      mandatoryFields: Array.isArray(mandatoryFields) && mandatoryFields.length > 0
        ? mandatoryFields
        : ['technicalDiagnosis', 'requestedPart'],
      workflow: workflow || 'STANDARD_APPROVAL',
      status: status || 'ACTIVE',
      createdBy: createdBy || 'Super Admin',
    });

    await AuditLog.create({
      action: 'CREATE_ESCALATION_SUBCATEGORY',
      module: 'escalationManagement',
      entityId: newSubcat._id.toString(),
      entityName: `${catDoc.name} - ${newSubcat.name}`,
      performedBy: createdBy || 'Super Admin',
      details: { category: catDoc.name, subcategory: newSubcat.name, priority: newSubcat.priority },
    });

    return NextResponse.json({ success: true, data: newSubcat, message: 'Subcategory created successfully' });
  } catch (error: any) {
    console.error('Error creating subcategory:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { id, ...updateFields } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Subcategory ID required' }, { status: 400 });
    }

    const updated = await EscalationSubcategory.findByIdAndUpdate(id, updateFields, { new: true });
    if (!updated) {
      return NextResponse.json({ success: false, message: 'Subcategory not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated, message: 'Subcategory updated successfully' });
  } catch (error: any) {
    console.error('Error updating subcategory:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Subcategory ID required' }, { status: 400 });
    }

    const sub = await EscalationSubcategory.findById(id);
    if (!sub) {
      return NextResponse.json({ success: false, message: 'Subcategory not found' }, { status: 404 });
    }

    const newStatus = sub.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    sub.status = newStatus;
    await sub.save();

    return NextResponse.json({
      success: true,
      message: `Subcategory "${sub.name}" marked as ${newStatus}`,
      data: sub,
    });
  } catch (error: any) {
    console.error('Error toggling subcategory status:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

