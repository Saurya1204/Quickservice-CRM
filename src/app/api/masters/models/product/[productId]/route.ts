import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { ModelMaster } from '@/models/ModelMaster';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, context: { params: Promise<{ productId: string }> }) {
  try {
    await connectDB();
    const { productId } = await context.params;

    if (!productId) {
      return NextResponse.json({ success: false, message: 'Product ID is required' }, { status: 400 });
    }

    const models = await ModelMaster.find({ productId, status: 'A' }).sort({ modelNo: 1 });
    return NextResponse.json({ success: true, data: models });
  } catch (error: any) {
    console.error('Error fetching models by product:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
