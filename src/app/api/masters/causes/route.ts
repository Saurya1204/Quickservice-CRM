import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Cause } from '@/models/Cause';
import { Symptom } from '@/models/Symptom';
import { Category } from '@/models/Category';
import { Analysis } from '@/models/Analysis';
import { AuditLog } from '@/models/AuditLog';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');
    const symptomId = searchParams.get('symptomId');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const query: any = {};
    if (categoryId && categoryId !== 'all') query.categoryId = categoryId;
    if (symptomId && symptomId !== 'all') query.symptomId = symptomId;
    if (status && status !== 'all') query.status = status;

    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { causeName: regex },
        { causeCode: regex },
        { symptomName: regex },
        { categoryName: regex },
      ];
    }

    const total = await Cause.countDocuments(query);
    const causes = await Cause.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      success: true,
      data: causes,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) || 1 },
    });
  } catch (error: any) {
    console.error('Error fetching causes:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { categoryId, symptomId, causeName, status } = body;

    if (!categoryId || !symptomId || !causeName) {
      return NextResponse.json(
        { success: false, message: 'Category, Symptom and Cause Name are required' },
        { status: 400 }
      );
    }

    const [category, symptom] = await Promise.all([
      Category.findById(categoryId),
      Symptom.findById(symptomId),
    ]);

    if (!category || !symptom) {
      return NextResponse.json(
        { success: false, message: 'Selected Category or Symptom does not exist' },
        { status: 404 }
      );
    }

    // Check duplicate
    const existing = await Cause.findOne({
      symptomId,
      causeName: causeName.trim(),
    });
    if (existing) {
      return NextResponse.json(
        { success: false, message: `Cause "${causeName}" already exists for this Symptom` },
        { status: 409 }
      );
    }

    const count = await Cause.countDocuments();
    const causeCode = `CAU${String(count + 1).padStart(4, '0')}`;

    const newCause = await Cause.create({
      causeCode,
      categoryId,
      categoryName: category.categoryName,
      symptomId,
      symptomName: symptom.symptomName,
      causeName: causeName.trim(),
      status: status || 'A',
      createdBy: 'Super Admin',
      updatedBy: 'Super Admin',
    });

    await AuditLog.create({
      action: 'CREATE',
      module: 'CauseMaster',
      recordId: newCause._id.toString(),
      details: { causeCode, causeName: newCause.causeName, symptomName: symptom.symptomName },
      performedBy: 'Super Admin',
    });

    return NextResponse.json({ success: true, data: newCause, message: 'Cause created successfully' });
  } catch (error: any) {
    console.error('Error creating cause:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { _id, categoryId, symptomId, causeName, status } = body;

    if (!_id) {
      return NextResponse.json({ success: false, message: 'Cause ID is required' }, { status: 400 });
    }

    const updateData: any = { updatedAt: new Date(), updatedBy: 'Super Admin' };
    if (status) updateData.status = status;
    if (causeName) updateData.causeName = causeName.trim();
    if (categoryId) {
      const cat = await Category.findById(categoryId);
      if (cat) {
        updateData.categoryId = categoryId;
        updateData.categoryName = cat.categoryName;
      }
    }
    if (symptomId) {
      const sym = await Symptom.findById(symptomId);
      if (sym) {
        updateData.symptomId = symptomId;
        updateData.symptomName = sym.symptomName;
      }
    }

    const updated = await Cause.findByIdAndUpdate(_id, updateData, { new: true });
    if (!updated) {
      return NextResponse.json({ success: false, message: 'Cause not found' }, { status: 404 });
    }

    await AuditLog.create({
      action: 'UPDATE',
      module: 'CauseMaster',
      recordId: _id,
      details: { causeName: updated.causeName },
      performedBy: 'Super Admin',
    });

    return NextResponse.json({ success: true, data: updated, message: 'Cause updated successfully' });
  } catch (error: any) {
    console.error('Error updating cause:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Cause ID is required' }, { status: 400 });
    }

    const analysisCount = await Analysis.countDocuments({ causeId: id });
    if (analysisCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot delete Cause: Referenced by ${analysisCount} Analysis record(s). Please deactivate it instead.`,
        },
        { status: 400 }
      );
    }

    const deleted = await Cause.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ success: false, message: 'Cause not found' }, { status: 404 });
    }

    await AuditLog.create({
      action: 'DELETE',
      module: 'CauseMaster',
      recordId: id,
      details: { causeName: deleted.causeName },
      performedBy: 'Super Admin',
    });

    return NextResponse.json({ success: true, message: 'Cause deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting cause:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
