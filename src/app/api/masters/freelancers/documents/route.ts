import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { FreelancerDocument, FREELANCER_DOCUMENT_TYPES } from '@/models/FreelancerDocument';
import { Freelancer } from '@/models/Freelancer';
import { AuditLog } from '@/models/AuditLog';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const freelancerId = searchParams.get('freelancerId');
    const freelancerCode = searchParams.get('freelancerCode');

    const query: any = { status: 'ACTIVE' };
    if (freelancerId) {
      query.freelancerId = freelancerId;
    }
    if (freelancerCode) {
      query.freelancerCode = freelancerCode.toUpperCase().trim();
    }

    const docs = await FreelancerDocument.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: docs });
  } catch (error: any) {
    console.error('Error fetching freelancer documents:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const formData = await req.formData();

    let freelancerId = formData.get('freelancerId') as string;
    const freelancerCode = formData.get('freelancerCode') as string;
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

    let freelancer: any = null;
    if (freelancerId) {
      freelancer = await Freelancer.findById(freelancerId);
    }
    if (!freelancer && freelancerCode) {
      freelancer = await Freelancer.findOne({
        freelancerCode: freelancerCode.toUpperCase().trim(),
      });
    }

    if (!freelancer) {
      return NextResponse.json(
        {
          success: false,
          message: 'Freelancer not found. Please provide a valid Freelancer ID or Code.',
        },
        { status: 404 }
      );
    }

    freelancerId = freelancer._id.toString();

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

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'freelancer-docs');
    await mkdir(uploadDir, { recursive: true });

    const safeFilename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const filePath = path.join(uploadDir, safeFilename);
    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/freelancer-docs/${safeFilename}`;

    const newDoc = await FreelancerDocument.create({
      freelancerId: freelancer._id,
      freelancerCode: freelancer.freelancerCode,
      freelancerName: freelancer.freelancerName,
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
      action: 'UPLOAD_FREELANCER_DOCUMENT',
      module: 'FREELANCE_MASTER',
      performedBy: uploadedBy,
      entityId: freelancer._id.toString(),
      details: `Uploaded ${documentType} ("${file.name}") for Freelancer "${freelancer.freelancerName}" (${freelancer.freelancerCode})`,
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      data: newDoc,
      message: `Document "${file.name}" uploaded successfully for Freelancer "${freelancer.freelancerName}"!`,
    });
  } catch (error: any) {
    console.error('Error uploading freelancer document:', error);
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

    const doc = await FreelancerDocument.findById(id);
    if (!doc) {
      return NextResponse.json({ success: false, message: 'Document not found' }, { status: 404 });
    }

    if (doc.fileUrl && doc.fileUrl.startsWith('/uploads/freelancer-docs/')) {
      const diskPath = path.join(process.cwd(), 'public', doc.fileUrl);
      await unlink(diskPath).catch(() => null);
    }

    await FreelancerDocument.findByIdAndDelete(id);

    await AuditLog.create({
      action: 'DELETE_FREELANCER_DOCUMENT',
      module: 'FREELANCE_MASTER',
      performedBy: 'Super Admin',
      entityId: doc.freelancerId?.toString() || id,
      details: `Deleted ${doc.documentType} ("${doc.fileName}") for Freelancer (${doc.freelancerCode})`,
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      message: `Document "${doc.fileName}" deleted successfully.`,
    });
  } catch (error: any) {
    console.error('Error deleting freelancer document:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
