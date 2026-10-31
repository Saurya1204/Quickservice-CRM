import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { VendorDocument } from '@/models/VendorDocument';
import { Vendor } from '@/models/Vendor';
import { AuditLog } from '@/models/AuditLog';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const vendorId = searchParams.get('vendorId');

    const query: any = {};
    if (vendorId && vendorId !== 'all') {
      query.vendorId = vendorId;
    }

    const documents = await VendorDocument.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: documents });
  } catch (error: any) {
    console.error('Error fetching vendor documents:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const formData = await req.formData();
    const vendorId = formData.get('vendorId') as string;
    const documentType = formData.get('documentType') as string;
    const file = formData.get('file') as File;

    if (!vendorId || !documentType || !file) {
      return NextResponse.json(
        { success: false, message: 'Vendor, Document Type, and File are required' },
        { status: 400 }
      );
    }

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return NextResponse.json({ success: false, message: 'Vendor not found' }, { status: 404 });
    }

    // Validate mime
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: 'Invalid file type. Only PDF, JPG, PNG, and WebP are allowed' },
        { status: 400 }
      );
    }

    // Size limit: 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: 'File size exceeds maximum limit of 10MB' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueFileName = `${Date.now()}_${sanitizedFileName}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'vendor-docs');
    const filePath = path.join(uploadDir, uniqueFileName);

    await writeFile(filePath, buffer);
    const fileUrl = `/uploads/vendor-docs/${uniqueFileName}`;

    const newDoc = await VendorDocument.create({
      vendorId: vendor._id,
      vendorName: vendor.vendorName,
      documentType,
      fileName: file.name,
      fileUrl,
      fileSize: file.size,
      mimeType: file.type,
      uploadedBy: 'Super Admin',
      uploadedAt: new Date(),
      status: 'Active',
    });

    await AuditLog.create({
      action: 'UPLOAD_DOCUMENT',
      module: 'VendorDocument',
      recordId: newDoc._id.toString(),
      details: { vendorId: vendor._id, documentType, fileName: file.name },
      performedBy: 'Super Admin',
    });

    return NextResponse.json({
      success: true,
      data: newDoc,
      message: 'Vendor document uploaded successfully',
    });
  } catch (error: any) {
    console.error('Error uploading vendor document:', error);
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

    const doc = await VendorDocument.findById(id);
    if (!doc) {
      return NextResponse.json({ success: false, message: 'Document not found' }, { status: 404 });
    }

    if (doc.fileUrl) {
      try {
        const filePath = path.join(process.cwd(), 'public', doc.fileUrl);
        await unlink(filePath);
      } catch (e) {
        console.warn('Could not unlink local file:', e);
      }
    }

    await VendorDocument.findByIdAndDelete(id);

    await AuditLog.create({
      action: 'DELETE_DOCUMENT',
      module: 'VendorDocument',
      recordId: id,
      details: { documentType: doc.documentType, fileName: doc.fileName },
      performedBy: 'Super Admin',
    });

    return NextResponse.json({ success: true, message: 'Vendor document deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting vendor document:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
