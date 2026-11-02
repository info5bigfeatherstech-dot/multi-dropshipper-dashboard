import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  Package,
  ShieldCheck,
  CheckCircle2,
  UploadCloud,
  FileCheck,
  CreditCard,
  Search,
  Sparkles,
  ArrowRight,
  Clock,
  AlertCircle
} from 'lucide-react';
import { dropshipperAuthService, type RegisterStartInput } from '../../services/dropshipperAuthService';
import type { SubscriptionSettings, RegistrationStatusResponse } from '../../types/dropshipper';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { loadRazorpayScript } from '../../utils/razorpay';
import { formatCurrency } from '../../lib/utils';
import { useAppDispatch } from '../../store/hooks';
import { addToast } from '../../store/slices/uiSlice';

export const RegisterPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // Active Tab: 'apply' or 'status'
  const [activeTab, setActiveTab] = useState<'apply' | 'status'>('apply');

  // Subscription info
  const [settings, setSettings] = useState<SubscriptionSettings | null>(null);

  // Form State
  const [form, setForm] = useState<RegisterStartInput>({
    fullName: '',
    email: '',
    phone: '',
    businessName: '',
    gstNumber: '',
    panNumber: '',
    address: '',
    city: '',
    state: '',
    postalCode: ''
  });

  const [idProofFile, setIdProofFile] = useState<File | null>(null);
  const [addressProofFile, setAddressProofFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [createdRequestId, setCreatedRequestId] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Status Lookup Tab State
  const [lookupRequestId, setLookupRequestId] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState<RegistrationStatusResponse | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  useEffect(() => {
    dropshipperAuthService.getSubscriptionSettings().then(setSettings);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.phone || !form.businessName) {
      dispatch(addToast({ type: 'warning', title: 'Missing Information', message: 'Please complete all required fields.' }));
      return;
    }

    setSubmitting(true);
    try {
      // Step 1: Pre-validate
      await dropshipperAuthService.startRegistration(form);

      // Step 2: Create Payment & upload files
      const paymentInit = await dropshipperAuthService.createRegistrationPayment(form, {
        idProof: idProofFile,
        businessAddressProof: addressProofFile
      });

      const { requestId, razorpay } = paymentInit;
      setCreatedRequestId(requestId);

      // Step 3: Open Razorpay Modal
      await loadRazorpayScript();

      if (!window.Razorpay) {
        throw new Error('Razorpay SDK failed to load. Please verify your connection.');
      }

      const options = {
        key: razorpay.keyId,
        amount: razorpay.amount,
        currency: razorpay.currency || 'INR',
        name: 'DropFlow Logistics Network',
        description: 'Annual Partner Verification & Sourcing Access',
        order_id: razorpay.orderId,
        prefill: {
          name: form.fullName,
          email: form.email,
          contact: form.phone
        },
        theme: {
          color: '#4F46E5'
        },
        handler: async (response: any) => {
          try {
            // Step 4: Verify signature
            const verifyRes = await dropshipperAuthService.verifyRegistrationPayment({
              requestId,
              razorpay_order_id: response.razorpay_order_id || razorpay.orderId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature || 'simulated_sig'
            });

            // Trigger confetti
            confetti({
              particleCount: 120,
              spread: 70,
              origin: { y: 0.6 }
            });

            setPaymentSuccess(true);
            dispatch(addToast({
              type: 'success',
              title: 'Application Submitted!',
              message: verifyRes.message || 'Payment received. Application queued for KYC approval.'
            }));
          } catch (err: any) {
            dispatch(addToast({ type: 'error', title: 'Payment Verification Error', message: err.message }));
          }
        },
        modal: {
          ondismiss: () => {
            dispatch(addToast({ type: 'info', title: 'Payment Window Closed', message: 'You can retry payment whenever ready.' }));
            setSubmitting(false);
          }
        }
      };

      const rzpInstance = new window.Razorpay(options);
      rzpInstance.open();
    } catch (err: any) {
      dispatch(addToast({ type: 'error', title: 'Registration Failed', message: err.message || 'Something went wrong.' }));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupRequestId.trim()) return;

    setLookupLoading(true);
    setLookupError(null);
    setLookupResult(null);

    try {
      const res = await dropshipperAuthService.getRegistrationStatus(lookupRequestId.trim());
      setLookupResult(res);
    } catch (err: any) {
      setLookupError(err.message || 'Could not find application with this ID');
    } finally {
      setLookupLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <div className="max-w-4xl w-full mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-500/30">
            <Package className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            DropFlow Dropshipper Onboarding
          </h1>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Get direct wholesale B2B pricing, automated courier dispatches, and Pan-India COD fulfillment.
          </p>

          {/* Tab Switcher */}
          <div className="flex justify-center pt-4">
            <div className="bg-slate-200/80 p-1 rounded-2xl flex gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('apply')}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'apply' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                1. New Application & Fee
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('status')}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'status' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                2. Check Application Status
              </button>
            </div>
          </div>
        </div>

        {/* Tab 1: Application Form */}
        {activeTab === 'apply' && (
          <div className="space-y-6">
            {/* Fee & Perks Card */}
            {settings && (
              <div className="rounded-3xl border border-brand-200/80 bg-gradient-to-br from-brand-50/70 via-white to-indigo-50/50 p-6 sm:p-8 shadow-xs">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-brand-100 pb-5">
                  <div>
                    <span className="text-xs font-bold text-brand-700 uppercase tracking-wider bg-brand-100/60 px-2.5 py-1 rounded-md">
                      Annual Partner Verification Pass
                    </span>
                    <h3 className="text-xl font-bold text-slate-900 mt-1">Direct Factory Wholesale Access</h3>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-2xl sm:text-3xl font-extrabold text-brand-600">
                      {formatCurrency(settings.feeAmount)}
                    </span>
                    <span className="text-xs text-slate-400 block font-medium">/ {settings.planDuration || 'Year'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-5">
                  {(settings.features || []).map((feat, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs font-medium text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Success Banner if payment done */}
            {paymentSuccess ? (
              <div className="rounded-3xl border border-emerald-200 bg-white p-8 text-center space-y-4 shadow-xl">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Application Submitted for KYC Approval!</h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto">
                  Payment has been confirmed. Your Application Request ID is:
                </p>
                <div className="inline-block bg-slate-100 border border-slate-200 px-4 py-2 rounded-xl font-mono font-bold text-brand-600 text-base">
                  {createdRequestId}
                </div>
                <p className="text-xs text-slate-400">
                  Save this Request ID to track status. Once approved by the DropFlow Admin team, you will receive an activation email with an OTP to set your password.
                </p>
                <div className="pt-4 flex justify-center gap-3">
                  <Button
                    variant="primary"
                    onClick={() => {
                      if (createdRequestId) setLookupRequestId(createdRequestId);
                      setActiveTab('status');
                    }}
                  >
                    Track Status
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/activate')}>
                    Go to Activation
                  </Button>
                </div>
              </div>
            ) : (
              /* Application Form */
              <form onSubmit={handleApplySubmit} className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xl space-y-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900">1. Applicant & Business Information</h3>
                  <p className="text-xs text-slate-500">Provide legal entity details for merchant KYC verification.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Full Name (As per PAN/Aadhaar)"
                    name="fullName"
                    placeholder="e.g. Rahul Sharma"
                    value={form.fullName}
                    onChange={handleChange}
                    required
                  />

                  <Input
                    label="Official Business / Store Name"
                    name="businessName"
                    placeholder="e.g. Apex E-Commerce Retail"
                    value={form.businessName}
                    onChange={handleChange}
                    required
                  />

                  <Input
                    label="Email Address"
                    type="email"
                    name="email"
                    placeholder="rahul@business.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />

                  <Input
                    label="Phone Number"
                    type="tel"
                    name="phone"
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChange={handleChange}
                    required
                  />

                  <Input
                    label="GSTIN (Optional)"
                    name="gstNumber"
                    placeholder="27AAAAA0000A1Z5"
                    value={form.gstNumber}
                    onChange={handleChange}
                  />

                  <Input
                    label="PAN Card Number"
                    name="panNumber"
                    placeholder="ABCDE1234F"
                    value={form.panNumber}
                    onChange={handleChange}
                  />
                </div>

                <div className="pt-2">
                  <h3 className="text-base font-bold text-slate-900">2. Registered Address</h3>
                  <p className="text-xs text-slate-500">Address used for tax invoices and merchant agreements.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-3">
                    <Input
                      label="Street Address"
                      name="address"
                      placeholder="Shop 4, Trade Center, MG Road"
                      value={form.address}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <Input
                    label="City"
                    name="city"
                    placeholder="Mumbai"
                    value={form.city}
                    onChange={handleChange}
                    required
                  />

                  <Input
                    label="State"
                    name="state"
                    placeholder="Maharashtra"
                    value={form.state}
                    onChange={handleChange}
                    required
                  />

                  <Input
                    label="Postal Code (PIN)"
                    name="postalCode"
                    placeholder="400001"
                    maxLength={6}
                    value={form.postalCode}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="pt-2">
                  <h3 className="text-base font-bold text-slate-900">3. Proof Documents (KYC Verification)</h3>
                  <p className="text-xs text-slate-500">Upload Government ID and Business proof (PDF, JPG, or PNG).</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* ID Proof */}
                  <div className="rounded-2xl border-2 border-dashed border-slate-200 p-4 text-center hover:border-brand-400 transition-colors">
                    <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <span className="text-xs font-semibold text-slate-700 block">ID Proof (Aadhaar / Voter / Passport)</span>
                    <span className="text-[11px] text-slate-400 block mb-3">
                      {idProofFile ? idProofFile.name : 'Max file size 5MB'}
                    </span>
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700 transition-colors">
                      <FileCheck className="w-3.5 h-3.5" />
                      Browse File
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={(e) => setIdProofFile(e.target.files?.[0] || null)}
                      />
                    </label>
                  </div>

                  {/* Address Proof */}
                  <div className="rounded-2xl border-2 border-dashed border-slate-200 p-4 text-center hover:border-brand-400 transition-colors">
                    <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <span className="text-xs font-semibold text-slate-700 block">Business Address Proof / Utility Bill</span>
                    <span className="text-[11px] text-slate-400 block mb-3">
                      {addressProofFile ? addressProofFile.name : 'Max file size 5MB'}
                    </span>
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700 transition-colors">
                      <FileCheck className="w-3.5 h-3.5" />
                      Browse File
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={(e) => setAddressProofFile(e.target.files?.[0] || null)}
                      />
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-slate-500">
                    Already registered and approved?{' '}
                    <Link to="/activate" className="font-semibold text-brand-600 hover:underline">
                      Activate Account →
                    </Link>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    isLoading={submitting}
                    leftIcon={<CreditCard className="w-4 h-4" />}
                    className="w-full sm:w-auto shadow-md"
                  >
                    Pay ₹{settings?.feeAmount || 800} & Submit Application
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Tab 2: Application Status Lookup */}
        {activeTab === 'status' && (
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xl space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Track KYC & Approval Status</h3>
              <p className="text-xs text-slate-500">
                Enter your Application Request ID received after fee payment to inspect verification status.
              </p>
            </div>

            <form onSubmit={handleCheckStatus} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Input
                  placeholder="e.g. REQ-9A82B7 or OWB-REQ-101"
                  value={lookupRequestId}
                  onChange={(e) => setLookupRequestId(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                isLoading={lookupLoading}
                leftIcon={<Search className="w-4 h-4" />}
              >
                Inspect Status
              </Button>
            </form>

            {lookupError && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{lookupError}</span>
              </div>
            )}

            {lookupResult && (
              <div className="rounded-2xl border border-slate-200/80 p-5 bg-slate-50/60 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 font-mono">REQUEST ID</span>
                    <h4 className="text-base font-bold text-slate-900">{lookupResult.requestId}</h4>
                  </div>
                  <div>
                    {lookupResult.status === 'approved' && (
                      <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> APPROVED
                      </span>
                    )}
                    {lookupResult.status === 'admin_approval' && (
                      <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                        <Clock className="w-4 h-4" /> UNDER ADMIN REVIEW
                      </span>
                    )}
                    {lookupResult.status === 'rejected' && (
                      <span className="bg-rose-100 text-rose-800 text-xs font-bold px-3 py-1 rounded-full">
                        REJECTED
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs text-slate-600 pt-2 border-t border-slate-200">
                  <div>
                    <span className="text-slate-400 block">Applicant:</span>
                    <span className="font-semibold text-slate-800">{lookupResult.applicantName || 'Partner'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Store Name:</span>
                    <span className="font-semibold text-slate-800">{lookupResult.businessName || 'Verified Store'}</span>
                  </div>
                </div>

                {lookupResult.status === 'approved' && (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
                    <span>
                      🎉 Congratulations! Your seller KYC has been approved. You can now activate your login credentials.
                    </span>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate('/activate')}
                      rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    >
                      Activate Now
                    </Button>
                  </div>
                )}

                {lookupResult.status === 'admin_approval' && (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                    Your payment and identity proofs are being verified by our compliance team. Review typically completes within 12-24 business hours.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="text-center text-xs text-slate-500">
          Already have an active Dropshipper terminal?{' '}
          <Link to="/login" className="font-bold text-brand-600 hover:text-brand-500">
            Sign In Here →
          </Link>
        </div>
      </div>
    </div>
  );
};

