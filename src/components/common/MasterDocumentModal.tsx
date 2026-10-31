'use client';

import React, { useState, useEffect } from 'react';

export interface EntityOption {
  id: string;
  name: string;
  code?: string;
}

interface MasterDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  masterType: string; // e.g. 'branch', 'franchise', 'technician', 'client', 'brand', 'category', 'role', 'freelancer', etc.
  masterTitle: string; // e.g. 'Branch Master'
  entities?: EntityOption[];
  currentUser?: any;
}

export function UploadDocumentButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-[#dc2626] hover:bg-[#b91c1c] active:bg-[#991b1b] text-white text-xs sm:text-sm px-4 py-2 rounded-md font-medium transition shadow-md whitespace-nowrap cursor-pointer"
      title="Upload and manage documents for this master"
    >
      Upload Document
    </button>
  );
}

export default function MasterDocumentModal({
  isOpen,
  onClose,
  masterType,
  masterTitle,
  entities = [],
  currentUser,
}: MasterDocumentModalProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'repository'>('upload');
  const [documents, setDocuments] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // Upload Form State
  const [selectedEntityId, setSelectedEntityId] = useState('');
  const [customEntityName, setCustomEntityName] = useState('');
  const [documentType, setDocumentType] = useState('Registration / Certificate');
  const [customDocType, setCustomDocType] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Default document type options per master
  const defaultDocTypes = [
    'Registration / Certificate',
    'GST / Tax Document',
    'Agreement / Contract',
    'Address / Identity Proof',
    'SLA / Compliance Policy',
    'Financial / Bank Details',
    'Technical / Spec Sheet',
    'Other / Miscellaneous',
  ];

  useEffect(() => {
    if (isOpen) {
      fetchDocuments();
      if (entities.length > 0 && !selectedEntityId) {
        setSelectedEntityId(entities[0].id);
      }
      setMessage(null);
    }
  }, [isOpen, masterType]);

  const fetchDocuments = async () => {
    setLoadingDocs(true);
    try {
      const res = await fetch(`/api/masters/documents?masterType=${masterType.toLowerCase()}`);
      const json = await res.json();
      if (json.success) {
        setDocuments(json.data || []);
      }
    } catch (e) {
      console.error('Error fetching documents:', e);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!file) {
      setMessage({ type: 'error', text: 'Please choose a document file to upload.' });
      return;
    }

    let finalEntityName = 'General Master File';
    if (selectedEntityId && entities.length > 0) {
      const found = entities.find((ent) => ent.id === selectedEntityId);
      if (found) finalEntityName = found.name;
    } else if (customEntityName.trim()) {
      finalEntityName = customEntityName.trim();
    }

    const finalDocType = documentType === 'Other / Miscellaneous' && customDocType.trim() ? customDocType.trim() : documentType;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('masterType', masterType.toLowerCase());
      formData.append('entityId', selectedEntityId || '');
      formData.append('entityName', finalEntityName);
      formData.append('documentType', finalDocType);
      formData.append('description', description);
      formData.append('file', file);
      formData.append('uploadedBy', currentUser?.fullName || currentUser?.username || 'Super Admin');

      const res = await fetch('/api/masters/documents', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();

      if (json.success) {
        setMessage({ type: 'success', text: json.message || 'Document uploaded successfully!' });
        setFile(null);
        setDescription('');
        setCustomDocType('');
        fetchDocuments();
        setActiveTab('repository');
      } else {
        setMessage({ type: 'error', text: json.message || 'Failed to upload document.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Network error occurred.' });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDoc = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete document "${name}"?`)) return;

    try {
      const res = await fetch(`/api/masters/documents?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setDocuments((prev) => prev.filter((d) => d._id !== id));
      } else {
        alert(json.message);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (!isOpen) return null;

  const filteredDocs = documents.filter((d) => {
    const q = searchTerm.toLowerCase();
    return (
      d.fileName?.toLowerCase().includes(q) ||
      d.entityName?.toLowerCase().includes(q) ||
      d.documentType?.toLowerCase().includes(q) ||
      d.uploadedBy?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#111c2e] border border-[#2d3d54] rounded-2xl w-full max-w-3xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0d1624] border-b border-[#2d3d54]">
          <div className="flex items-center space-x-3">
            <span className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold text-sm">
              📁
            </span>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>{masterTitle} Document Center</span>
                <span className="text-[11px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded font-mono font-normal">
                  {documents.length} Files
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Upload, archive and verify official documents for {masterTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 w-8 h-8 rounded-lg flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex border-b border-[#2d3d54] bg-[#142033] px-6">
          <button
            onClick={() => {
              setActiveTab('upload');
              setMessage(null);
            }}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'upload'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <span>⬆️ Upload Document</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('repository');
              fetchDocuments();
            }}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'repository'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <span>📚 Document Repository</span>
            <span className="bg-slate-700 text-slate-300 text-[10px] px-1.5 py-0.5 rounded-full font-mono">
              {documents.length}
            </span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {message && (
            <div
              className={`p-3 rounded-lg text-xs font-medium mb-4 flex items-center justify-between ${
                message.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
              }`}
            >
              <span>{message.text}</span>
              <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-white ml-2">
                ✕
              </button>
            </div>
          )}

          {activeTab === 'upload' ? (
            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Associated Entity */}
                {entities.length > 0 ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Select {masterTitle.replace(' Master', '')} *
                    </label>
                    <select
                      value={selectedEntityId}
                      onChange={(e) => setSelectedEntityId(e.target.value)}
                      className="w-full bg-[#0a111e] border border-[#2d3d54] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    >
                      {entities.map((ent) => (
                        <option key={ent.id} value={ent.id}>
                          {ent.name} {ent.code ? `(${ent.code})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Entity / Reference Name
                    </label>
                    <input
                      type="text"
                      placeholder={`e.g. ${masterTitle} Document`}
                      value={customEntityName}
                      onChange={(e) => setCustomEntityName(e.target.value)}
                      className="w-full bg-[#0a111e] border border-[#2d3d54] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                )}

                {/* Document Type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Document Category / Type *
                  </label>
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    className="w-full bg-[#0a111e] border border-[#2d3d54] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  >
                    {defaultDocTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {documentType === 'Other / Miscellaneous' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Specify Custom Document Type *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. NOC Certificate / Police Verification"
                    value={customDocType}
                    onChange={(e) => setCustomDocType(e.target.value)}
                    className="w-full bg-[#0a111e] border border-[#2d3d54] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              )}

              {/* Description / Remarks */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Remarks / Description (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Valid until 2028, signed agreement copy"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#0a111e] border border-[#2d3d54] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* File Upload Box */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Attach Document File *
                </label>
                <div className="border-2 border-dashed border-[#2d3d54] hover:border-rose-500/50 rounded-xl p-5 text-center bg-[#0d1624]/60 transition">
                  <input
                    type="file"
                    id="masterDocUpload"
                    accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="masterDocUpload" className="cursor-pointer block">
                    <div className="text-3xl mb-2">📄</div>
                    {file ? (
                      <div>
                        <p className="text-xs font-semibold text-rose-400">{file.name}</p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB • Click to replace file
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-medium text-slate-200">
                          Click to browse or drag and drop your file here
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1">
                          Supported formats: PDF, PNG, JPG, JPEG, DOCX, XLSX (Max 25 MB)
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end items-center gap-3 pt-3 border-t border-[#2d3d54]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !file}
                  className="bg-[#dc2626] hover:bg-[#b91c1c] disabled:opacity-50 text-white text-xs px-5 py-2 rounded-lg font-semibold transition shadow-md flex items-center gap-2 cursor-pointer"
                >
                  {uploading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      <span>Uploading File...</span>
                    </>
                  ) : (
                    <span>Upload to Repository</span>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Tab 2: Repository Table */
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <input
                  type="text"
                  placeholder="Search uploaded documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-[#0a111e] border border-[#2d3d54] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500 w-full sm:w-64"
                />
                <button
                  onClick={fetchDocuments}
                  className="text-xs text-slate-400 hover:text-white bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-[#2d3d54] transition flex items-center gap-1"
                >
                  <span>🔄 Refresh</span>
                </button>
              </div>

              {loadingDocs ? (
                <div className="py-12 text-center text-xs text-slate-400">Loading documents...</div>
              ) : filteredDocs.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-[#2d3d54] rounded-xl bg-[#0d1624]/40">
                  <span className="text-3xl block mb-2">📭</span>
                  <p className="text-xs text-slate-300 font-medium">No documents uploaded yet</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Switch to the Upload tab to add the first document for this master.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-[#2d3d54]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#0d1624] text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-[#2d3d54]">
                      <tr>
                        <th className="p-3">File Name & Type</th>
                        <th className="p-3">Associated Entity</th>
                        <th className="p-3">Size</th>
                        <th className="p-3">Uploaded By</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2d3d54]/50 text-slate-200">
                      {filteredDocs.map((doc) => (
                        <tr key={doc._id} className="hover:bg-[#152338]/60 transition">
                          <td className="p-3">
                            <div className="font-semibold text-white truncate max-w-xs">{doc.fileName}</div>
                            <span className="inline-block text-[10px] bg-rose-500/10 text-rose-300 border border-rose-500/20 px-1.5 py-0.2 rounded font-mono mt-0.5">
                              {doc.documentType}
                            </span>
                          </td>
                          <td className="p-3 font-medium text-slate-300">{doc.entityName || '—'}</td>
                          <td className="p-3 font-mono text-slate-400">
                            {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} KB` : '—'}
                          </td>
                          <td className="p-3 text-slate-400">
                            <div>{doc.uploadedBy || 'Admin'}</div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : ''}
                            </div>
                          </td>
                          <td className="p-3 text-right space-x-2 whitespace-nowrap">
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-2 py-1 rounded border border-blue-500/20 font-medium transition"
                            >
                              View
                            </a>
                            <a
                              href={doc.fileUrl}
                              download={doc.fileName}
                              className="text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-1 rounded border border-emerald-500/20 font-medium transition"
                            >
                              Download
                            </a>
                            <button
                              onClick={() => handleDeleteDoc(doc._id, doc.fileName)}
                              className="text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 px-2 py-1 rounded border border-rose-500/20 font-medium transition"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
