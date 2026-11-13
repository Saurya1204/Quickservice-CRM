'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

const EXPERIENCE_OPTIONS = ['Select', 'Poor', 'Average', 'Good', 'Very Good', 'Excellent'];
const YES_NO_OPTIONS = ['Select', 'Yes', 'No'];

export default function CustomerFeedbackPage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submittedSuccessfully, setSubmittedSuccessfully] = useState(false);
  const [callData, setCallData] = useState<any>(null);
  const [existingFeedbackStatus, setExistingFeedbackStatus] = useState<string>('PENDING');

  // Form State - Exact 13 Questions
  const [formData, setFormData] = useState({
    appointmentVisitRating: 'Select',
    resolutionOnTime: 'Select',
    productServiceSatisfaction: 'Select',
    engineerAttitudeRating: 'Select',
    engineerKnowledgeRating: 'Select',
    workSatisfaction: 'Select',
    engineerTimeRating: 'Select',
    productDemonstration: 'Select',
    amountCollected: 'Select',
    receiptProvided: 'Not Applicable',
    dissatisfactionReason: '',
    callCentreExperience: 'Select',
    overallExperience: 'Select',
  });

  // Track whether any question has negative rating to enforce Field 11
  const isDissatisfactionTriggered =
    formData.productServiceSatisfaction === 'Poor' ||
    formData.productServiceSatisfaction === 'Average' ||
    formData.engineerAttitudeRating === 'Poor' ||
    formData.engineerAttitudeRating === 'Average' ||
    formData.engineerKnowledgeRating === 'Poor' ||
    formData.engineerKnowledgeRating === 'Average' ||
    formData.workSatisfaction === 'Poor' ||
    formData.workSatisfaction === 'Average' ||
    formData.callCentreExperience === 'Poor' ||
    formData.callCentreExperience === 'Average' ||
    formData.overallExperience === 'Poor' ||
    formData.overallExperience === 'Average' ||
    formData.appointmentVisitRating === 'No' ||
    formData.resolutionOnTime === 'No' ||
    formData.engineerTimeRating === 'No' ||
    formData.productDemonstration === 'No';

  // Load Feedback Form data
  useEffect(() => {
    if (!token) return;
    fetchFeedbackDetails();
  }, [token]);

  const fetchFeedbackDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/feedback/${token}`);
      const json = await res.json();
      if (json.success) {
        setCallData(json.data.call);
        setExistingFeedbackStatus(json.data.feedbackStatus || 'PENDING');
        if (json.data.responses) {
          setFormData({
            appointmentVisitRating: json.data.responses.appointmentVisitRating || 'Select',
            resolutionOnTime: json.data.responses.resolutionOnTime || 'Select',
            productServiceSatisfaction: json.data.responses.productServiceSatisfaction || 'Select',
            engineerAttitudeRating: json.data.responses.engineerAttitudeRating || 'Select',
            engineerKnowledgeRating: json.data.responses.engineerKnowledgeRating || 'Select',
            workSatisfaction: json.data.responses.workSatisfaction || 'Select',
            engineerTimeRating: json.data.responses.engineerTimeRating || 'Select',
            productDemonstration: json.data.responses.productDemonstration || 'Select',
            amountCollected: json.data.responses.amountCollected || 'Select',
            receiptProvided: json.data.responses.receiptProvided || 'Not Applicable',
            dissatisfactionReason: json.data.responses.dissatisfactionReason || '',
            callCentreExperience: json.data.responses.callCentreExperience || 'Select',
            overallExperience: json.data.responses.overallExperience || 'Select',
          });
        }
      } else {
        setError(json.message || 'Unable to load feedback form.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error fetching feedback details.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Amount Collected Change
  const handleAmountCollectedChange = (val: string) => {
    if (val === 'Yes') {
      setFormData((prev) => ({
        ...prev,
        amountCollected: val,
        receiptProvided: prev.receiptProvided === 'Not Applicable' ? 'Select' : prev.receiptProvided,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        amountCollected: val,
        receiptProvided: 'Not Applicable',
      }));
    }
  };

  // Submit Handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validations
    if (formData.appointmentVisitRating === 'Select') {
      alert('Please select: Engineer Visit as per Scheduled Appointment.');
      return;
    }
    if (formData.resolutionOnTime === 'Select') {
      alert('Please select: Are you get resolution on time.');
      return;
    }
    if (formData.productServiceSatisfaction === 'Select') {
      alert('Please select: Are you satisfied with Product Service / Installation.');
      return;
    }
    if (formData.engineerAttitudeRating === 'Select') {
      alert('Please select: Engineer - Attitude/Behavior/Attentiveness/Grooming.');
      return;
    }
    if (formData.engineerKnowledgeRating === 'Select') {
      alert('Please select: Engineer - Knowledge or Skill of product/repair.');
      return;
    }
    if (formData.workSatisfaction === 'Select') {
      alert('Please select: Is he Complete work as per your Satisfaction.');
      return;
    }
    if (formData.engineerTimeRating === 'Select') {
      alert('Please select: Is he given you proper time.');
      return;
    }
    if (formData.productDemonstration === 'Select') {
      alert('Please select: Is he Demonstrate you properly about Product.');
      return;
    }
    if (formData.amountCollected === 'Select') {
      alert('Please select: Is he Collected Any Amount from You.');
      return;
    }
    if (formData.amountCollected === 'Yes' && (formData.receiptProvided === 'Select' || formData.receiptProvided === 'Not Applicable')) {
      alert('Since money was collected, please answer: Is he given you Receipt of Collected Amount.');
      return;
    }
    if (formData.callCentreExperience === 'Select') {
      alert('Please select: Call Centre Interaction experience.');
      return;
    }
    if (formData.overallExperience === 'Select') {
      alert('Please select: Overall experience.');
      return;
    }

    if (isDissatisfactionTriggered && (!formData.dissatisfactionReason || !formData.dissatisfactionReason.trim())) {
      alert('Please provide the "Reason behind Desatisfaction ?" so we can urgently review and resolve your concern.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/feedback/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          callId: callData?.id,
          complaintNo: callData?.complaintNo,
          ...formData,
          submittedBy: 'Customer',
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSubmittedSuccessfully(true);
        setExistingFeedbackStatus('SUBMITTED');
      } else {
        alert(json.message || 'Failed to submit feedback.');
      }
    } catch (err: any) {
      alert(err.message || 'Network error occurred while submitting feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAbort = () => {
    if (confirm('Are you sure you want to abort? Any unsaved feedback information will be lost.')) {
      router.push('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b1329] text-white flex flex-col items-center justify-center p-4">
        <div className="animate-spin text-4xl mb-4">⚙️</div>
        <p className="text-sm font-medium text-slate-300">Loading your verified feedback session...</p>
      </div>
    );
  }

  if (error || !callData) {
    return (
      <div className="min-h-screen bg-[#0b1329] text-white flex flex-col items-center justify-center p-4">
        <div className="bg-[#172033] border border-[#334155] rounded-2xl p-8 max-w-md w-full text-center shadow-2xl space-y-4">
          <div className="text-4xl text-rose-400">⚠️</div>
          <h2 className="text-lg font-bold text-white">Feedback Access Error</h2>
          <p className="text-xs text-slate-300">{error || 'Invalid or expired feedback link.'}</p>
          <button
            onClick={() => router.push('/feedback')}
            className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow"
          >
            Verify with Mobile & Complaint Number
          </button>
        </div>
      </div>
    );
  }

  // Already submitted state
  if (existingFeedbackStatus === 'SUBMITTED' && !submittedSuccessfully) {
    return (
      <div className="min-h-screen bg-[#0b1329] text-white p-4 sm:p-8 flex flex-col items-center justify-center">
        <div className="max-w-2xl w-full bg-[#172033] border border-[#334155] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 text-center">
          <div className="flex justify-center">
            <img src="/assets/quickserves-logo.png" alt="Quickserves Official Logo" className="h-9 w-auto object-contain" />
          </div>
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-3xl mx-auto border border-emerald-500/30">
            ✓
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Feedback Already Recorded</h2>
            <p className="text-xs text-slate-300">
              Thank you! Your feedback for Complaint <strong className="text-emerald-400 font-mono">#{callData.complaintNo}</strong> has already been received and securely logged in our system.
            </p>
          </div>

          <div className="bg-[#0f172a] p-4 rounded-xl border border-[#334155] text-left text-xs space-y-2">
            <div className="flex justify-between border-b border-[#334155] pb-2">
              <span className="text-slate-400">Customer:</span>
              <span className="text-white font-semibold">{callData.customerName}</span>
            </div>
            <div className="flex justify-between border-b border-[#334155] pb-2">
              <span className="text-slate-400">Assigned Engineer:</span>
              <span className="text-indigo-300 font-medium">{callData.engineerName}</span>
            </div>
            <div className="flex justify-between border-b border-[#334155] pb-2">
              <span className="text-slate-400">Overall Rating:</span>
              <span className="text-amber-400 font-bold">{formData.overallExperience || 'Recorded'}</span>
            </div>
            {formData.dissatisfactionReason && (
              <div>
                <span className="text-slate-400 block text-[11px] mb-1">Recorded Feedback Notes:</span>
                <p className="text-slate-200 bg-[#172033] p-2.5 rounded border border-[#334155]">
                  "{formData.dissatisfactionReason}"
                </p>
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-500">
            If you need further assistance or wish to reopen this ticket, please contact Quickserves Customer Support.
          </p>
        </div>
      </div>
    );
  }

  // Submission success screen
  if (submittedSuccessfully) {
    return (
      <div className="min-h-screen bg-[#0b1329] text-white p-4 sm:p-8 flex flex-col items-center justify-center">
        <div className="max-w-xl w-full bg-[#172033] border border-emerald-500/40 rounded-2xl p-8 shadow-2xl text-center space-y-6">
          <div className="flex justify-center">
            <img src="/assets/quickserves-logo.png" alt="Quickserves Official Logo" className="h-9 w-auto object-contain" />
          </div>
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-3xl mx-auto border border-emerald-500/30 animate-bounce">
            🎉
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Thank You for Your Feedback!</h2>
            <p className="text-xs text-slate-300">
              Your feedback for Service Call <strong className="text-emerald-400 font-mono">#{callData.complaintNo}</strong> has been successfully recorded. Your ratings help us continually elevate our service quality across India.
            </p>
          </div>

          <div className="bg-[#0f172a] p-4 rounded-xl border border-[#334155] text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Customer:</span>
              <span className="text-white font-medium">{callData.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Service Engineer:</span>
              <span className="text-indigo-300 font-medium">{callData.engineerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Overall Experience:</span>
              <span className="text-emerald-400 font-bold">{formData.overallExperience}</span>
            </div>
          </div>

          <button
            onClick={() => router.push('/')}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow"
          >
            Return to Quickserves Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1329] text-slate-100 py-6 px-3 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-5">
        {/* LOGO & BRAND HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-center bg-[#172033] border border-[#334155] p-4 sm:p-5 rounded-2xl shadow-xl gap-4">
          <div className="flex items-center space-x-3">
            <img
              src="/assets/quickserves-logo.png"
              alt="Quickserves Official Logo"
              className="h-8 sm:h-9 w-auto object-contain select-none"
            />
            <div className="border-l border-slate-700 pl-3">
              <h1 className="text-sm sm:text-base font-bold text-white tracking-wide uppercase">
                Customer Service Experience
              </h1>
              <p className="text-[11px] text-slate-400">Service Visit & Installation Feedback Portal</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-full font-bold">
              Verified Session
            </span>
          </div>
        </div>

        {/* VERIFIED SERVICE SUMMARY BANNER */}
        <div className="bg-[#111c2e] border border-[#1e293b] rounded-xl p-4 shadow-lg grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-[10px] uppercase text-slate-400 font-semibold block">Complaint Number</span>
            <span className="text-emerald-400 font-bold font-mono text-sm">#{callData.complaintNo}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase text-slate-400 font-semibold block">Customer Name</span>
            <span className="text-white font-medium">{callData.customerName}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase text-slate-400 font-semibold block">Product / Appliance</span>
            <span className="text-slate-200">
              {callData.brandName} {callData.categoryName && `• ${callData.categoryName}`}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase text-slate-400 font-semibold block">Service Engineer</span>
            <span className="text-indigo-300 font-medium">{callData.engineerName}</span>
          </div>
        </div>

        {/* MAIN FEEDBACK FORM CARD */}
        <div className="bg-[#172033] border border-[#334155] rounded-2xl shadow-2xl p-5 sm:p-8 space-y-6">
          <div className="border-b border-[#334155] pb-3 flex justify-between items-center">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white uppercase tracking-wider">
                Feedback Details
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Please rate your recent technician visit and service experience with Quickserves.
              </p>
            </div>
            <span className="text-xs text-rose-400 font-medium">* All core fields mandatory</span>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            {/* TWO-COLUMN RESPONSIVE LAYOUT */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
              {/* LEFT COLUMN */}
              <div className="space-y-5">
                {/* FIELD 1 */}
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                    Engineer Visit as per Scheduled Appointment <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formData.appointmentVisitRating}
                    onChange={(e) => setFormData({ ...formData, appointmentVisitRating: e.target.value })}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
                  >
                    {YES_NO_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* FIELD 3 */}
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                    Are you satisfied with Product Service / Installation <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formData.productServiceSatisfaction}
                    onChange={(e) => setFormData({ ...formData, productServiceSatisfaction: e.target.value })}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
                  >
                    {EXPERIENCE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* FIELD 5 */}
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                    Engineer - Knowledge or Skill of product/repair <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formData.engineerKnowledgeRating}
                    onChange={(e) => setFormData({ ...formData, engineerKnowledgeRating: e.target.value })}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
                  >
                    {EXPERIENCE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* FIELD 7 */}
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                    Is he given you proper time <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formData.engineerTimeRating}
                    onChange={(e) => setFormData({ ...formData, engineerTimeRating: e.target.value })}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
                  >
                    {YES_NO_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* FIELD 9 */}
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                    Is he Collected Any Amount from You <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formData.amountCollected}
                    onChange={(e) => handleAmountCollectedChange(e.target.value)}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
                  >
                    {YES_NO_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* FIELD 11: Dissatisfaction Reason (Conditional) */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-semibold text-slate-200">
                      Reason behind Desatisfaction ?{' '}
                      {isDissatisfactionTriggered ? (
                        <span className="text-amber-400 font-bold">* (Mandatory for unsatisfactory feedback)</span>
                      ) : (
                        <span className="text-slate-400 font-normal">(Optional)</span>
                      )}
                    </label>
                  </div>
                  <textarea
                    rows={4}
                    value={formData.dissatisfactionReason}
                    onChange={(e) => setFormData({ ...formData, dissatisfactionReason: e.target.value })}
                    placeholder="Please tell us why you are dissatisfied with our service."
                    className={`w-full bg-[#0f172a] border rounded-lg p-3 text-xs text-white focus:outline-none transition ${
                      isDissatisfactionTriggered
                        ? 'border-amber-500/70 focus:border-amber-400 ring-1 ring-amber-500/30'
                        : 'border-[#334155] focus:border-emerald-500'
                    }`}
                  />
                  {isDissatisfactionTriggered && (
                    <p className="text-[11px] text-amber-400 mt-1">
                      ⚠️ Because an average or unsatisfactory rating was provided, please specify your reason so our quality desk can follow up.
                    </p>
                  )}
                </div>

                {/* FIELD 13 */}
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                    Overall experience <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formData.overallExperience}
                    onChange={(e) => setFormData({ ...formData, overallExperience: e.target.value })}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition font-bold"
                  >
                    {EXPERIENCE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className="space-y-5">
                {/* FIELD 2 */}
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                    Are you get resolution on time <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formData.resolutionOnTime}
                    onChange={(e) => setFormData({ ...formData, resolutionOnTime: e.target.value })}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
                  >
                    {YES_NO_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* FIELD 4 */}
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                    Engineer - Attitude/Behavior/Attentiveness/Grooming <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formData.engineerAttitudeRating}
                    onChange={(e) => setFormData({ ...formData, engineerAttitudeRating: e.target.value })}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
                  >
                    {EXPERIENCE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* FIELD 6 */}
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                    Is he Complete work as per your Satisfaction <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formData.workSatisfaction}
                    onChange={(e) => setFormData({ ...formData, workSatisfaction: e.target.value })}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
                  >
                    {EXPERIENCE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* FIELD 8 */}
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                    Is he Demonstrate you properly about Product <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formData.productDemonstration}
                    onChange={(e) => setFormData({ ...formData, productDemonstration: e.target.value })}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
                  >
                    {YES_NO_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* FIELD 10: Receipt (Conditional on Amount Collected) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                    Is he given you Receipt of Collected Amount{' '}
                    {formData.amountCollected === 'Yes' ? (
                      <span className="text-rose-400">*</span>
                    ) : (
                      <span className="text-slate-400 font-normal">(Not Applicable)</span>
                    )}
                  </label>
                  {formData.amountCollected === 'Yes' ? (
                    <select
                      value={formData.receiptProvided}
                      onChange={(e) => setFormData({ ...formData, receiptProvided: e.target.value as any })}
                      className="w-full bg-[#0f172a] border border-emerald-500/50 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
                    >
                      {YES_NO_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      disabled
                      value="Not Applicable (No amount collected)"
                      className="w-full bg-[#0f172a]/60 border border-slate-700/60 rounded-lg px-3 py-2 text-xs text-slate-400 cursor-not-allowed font-sans"
                    />
                  )}
                </div>

                {/* FIELD 12 */}
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                    Call Centre Interaction experience <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formData.callCentreExperience}
                    onChange={(e) => setFormData({ ...formData, callCentreExperience: e.target.value })}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
                  >
                    {EXPERIENCE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS (Save and Abort) */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-6 border-t border-[#334155]">
              <button
                type="button"
                onClick={handleAbort}
                className="w-full sm:w-auto px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition border border-slate-700 cursor-pointer text-center"
              >
                Abort
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-8 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-emerald-900/30 cursor-pointer disabled:opacity-50 text-center flex items-center justify-center space-x-2"
              >
                {submitting ? (
                  <>
                    <span className="animate-spin text-sm">⏳</span>
                    <span>Submitting Feedback...</span>
                  </>
                ) : (
                  <span>Save Feedback</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

