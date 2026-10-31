import { NextResponse } from 'next/server';

// In-memory cache to prevent repeated lookups
const pincodeCache = new Map<string, any>();

// Standard fallback database for common test/operational PIN codes
const PINCODE_FALLBACKS: Record<
  string,
  { state: string; district: string; city: string; localities: string[] }
> = {
  '201014': {
    state: 'UTTAR PRADESH',
    district: 'GHAZIABAD',
    city: 'GHAZIABAD',
    localities: ['INDIRAPURAM', 'VAIBHAV KHAND', 'AHINSA KHAND', 'NYAY KHAND'],
  },
  '201010': {
    state: 'UTTAR PRADESH',
    district: 'GHAZIABAD',
    city: 'GHAZIABAD',
    localities: ['VAISHALI', 'KAUSHAMBI', 'SECTOR 4 VAISHALI'],
  },
  '201007': {
    state: 'UTTAR PRADESH',
    district: 'GHAZIABAD',
    city: 'GHAZIABAD',
    localities: ['MOHAN NAGAR', 'ARTHALA', 'PASSONDA'],
  },
  '201301': {
    state: 'UTTAR PRADESH',
    district: 'GAUTAM BUDDHA NAGAR',
    city: 'NOIDA',
    localities: ['SECTOR 15', 'SECTOR 16', 'SECTOR 18', 'SECTOR 27'],
  },
  '201309': {
    state: 'UTTAR PRADESH',
    district: 'GAUTAM BUDDHA NAGAR',
    city: 'NOIDA',
    localities: ['SECTOR 62', 'SECTOR 63', 'ELECTRONIC CITY'],
  },
  '110001': {
    state: 'DELHI',
    district: 'CENTRAL DELHI',
    city: 'NEW DELHI',
    localities: ['CONNAUGHT PLACE', 'BARAKHAMBA', 'JANPATH', 'PARLIAMENT STREET'],
  },
  '110092': {
    state: 'DELHI',
    district: 'EAST DELHI',
    city: 'DELHI',
    localities: ['PREET VIHAR', 'NIRMAN VIHAR', 'SHAKARPUR', 'LAXMI NAGAR'],
  },
  '110039': {
    state: 'DELHI',
    district: 'NORTH WEST DELHI',
    city: 'NEW DELHI',
    localities: ['BAWANA', 'BAWANA INDUSTRIAL AREA', 'POOTH KHURD'],
  },
  '400001': {
    state: 'MAHARASHTRA',
    district: 'MUMBAI',
    city: 'MUMBAI',
    localities: ['FORT', 'NARIMAN POINT', 'COLABA', 'BALLARD ESTATE'],
  },
  '560001': {
    state: 'KARNATAKA',
    district: 'BANGALORE',
    city: 'BENGALURU',
    localities: ['MG ROAD', 'BRIGADE ROAD', 'CUBBON PARK', 'SHIVAJINAGAR'],
  },
  '600001': {
    state: 'TAMIL NADU',
    district: 'CHENNAI',
    city: 'CHENNAI',
    localities: ['GEORGE TOWN', 'PARRYS', 'FLOWER BAZAAR'],
  },
  '700001': {
    state: 'WEST BENGAL',
    district: 'KOLKATA',
    city: 'KOLKATA',
    localities: ['BBD BAGH', 'DALHOUSIE', 'HARE STREET'],
  },
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const cleanCode = (code || '').trim();

    if (!/^\d{6}$/.test(cleanCode)) {
      return NextResponse.json(
        { success: false, message: 'Invalid Indian PIN Code. Must be exactly 6 digits.' },
        { status: 400 }
      );
    }

    // Check cache
    if (pincodeCache.has(cleanCode)) {
      return NextResponse.json({
        success: true,
        data: pincodeCache.get(cleanCode),
        source: 'cache',
      });
    }

    // Try fetching from official Indian Postal Pincode API
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const postalRes = await fetch(`https://api.postalpincode.in/pincode/${cleanCode}`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeoutId);

      if (postalRes.ok) {
        const postalData = await postalRes.json();
        if (
          Array.isArray(postalData) &&
          postalData.length > 0 &&
          postalData[0].Status === 'Success' &&
          Array.isArray(postalData[0].PostOffice) &&
          postalData[0].PostOffice.length > 0
        ) {
          const poList = postalData[0].PostOffice;
          const first = poList[0];
          const state = (first.State || '').toUpperCase();
          const district = (first.District || '').toUpperCase();
          const city = (first.Division || first.District || first.Block || '').toUpperCase();
          const localities = Array.from(
            new Set(
              poList
                .map((p: any) => (p.Name || '').toUpperCase())
                .filter(Boolean)
            )
          ) as string[];

          const result = {
            pincode: cleanCode,
            state,
            district,
            city,
            localities,
            defaultLocality: localities[0] || '',
          };

          pincodeCache.set(cleanCode, result);
          return NextResponse.json({ success: true, data: result, source: 'live_api' });
        }
      }
    } catch (networkErr) {
      console.warn(`Pincode live lookup failed for ${cleanCode}, falling back:`, networkErr);
    }

    // Check fallback database
    if (PINCODE_FALLBACKS[cleanCode]) {
      const fb = PINCODE_FALLBACKS[cleanCode];
      const result = {
        pincode: cleanCode,
        state: fb.state,
        district: fb.district,
        city: fb.city,
        localities: fb.localities,
        defaultLocality: fb.localities[0] || '',
      };
      pincodeCache.set(cleanCode, result);
      return NextResponse.json({ success: true, data: result, source: 'fallback' });
    }

    return NextResponse.json(
      {
        success: false,
        message: `No location details found for PIN Code ${cleanCode}. Please enter manually.`,
      },
      { status: 404 }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
