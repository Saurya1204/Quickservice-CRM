import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    await connectDB();
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const attachmentType = (formData.get('attachmentType') as string) || 'Technical Diagnosis';
    const uploadedBy = (formData.get('uploadedBy') as string) || 'Technician';

    if (!file || typeof file === 'string') {
      return NextResponse.json({ success: false, message: 'No file provided.' }, { status: 400 });
    }

    // Maximum file limit: 25MB
    const MAX_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ success: false, message: 'File exceeds maximum 25 MB limit.' }, { status: 400 });
    }

    const ext = path.extname(file.name).toLowerCase();
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.doc', '.docx'];
    if (!allowedExts.includes(ext)) {
      return NextResponse.json(
        { success: false, message: `Unsupported format. Allowed: ${allowedExts.join(', ')}` },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Data = buffer.toString('base64');
    const safeFilename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

    // Attempt local filesystem write, gracefully ignoring EROFS in read-only environments
    let fileUrl = `data:${file.type || 'image/jpeg'};base64,${base64Data}`;
    try {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'escalations');
      await mkdir(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, safeFilename);
      await writeFile(filePath, buffer);
      fileUrl = `/uploads/escalations/${safeFilename}`;
    } catch {
      // Serverless fallback: base64 data URL
    }

    return NextResponse.json({
      success: true,
      data: {
        fileName: file.name,
        fileUrl,
        fileData: base64Data,
        attachmentType,
        fileSize: file.size,
        mimeType: file.type || ext,
        uploadedBy,
        uploadedAt: new Date(),
      },
      message: 'Attachment uploaded successfully',
    });
  } catch (error: any) {
    console.error('Error uploading escalation attachment:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

