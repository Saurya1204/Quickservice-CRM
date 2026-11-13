'use client';

import React from 'react';

interface CallDetailModalProps {
  call: any;
  onClose: () => void;
  onOpenJobSheet?: (call: any) => void;
  onOpenPrint?: (call: any) => void;
}

export default function CallDetailModal({
  call,
  onClose,
  onOpenJobSheet,
  onOpenPrint,
}: CallDetailModalProps) {
  if (!call) return null;

  // Derive fields
  const callHistory = Array.isArray(call.callHistory) ? call.callHistory : [];
  const pendingParts = Array.isArray(call.pendingParts) ? call.pendingParts : [];
  const consumedParts = Array.isArray(call.consumedParts) ? call.consumedParts : [];
  const workDoneRecords = Array.isArray(call.workDoneRecords)
    ? call.workDoneRecords
    : call.jobDetails
    ? [
        {
          workDone: call.jobDetails,
          symptom: call.symptomObserved || call.symptomRegistered || call.symptomName || 'General',
          cause: call.cause || call.causeName || 'N/A',
          analysis: call.analysis || call.analysisName || 'N/A',
        },
      ]
    : [];

  const visitList = Array.isArray(call.visitHistory) && call.visitHistory.length > 0
    ? call.visitHistory
    : call.visitDetails
    ? [call.visitDetails]
    : [];

  // Build attachment list for Section 11: Attachment Download
  const attachments: Array<{
    type: string;
    name: string;
    date: string;
    url: string;
    previewable: boolean;
  }> = [];

  if (call.invoiceFile?.fileName || call.invoiceFile?.fileUrl) {
    attachments.push({
      type: 'Invoice Document',
      name: call.invoiceFile.fileName || 'Product_Invoice.pdf',
      date: call.invoiceFile.uploadedAt
        ? new Date(call.invoiceFile.uploadedAt).toLocaleDateString()
        : 'Uploaded during registration/update',
      url: `/api/calls/attachments/serve?callId=${call._id}&type=invoice`,
      previewable: true,
    });
  }

  if (Array.isArray(call.defectivePartImages)) {
    call.defectivePartImages.forEach((img: any, idx: number) => {
      attachments.push({
        type: `Defective Parts Image #${idx + 1}`,
        name: img.fileName || `defective_part_${idx + 1}.jpg`,
        date: img.uploadedAt ? new Date(img.uploadedAt).toLocaleDateString() : 'Uploaded during PART_PENDING',
        url: `/api/calls/attachments/serve?callId=${call._id}&type=defective&index=${idx}`,
        previewable: true,
      });
    });
  }

  // Calculate charges
  const c = call.charges || {};
  const spareCharge = Number(c.spareCharge) || 0;
  const spareTax = Number(c.spareTax) || 0;
  const labourCharge = Number(c.labourCharge) || 0;
  const labourTax = Number(c.labourTax) || 0;
  const transportCharge = Number(c.transportCharge) || 0;
  const otherCharge = Number(c.otherCharge) || 0;
  const totalAmount = Number(c.totalAmount) || (spareCharge + spareTax + labourCharge + labourTax + transportCharge + otherCharge);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-[#111c2e] border border-blue-500/30 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in duration-200">
        {/* HEADER BAR */}
        <div className="bg-[#18263e] border-b border-[#334155] p-4 flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/30 text-lg">
              📋
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Complaint View / History Details</span>
                <span className="font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-xs">
                  #{call.callNo}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Official Comprehensive Complaint Lifecycle Record • Quickserves CRM
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenJobSheet && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenJobSheet(call);
                }}
                className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-semibold transition shadow flex items-center space-x-1"
              >
                <span>✏️ Update Job Sheet</span>
              </button>
            )}
            {onOpenPrint && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPrint(call);
                }}
                className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded font-semibold transition flex items-center space-x-1"
              >
                <span>🖨️ Jobsheet Print</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-1.5 rounded-lg text-sm transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* SCROLLABLE 11 SECTIONS BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-xs text-slate-300">
          {/* SECTION 1: HISTORY OF COMPLAINT */}
          <div className="bg-[#172236] border border-[#2d3d57] rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center space-x-2 border-b border-[#2d3d57] pb-2">
              <span>1. History of Complaint</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Call By</span>
                <span className="text-white font-medium">{call.callBy || call.callRegisterBy || 'Customer'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Dealer</span>
                <span className="text-white font-medium">{call.dealerName || 'Direct Customer'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Customer Language</span>
                <span className="text-white font-medium">
                  {call.customerLanguage || (call.languages && call.languages[0]) || 'Hindi'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Dealer City</span>
                <span className="text-white font-medium">{call.dealerCity || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Customer Feedback</span>
                {call.feedback ? (
                  <span className="text-amber-400 font-bold">
                    {'⭐'.repeat(Math.min(5, Math.max(1, call.feedback.rating || 5)))} ({call.feedback.rating}/5)
                  </span>
                ) : (
                  <span className="text-slate-500 italic">Not Submitted</span>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 2: CUSTOMER DETAILS */}
          <div className="bg-[#172236] border border-[#2d3d57] rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center space-x-2 border-b border-[#2d3d57] pb-2">
              <span>2. Customer Details</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Title</span>
                <span className="text-white font-medium">{call.customerTitle || 'Mr'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">First Name</span>
                <span className="text-white font-medium">{call.customerFirstName || call.customerName?.split(' ')[0] || ''}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Last Name</span>
                <span className="text-white font-medium">
                  {call.customerLastName || call.customerName?.split(' ').slice(1).join(' ') || ''}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Mobile Number</span>
                <span className="text-emerald-400 font-mono font-bold">{call.customerMobile}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">City</span>
                <span className="text-white font-medium">{call.city}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Pincode</span>
                <span className="text-white font-mono">{call.pincode}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">STD Code</span>
                <span className="text-slate-300 font-mono">{call.stdCode || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Residence Phone</span>
                <span className="text-slate-300 font-mono">{call.residencePhone || 'N/A'}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Address 1</span>
                <span className="text-white">{call.customerAddress1 || call.customerAddress}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Address 2</span>
                <span className="text-slate-300">{call.customerAddress2 || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Locality</span>
                <span className="text-white">{call.locality || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Landmark</span>
                <span className="text-white">{call.landmark || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Office Phone</span>
                <span className="text-slate-300 font-mono">{call.officePhone || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Customer Language</span>
                <span className="text-white">{call.customerLanguage || 'Hindi'}</span>
              </div>
            </div>
          </div>

          {/* SECTION 3: PRODUCT DETAILS */}
          <div className="bg-[#172236] border border-[#2d3d57] rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center space-x-2 border-b border-[#2d3d57] pb-2">
              <span>3. Product Details</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Brand</span>
                <span className="text-white font-bold">{call.brandName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Product / Category</span>
                <span className="text-white">{call.productName || call.categoryName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Model</span>
                <span className="text-white font-mono">{call.modelNo || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Product Serial Number</span>
                <span className="text-amber-400 font-mono font-bold">{call.serialNo || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Warranty Status</span>
                <span className="text-emerald-400 font-medium">{call.warrantyStatus || 'Under Warranty'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Contract Details</span>
                <span className="text-slate-300">{call.contractDetails || 'Standard Warranty'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Date of Purchase (DOP)</span>
                <span className="text-white font-mono">{call.productDOP || call.dealerDOP || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Priority</span>
                <span className="text-rose-400 font-semibold">{call.complaintPriority || 'Normal'}</span>
              </div>
            </div>
          </div>

          {/* SECTION 4: COMPLAINT DETAILS */}
          <div className="bg-[#172236] border border-[#2d3d57] rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center space-x-2 border-b border-[#2d3d57] pb-2">
              <span>4. Complaint Details</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Complaint Number</span>
                <span className="text-white font-mono font-bold">{call.callNo}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Complaint Date</span>
                <span className="text-white">{call.createdAt ? new Date(call.createdAt).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Complaint Status</span>
                <span className="text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 inline-block">
                  {call.callStatus}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Call Type</span>
                <span className="text-white">{call.callType || 'Service'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">ASC Name / Branch</span>
                <span className="text-white">{call.branch || call.ascName || 'Central Hub'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Talk To Whom (Allot)</span>
                <span className="text-indigo-400 font-semibold">{call.technicianName || call.talkToWhom || 'Unassigned'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Appointment Date & Time</span>
                <span className="text-purple-400 font-medium">
                  {call.appointmentDate ? new Date(call.appointmentDate).toLocaleDateString() : 'Not Scheduled'}{' '}
                  {call.appointmentTime || ''}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Promise Date & Time</span>
                <span className="text-slate-300">
                  {call.promiseDate || 'N/A'} {call.promiseTime || ''}
                </span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Remarks (Solve Over Phone / Fault)</span>
                <span className="text-slate-200">{call.reportedFault || call.complaintDescription || 'General Service'}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Cancel Remarks</span>
                <span className="text-rose-400">{call.cancelRemarks || call.cancellationReason || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* SECTION 5: JOB DONE */}
          <div className="bg-[#172236] border border-[#2d3d57] rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center space-x-2 border-b border-[#2d3d57] pb-2">
              <span>5. Job Done ({workDoneRecords.length})</span>
            </h3>
            {workDoneRecords.length === 0 ? (
              <p className="text-slate-500 italic text-[11px]">No Job Done entries recorded yet.</p>
            ) : (
              <div className="overflow-x-auto rounded border border-[#2d3d57]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#0f172a] text-slate-400 uppercase text-[10px] font-semibold border-b border-[#2d3d57]">
                    <tr>
                      <th className="p-2 w-12">Sr. No.</th>
                      <th className="p-2">Work Done</th>
                      <th className="p-2">Symptom</th>
                      <th className="p-2">Cause</th>
                      <th className="p-2">Analysis</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2d3d57] bg-[#121b2d]">
                    {workDoneRecords.map((r: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="p-2 font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-2 text-white font-medium">{r.workDone}</td>
                        <td className="p-2 text-slate-300">{r.symptom || 'N/A'}</td>
                        <td className="p-2 text-slate-300">{r.cause || 'N/A'}</td>
                        <td className="p-2 text-slate-300">{r.analysis || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* SECTION 6: PART PENDING */}
          <div className="bg-[#172236] border border-[#2d3d57] rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-2 border-b border-[#2d3d57] pb-2">
              <span>6. Part Pending ({pendingParts.length})</span>
            </h3>
            {pendingParts.length === 0 ? (
              <p className="text-slate-500 italic text-[11px]">No pending spare parts.</p>
            ) : (
              <div className="overflow-x-auto rounded border border-[#2d3d57]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#0f172a] text-slate-400 uppercase text-[10px] font-semibold border-b border-[#2d3d57]">
                    <tr>
                      <th className="p-2">Part Name</th>
                      <th className="p-2">Part Code</th>
                      <th className="p-2">Qty</th>
                      <th className="p-2">Unit Set Serial Number</th>
                      <th className="p-2">Pending Reason</th>
                      <th className="p-2">Invoice Copy</th>
                      <th className="p-2">Defective Part Image</th>
                      <th className="p-2">Pending Date</th>
                      <th className="p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2d3d57] bg-[#121b2d]">
                    {pendingParts.map((p: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="p-2 font-semibold text-white">{p.partName}</td>
                        <td className="p-2 font-mono text-slate-300">{p.partCode || 'N/A'}</td>
                        <td className="p-2 font-mono text-center">{p.quantity}</td>
                        <td className="p-2 font-mono text-amber-300 font-bold">{p.unitSerialNumber || call.unitSerialNumber || 'N/A'}</td>
                        <td className="p-2 text-slate-300">{p.pendingReason}</td>
                        <td className="p-2">
                          {p.invoiceCopyUrl || call.invoiceFile?.fileUrl ? (
                            <a
                              href={p.invoiceCopyUrl || `/api/calls/attachments/serve?callId=${call._id}&type=invoice`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-400 hover:underline font-semibold"
                            >
                              📄 View Invoice
                            </a>
                          ) : (
                            <span className="text-slate-500">None</span>
                          )}
                        </td>
                        <td className="p-2">
                          {p.defectiveImageUrl || (call.defectivePartImages && call.defectivePartImages.length > 0) ? (
                            <a
                              href={p.defectiveImageUrl || `/api/calls/attachments/serve?callId=${call._id}&type=defective&index=0`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-amber-400 hover:underline font-semibold"
                            >
                              🖼️ View Image
                            </a>
                          ) : (
                            <span className="text-slate-500">None</span>
                          )}
                        </td>
                        <td className="p-2 font-mono">{p.pendingDate ? new Date(p.pendingDate).toLocaleDateString() : 'N/A'}</td>
                        <td className="p-2 text-amber-400 font-bold">{p.pendingStatus || 'PENDING'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* SECTION 7: PART CONSUMPTION */}
          <div className="bg-[#172236] border border-[#2d3d57] rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center space-x-2 border-b border-[#2d3d57] pb-2">
              <span>7. Part Consumption ({consumedParts.length})</span>
            </h3>
            {consumedParts.length === 0 ? (
              <p className="text-slate-500 italic text-[11px]">No parts consumed yet.</p>
            ) : (
              <div className="overflow-x-auto rounded border border-[#2d3d57]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#0f172a] text-slate-400 uppercase text-[10px] font-semibold border-b border-[#2d3d57]">
                    <tr>
                      <th className="p-2">Part Name</th>
                      <th className="p-2">Part Code</th>
                      <th className="p-2">Consumed Qty</th>
                      <th className="p-2">Part Serial Number</th>
                      <th className="p-2">Consumption Date</th>
                      <th className="p-2">Engineer / Tech</th>
                      <th className="p-2">Call ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2d3d57] bg-[#121b2d]">
                    {consumedParts.map((cPart: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="p-2 font-semibold text-white">{cPart.partName}</td>
                        <td className="p-2 font-mono text-slate-300">{cPart.partCode || 'N/A'}</td>
                        <td className="p-2 font-mono text-center">{cPart.consumedQuantity}</td>
                        <td className="p-2 font-mono text-slate-300">{cPart.partSerialNumber || 'N/A'}</td>
                        <td className="p-2 font-mono">{cPart.consumptionDate ? new Date(cPart.consumptionDate).toLocaleDateString() : 'N/A'}</td>
                        <td className="p-2 text-slate-200">{cPart.engineerName || call.technicianName}</td>
                        <td className="p-2 font-mono text-blue-400">{cPart.relatedCallId || call.callNo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* SECTION 8: LABOUR COLLECTED */}
          <div className="bg-[#172236] border border-[#2d3d57] rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-2 border-b border-[#2d3d57] pb-2">
              <span>8. Labour & Spare Collected</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Labour Charges</span>
                <span className="text-white font-mono font-bold">₹ {labourCharge.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Labour Tax</span>
                <span className="text-white font-mono">₹ {labourTax.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Spare Charges</span>
                <span className="text-white font-mono font-bold">₹ {spareCharge.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Spare Tax</span>
                <span className="text-white font-mono">₹ {spareTax.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Transport Charges</span>
                <span className="text-white font-mono">₹ {transportCharge.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Other Charges</span>
                <span className="text-white font-mono">₹ {otherCharge.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-400 block uppercase font-bold">Total Collected Amount</span>
                <span className="text-emerald-400 font-mono font-bold text-sm">₹ {totalAmount.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Temporary Cash Receipt (TCR)</span>
                <span className="text-white font-mono">{c.tcrNo || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* SECTION 9: VISIT DETAIL */}
          <div className="bg-[#172236] border border-[#2d3d57] rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center space-x-2 border-b border-[#2d3d57] pb-2">
              <span>9. Visit Detail ({visitList.length})</span>
            </h3>
            {visitList.length === 0 ? (
              <p className="text-slate-500 italic text-[11px]">No technician visits recorded yet.</p>
            ) : (
              <div className="overflow-x-auto rounded border border-[#2d3d57]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#0f172a] text-slate-400 uppercase text-[10px] font-semibold border-b border-[#2d3d57]">
                    <tr>
                      <th className="p-2">Engineer Name</th>
                      <th className="p-2">Visit Date</th>
                      <th className="p-2">In-Time</th>
                      <th className="p-2">Out-Time</th>
                      <th className="p-2">Action Taken</th>
                      <th className="p-2">Remarks</th>
                      <th className="p-2">Last Status</th>
                      <th className="p-2">Present Status</th>
                      <th className="p-2">Happy Code</th>
                      <th className="p-2">Distance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2d3d57] bg-[#121b2d]">
                    {visitList.map((v: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="p-2 font-medium text-white">{v.engineerName || call.technicianName}</td>
                        <td className="p-2 font-mono">{v.visitDate ? new Date(v.visitDate).toLocaleDateString() : 'N/A'}</td>
                        <td className="p-2 font-mono">{v.inTimeHour || '10'}:{v.inTimeMinute || '00'}</td>
                        <td className="p-2 font-mono">{v.outTimeHour || '11'}:{v.outTimeMinute || '00'}</td>
                        <td className="p-2 text-slate-300">{v.actionTaken || 'N/A'}</td>
                        <td className="p-2 text-slate-300">{v.engineerRemark || 'N/A'}</td>
                        <td className="p-2 text-slate-400 font-bold">{v.lastStatus || 'N/A'}</td>
                        <td className="p-2 text-emerald-400 font-bold">{v.presentStatus || call.callStatus}</td>
                        <td className="p-2 font-mono text-amber-300 font-bold">{v.happyCode || 'N/A'}</td>
                        <td className="p-2 font-mono">{v.distanceFromSF ? `${v.distanceFromSF} KM` : 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* SECTION 10: CALL HISTORY */}
          <div className="bg-[#172236] border border-[#2d3d57] rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center space-x-2 border-b border-[#2d3d57] pb-2">
              <span>10. Call History (Operational Timeline - {callHistory.length} events)</span>
            </h3>
            {callHistory.length === 0 ? (
              <p className="text-slate-500 italic text-[11px]">No call history events recorded yet.</p>
            ) : (
              <div className="overflow-x-auto rounded border border-[#2d3d57]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#0f172a] text-slate-400 uppercase text-[10px] font-semibold border-b border-[#2d3d57]">
                    <tr>
                      <th className="p-2">Action</th>
                      <th className="p-2">Remark</th>
                      <th className="p-2">Tdate (Transaction Date)</th>
                      <th className="p-2">IP Address</th>
                      <th className="p-2">Entered By</th>
                      <th className="p-2">complaint_status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2d3d57] bg-[#121b2d]">
                    {callHistory.map((hist: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="p-2 font-bold text-white whitespace-nowrap">{hist.action}</td>
                        <td className="p-2 text-slate-300">{hist.remark}</td>
                        <td className="p-2 font-mono text-slate-400 whitespace-nowrap">
                          {hist.transactionDate ? new Date(hist.transactionDate).toLocaleString() : 'N/A'}
                        </td>
                        <td className="p-2 font-mono text-slate-400">{hist.ipAddress || '127.0.0.1'}</td>
                        <td className="p-2 font-medium text-slate-200">{hist.enteredBy}</td>
                        <td className="p-2">
                          <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {hist.complaintStatus || call.callStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* SECTION 11: ATTACHMENT DOWNLOAD */}
          <div className="bg-[#172236] border border-[#2d3d57] rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center space-x-2 border-b border-[#2d3d57] pb-2">
              <span>11. Attachment Download ({attachments.length})</span>
            </h3>
            {attachments.length === 0 ? (
              <p className="text-slate-500 italic text-[11px]">No attachments uploaded for this complaint.</p>
            ) : (
              <div className="overflow-x-auto rounded border border-[#2d3d57]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#0f172a] text-slate-400 uppercase text-[10px] font-semibold border-b border-[#2d3d57]">
                    <tr>
                      <th className="p-2 w-12">Sr. No.</th>
                      <th className="p-2">Document Type</th>
                      <th className="p-2">File Name</th>
                      <th className="p-2">Entered Date</th>
                      <th className="p-2 text-right">Action (Download / Preview)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2d3d57] bg-[#121b2d]">
                    {attachments.map((att, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="p-2 font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-2 font-bold text-white">{att.type}</td>
                        <td className="p-2 text-slate-300 font-mono truncate max-w-xs">{att.name}</td>
                        <td className="p-2 font-mono text-slate-400">{att.date}</td>
                        <td className="p-2 text-right space-x-2 whitespace-nowrap">
                          <a
                            href={att.url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 rounded text-[11px] font-semibold transition inline-block"
                          >
                            👁️ Preview
                          </a>
                          <a
                            href={`${att.url}&download=1`}
                            download={att.name}
                            className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 rounded text-[11px] font-semibold transition inline-block"
                          >
                            📥 Download
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER BAR */}
        <div className="bg-[#18263e] border-t border-[#334155] p-3 px-6 flex justify-between items-center">
          <span className="text-[11px] text-slate-400">
            Current Status: <strong className="text-emerald-400">{call.callStatus}</strong> • Registered:{' '}
            {call.createdAt ? new Date(call.createdAt).toLocaleDateString() : 'N/A'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition"
          >
            Close View
          </button>
        </div>
      </div>
    </div>
  );
}

