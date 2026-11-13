import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { ServiceCall } from '@/models/ServiceCall';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const callId = searchParams.get('callId') || searchParams.get('id');
    const type = (searchParams.get('type') || 'invoice').toLowerCase();
    const index = parseInt(searchParams.get('index') || '0', 10);
    const download = searchParams.get('download') === '1' || searchParams.get('download') === 'true';

    if (!callId) {
      return NextResponse.json({ success: false, message: 'Call ID is required.' }, { status: 400 });
    }

    const call = await ServiceCall.findById(callId).select('+invoiceFile.fileData +defectivePartImages.fileData');
    if (!call) {
      return NextResponse.json({ success: false, message: 'Service Call not found.' }, { status: 404 });
    }

    let attachment: any = null;
    if (type === 'invoice') {
      attachment = call.invoiceFile;
    } else if (type === 'defective' || type === 'defectivepart') {
      const images = call.defectivePartImages || [];
      attachment = images[index] || images[0];
    }

    if (!attachment) {
      return NextResponse.json({ success: false, message: 'Requested attachment not found.' }, { status: 404 });
    }

    let fileBuffer: Buffer | null = null;
    if (attachment.fileData) {
      fileBuffer = Buffer.from(attachment.fileData, 'base64');
    } else if (attachment.fileUrl) {
      try {
        const localPath = path.join(process.cwd(), 'public', attachment.fileUrl);
        if (existsSync(localPath)) {
          fileBuffer = await readFile(localPath);
        }
      } catch (e) {
        console.warn('Could not read attachment from local disk:', e);
      }
    }

    if (!fileBuffer) {
      return NextResponse.json({ success: false, message: 'File contents are not available.' }, { status: 404 });
    }

    let mimeType = attachment.mimeType || '';
    if (!mimeType || mimeType === 'application/octet-stream') {
      const ext = path.extname(attachment.fileName || '').toLowerCase();
      if (ext === '.pdf') mimeType = 'application/pdf';
      else if (ext === '.png') mimeType = 'image/png';
      else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
      else if (ext === '.webp') mimeType = 'image/webp';
      else mimeType = 'application/octet-stream';
    }

    const disposition = download ? 'attachment' : 'inline';
    const fileName = attachment.fileName || (type === 'invoice' ? 'invoice' : 'defective-part');

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `${disposition}; filename="${encodeURIComponent(fileName)}"`,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    console.error('Error serving call attachment:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

