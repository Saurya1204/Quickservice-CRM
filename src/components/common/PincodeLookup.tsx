'use client';

import React, { useState, useEffect, useCallback } from 'react';

export interface PincodeLookupResult {
  pincode: string;
  state: string;
  district: string;
  city: string;
  localities: string[];
  defaultLocality?: string;
}

export function usePincodeLookup(onFound?: (data: PincodeLookupResult) => void) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lookupData, setLookupData] = useState<PincodeLookupResult | null>(null);

  const lookup = useCallback(
    async (pin: string) => {
      const clean = pin.trim();
      if (clean.length !== 6 || !/^\d{6}$/.test(clean)) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/pincode/${clean}`);
        const json = await res.json();

        if (json.success && json.data) {
          setLookupData(json.data);
          if (onFound) {
            onFound(json.data);
          }
        } else {
          setError(json.message || 'Location not found for this PIN code');
        }
      } catch (err: any) {
        setError('Failed to fetch PIN code data');
      } finally {
        setLoading(false);
      }
    },
    [onFound]
  );

  return { lookup, loading, error, lookupData };
}

interface PincodeFieldProps {
  pincode?: string;
  value?: string;
  onPincodeChange?: (pincode: string) => void;
  onChange?: (pincode: string) => void;
  onLocationFound: (location: { state: string; district: string; city: string; locality: string }) => void;
  className?: string;
}

export default function PincodeField({
  pincode,
  value,
  onPincodeChange,
  onChange,
  onLocationFound,
  className = '',
}: PincodeFieldProps) {
  const currentPincode = value ?? pincode ?? '';
  const [localities, setLocalities] = useState<string[]>([]);
  const { lookup, loading, error } = usePincodeLookup((data) => {
    setLocalities(data.localities || []);
    onLocationFound({
      state: data.state,
      district: data.district,
      city: data.city,
      locality: data.defaultLocality || (data.localities && data.localities[0]) || '',
    });
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    if (onChange) onChange(val);
    if (onPincodeChange) onPincodeChange(val);
    if (val.length === 6) {
      lookup(val);
    }
  };

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="relative">
        <input
          type="text"
          maxLength={6}
          value={currentPincode}
          onChange={handleChange}
          placeholder="6-digit PIN Code"
          className="w-full bg-[#172033] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
        />
        {loading && (
          <div className="absolute right-3 top-2.5 flex items-center space-x-1.5 text-xs text-emerald-400">
            <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full" />
            <span className="text-[10px]">Fetching...</span>
          </div>
        )}
      </div>
      {error && <p className="text-[10px] text-amber-400 mt-0.5">{error}</p>}
    </div>
  );
}
