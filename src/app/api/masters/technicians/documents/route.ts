import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { TechnicianDocument, TECHNICIAN_DOCUMENT_TYPES } from '@/models/TechnicianDocument';
import { Technician } from '@/models/Technician';
import { AuditLog } from '@/models/AuditLog';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const technicianId = searchParams.get('technicianId');
    const crmCode = searchParams.get('crmCode');

    const query: any = { status: 'ACTIVE' };
    if (technicianId) {
      query.technicianId = technicianId;
    }
    if (crmCode) {
      query.technicianCRMCode = crmCode.toUpperCase().trim();
    }

    const docs = await TechnicianDocument.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: docs });
  } catch (error: any) {
    console.error('Error fetching technician documents:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const formData = await req.formData();

    let technicianId = formData.get('technicianId') as string;
    const technicianCRMCode = formData.get('technicianCRMCode') as string;
    const documentType = formData.get('documentType') as string;
    const uploadedBy = (formData.get('uploadedBy') as string) || 'Super Admin';
    const notes = (formData.get('notes') as string) || '';
    const file = formData.get('file') as File | null;

    if (!documentType) {
      return NextResponse.json({ success: false, message: 'Please select Document Type.' }, { status: 400 });
    }
    if (!file || typeof file === 'string') {
      return NextResponse.json({ success: false, message: 'Please select a file to upload.' }, { status: 400 });
    }

    let technician: any = null;
    if (technicianId) {
      technician = await Technician.findById(technicianId);
    }
    if (!technician && technicianCRMCode) {
      technician = await Technician.findOne({
        crmCode: technicianCRMCode.toUpperCase().trim(),
      });
    }

    if (!technician) {
      return NextResponse.json(
        {
          success: false,
          message: 'Technician not found. Please provide a valid Technician CRM Code or select a Technician.',
        },
        { status: 404 }
      );
    }

    technicianId = technician._id.toString();

    const MAX_SIZE = 20 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, message: 'File size exceeds 20 MB limit.' },
        { status: 400 }
      );
    }

    const ext = path.extname(file.name).toLowerCase();
    const allowedExts = ['.pdf', '.png', '.jpg', '.jpeg', '.webp', '.doc', '.docx'];
    if (!allowedExts.includes(ext)) {
      return NextResponse.json(
        {
          success: false,
          message: `Unsupported file type "${ext}". Supported types: PDF, PNG, JPG, JPEG, WEBP, DOC, DOCX.`,
        },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'technician-docs');
    await mkdir(uploadDir, { recursive: true });

    const safeFilename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const filePath = path.join(uploadDir, safeFilename);
    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/technician-docs/${safeFilename}`;

    const newDoc = await TechnicianDocument.create({
      technicianId: technician._id,
      technicianCRMCode: technician.crmCode,
      technicianName: technician.technicianName,
      documentType,
      fileName: file.name,
      fileUrl,
      fileSize: file.size,
      mimeType: file.type || ext,
      uploadedBy,
      notes,
      status: 'ACTIVE',
    });

    await AuditLog.create({
      action: 'UPLOAD_TECHNICIAN_DOCUMENT',
      module: 'TECHNICIAN_MASTER',
      performedBy: uploadedBy,
      entityId: technician._id.toString(),
      details: `Uploaded ${documentType} ("${file.name}") for Technician "${technician.technicianName}" (${technician.crmCode})`,
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      data: newDoc,
      message: `Document "${file.name}" uploaded successfully for Technician "${technician.technicianName}"!`,
    });
  } catch (error: any) {
    console.error('Error uploading technician document:', error);
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

    const doc = await TechnicianDocument.findById(id);
    if (!doc) {
      return NextResponse.json({ success: false, message: 'Document not found' }, { status: 404 });
    }

    if (doc.fileUrl && doc.fileUrl.startsWith('/uploads/technician-docs/')) {
      const diskPath = path.join(process.cwd(), 'public', doc.fileUrl);
      await unlink(diskPath).catch(() => null);
    }

    await TechnicianDocument.findByIdAndDelete(id);

    await AuditLog.create({
      action: 'DELETE_TECHNICIAN_DOCUMENT',
      module: 'TECHNICIAN_MASTER',
      performedBy: 'Super Admin',
      entityId: doc.technicianId?.toString() || id,
      details: `Deleted ${doc.documentType} ("${doc.fileName}") for Technician (${doc.technicianCRMCode})`,
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      message: `Document "${doc.fileName}" deleted successfully.`,
    });
  } catch (error: any) {
    console.error('Error deleting technician document:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
