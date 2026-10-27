'use client';

import React, { useState, useEffect } from 'react';

export default function UploaderView() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [calls, setCalls] = useState<any[]>([]);
  const [editingCall, setEditingCall] = useState<any | null>(null);

  useEffect(() => {
    fetchRecentCalls();
  }, []);

  const fetchRecentCalls = async () => {
    try {
      const res = await fetch('/api/calls');
      const json = await res.json();
      if (json.success) {
        setCalls(json.data.slice(0, 10));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const downloadSampleFile = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'customerName,customerMobile,customerAddress,city,state,pincode,clientName,brandName,categoryName,reportedFault\n' +
      'Rajesh Sharma,9876543210,"Flat 402, Sunshine Heights",Mumbai,Maharashtra,400001,Voltas Ltd,Voltas,Air Conditioner,Compressor not starting\n' +
      'Anita Verma,9811223344,"Plot 12, Sector 18",Noida,Uttar Pradesh,201301,Havells India,Lloyd,LED TV,Display panel lines\n' +
      'Karan Kapoor,9988776655,"14 MG Road",Bengaluru,Karnataka,560001,Daikin Airconditioning,Daikin,Air Conditioner,Gas leakage cooling issue\n';

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Live_Call_Sample_File.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadReferenceFile = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'ReferenceCode,EntityType,Description,StandardSLA_Hours\n' +
      'REF-AC-01,Air Conditioner,Split / Inverter AC Maintenance,24\n' +
      'REF-WM-02,Washing Machine,Front & Top Load Drum Diagnostics,24\n' +
      'REF-REF-03,Refrigerator,Frost Free & Inverter Compressor Check,18\n' +
      'REF-TV-04,LED TV,Power Board & Backlight Module,48\n';

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Live_Call_Reference_File.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setResult({ type: 'error', text: 'Please choose an Excel or CSV file before clicking Upload.' });
      return;
    }

    setUploading(true);
    setResult(null);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter((l) => l.trim().length > 0);

      if (lines.length < 2) {
        throw new Error('File does not contain valid data rows.');
      }

      const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
      const parsedRecords: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values: string[] = [];
        let curr = '';
        let insideQuotes = false;
        const line = lines[i];

        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (char === '"' || char === "'") {
            insideQuotes = !insideQuotes;
          } else if (char === ',' && !insideQuotes) {
            values.push(curr.trim().replace(/^"|"$/g, ''));
            curr = '';
          } else {
            curr += char;
          }
        }
        values.push(curr.trim().replace(/^"|"$/g, ''));

        if (values.length >= 2 && values[0]) {
          const rowObj: any = {};
          headers.forEach((h, idx) => {
            if (values[idx] !== undefined) {
              rowObj[h] = values[idx];
            }
          });

          // Ensure mandatory fields
          parsedRecords.push({
            customerName: rowObj.customerName || values[0],
            customerMobile: rowObj.customerMobile || values[1] || '9800000000',
            customerAddress: rowObj.customerAddress || values[2] || 'Operational Area',
            city: rowObj.city || values[3] || 'Delhi',
            state: rowObj.state || values[4] || 'Delhi',
            pincode: rowObj.pincode || values[5] || '110001',
            clientName: rowObj.clientName || values[6] || 'General Client',
            brandName: rowObj.brandName || values[7] || 'Voltas',
            categoryName: rowObj.categoryName || values[8] || 'Air Conditioner',
            reportedFault: rowObj.reportedFault || values[9] || 'Standard maintenance requested',
            callStatus: 'OPEN',
            daysPending: 0,
          });
        }
      }

      if (parsedRecords.length === 0) {
        throw new Error('No valid records parsed from CSV.');
      }

      const res = await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedRecords),
      });

      const json = await res.json();
      if (json.success) {
        setResult({
          type: 'success',
          text: `File "${file.name}" ingested successfully! ${parsedRecords.length} live calls saved to database.`,
        });
        setFile(null);
        fetchRecentCalls();
      } else {
        throw new Error(json.message);
      }
    } catch (err: any) {
      setResult({ type: 'error', text: err.message || 'Upload ingestion failed' });
    } finally {
      setUploading(false);
    }
  };

  const handleQuickStatusUpdate = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/calls', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, callStatus: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        setEditingCall(null);
        fetchRecentCalls();
      } else {
        alert(json.message);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDeleteCall = async (id: string, callNo: string) => {
    if (!confirm(`Delete call ${callNo}?`)) return;
    try {
      const res = await fetch(`/api/calls?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        fetchRecentCalls();
      } else {
        alert(json.message);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Container matching Screenshot 3 */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl shadow-xl overflow-hidden">
        {/* Header Bar matching Screenshot 3: UPLOAD LIVE CALL with monitor icon */}
        <div className="bg-[#172033] px-6 py-4 border-b border-[#334155] flex items-center space-x-3">
          <span className="text-xl">💻</span>
          <h1 className="text-base font-semibold text-slate-200 tracking-wide uppercase">
            UPLOAD LIVE CALL
          </h1>
        </div>

        {/* Sub-bar with Bulk Live Call Upload text & Cyan buttons */}
        <div className="px-8 pt-6 pb-2 flex flex-wrap items-center justify-between gap-4 border-b border-[#334155]/40">
          <span className="text-sm font-semibold text-slate-300">
            Bulk Live Call Upload
          </span>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={downloadReferenceFile}
              className="bg-[#17a2b8] hover:bg-[#138496] text-white text-xs font-semibold px-4 py-2 rounded shadow transition"
            >
              Live Call Reference File
            </button>
            <button
              type="button"
              onClick={downloadSampleFile}
              className="bg-[#17a2b8] hover:bg-[#138496] text-white text-xs font-semibold px-4 py-2 rounded shadow transition"
            >
              Live Call Sample File
            </button>
          </div>
        </div>

        {/* File chooser & Upload action matching Screenshot 3 */}
        <div className="p-8">
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Blue container for Choose File */}
              <div className="bg-[#007bff] hover:bg-[#0069d9] text-white rounded px-4 py-2 flex items-center space-x-3 shadow cursor-pointer transition">
                <label htmlFor="liveCallFileInput" className="cursor-pointer flex items-center space-x-2 text-xs font-medium">
                  <span className="bg-white text-slate-800 font-semibold px-2 py-1 rounded text-[11px] shadow-sm">
                    Choose File
                  </span>
                  <span className="text-white text-xs">
                    {file ? file.name : 'No file chosen'}
                  </span>
                </label>
                <input
                  id="liveCallFileInput"
                  type="file"
                  accept=".csv, .xlsx, .xls, .txt"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setFile(e.target.files[0]);
                      setResult(null);
                    }
                  }}
                  className="hidden"
                />
              </div>

              {/* Blue Upload Button */}
              <button
                type="submit"
                disabled={uploading || !file}
                className="bg-[#007bff] hover:bg-[#0069d9] disabled:opacity-50 text-white text-xs font-semibold px-6 py-2.5 rounded shadow transition"
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>

            {result && (
              <div
                className={`p-3 rounded text-xs font-medium mt-3 ${
                  result.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                }`}
              >
                {result.text}
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Edit Modal if editing a call */}
      {editingCall && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#334155] pb-3">
              <h3 className="text-sm font-semibold text-white">
                Edit Call: <span className="text-emerald-400 font-mono">{editingCall.callNo}</span>
              </h3>
              <button
                onClick={() => setEditingCall(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Customer Name</label>
                <input
                  type="text"
                  value={editingCall.customerName}
                  onChange={(e) => setEditingCall({ ...editingCall, customerName: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Status</label>
                <select
                  value={editingCall.callStatus}
                  onChange={(e) => setEditingCall({ ...editingCall, callStatus: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-white"
                >
                  <option value="OPEN">OPEN</option>
                  <option value="APPOINTMENT">APPOINTMENT</option>
                  <option value="ALLOTED">ALLOTED</option>
                  <option value="PART_PENDING">PART_PENDING</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCEL">CANCEL</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Assigned Technician</label>
                <input
                  type="text"
                  value={editingCall.technicianName || ''}
                  onChange={(e) => setEditingCall({ ...editingCall, technicianName: e.target.value })}
                  placeholder="Technician Name"
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Reported Fault</label>
                <textarea
                  value={editingCall.reportedFault || ''}
                  onChange={(e) => setEditingCall({ ...editingCall, reportedFault: e.target.value })}
                  rows={2}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-[#334155]">
              <button
                type="button"
                onClick={() => setEditingCall(null)}
                className="bg-slate-700 hover:bg-slate-600 text-white text-xs px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleQuickStatusUpdate(editingCall._id, editingCall.callStatus)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-5 py-2 rounded font-semibold shadow"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Calls Database Table with Edit and Delete Buttons */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl shadow-xl overflow-hidden">
        <div className="bg-[#172033] px-6 py-4 border-b border-[#334155] flex justify-between items-center">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Live Service Calls in Database</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time records from central database
            </p>
          </div>
          <span className="text-xs bg-slate-800 text-emerald-400 border border-slate-700 px-3 py-1 rounded-full font-mono">
            {calls.length} Recent Records
          </span>
        </div>

        <div className="overflow-x-auto">
          {calls.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">No service calls found.</div>
          ) : (
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#172033] text-[11px] uppercase tracking-wider text-slate-400 border-b border-[#334155]">
                <tr>
                  <th className="p-3">Call No</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Brand / Category</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Technician</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#334155]">
                {calls.map((call) => (
                  <tr key={call._id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 font-mono text-emerald-400 font-semibold">{call.callNo}</td>
                    <td className="p-3 font-medium text-white">{call.customerName}</td>
                    <td className="p-3 font-mono text-slate-300">{call.customerMobile}</td>
                    <td className="p-3 text-slate-300">
                      {call.brandName} • {call.categoryName}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          call.callStatus === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : call.callStatus === 'OPEN'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {call.callStatus}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400">{call.technicianName || 'Unassigned'}</td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => setEditingCall(call)}
                        className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30 px-3 py-1 rounded text-xs transition font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCall(call._id, call.callNo)}
                        className="bg-rose-600/20 hover:bg-rose-600/40 text-rose-400 border border-rose-500/30 px-3 py-1 rounded text-xs transition font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
