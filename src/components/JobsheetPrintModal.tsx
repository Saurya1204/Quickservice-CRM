'use client';

import React from 'react';

interface JobsheetPrintModalProps {
  call: any;
  onClose: () => void;
}

export default function JobsheetPrintModal({ call, onClose }: JobsheetPrintModalProps) {
  if (!call) return null;

  const handlePrint = () => {
    window.print();
  };

  const c = call.charges || {};
  const spareCharge = Number(c.spareCharge) || 0;
  const spareTax = Number(c.spareTax) || 0;
  const labourCharge = Number(c.labourCharge) || 0;
  const labourTax = Number(c.labourTax) || 0;
  const transportCharge = Number(c.transportCharge) || 0;
  const otherCharge = Number(c.otherCharge) || 0;
  const totalAmount = Number(c.totalAmount) || (spareCharge + spareTax + labourCharge + labourTax + transportCharge + otherCharge);

  const parts = call.requiredParts || call.pendingParts || [];
  const v = call.visitDetails || {};

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white text-slate-900 rounded-xl w-full max-w-4xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* ACTION BAR (Hidden when printing) */}
        <div className="print:hidden bg-slate-900 text-white p-3 px-5 flex justify-between items-center border-b border-slate-700">
          <div className="flex items-center space-x-2">
            <span className="text-base">🖨️</span>
            <span className="text-xs font-bold tracking-wide uppercase">Print Job Sheet: #{call.callNo}</span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-xs shadow transition flex items-center space-x-1.5"
            >
              <span>🖨️ Print / Save as PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800"
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* PRINTABLE A4 CONTENT */}
        <div id="printableJobSheet" className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-5 text-[11px] leading-relaxed bg-white">
          {/* HEADER: LOGO & DOCUMENT TITLE */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <img
                  src="/quickserves-logo.png"
                  alt="Quickserves Logo"
                  className="h-10 w-auto object-contain filter invert"
                  onError={(e: any) => {
                    e.target.style.display = 'none';
                  }}
                />
                <h1 className="text-xl font-black tracking-tight text-slate-900 font-sans">
                  QUICKSERVES
                </h1>
              </div>
              <p className="text-[10px] text-slate-600 mt-0.5">
                Quickserves Service Solutions • Pan-India Appliance Care & Engineering
              </p>
              <p className="text-[9px] text-slate-500">
                Helpline: 1800-QUICK-SERVE • Website: https://qs.onservice.in/
              </p>
            </div>

            <div className="text-right">
              <span className="inline-block bg-slate-900 text-white font-bold px-3 py-1 text-xs uppercase tracking-wider rounded">
                CUSTOMER JOB SHEET
              </span>
              <p className="text-xs font-mono font-bold mt-1 text-slate-900">
                Call ID: #{call.callNo}
              </p>
              <p className="text-[10px] text-slate-600">
                Date: {new Date().toLocaleDateString()}
              </p>
              <p className="text-[10px] text-slate-600">
                Status: <strong className="uppercase">{call.callStatus}</strong>
              </p>
            </div>
          </div>

          {/* GRID: CUSTOMER & PRODUCT INFO */}
          <div className="grid grid-cols-2 gap-4 border border-slate-300 rounded p-3">
            {/* Customer Details */}
            <div className="space-y-1 border-r border-slate-200 pr-3">
              <h3 className="font-bold uppercase tracking-wider text-[10px] text-slate-700 border-b border-slate-200 pb-1">
                Customer Information
              </h3>
              <p><strong>Name:</strong> {call.customerName}</p>
              <p><strong>Mobile:</strong> {call.customerMobile}</p>
              <p><strong>Email:</strong> {call.customerEmail || 'N/A'}</p>
              <p><strong>Address:</strong> {call.customerAddress || call.customerAddress1}</p>
              <p><strong>City / Locality:</strong> {call.city} {call.locality ? `, ${call.locality}` : ''}</p>
              <p><strong>Pincode / State:</strong> {call.pincode}, {call.state}</p>
            </div>

            {/* Product Details */}
            <div className="space-y-1 pl-1">
              <h3 className="font-bold uppercase tracking-wider text-[10px] text-slate-700 border-b border-slate-200 pb-1">
                Product & Warranty Details
              </h3>
              <p><strong>Client / Brand:</strong> {call.clientName} / {call.brandName}</p>
              <p><strong>Category / Product:</strong> {call.categoryName} {call.productName ? `- ${call.productName}` : ''}</p>
              <p><strong>Model Number:</strong> {call.modelNo || 'N/A'}</p>
              <p><strong>Product Serial No:</strong> <strong className="font-mono text-slate-900">{call.serialNo || 'N/A'}</strong></p>
              <p><strong>Unit Set Serial No:</strong> <span className="font-mono">{call.unitSerialNumber || 'N/A'}</span></p>
              <p><strong>Warranty Status:</strong> {call.warrantyStatus || 'Under Warranty'}</p>
              <p><strong>Date of Purchase (DOP):</strong> {call.productDOP || 'N/A'} (Inv: {call.invoiceNo || 'N/A'})</p>
            </div>
          </div>

          {/* COMPLAINT & SERVICE WORK DONE */}
          <div className="border border-slate-300 rounded p-3 space-y-2">
            <h3 className="font-bold uppercase tracking-wider text-[10px] text-slate-700 border-b border-slate-200 pb-1">
              Complaint & Service Report
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p><strong>Reported Fault / Complaint:</strong> {call.reportedFault || call.complaintDescription || 'General Service'}</p>
                <p><strong>Symptom:</strong> {call.symptomObserved || call.symptomRegistered || call.symptomName || 'Observed Defect'}</p>
                <p><strong>Cause & Analysis:</strong> {call.cause || call.causeName || 'Technical Inspection'} / {call.analysis || call.analysisName || 'Diagnosed'}</p>
              </div>
              <div>
                <p><strong>Action Taken:</strong> {v.actionTaken || call.serviceRemarks || 'Inspected and serviced at site.'}</p>
                <p><strong>Engineer Remarks:</strong> {v.engineerRemark || 'Work completed per standard service procedures.'}</p>
                <p><strong>Happy Code (OTP):</strong> {v.happyCode || 'Verified'}</p>
              </div>
            </div>
          </div>

          {/* SPARE PARTS TABLE */}
          <div className="border border-slate-300 rounded p-3 space-y-2">
            <h3 className="font-bold uppercase tracking-wider text-[10px] text-slate-700 border-b border-slate-200 pb-1">
              Spare Parts Detail (Required / Consumed / Replaced)
            </h3>
            {parts.length === 0 ? (
              <p className="text-slate-500 italic text-[10px]">No spare parts required or consumed for this service visit.</p>
            ) : (
              <table className="w-full text-left border-collapse border border-slate-300 text-[10px]">
                <thead className="bg-slate-100 font-bold border-b border-slate-300">
                  <tr>
                    <th className="p-1.5 border-r border-slate-300 w-8">#</th>
                    <th className="p-1.5 border-r border-slate-300">Part Description</th>
                    <th className="p-1.5 border-r border-slate-300">Part Code</th>
                    <th className="p-1.5 border-r border-slate-300 text-center w-12">Qty</th>
                    <th className="p-1.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {parts.map((p: any, idx: number) => (
                    <tr key={idx}>
                      <td className="p-1.5 border-r border-slate-200 font-mono text-center">{idx + 1}</td>
                      <td className="p-1.5 border-r border-slate-200 font-medium">{p.partName}</td>
                      <td className="p-1.5 border-r border-slate-200 font-mono">{p.partCode || 'N/A'}</td>
                      <td className="p-1.5 border-r border-slate-200 text-center font-mono">{p.quantity || 1}</td>
                      <td className="p-1.5 font-semibold uppercase">{p.status || p.pendingStatus || 'CONSUMED'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* COMMERCIAL CHARGES BREAKDOWN */}
          <div className="border border-slate-300 rounded p-3 space-y-2">
            <h3 className="font-bold uppercase tracking-wider text-[10px] text-slate-700 border-b border-slate-200 pb-1">
              Commercials & Amount Collected (INR)
            </h3>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                <span className="block text-[9px] text-slate-500 uppercase">Spare Charges</span>
                <span className="font-bold font-mono">₹ {spareCharge.toFixed(2)}</span>
              </div>
              <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                <span className="block text-[9px] text-slate-500 uppercase">Labour / Visit</span>
                <span className="font-bold font-mono">₹ {labourCharge.toFixed(2)}</span>
              </div>
              <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                <span className="block text-[9px] text-slate-500 uppercase">Taxes & Other</span>
                <span className="font-bold font-mono">₹ {(spareTax + labourTax + transportCharge + otherCharge).toFixed(2)}</span>
              </div>
              <div className="bg-slate-100 p-1.5 rounded border border-slate-300">
                <span className="block text-[9px] text-slate-700 uppercase font-bold">Total Collected</span>
                <span className="font-black font-mono text-sm text-slate-900">₹ {totalAmount.toFixed(2)}</span>
              </div>
            </div>
            <p className="text-[9px] text-slate-500 text-right">
              Temporary Cash Receipt (TCR): <strong>{c.tcrNo || 'N/A'}</strong>
            </p>
          </div>

          {/* ENGINEER & CUSTOMER SIGNATURES */}
          <div className="grid grid-cols-2 gap-8 pt-4 border-t-2 border-slate-300">
            <div>
              <p className="font-bold">Attending Service Engineer:</p>
              <p className="font-semibold text-slate-800">{v.engineerName || call.technicianName || 'Certified Engineer'}</p>
              <p className="text-[10px] text-slate-500">Visit Date: {v.visitDate ? new Date(v.visitDate).toLocaleDateString() : new Date().toLocaleDateString()}</p>
              <div className="h-12 border-b border-slate-400 mt-3"></div>
              <p className="text-[9px] text-slate-500 mt-1">Engineer Signature & Date</p>
            </div>

            <div>
              <p className="font-bold">Customer Satisfaction Acknowledgment:</p>
              <p className="text-[10px] text-slate-600 leading-tight">
                I acknowledge that the above service has been satisfactorily executed in my presence.
              </p>
              <div className="h-12 border-b border-slate-400 mt-3"></div>
              <p className="text-[9px] text-slate-500 mt-1">Customer Signature & Date</p>
            </div>
          </div>

          {/* FOOTER NOTE */}
          <div className="text-center text-[9px] text-slate-400 pt-2 border-t border-slate-200">
            This is an official computer-generated Quickserves Customer Service Job Sheet. • Quickserves CRM v2.4 Enterprise
          </div>
        </div>
      </div>
    </div>
  );
}

