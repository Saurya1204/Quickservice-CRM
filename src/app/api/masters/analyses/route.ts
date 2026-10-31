import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Analysis } from '@/models/Analysis';
import { Cause } from '@/models/Cause';
import { Symptom } from '@/models/Symptom';
import { Category } from '@/models/Category';
import { AuditLog } from '@/models/AuditLog';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');
    const symptomId = searchParams.get('symptomId');
    const causeId = searchParams.get('causeId');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const query: any = {};
    if (categoryId && categoryId !== 'all') query.categoryId = categoryId;
    if (symptomId && symptomId !== 'all') query.symptomId = symptomId;
    if (causeId && causeId !== 'all') query.causeId = causeId;
    if (status && status !== 'all') query.status = status;

    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { analysisName: regex },
        { analysisCode: regex },
        { causeName: regex },
        { symptomName: regex },
        { categoryName: regex },
      ];
    }

    const total = await Analysis.countDocuments(query);
    const analyses = await Analysis.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      success: true,
      data: analyses,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) || 1 },
    });
  } catch (error: any) {
    console.error('Error fetching analyses:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { categoryId, symptomId, causeId, analysisName, status } = body;

    if (!categoryId || !symptomId || !causeId || !analysisName) {
      return NextResponse.json(
        { success: false, message: 'Category, Symptom, Cause and Analysis Name are required' },
        { status: 400 }
      );
    }

    const [category, symptom, cause] = await Promise.all([
      Category.findById(categoryId),
      Symptom.findById(symptomId),
      Cause.findById(causeId),
    ]);

    if (!category || !symptom || !cause) {
      return NextResponse.json(
        { success: false, message: 'Selected Category, Symptom, or Cause does not exist' },
        { status: 404 }
      );
    }

    // Check duplicate
    const existing = await Analysis.findOne({
      causeId,
      analysisName: analysisName.trim(),
    });
    if (existing) {
      return NextResponse.json(
        { success: false, message: `Analysis "${analysisName}" already exists for this Cause` },
        { status: 409 }
      );
    }

    const count = await Analysis.countDocuments();
    const analysisCode = `ANA${String(count + 1).padStart(4, '0')}`;

    const newAnalysis = await Analysis.create({
      analysisCode,
      categoryId,
      categoryName: category.categoryName,
      symptomId,
      symptomName: symptom.symptomName,
      causeId,
      causeName: cause.causeName,
      analysisName: analysisName.trim(),
      status: status || 'A',
      createdBy: 'Super Admin',
      updatedBy: 'Super Admin',
    });

    await AuditLog.create({
      action: 'CREATE',
      module: 'AnalysisMaster',
      recordId: newAnalysis._id.toString(),
      details: { analysisCode, analysisName: newAnalysis.analysisName, causeName: cause.causeName },
      performedBy: 'Super Admin',
    });

    return NextResponse.json({ success: true, data: newAnalysis, message: 'Analysis created successfully' });
  } catch (error: any) {
    console.error('Error creating analysis:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { _id, categoryId, symptomId, causeId, analysisName, status } = body;

    if (!_id) {
      return NextResponse.json({ success: false, message: 'Analysis ID is required' }, { status: 400 });
    }

    const updateData: any = { updatedAt: new Date(), updatedBy: 'Super Admin' };
    if (status) updateData.status = status;
    if (analysisName) updateData.analysisName = analysisName.trim();
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
    if (causeId) {
      const cau = await Cause.findById(causeId);
      if (cau) {
        updateData.causeId = causeId;
        updateData.causeName = cau.causeName;
      }
    }

    const updated = await Analysis.findByIdAndUpdate(_id, updateData, { new: true });
    if (!updated) {
      return NextResponse.json({ success: false, message: 'Analysis not found' }, { status: 404 });
    }

    await AuditLog.create({
      action: 'UPDATE',
      module: 'AnalysisMaster',
      recordId: _id,
      details: { analysisName: updated.analysisName },
      performedBy: 'Super Admin',
    });

    return NextResponse.json({ success: true, data: updated, message: 'Analysis updated successfully' });
  } catch (error: any) {
    console.error('Error updating analysis:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Analysis ID is required' }, { status: 400 });
    }

    const deleted = await Analysis.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ success: false, message: 'Analysis not found' }, { status: 404 });
    }

    await AuditLog.create({
      action: 'DELETE',
      module: 'AnalysisMaster',
      recordId: id,
      details: { analysisName: deleted.analysisName },
      performedBy: 'Super Admin',
    });

    return NextResponse.json({ success: true, message: 'Analysis deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting analysis:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
