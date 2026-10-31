'use client';

import React, { useState, useEffect } from 'react';

interface UploaderViewProps {
  initialMode?: 'bulkExcelUpload' | 'liveCallUpload';
  currentUser?: any;
}

export default function UploaderView({
  initialMode = 'bulkExcelUpload',
  currentUser,
}: UploaderViewProps) {
  const [activeTab, setActiveTab] = useState<'bulkExcelUpload' | 'liveCallUpload'>(initialMode);

  useEffect(() => {
    if (initialMode) {
      setActiveTab(initialMode);
    }
  }, [initialMode]);

  // Bulk Excel Upload state
  const [excelOf, setExcelOf] = useState<'Symptom' | 'Cause' | 'Analysis' | 'Spare'>('Symptom');
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [validationResult, setValidationResult] = useState<any | null>(null);
  const [importSummary, setImportSummary] = useState<{
    success: boolean;
    importedCount: number;
    failedCount: number;
    message: string;
  } | null>(null);
  const [uploadHistory, setUploadHistory] = useState<any[]>([]);

  // Live Call Upload state
  const [liveFile, setLiveFile] = useState<File | null>(null);
  const [uploadingLive, setUploadingLive] = useState(false);
  const [liveResult, setLiveResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [calls, setCalls] = useState<any[]>([]);

  useEffect(() => {
    fetchHistory();
    fetchRecentCalls();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/uploader/history');
      const json = await res.json();
      if (json.success) {
        setUploadHistory(json.data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRecentCalls = async () => {
    try {
      const res = await fetch('/api/calls');
      const json = await res.json();
      if (json.success) {
        setCalls((json.data || []).slice(0, 10));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Bulk Excel Upload Handlers
  const handleBulkFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      const ext = f.name.toLowerCase();
      if (!ext.endsWith('.xls') && !ext.endsWith('.xlsx')) {
        alert('Invalid file format! Please select an Excel file (.xls or .xlsx).');
        return;
      }
      setBulkFile(f);
      setValidationResult(null);
      setImportSummary(null);
    }
  };

  const handleAbort = () => {
    setBulkFile(null);
    setValidationResult(null);
    setImportSummary(null);
    const input = document.getElementById('bulkExcelFileInput') as HTMLInputElement;
    if (input) input.value = '';
  };

  const handleSaveAndPreview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkFile) {
      alert('Please select an Excel file before clicking Save.');
      return;
    }

    setValidating(true);
    setValidationResult(null);
    setImportSummary(null);

    try {
      const formData = new FormData();
      formData.append('file', bulkFile);
      formData.append('excelOf', excelOf);
      formData.append('uploadedBy', currentUser?.name || 'Super Admin');

      const res = await fetch('/api/uploader/preview', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (json.success) {
        setValidationResult(json.data);
      } else {
        alert(`Validation failed: ${json.message}`);
      }
    } catch (err: any) {
      alert(`Error uploading file: ${err.message}`);
    } finally {
      setValidating(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!validationResult || !validationResult.parsedRows) return;
    setImporting(true);
    try {
      const res = await fetch('/api/uploader/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: validationResult.batchId,
          rows: validationResult.parsedRows,
          adminUser: currentUser?.name || 'Super Admin',
        }),
      });
      const json = await res.json();
      if (json.success) {
        setImportSummary({
          success: true,
          importedCount: json.data?.importedCount || 0,
          failedCount: json.data?.failedCount || 0,
          message: json.message,
        });
        fetchHistory();
      } else {
        alert(`Import failed: ${json.message}`);
      }
    } catch (err: any) {
      alert(`Error during import: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadErrorReport = (batchId: string) => {
    window.open(`/api/uploader/history/${batchId}/errors/export`, '_blank');
  };

  // Sample Template Generator for testing
  const handleDownloadTemplate = () => {
    let csv = '';
    let filename = '';
    if (excelOf === 'Symptom') {
      filename = 'Symptom_Upload_Template.csv';
      csv = 'Product Category,Symptom ID,Symptom Name\nOther Electrical,SYM-001,Water leakage from indoor unit\nOther Electrical,SYM-002,Abnormal noise during compressor spin\n';
    } else if (excelOf === 'Cause') {
      filename = 'Cause_Upload_Template.csv';
      csv = 'Product Category,Symptom ID,Symptom Name,Cause ID,Cause Name\nOther Electrical,SYM-001,No Cooling / Air Flow Fault 168,CSE-001,Clogged air filter mesh\nOther Electrical,SYM-001,No Cooling / Air Flow Fault 168,CSE-002,Defective blower fan motor\n';
    } else if (excelOf === 'Analysis') {
      filename = 'Analysis_Upload_Template.csv';
      csv = 'Product Category,Symptom ID,Symptom Name,Cause ID,Cause Name,Analysis ID,Analysis Name\nOther Electrical,SYM-001,No Cooling / Air Flow Fault 168,CSE-001,Clogged air filter mesh,ANS-001,Chemical cleaning and pressure wash\n';
    } else if (excelOf === 'Spare') {
      filename = 'Spare_Upload_Template.csv';
      csv = 'ProductID,Product,ProductCode,Cat_ID,Cat_Name,ModelID,ModelNo,description,SerialLimit,SerialMaxLimit,PartID,PartCode,PartDescription,CustomerPrice\n1,Air Conditioner,PRD01,1,Other Electrical,1,TEST-MDL-3419,Test Model,1000,999999,PART-01,PRT-9988,Copper Filter Drier Valve,450\n';
    }
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Live Call Handlers (preserved)
  const handleLiveCallUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveFile) return;
    setUploadingLive(true);
    setLiveResult(null);
    try {
      const text = await liveFile.text();
      const lines = text.split('\n').filter((l) => l.trim().length > 0);
      if (lines.length < 2) throw new Error('File does not contain valid data rows.');

      const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
      const parsedRecords: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
        if (values.length >= 2 && values[0]) {
          parsedRecords.push({
            customerName: values[0],
            customerMobile: values[1] || '9800000000',
            customerAddress: values[2] || 'Service Area',
            city: values[3] || 'Delhi',
            state: values[4] || 'Delhi',
            pincode: values[5] || '110001',
            clientName: values[6] || 'General Client',
            brandName: values[7] || 'Voltas',
            categoryName: values[8] || 'Air Conditioner',
            reportedFault: values[9] || 'Standard maintenance',
            callStatus: 'OPEN',
            daysPending: 0,
          });
        }
      }

      const res = await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedRecords),
      });
      const json = await res.json();
      if (json.success) {
        setLiveResult({
          type: 'success',
          text: `File "${liveFile.name}" ingested successfully! ${parsedRecords.length} live calls saved.`,
        });
        setLiveFile(null);
        fetchRecentCalls();
      } else {
        throw new Error(json.message);
      }
    } catch (err: any) {
      setLiveResult({ type: 'error', text: err.message || 'Upload failed' });
    } finally {
      setUploadingLive(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation Tabs Header */}
      <div className="flex items-center space-x-2 border-b border-[#334155] pb-2">
        <button
          onClick={() => setActiveTab('bulkExcelUpload')}
          className={`px-4 py-2 rounded-t-lg text-xs font-bold transition flex items-center space-x-2 ${
            activeTab === 'bulkExcelUpload'
              ? 'bg-[#1e293b] text-emerald-400 border-t-2 border-emerald-500'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>📊</span>
          <span>Bulk Excel Upload</span>
        </button>
        <button
          onClick={() => setActiveTab('liveCallUpload')}
          className={`px-4 py-2 rounded-t-lg text-xs font-bold transition flex items-center space-x-2 ${
            activeTab === 'liveCallUpload'
              ? 'bg-[#1e293b] text-blue-400 border-t-2 border-blue-500'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>💻</span>
          <span>Live Call Upload</span>
        </button>
      </div>

      {/* SECTION 1: BULK EXCEL UPLOAD */}
      {activeTab === 'bulkExcelUpload' && (
        <div className="space-y-6">
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl shadow-xl overflow-hidden">
            {/* Header: Bulk Excel Upload matching legacy layout */}
            <div className="bg-[#172033] px-6 py-4 border-b border-[#334155] flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <span className="text-xl">📁</span>
                <div>
                  <h1 className="text-base font-bold text-white tracking-wide uppercase">
                    Bulk Excel Upload
                  </h1>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Import master records with complete hierarchy mapping & preview validation
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-semibold px-3 py-1.5 rounded transition flex items-center space-x-1.5"
              >
                <span>📥</span>
                <span>Download {excelOf} Template</span>
              </button>
            </div>

            {/* Form Fields: Excel Of + Upload Excel + Save (Green) + Abort (Yellow) */}
            <div className="p-8">
              <form onSubmit={handleSaveAndPreview} className="space-y-6 max-w-3xl">
                {/* Field 1: Excel Of */}
                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                  <label className="text-xs font-bold text-slate-200">
                    Excel Of <span className="text-rose-400">*</span>
                  </label>
                  <div className="md:col-span-2">
                    <select
                      value={excelOf}
                      onChange={(e) => {
                        setExcelOf(e.target.value as any);
                        setValidationResult(null);
                        setImportSummary(null);
                      }}
                      className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Symptom">Symptom</option>
                      <option value="Cause">Cause</option>
                      <option value="Analysis">Analysis</option>
                      <option value="Spare">Spare</option>
                    </select>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Target Master:{' '}
                      <span className="text-emerald-400 font-semibold">
                        {excelOf === 'Spare' ? 'Spares Master' : `${excelOf} Master`}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Field 2: Upload Excel */}
                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                  <label className="text-xs font-bold text-slate-200">
                    Upload Excel <span className="text-rose-400">*</span>
                  </label>
                  <div className="md:col-span-2">
                    <div className="flex items-center space-x-3">
                      <label
                        htmlFor="bulkExcelFileInput"
                        className="bg-slate-800 hover:bg-slate-700 text-white border border-[#334155] text-xs font-medium px-4 py-2 rounded-lg shadow-sm cursor-pointer transition flex items-center space-x-2"
                      >
                        <span>Choose File</span>
                      </label>
                      <span className="text-xs text-slate-300 font-mono truncate max-w-xs">
                        {bulkFile ? bulkFile.name : 'No file chosen'}
                      </span>
                      <input
                        id="bulkExcelFileInput"
                        type="file"
                        accept=".xls, .xlsx"
                        onChange={handleBulkFileChange}
                        className="hidden"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Supports standard .xlsx, .xls and HTML-table based legacy .xls files (Max 10MB)
                    </p>
                  </div>
                </div>

                {/* Buttons: Save (Green) & Abort (Yellow) */}
                <div className="pt-4 border-t border-[#334155] flex items-center space-x-3">
                  <button
                    type="submit"
                    disabled={validating || !bulkFile}
                    className="bg-[#16a34a] hover:bg-[#15803d] disabled:opacity-50 text-white text-xs font-bold px-7 py-2.5 rounded-lg shadow-lg transition flex items-center space-x-2"
                  >
                    <span>{validating ? 'Parsing & Validating...' : 'Save'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAbort}
                    className="bg-[#ca8a04] hover:bg-[#a16207] text-white text-xs font-bold px-7 py-2.5 rounded-lg shadow-lg transition"
                  >
                    Abort
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* IMPORT PREVIEW & SUMMARY PANEL */}
          {validationResult && (
            <div className="bg-[#1e293b] border border-[#334155] rounded-xl shadow-xl overflow-hidden p-6 space-y-6">
              <div className="border-b border-[#334155] pb-4 flex flex-wrap justify-between items-center gap-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <span>Validation Preview:</span>
                    <span className="text-emerald-400 font-mono">{validationResult.fileName}</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Target Master: <strong className="text-white">{validationResult.excelOf} Master</strong>
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  {validationResult.errors?.length > 0 && (
                    <button
                      onClick={() => handleDownloadErrorReport(validationResult.batchId)}
                      className="bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/30 text-xs font-semibold px-4 py-2 rounded-lg transition"
                    >
                      ⚠️ Download Error Report ({validationResult.errors.length})
                    </button>
                  )}
                  <button
                    onClick={handleAbort}
                    className="bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
                  >
                    Cancel Import
                  </button>
                  <button
                    onClick={handleConfirmImport}
                    disabled={importing || validationResult.validRecords === 0}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold px-6 py-2 rounded-lg shadow-lg transition"
                  >
                    {importing ? 'Importing Records...' : `Confirm Import (${validationResult.validRecords} Valid)`}
                  </button>
                </div>
              </div>

              {/* Summary Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-[#172033] p-4 rounded-xl border border-[#334155]">
                  <span className="text-xs text-slate-400 uppercase font-medium">Total Rows</span>
                  <p className="text-2xl font-bold text-white mt-1">{validationResult.totalRows}</p>
                </div>
                <div className="bg-[#172033] p-4 rounded-xl border border-[#334155]">
                  <span className="text-xs text-emerald-400 uppercase font-medium">Valid Records</span>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">{validationResult.validRecords}</p>
                </div>
                <div className="bg-[#172033] p-4 rounded-xl border border-[#334155]">
                  <span className="text-xs text-amber-400 uppercase font-medium">Duplicate Records</span>
                  <p className="text-2xl font-bold text-amber-400 mt-1">{validationResult.duplicateRecords}</p>
                </div>
                <div className="bg-[#172033] p-4 rounded-xl border border-[#334155]">
                  <span className="text-xs text-rose-400 uppercase font-medium">Invalid Records</span>
                  <p className="text-2xl font-bold text-rose-400 mt-1">{validationResult.invalidRecords}</p>
                </div>
              </div>

              {/* Import Execution Result */}
              {importSummary && (
                <div
                  className={`p-4 rounded-xl text-xs font-medium border ${
                    importSummary.success
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  }`}
                >
                  <div className="font-bold text-sm mb-1">{importSummary.message}</div>
                  <div>
                    Successfully Imported: <strong>{importSummary.importedCount}</strong> • Skipped/Failed:{' '}
                    <strong>{importSummary.failedCount}</strong>
                  </div>
                </div>
              )}

              {/* Preview Rows Table */}
              <div className="border border-[#334155] rounded-lg overflow-hidden">
                <div className="bg-[#172033] px-4 py-2.5 border-b border-[#334155] text-xs font-semibold text-slate-300">
                  Data Row Verification Preview (Sample Top 50 Rows)
                </div>
                <div className="overflow-x-auto max-h-80">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-[#111c2e] text-[10px] uppercase text-slate-400 sticky top-0">
                      <tr>
                        <th className="p-2.5">Row #</th>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5">Hierarchy & Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#334155]">
                      {validationResult.previewRows?.map((pr: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-800/40">
                          <td className="p-2.5 font-mono text-slate-400">{pr.rowNumber}</td>
                          <td className="p-2.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                pr.status === 'Valid'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                  : pr.status === 'Duplicate'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {pr.status}
                            </span>
                          </td>
                          <td className="p-2.5 text-slate-200">{pr.details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* RECENT UPLOADS AUDIT TABLE */}
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl shadow-xl overflow-hidden">
            <div className="bg-[#172033] px-6 py-4 border-b border-[#334155] flex justify-between items-center">
              <div>
                <h3 className="text-sm font-semibold text-white">Bulk Excel Upload Audit History</h3>
                <p className="text-xs text-slate-400 mt-0.5">Track past uploads, error counts & import statuses</p>
              </div>
              <span className="text-xs font-mono bg-slate-800 text-slate-300 px-3 py-1 rounded-full border border-slate-700">
                {uploadHistory.length} Batches
              </span>
            </div>

            <div className="overflow-x-auto">
              {uploadHistory.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">No upload batches recorded yet.</div>
              ) : (
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#172033] text-[11px] uppercase text-slate-400 border-b border-[#334155]">
                    <tr>
                      <th className="p-3">Date</th>
                      <th className="p-3">Master</th>
                      <th className="p-3">File Name</th>
                      <th className="p-3">Total Rows</th>
                      <th className="p-3">Imported</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Error Report</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#334155]">
                    {uploadHistory.map((h) => (
                      <tr key={h._id} className="hover:bg-slate-800/40">
                        <td className="p-3 text-slate-400">{new Date(h.createdAt).toLocaleString()}</td>
                        <td className="p-3 font-semibold text-white">{h.excelOf}</td>
                        <td className="p-3 font-mono text-slate-300">{h.fileName}</td>
                        <td className="p-3 font-mono">{h.totalRows}</td>
                        <td className="p-3 font-mono text-emerald-400">{h.importedRecords || 0}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              h.status === 'Completed'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : h.status === 'Preview'
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {h.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {(h.validationErrors?.length || h.errors?.length) ? (
                            <button
                              onClick={() => handleDownloadErrorReport(h._id)}
                              className="text-amber-400 hover:text-amber-300 underline font-medium text-xs"
                            >
                              Download Errors ({h.validationErrors?.length || h.errors?.length})
                            </button>
                          ) : (
                            <span className="text-slate-500 text-[11px]">No Errors</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: LIVE CALL UPLOAD */}
      {activeTab === 'liveCallUpload' && (
        <div className="space-y-6">
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl shadow-xl overflow-hidden">
            <div className="bg-[#172033] px-6 py-4 border-b border-[#334155] flex items-center space-x-3">
              <span className="text-xl">💻</span>
              <h1 className="text-base font-semibold text-slate-200 tracking-wide uppercase">
                UPLOAD LIVE CALL
              </h1>
            </div>

            <div className="p-8">
              <form onSubmit={handleLiveCallUpload} className="space-y-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="bg-[#007bff] hover:bg-[#0069d9] text-white rounded px-4 py-2 flex items-center space-x-3 shadow cursor-pointer transition">
                    <label htmlFor="liveCallFileInput" className="cursor-pointer flex items-center space-x-2 text-xs font-medium">
                      <span className="bg-white text-slate-800 font-semibold px-2 py-1 rounded text-[11px] shadow-sm">
                        Choose File
                      </span>
                      <span className="text-white text-xs truncate max-w-xs">
                        {liveFile ? liveFile.name : 'No file chosen'}
                      </span>
                    </label>
                    <input
                      id="liveCallFileInput"
                      type="file"
                      accept=".csv, .xlsx, .xls"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setLiveFile(e.target.files[0]);
                          setLiveResult(null);
                        }
                      }}
                      className="hidden"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={uploadingLive || !liveFile}
                    className="bg-[#007bff] hover:bg-[#0069d9] disabled:opacity-50 text-white text-xs font-semibold px-6 py-2.5 rounded shadow transition"
                  >
                    {uploadingLive ? 'Uploading...' : 'Upload'}
                  </button>
                </div>

                {liveResult && (
                  <div
                    className={`p-3 rounded text-xs font-medium mt-3 ${
                      liveResult.type === 'success'
                        ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                        : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                    }`}
                  >
                    {liveResult.text}
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Live Calls table */}
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl shadow-xl overflow-hidden">
            <div className="bg-[#172033] px-6 py-4 border-b border-[#334155] flex justify-between items-center">
              <div>
                <h3 className="text-sm font-semibold text-slate-200">Live Service Calls in Database</h3>
                <p className="text-xs text-slate-400 mt-0.5">Real-time records from central database</p>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
