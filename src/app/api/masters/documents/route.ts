import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { MasterDocument } from '@/models/MasterDocument';
import { BranchDocument } from '@/models/BranchDocument';
import { AuditLog } from '@/models/AuditLog';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const masterType = searchParams.get('masterType') || 'all';
    const entityId = searchParams.get('entityId');

    const query: any = { status: 'ACTIVE' };
    if (masterType !== 'all') {
      query.masterType = masterType.toLowerCase();
    }
    if (entityId) {
      query.entityId = entityId;
    }

    const docs = await MasterDocument.find(query).sort({ createdAt: -1 });

    // Also include legacy branch docs if querying branch
    let legacyBranchDocs: any[] = [];
    if (masterType === 'branch' || masterType === 'all') {
      const bQuery: any = { status: 'ACTIVE' };
      if (entityId) bQuery.branchId = entityId;
      const bDocs = await BranchDocument.find(bQuery).sort({ createdAt: -1 });
      legacyBranchDocs = bDocs.map((bd) => ({
        _id: bd._id,
        masterType: 'branch',
        entityId: bd.branchId?.toString(),
        entityName: bd.branchName,
        crmCode: bd.crmCode,
        documentType: bd.documentType,
        fileName: bd.fileName,
        fileUrl: bd.fileUrl,
        fileSize: bd.fileSize,
        fileType: bd.fileType,
        uploadedBy: bd.uploadedBy,
        createdAt: bd.createdAt,
      }));
    }

    // Merge and deduplicate by _id
    const merged = [...docs, ...legacyBranchDocs];
    const uniqueMap = new Map();
    for (const item of merged) {
      const idStr = item._id.toString();
      if (!uniqueMap.has(idStr)) {
        uniqueMap.set(idStr, item);
      }
    }

    return NextResponse.json({ success: true, data: Array.from(uniqueMap.values()) });
  } catch (error: any) {
    console.error('Error fetching master documents:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const formData = await req.formData();

    const masterType = (formData.get('masterType') as string) || 'general';
    const entityId = (formData.get('entityId') as string) || '';
    const entityName = (formData.get('entityName') as string) || 'Master Entity';
    const documentType = formData.get('documentType') as string;
    const description = (formData.get('description') as string) || '';
    const uploadedBy = (formData.get('uploadedBy') as string) || 'Super Admin';
    const file = formData.get('file') as File | null;

    if (!documentType) {
      return NextResponse.json({ success: false, message: 'Please select or specify Document Type.' }, { status: 400 });
    }
    if (!file || typeof file === 'string') {
      return NextResponse.json({ success: false, message: 'Please select a file to upload.' }, { status: 400 });
    }

    // Max file size 25MB
    const MAX_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, message: 'File size exceeds maximum limit of 25 MB.' },
        { status: 400 }
      );
    }

    const ext = path.extname(file.name).toLowerCase();
    const allowedExts = ['.pdf', '.png', '.jpg', '.jpeg', '.webp', '.doc', '.docx', '.xls', '.xlsx'];
    if (!allowedExts.includes(ext)) {
      return NextResponse.json(
        {
          success: false,
          message: `Unsupported file format. Supported formats: ${allowedExts.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save to public/uploads/master-docs
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'master-docs');
    await mkdir(uploadDir, { recursive: true });

    const safeFilename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const filePath = path.join(uploadDir, safeFilename);
    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/master-docs/${safeFilename}`;

    const newDoc = await MasterDocument.create({
      masterType: masterType.toLowerCase(),
      entityId,
      entityName,
      documentType,
      description,
      fileName: file.name,
      fileUrl,
      fileSize: file.size,
      fileType: file.type || ext,
      uploadedBy,
      status: 'ACTIVE',
    });

    await AuditLog.create({
      action: 'UPLOAD_MASTER_DOCUMENT',
      module: `${masterType}Master`,
      entityId: newDoc._id.toString(),
      entityName: `${entityName} - ${documentType}`,
      performedBy: uploadedBy,
      details: { masterType, fileName: file.name, fileSize: file.size, documentType },
    });

    return NextResponse.json({
      success: true,
      data: newDoc,
      message: `Document "${file.name}" uploaded successfully for "${entityName}"!`,
    });
  } catch (error: any) {
    console.error('Master document upload error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Document ID is required' }, { status: 400 });
    }

    let doc: any = await MasterDocument.findById(id);
    let isLegacyBranch = false;

    if (!doc) {
      doc = await BranchDocument.findById(id);
      if (doc) isLegacyBranch = true;
    }

    if (!doc) {
      return NextResponse.json({ success: false, message: 'Document not found' }, { status: 404 });
    }

    // Try to remove physical file
    try {
      if (doc.fileUrl && (doc.fileUrl.startsWith('/uploads/master-docs/') || doc.fileUrl.startsWith('/uploads/branch-docs/'))) {
        const filePath = path.join(process.cwd(), 'public', doc.fileUrl);
        await unlink(filePath).catch(() => {});
      }
    } catch (e) {
      console.warn('Could not remove file from disk:', e);
    }

    if (isLegacyBranch) {
      await BranchDocument.findByIdAndDelete(id);
    } else {
      await MasterDocument.findByIdAndDelete(id);
    }

    return NextResponse.json({ success: true, message: 'Document deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
