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

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const entity = (searchParams.get('entity') || searchParams.get('type') || '').toLowerCase();
    const download = searchParams.get('download') === '1' || searchParams.get('download') === 'true';

    if (!id) {
      return NextResponse.json({ success: false, message: 'Document ID is required.' }, { status: 400 });
    }

    let doc: any = null;

    // 1. Try target model first based on entity
    if (entity === 'client') {
      doc = await ClientDocument.findById(id).select('+fileData');
    } else if (entity === 'branch') {
      doc = await BranchDocument.findById(id).select('+fileData');
    } else if (entity === 'franchise') {
      doc = await FranchiseDocument.findById(id).select('+fileData');
    } else if (entity === 'technician') {
      doc = await TechnicianDocument.findById(id).select('+fileData');
    } else if (entity === 'freelancer' || entity === 'freelance') {
      doc = await FreelancerDocument.findById(id).select('+fileData');
    } else if (entity === 'vendor') {
      doc = await VendorDocument.findById(id).select('+fileData');
    } else if (entity === 'master') {
      doc = await MasterDocument.findById(id).select('+fileData');
    }

    // 2. Fallback search across all models if not found yet
    if (!doc) {
      const models: any[] = [
        ClientDocument,
        FranchiseDocument,
        TechnicianDocument,
        BranchDocument,
        FreelancerDocument,
        VendorDocument,
        MasterDocument,
      ];
      for (const M of models) {
        doc = await M.findById(id).select('+fileData').catch(() => null);
        if (doc) break;
      }
    }

    if (!doc) {
      return NextResponse.json({ success: false, message: 'Document not found.' }, { status: 404 });
    }

    // Resolve binary buffer
    let fileBuffer: Buffer | null = null;
    if (doc.fileData) {
      fileBuffer = Buffer.from(doc.fileData, 'base64');
    } else if (doc.fileUrl) {
      try {
        const localPath = path.join(process.cwd(), 'public', doc.fileUrl);
        if (existsSync(localPath)) {
          fileBuffer = await readFile(localPath);
        }
      } catch (e) {
        console.warn('Could not read from local disk:', e);
      }
    }

    if (!fileBuffer) {
      return NextResponse.json(
        { success: false, message: 'File contents are not available.' },
        { status: 404 }
      );
    }

    // Determine correct content type
    let mimeType = doc.mimeType || doc.fileType || '';
    if (!mimeType || mimeType === 'application/octet-stream') {
      const ext = path.extname(doc.fileName || '').toLowerCase();
      if (ext === '.pdf') mimeType = 'application/pdf';
      else if (ext === '.png') mimeType = 'image/png';
      else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
      else if (ext === '.webp') mimeType = 'image/webp';
      else if (ext === '.doc') mimeType = 'application/msword';
      else if (ext === '.docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      else mimeType = 'application/octet-stream';
    }

    const disposition = download ? 'attachment' : 'inline';

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `${disposition}; filename="${encodeURIComponent(doc.fileName)}"`,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    console.error('Error serving document:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
