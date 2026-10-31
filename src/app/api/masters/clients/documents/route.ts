import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { ClientDocument, CLIENT_DOCUMENT_TYPES } from '@/models/ClientDocument';
import { Client } from '@/models/Client';
import { AuditLog } from '@/models/AuditLog';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    const clientCode = searchParams.get('clientCode');

    const query: any = { status: 'ACTIVE' };
    if (clientId) {
      query.clientId = clientId;
    }
    if (clientCode) {
      query.clientCode = clientCode.toUpperCase().trim();
    }

    const docs = await ClientDocument.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: docs });
  } catch (error: any) {
    console.error('Error fetching client documents:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const formData = await req.formData();

    let clientId = formData.get('clientId') as string;
    const clientCode = formData.get('clientCode') as string;
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

    let client: any = null;
    if (clientId) {
      client = await Client.findById(clientId);
    }
    if (!client && clientCode) {
      client = await Client.findOne({
        clientCode: clientCode.toUpperCase().trim(),
      });
    }

    if (!client) {
      return NextResponse.json(
        {
          success: false,
          message: 'Client not found. Please select a valid Client.',
        },
        { status: 404 }
      );
    }

    clientId = client._id.toString();

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

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'client-docs');
    await mkdir(uploadDir, { recursive: true });

    const safeFilename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const filePath = path.join(uploadDir, safeFilename);
    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/client-docs/${safeFilename}`;

    const newDoc = await ClientDocument.create({
      clientId: client._id,
      clientCode: client.clientCode,
      clientName: client.clientName,
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
      action: 'UPLOAD_CLIENT_DOCUMENT',
      module: 'CLIENT_MASTER',
      performedBy: uploadedBy,
      entityId: client._id.toString(),
      details: `Uploaded ${documentType} ("${file.name}") for Client "${client.clientName}" (${client.clientCode})`,
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      data: newDoc,
      message: `Document "${file.name}" uploaded successfully for Client "${client.clientName}"!`,
    });
  } catch (error: any) {
    console.error('Error uploading client document:', error);
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

    const doc = await ClientDocument.findById(id);
    if (!doc) {
      return NextResponse.json({ success: false, message: 'Document not found' }, { status: 404 });
    }

    if (doc.fileUrl && doc.fileUrl.startsWith('/uploads/client-docs/')) {
      const diskPath = path.join(process.cwd(), 'public', doc.fileUrl);
      await unlink(diskPath).catch(() => null);
    }

    await ClientDocument.findByIdAndDelete(id);

    await AuditLog.create({
      action: 'DELETE_CLIENT_DOCUMENT',
      module: 'CLIENT_MASTER',
      performedBy: 'Super Admin',
      entityId: doc.clientId?.toString() || id,
      details: `Deleted ${doc.documentType} ("${doc.fileName}") for Client (${doc.clientCode})`,
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      message: `Document "${doc.fileName}" deleted successfully.`,
    });
  } catch (error: any) {
    console.error('Error deleting client document:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
