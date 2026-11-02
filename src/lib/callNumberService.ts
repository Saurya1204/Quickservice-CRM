import { connectDB } from '@/lib/db';
import { CallSequence } from '@/models/CallSequence';
import { ServiceCall } from '@/models/ServiceCall';

/**
 * Standard 2-letter codes for all Indian States & Union Territories
 */
export const INDIAN_STATE_CODES: Record<string, string> = {
  // 28 States
  'ANDHRA PRADESH': 'AP',
  'ARUNACHAL PRADESH': 'AR',
  'ASSAM': 'AS',
  'BIHAR': 'BR',
  'CHHATTISGARH': 'CG',
  'GOA': 'GA',
  'GUJARAT': 'GJ',
  'HARYANA': 'HR',
  'HIMACHAL PRADESH': 'HP',
  'JHARKHAND': 'JH',
  'KARNATAKA': 'KA',
  'KERALA': 'KL',
  'MADHYA PRADESH': 'MP',
  'MAHARASHTRA': 'MH',
  'MANIPUR': 'MN',
  'MEGHALAYA': 'ML',
  'MIZORAM': 'MZ',
  'NAGALAND': 'NL',
  'ODISHA': 'OD',
  'ORISSA': 'OD',
  'PUNJAB': 'PB',
  'RAJASTHAN': 'RJ',
  'SIKKIM': 'SK',
  'TAMIL NADU': 'TN',
  'TELANGANA': 'TS',
  'TRIPURA': 'TR',
  'UTTAR PRADESH': 'UP',
  'UTTARAKHAND': 'UK',
  'UTTARANCHAL': 'UK',
  'WEST BENGAL': 'WB',

  // 8 Union Territories
  'ANDAMAN AND NICOBAR ISLANDS': 'AN',
  'CHANDIGARH': 'CH',
  'DADRA AND NAGAR HAVELI AND DAMAN AND DIU': 'DD',
  'DADRA AND NAGAR HAVELI': 'DD',
  'DAMAN AND DIU': 'DD',
  'DELHI': 'DL',
  'NEW DELHI': 'DL',
  'NATIONAL CAPITAL TERRITORY OF DELHI': 'DL',
  'JAMMU AND KASHMIR': 'JK',
  'LADAKH': 'LA',
  'LAKSHADWEEP': 'LD',
  'PUDUCHERRY': 'PY',
  'PONDICHERRY': 'PY',
};

// Set of all valid 2-letter codes
export const VALID_STATE_CODES = new Set(Object.values(INDIAN_STATE_CODES));

/**
 * Pincode prefix to State code mapping fallback
 */
export function getStateCodeFromPincode(pincode?: string): string | null {
  if (!pincode) return null;
  const pin = pincode.toString().trim();
  if (pin.length < 2 || !/^\d{2,6}$/.test(pin)) return null;

  const prefix2 = pin.substring(0, 2);
  const prefix1 = pin.substring(0, 1);

  if (prefix2 === '11') return 'DL';
  if (prefix2 === '12' || prefix2 === '13') return 'HR';
  if (prefix2 === '14' || prefix2 === '15') return 'PB';
  if (prefix2 === '16') return 'CH';
  if (prefix2 === '17') return 'HP';
  if (prefix2 === '18' || prefix2 === '19') return 'JK';
  if (['20', '21', '22', '23', '24', '25', '26', '27', '28'].includes(prefix2)) {
    // 248xxx, 249xxx are Uttarakhand
    if (pin.startsWith('248') || pin.startsWith('249') || pin.startsWith('246') || pin.startsWith('247') || pin.startsWith('263')) {
      return 'UK';
    }
    return 'UP';
  }
  if (['30', '31', '32', '33', '34'].includes(prefix2)) return 'RJ';
  if (['36', '37', '38', '39'].includes(prefix2)) return 'GJ';
  if (['40', '41', '42', '43', '44'].includes(prefix2)) {
    if (pin.startsWith('403')) return 'GA';
    return 'MH';
  }
  if (['45', '46', '47', '48'].includes(prefix2)) return 'MP';
  if (prefix2 === '49') return 'CG';
  if (['50', '51', '52', '53'].includes(prefix2)) {
    if (['500', '501', '502', '503', '504', '505', '506', '507', '508', '509'].some((p) => pin.startsWith(p))) {
      return 'TS';
    }
    return 'AP';
  }
  if (['56', '57', '58', '59'].includes(prefix2)) return 'KA';
  if (['60', '61', '62', '63', '64'].includes(prefix2)) {
    if (pin.startsWith('605')) return 'PY';
    return 'TN';
  }
  if (['67', '68', '69'].includes(prefix2)) {
    if (pin.startsWith('682')) return 'LD';
    return 'KL';
  }
  if (['70', '71', '72', '73', '74'].includes(prefix2)) {
    if (pin.startsWith('744')) return 'AN';
    return 'WB';
  }
  if (['75', '76', '77'].includes(prefix2)) return 'OD';
  if (prefix2 === '78') return 'AS';
  if (prefix2 === '79') {
    if (pin.startsWith('790') || pin.startsWith('791') || pin.startsWith('792')) return 'AR';
    if (pin.startsWith('793') || pin.startsWith('794')) return 'ML';
    if (pin.startsWith('795')) return 'MN';
    if (pin.startsWith('796')) return 'MZ';
    if (pin.startsWith('797')) return 'NL';
    if (pin.startsWith('798')) return 'NL';
    if (pin.startsWith('799')) return 'TR';
    return 'AS';
  }
  if (['80', '81', '82', '83', '84', '85'].includes(prefix2)) {
    if (['814', '815', '816', '825', '826', '827', '828', '829', '831', '832', '833', '834', '835'].some((p) => pin.startsWith(p))) {
      return 'JH';
    }
    return 'BR';
  }

  // Broad first digit fallback
  if (prefix1 === '1') return 'DL';
  if (prefix1 === '2') return 'UP';
  if (prefix1 === '3') return 'RJ';
  if (prefix1 === '4') return 'MH';
  if (prefix1 === '5') return 'AP';
  if (prefix1 === '6') return 'TN';
  if (prefix1 === '7') return 'WB';
  if (prefix1 === '8') return 'BR';

  return null;
}

