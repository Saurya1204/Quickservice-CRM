import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Symptom } from '@/models/Symptom';
import { Category } from '@/models/Category';
import { Cause } from '@/models/Cause';
import { AuditLog } from '@/models/AuditLog';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const query: any = {};
    if (categoryId && categoryId !== 'all') query.categoryId = categoryId;
    if (status && status !== 'all') query.status = status;

    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [{ symptomName: regex }, { symptomCode: regex }, { categoryName: regex }];
    }

    const total = await Symptom.countDocuments(query);
    const symptoms = await Symptom.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      success: true,
      data: symptoms,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) || 1 },
    });
  } catch (error: any) {
    console.error('Error fetching symptoms:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { categoryId, symptomName, status } = body;

    if (!categoryId || !symptomName) {
      return NextResponse.json(
        { success: false, message: 'Product Category and Symptom Name are required' },
        { status: 400 }
      );
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return NextResponse.json({ success: false, message: 'Category not found' }, { status: 404 });
    }

    // Check duplicate
    const existing = await Symptom.findOne({
      categoryId,
      symptomName: symptomName.trim(),
    });
    if (existing) {
      return NextResponse.json(
        { success: false, message: `Symptom "${symptomName}" already exists for this Category` },
        { status: 409 }
      );
    }

    const count = await Symptom.countDocuments();
    const symptomCode = `SYM${String(count + 1).padStart(4, '0')}`;

    const newSymptom = await Symptom.create({
      symptomCode,
      categoryId,
      categoryName: category.categoryName,
      symptomName: symptomName.trim(),
      status: status || 'A',
      createdBy: 'Super Admin',
      updatedBy: 'Super Admin',
    });

    await AuditLog.create({
      action: 'CREATE',
      module: 'SymptomMaster',
      recordId: newSymptom._id.toString(),
      details: { symptomCode, symptomName: newSymptom.symptomName, categoryName: category.categoryName },
      performedBy: 'Super Admin',
    });

    return NextResponse.json({ success: true, data: newSymptom, message: 'Symptom created successfully' });
  } catch (error: any) {
    console.error('Error creating symptom:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { _id, categoryId, symptomName, status } = body;

    if (!_id) {
      return NextResponse.json({ success: false, message: 'Symptom ID is required' }, { status: 400 });
    }

    const updateData: any = { updatedAt: new Date(), updatedBy: 'Super Admin' };
    if (status) updateData.status = status;
    if (symptomName) updateData.symptomName = symptomName.trim();
    if (categoryId) {
      const cat = await Category.findById(categoryId);
      if (cat) {
        updateData.categoryId = categoryId;
        updateData.categoryName = cat.categoryName;
      }
    }

    const updated = await Symptom.findByIdAndUpdate(_id, updateData, { new: true });
    if (!updated) {
      return NextResponse.json({ success: false, message: 'Symptom not found' }, { status: 404 });
    }

    await AuditLog.create({
      action: 'UPDATE',
      module: 'SymptomMaster',
      recordId: _id,
      details: { symptomName: updated.symptomName },
      performedBy: 'Super Admin',
    });

    return NextResponse.json({ success: true, data: updated, message: 'Symptom updated successfully' });
  } catch (error: any) {
    console.error('Error updating symptom:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Symptom ID is required' }, { status: 400 });
    }

    const causeCount = await Cause.countDocuments({ symptomId: id });
    if (causeCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot delete Symptom: Referenced by ${causeCount} Cause(s). Please deactivate it instead.`,
        },
        { status: 400 }
      );
    }

    const deleted = await Symptom.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ success: false, message: 'Symptom not found' }, { status: 404 });
    }

    await AuditLog.create({
      action: 'DELETE',
      module: 'SymptomMaster',
      recordId: id,
      details: { symptomName: deleted.symptomName },
      performedBy: 'Super Admin',
    });

    return NextResponse.json({ success: true, message: 'Symptom deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting symptom:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
