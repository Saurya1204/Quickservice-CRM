import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Vendor } from '@/models/Vendor';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const vendorAs = searchParams.get('vendorAs');
    const status = searchParams.get('status');
    const search = searchParams.get('search') || '';

    const query: any = { isDeleted: false };
    if (vendorAs && vendorAs !== 'all') query.vendorAs = vendorAs;
    if (status && status !== 'all') query.status = status;

    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { vendorName: regex },
        { vendorId: regex },
        { vendorAs: regex },
        { proprietorName: regex },
        { proprietorContactNumbers: regex },
        { gstNumber: regex },
        { panNumber: regex },
        { city: regex },
        { state: regex },
      ];
    }

    const vendors = await Vendor.find(query).sort({ createdAt: -1 });

    const rows = vendors.map((v, idx) => ({
      'S.No': idx + 1,
      'Vendor ID': v.vendorId,
      'Vendor Name': v.vendorName,
      'Vendor As': v.vendorAs,
      Address: v.address || '',
      Pincode: v.pincode || '',
      District: v.district || '',
      City: v.city || '',
      State: v.state || '',
      'Landline Number': v.landlineNumber || '',
      'GST Number': v.gstNumber || '',
      'PAN Number': v.panNumber || '',
      'Proprietor Name': v.proprietorName || '',
      'Proprietor Contact': v.proprietorContactNumbers || '',
      'Proprietor Email': v.proprietorEmailId || '',
      'Payment Terms': v.paymentTerms || '',
      Status: v.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Vendors');

    const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new Response(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="Vendor_List.xlsx"',
      },
    });
  } catch (error: any) {
    console.error('Error exporting vendors:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