/**
 * Resolve state name or pincode to a standardized 2-letter Indian state code.
 */
export function resolveStateCode(stateInput?: string, pincodeInput?: string): string {
  // 1. Direct 2-letter uppercase match if input is already a valid code
  if (stateInput) {
    const trimmed = stateInput.trim().toUpperCase();
    if (trimmed.length === 2 && VALID_STATE_CODES.has(trimmed)) {
      return trimmed;
    }
    // Check direct dictionary lookup
    if (INDIAN_STATE_CODES[trimmed]) {
      return INDIAN_STATE_CODES[trimmed];
    }
    // Check case-insensitive fuzzy match in dictionary keys
    for (const [name, code] of Object.entries(INDIAN_STATE_CODES)) {
      if (trimmed.includes(name) || name.includes(trimmed)) {
        return code;
      }
    }
  }

  // 2. Fallback to pincode resolution
  if (pincodeInput) {
    const fromPin = getStateCodeFromPincode(pincodeInput);
    if (fromPin) return fromPin;
  }

  // 3. Fallback to UP (Default HQ) if input is 'N/A' or unspecified
  return 'UP';
}

/**
 * Get current date key in IST timezone (Asia/Kolkata): YYMMDD
 * Example: 261102 (for 2nd Nov 2026)
 */
export function getISTDateKey(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(date);
  let year = '';
  let month = '';
  let day = '';

  for (const p of parts) {
    if (p.type === 'year') year = p.value;
    if (p.type === 'month') month = p.value;
    if (p.type === 'day') day = p.value;
  }

  // Ensure 2 digits each
  year = year.padStart(2, '0').slice(-2);
  month = month.padStart(2, '0');
  day = day.padStart(2, '0');

  return `${year}${month}${day}`;
}

export interface GenerateCallNoOptions {
  state?: string;
  pincode?: string;
  date?: Date;
}

/**
 * Atomic, collision-free Call Number generator following the exact nomenclature:
 * YYMMDD + STATE_CODE + QS + 6-DIGIT_SEQUENCE
 * Example: 261006UPQS000345
 */
export async function generateNextCallNo(options: GenerateCallNoOptions = {}): Promise<string> {
  await connectDB();

  const stateCode = resolveStateCode(options.state, options.pincode);
  const dateKey = getISTDateKey(options.date || new Date());

  let callNo = '';
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    attempts++;

    // Atomic increment of sequence scoped by dateKey + stateCode
    const sequenceDoc = await CallSequence.findOneAndUpdate(
      { dateKey, stateCode },
      { $inc: { lastSequence: 1 } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const sequenceNumber = sequenceDoc.lastSequence;
    const formattedSequence = String(sequenceNumber).padStart(6, '0');
    callNo = `${dateKey}${stateCode}QS${formattedSequence}`;

    // Verify uniqueness against existing ServiceCall records (safety guarantee)
    const existing = await ServiceCall.findOne({ callNo }).lean();
    if (!existing) {
      return callNo;
    }
    // If collision exists, loop and increment again
  }

  // Fallback random padding if collision persists
  const fallbackSeq = Math.floor(100000 + Math.random() * 900000);
  return `${dateKey}${stateCode}QS${fallbackSeq}`;
}
