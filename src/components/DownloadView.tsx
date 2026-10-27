'use client';

import React, { useState } from 'react';

const MASTER_OPTIONS = [
  { label: '---Select---', value: '' },
  { label: 'Branch Master', value: 'Branch Master', endpoint: '/api/masters/branches' },
  { label: 'Franchise Master', value: 'Franchise Master', endpoint: '/api/masters/franchises' },
  { label: 'Freelancer Master', value: 'Freelancer Master', endpoint: '/api/masters/dynamic?type=freelancerMaster' },
  { label: 'Technician Master', value: 'Technician Master', endpoint: '/api/masters/technicians' },
  { label: 'Client Master', value: 'Client Master', endpoint: '/api/masters/clients' },
  { label: 'City Master', value: 'City Master', endpoint: '/api/masters/dynamic?type=cityMaster' },
  { label: 'Category Master', value: 'Category Master', endpoint: '/api/masters/categories' },
  { label: 'Product Master', value: 'Product Master', endpoint: '/api/masters/dynamic?type=productMaster' },
  { label: 'Model Master', value: 'Model Master', endpoint: '/api/masters/dynamic?type=modelMaster' },
  { label: 'Spare Master', value: 'Spare Master', endpoint: '/api/masters/dynamic?type=sparesMaster' },
  { label: 'Vendor Master', value: 'Vendor Master', endpoint: '/api/masters/dynamic?type=vendorMaster' },
  { label: 'Symptom Cause Analysis Master', value: 'Symptom Cause Analysis Master', endpoint: '/api/masters/dynamic?type=symptomMaster' },
  { label: 'Pincode Master', value: 'Pincode Master', endpoint: '/api/masters/dynamic?type=pincodeMapping' },
  { label: 'CRM User Master', value: 'CRM User Master', endpoint: '/api/users' },
  { label: 'Client/Brand Master', value: 'Client/Brand Master', endpoint: '/api/masters/brands' },
];

export default function DownloadView() {
  const [selectedMaster, setSelectedMaster] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);

  const handleDownload = async () => {
    if (!selectedMaster) {
      alert('Please select a Master Name first.');
      return;
    }

    const masterConfig = MASTER_OPTIONS.find((m) => m.value === selectedMaster);
    if (!masterConfig || !masterConfig.endpoint) {
      alert('Please select a valid Master Name.');
      return;
    }

    setDownloading(true);
    setFeedback(null);

    try {
      const res = await fetch(masterConfig.endpoint);
      const json = await res.json();
      const records = json.data || [];

      if (!records || records.length === 0) {
        setFeedback(`No records found in database for "${selectedMaster}".`);
        setPreviewData([]);
        setDownloading(false);
        return;
      }

      setPreviewData(records.slice(0, 5));
      setFeedback(`Found ${records.length} records. Generating Excel download...`);

      // Build CSV/Excel file
      const ignoredKeys = ['_id', '__v', 'passwordHash', 'createdAt', 'updatedAt'];
      const headers = Object.keys(records[0]).filter((k) => !ignoredKeys.includes(k));

      let csvContent = 'data:text/csv;charset=utf-8,' + headers.join(',') + '\n';

      records.forEach((row: any) => {
        const line = headers.map((header) => {
          let val = row[header] ?? '';
          if (typeof val === 'object') {
            val = JSON.stringify(val);
          }
          if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
            val = `"${val.replace(/"/g, '""')}"`;
          }
          return val;
        });
        csvContent += line.join(',') + '\n';
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `${selectedMaster.replace(/[\s\/]+/g, '_')}_MasterData.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setFeedback(`Successfully exported ${records.length} records from ${selectedMaster}.`);
    } catch (e: any) {
      setFeedback('Export failed: ' + e.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Select Card matching Screenshot 2 */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl shadow-xl overflow-hidden">
        {/* Banner with + Download Master Data */}
        <div className="bg-[#172033] px-6 py-3.5 border-b border-[#334155] flex items-center space-x-2">
          <span className="text-emerald-400 font-bold text-sm">+</span>
          <h2 className="text-sm font-semibold text-slate-200 tracking-wide">
            Download Master Data
          </h2>
        </div>

        <div className="p-8">
          <div className="max-w-3xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="flex-1">
                <label className="block text-sm font-bold text-slate-200 mb-2">
                  Master Name
                </label>
                <select
                  value={selectedMaster}
                  onChange={(e) => {
                    setSelectedMaster(e.target.value);
                    setFeedback(null);
                    setPreviewData([]);
                  }}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-md px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 shadow-inner"
                >
                  {MASTER_OPTIONS.map((opt) => (
                    <option key={opt.label} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={downloading || !selectedMaster}
                  className="bg-[#28a745] hover:bg-[#218838] disabled:opacity-50 text-white text-sm font-medium px-6 py-2.5 rounded-md shadow transition flex items-center justify-center space-x-2"
                >
                  <span>{downloading ? 'Downloading...' : 'Download Excel'}</span>
                </button>
              </div>
            </div>

            {feedback && (
              <div
                className={`p-3 rounded-lg text-xs font-medium mt-4 ${
                  feedback.includes('Successfully') || feedback.includes('Found')
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                }`}
              >
                {feedback}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview Section if data downloaded */}
      {previewData.length > 0 && (
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl shadow-xl overflow-hidden p-6 space-y-3">
          <h3 className="text-xs uppercase font-semibold text-slate-400 tracking-wider">
            Live Preview (First {previewData.length} Records from Database)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#172033] text-slate-400 uppercase text-[10px]">
                <tr>
                  {Object.keys(previewData[0])
                    .filter((k) => !['_id', '__v', 'passwordHash'].includes(k))
                    .slice(0, 6)
                    .map((header) => (
                      <th key={header} className="p-2.5">
                        {header}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#334155]">
                {previewData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40">
                    {Object.keys(row)
                      .filter((k) => !['_id', '__v', 'passwordHash'].includes(k))
                      .slice(0, 6)
                      .map((key) => (
                        <td key={key} className="p-2.5 font-mono text-slate-300">
                          {typeof row[key] === 'object' ? JSON.stringify(row[key]) : String(row[key] ?? '')}
                        </td>
                      ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
