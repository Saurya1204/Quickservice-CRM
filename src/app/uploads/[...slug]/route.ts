import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { ClientDocument } from '@/models/ClientDocument';
import { BranchDocument } from '@/models/BranchDocument';
import { FranchiseDocument } from '@/models/FranchiseDocument';
import { FreelancerDocument } from '@/models/FreelancerDocument';
import { TechnicianDocument } from '@/models/TechnicianDocument';
import { VendorDocument } from '@/models/VendorDocument';
import { MasterDocument } from '@/models/MasterDocument';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  try {
    const { slug } = await params;
    const requestedPath = '/uploads/' + slug.join('/');
    const requestedFilename = slug[slug.length - 1];

    // 1. First check if file exists on disk
    try {
      const localPath = path.join(process.cwd(), 'public', 'uploads', ...slug);
      if (existsSync(localPath)) {
        const fileBuffer = await readFile(localPath);
        const ext = path.extname(requestedFilename).toLowerCase();
        let mimeType = 'application/octet-stream';
        if (ext === '.pdf') mimeType = 'application/pdf';
        else if (ext === '.png') mimeType = 'image/png';
        else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
        else if (ext === '.webp') mimeType = 'image/webp';

        return new NextResponse(new Uint8Array(fileBuffer), {
          status: 200,
          headers: {
            'Content-Type': mimeType,
            'Content-Disposition': `inline; filename="${encodeURIComponent(requestedFilename)}"`,
            'Content-Length': fileBuffer.length.toString(),
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        });
      }
    } catch (e) {
      // Local disk read failed or EROFS, proceed to MongoDB fallback
    }

    // 2. Fallback: Search MongoDB document collections
    await connectDB();

    const models: any[] = [
      ClientDocument,
      FranchiseDocument,
      TechnicianDocument,
      BranchDocument,
      FreelancerDocument,
      VendorDocument,
      MasterDocument,
    ];

    let foundDoc: any = null;

    // Search by fileUrl matching requestedPath or requestedFilename
    for (const M of models) {
      foundDoc = await M.findOne({
        $or: [
          { fileUrl: requestedPath },
          { fileUrl: { $regex: requestedFilename, $options: 'i' } },
          { fileName: requestedFilename },
        ],
      })
        .select('+fileData')
        .catch(() => null);

      if (foundDoc && foundDoc.fileData) break;
    }

    if (!foundDoc || !foundDoc.fileData) {
      return NextResponse.json({ success: false, message: 'Document file not found.' }, { status: 404 });
    }

    const fileBuffer = Buffer.from(foundDoc.fileData, 'base64');
    let mimeType = foundDoc.mimeType || foundDoc.fileType || '';
    if (!mimeType || mimeType === 'application/octet-stream') {
      const ext = path.extname(foundDoc.fileName || requestedFilename).toLowerCase();
      if (ext === '.pdf') mimeType = 'application/pdf';
      else if (ext === '.png') mimeType = 'image/png';
      else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
      else if (ext === '.webp') mimeType = 'image/webp';
      else mimeType = 'application/octet-stream';
    }

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `inline; filename="${encodeURIComponent(foundDoc.fileName)}"`,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    console.error('Error serving upload fallback:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
