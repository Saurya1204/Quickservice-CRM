import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { EscalationCategory } from '@/models/EscalationCategory';
import { EscalationSubcategory } from '@/models/EscalationSubcategory';
import { seedInitialEscalationData } from '@/lib/escalationService';
import { AuditLog } from '@/models/AuditLog';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await connectDB();
    await seedInitialEscalationData();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const query: any = {};
    if (status && status !== 'ALL') {
      query.status = status;
    }

    const categories = await EscalationCategory.find(query).sort({ createdAt: -1 }).lean();

    // Attach subcategory counts
    const categoriesWithCounts = await Promise.all(
      categories.map(async (cat: any) => {
        const subCount = await EscalationSubcategory.countDocuments({ categoryId: cat._id, status: 'ACTIVE' });
        return {
          ...cat,
          subcategoryCount: subCount,
        };
      })
    );

    return NextResponse.json({ success: true, data: categoriesWithCounts });
  } catch (error: any) {
    console.error('Error fetching escalation categories:', error);
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
      description,
      department,
      associatedProductCategory,
      defaultManagerId,
      defaultManagerName,
      priority,
      approvalRequired,
      status,
      createdBy,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, message: 'Category Name is required' }, { status: 400 });
    }

    const formattedCode = (code || name)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');

    const existing = await EscalationCategory.findOne({
      $or: [{ code: formattedCode }, { name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } }],
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: `Category with code "${formattedCode}" or name "${name}" already exists.` },
        { status: 400 }
      );
    }

    const newCat = await EscalationCategory.create({
      name: name.trim(),
      code: formattedCode,
      description: description || '',
      department: department || 'Technical Services',
      associatedProductCategory: associatedProductCategory || 'All',
      defaultManagerId: defaultManagerId || undefined,
      defaultManagerName: defaultManagerName || '',
      priority: priority || 'MEDIUM',
      approvalRequired: approvalRequired !== false,
      status: status || 'ACTIVE',
      createdBy: createdBy || 'Super Admin',
    });

    await AuditLog.create({
      action: 'CREATE_ESCALATION_CATEGORY',
      module: 'escalationManagement',
      entityId: newCat._id.toString(),
      entityName: newCat.name,
      performedBy: createdBy || 'Super Admin',
      details: { code: newCat.code, priority: newCat.priority },
    });

    return NextResponse.json({ success: true, data: newCat, message: 'Category created successfully' });
  } catch (error: any) {
    console.error('Error creating escalation category:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { id, ...updateFields } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Category ID required' }, { status: 400 });
    }

    const updated = await EscalationCategory.findByIdAndUpdate(id, updateFields, { new: true });
    if (!updated) {
      return NextResponse.json({ success: false, message: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated, message: 'Category updated successfully' });
  } catch (error: any) {
    console.error('Error updating escalation category:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Category ID required' }, { status: 400 });
    }

    // Toggle to INACTIVE or delete
    const cat = await EscalationCategory.findById(id);
    if (!cat) {
      return NextResponse.json({ success: false, message: 'Category not found' }, { status: 404 });
    }

    const newStatus = cat.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    cat.status = newStatus;
    await cat.save();

    return NextResponse.json({
      success: true,
      message: `Category "${cat.name}" marked as ${newStatus}`,
      data: cat,
    });
  } catch (error: any) {
    console.error('Error toggling category status:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

