import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { FranchiseDocument, FRANCHISE_DOCUMENT_TYPES } from '@/models/FranchiseDocument';
import { Franchise } from '@/models/Franchise';
import { AuditLog } from '@/models/AuditLog';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const franchiseId = searchParams.get('franchiseId');
    const crmCode = searchParams.get('crmCode');

    const query: any = { status: 'ACTIVE' };
    if (franchiseId) {
      query.franchiseId = franchiseId;
    }
    if (crmCode) {
      query.franchiseCRMCode = crmCode.toUpperCase().trim();
    }

    const docs = await FranchiseDocument.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: docs });
  } catch (error: any) {
    console.error('Error fetching franchise documents:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const formData = await req.formData();

    let franchiseId = (formData.get('franchiseId') as string) || '';
    let franchiseCRMCode = (formData.get('franchiseCRMCode') as string) || '';
    const documentType = (formData.get('documentType') as string) || '';
    const uploadedBy = (formData.get('uploadedBy') as string) || 'Super Admin';
    const file = formData.get('file') as File | null;

    if (!documentType) {
      return NextResponse.json({ success: false, message: 'Please select Document Type.' }, { status: 400 });
    }
    if (!file || typeof file === 'string') {
      return NextResponse.json({ success: false, message: 'Please select a document file to upload.' }, { status: 400 });
    }

    // Resolve Franchise by ID or CRM Code
    let franchise = null;
    if (franchiseId) {
      franchise = await Franchise.findById(franchiseId);
    }
    if (!franchise && franchiseCRMCode) {
      franchise = await Franchise.findOne({ crmCode: franchiseCRMCode.toUpperCase().trim() });
    }

    if (!franchise) {
      return NextResponse.json(
        { success: false, message: 'Valid Franchise could not be identified. Please select a franchise.' },
        { status: 400 }
      );
    }

    // Validate size (max 20MB)
    const MAX_SIZE = 20 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, message: 'File size exceeds maximum limit of 20 MB.' },
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

    // Save to public/uploads/franchise-docs
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'franchise-docs');
    await mkdir(uploadDir, { recursive: true });

    const safeFilename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const filePath = path.join(uploadDir, safeFilename);
    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/franchise-docs/${safeFilename}`;

    const newDoc = await FranchiseDocument.create({
      franchiseId: franchise._id,
      franchiseCRMCode: franchise.crmCode,
      franchiseName: franchise.firmName,
      documentType,
      fileName: file.name,
      fileUrl,
      fileSize: file.size,
      mimeType: file.type || ext,
      uploadedBy,
      uploadedAt: new Date(),
      status: 'ACTIVE',
    });

    await AuditLog.create({
      action: 'UPLOAD_FRANCHISE_DOCUMENT',
      module: 'franchiseMaster',
      entityId: newDoc._id.toString(),
      entityName: `${franchise.firmName} - ${documentType}`,
      performedBy: uploadedBy,
      details: {
        crmCode: franchise.crmCode,
        fileName: file.name,
        fileSize: file.size,
        documentType,
      },
    });

    return NextResponse.json({
      success: true,
      data: newDoc,
      message: `Document "${file.name}" uploaded successfully for franchise "${franchise.firmName}" (${franchise.crmCode})!`,
    });
  } catch (error: any) {
    console.error('Franchise document upload error:', error);
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

    const doc = await FranchiseDocument.findById(id);
    if (!doc) {
      return NextResponse.json({ success: false, message: 'Document not found' }, { status: 404 });
    }

    // Try to remove physical file
    try {
      if (doc.fileUrl && doc.fileUrl.startsWith('/uploads/franchise-docs/')) {
        const filePath = path.join(process.cwd(), 'public', doc.fileUrl);
        await unlink(filePath).catch(() => {});
      }
    } catch (e) {
      console.warn('Could not remove file from disk:', e);
    }

    await FranchiseDocument.findByIdAndDelete(id);

    await AuditLog.create({
      action: 'DELETE_FRANCHISE_DOCUMENT',
      module: 'franchiseMaster',
      entityId: id,
      entityName: `${doc.franchiseName} - ${doc.documentType}`,
      performedBy: 'Super Admin',
      details: { fileName: doc.fileName },
    });

    return NextResponse.json({ success: true, message: `Document "${doc.fileName}" deleted successfully.` });
  } catch (error: any) {
    console.error('Error deleting franchise document:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
