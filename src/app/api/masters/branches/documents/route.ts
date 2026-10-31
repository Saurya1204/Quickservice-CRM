import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { BranchDocument } from '@/models/BranchDocument';
import { Branch } from '@/models/Branch';
import { AuditLog } from '@/models/AuditLog';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get('branchId');

    const query: any = { status: 'ACTIVE' };
    if (branchId) {
      query.branchId = branchId;
    }

    const docs = await BranchDocument.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: docs });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const formData = await req.formData();

    const branchId = formData.get('branchId') as string;
    const documentType = formData.get('documentType') as string;
    const uploadedBy = (formData.get('uploadedBy') as string) || 'Admin';
    const file = formData.get('file') as File | null;

    if (!branchId) {
      return NextResponse.json({ success: false, message: 'Please select a Branch.' }, { status: 400 });
    }
    if (!documentType) {
      return NextResponse.json({ success: false, message: 'Please select Document Type.' }, { status: 400 });
    }
    if (!file || typeof file === 'string') {
      return NextResponse.json({ success: false, message: 'Please select a file to upload.' }, { status: 400 });
    }

    // Validate branch
    const branch = await Branch.findById(branchId);
    if (!branch) {
      return NextResponse.json({ success: false, message: 'Selected branch does not exist.' }, { status: 404 });
    }

    // Validate size (max 15MB)
    const MAX_SIZE = 15 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, message: 'File size exceeds maximum limit of 15 MB.' },
        { status: 400 }
      );
    }

    // Allowed extensions
    const ext = path.extname(file.name).toLowerCase();
    const allowedExts = ['.pdf', '.png', '.jpg', '.jpeg', '.webp', '.doc', '.docx'];
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

    // Save to public/uploads/branch-docs
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'branch-docs');
    await mkdir(uploadDir, { recursive: true });

    const safeFilename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const filePath = path.join(uploadDir, safeFilename);
    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/branch-docs/${safeFilename}`;

    const newDoc = await BranchDocument.create({
      branchId: branch._id,
      branchName: branch.branchName,
      crmCode: branch.crmCode,
      documentType,
      fileName: file.name,
      fileUrl,
      fileSize: file.size,
      fileType: file.type || ext,
      uploadedBy,
      status: 'ACTIVE',
    });

    await AuditLog.create({
      action: 'UPLOAD_BRANCH_DOCUMENT',
      module: 'branchMaster',
      entityId: newDoc._id.toString(),
      entityName: `${branch.branchName} - ${documentType}`,
      performedBy: uploadedBy,
      details: { fileName: file.name, fileSize: file.size, documentType },
    });

    return NextResponse.json({
      success: true,
      data: newDoc,
      message: `Document "${file.name}" uploaded successfully for branch "${branch.branchName}"!`,
    });
  } catch (error: any) {
    console.error('Document upload error:', error);
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

    const doc = await BranchDocument.findById(id);
    if (!doc) {
      return NextResponse.json({ success: false, message: 'Document not found' }, { status: 404 });
    }

    // Try to remove physical file
    try {
      if (doc.fileUrl && doc.fileUrl.startsWith('/uploads/branch-docs/')) {
        const filePath = path.join(process.cwd(), 'public', doc.fileUrl);
        await unlink(filePath).catch(() => {});
      }
    } catch (e) {
      console.warn('Could not remove file from disk:', e);
    }

    await BranchDocument.findByIdAndDelete(id);

    await AuditLog.create({
      action: 'DELETE_BRANCH_DOCUMENT',
      module: 'branchMaster',
      entityId: id,
      entityName: `${doc.branchName} - ${doc.documentType}`,
      performedBy: 'Super Admin',
    });

    return NextResponse.json({ success: true, message: 'Document deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
