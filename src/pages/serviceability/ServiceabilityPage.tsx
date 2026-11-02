import React from 'react';
import { Truck, ShieldCheck, MapPin, Clock, ArrowRight, Layers, HelpCircle } from 'lucide-react';
import { AddressServiceabilityChecker } from '../../components/serviceability/AddressServiceabilityChecker';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';

export const ServiceabilityPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-brand-600 uppercase tracking-wider mb-1">
          <Truck className="w-3.5 h-3.5" />
          Domestic Carrier Intelligence
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Pan-India Logistics & Pincode Serviceability
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Simulate courier freight rates, check COD eligibility, and inspect transit SLAs across 28,000+ Indian postal codes.
        </p>
      </div>

      {/* Main Checker Component */}
      <AddressServiceabilityChecker standalone={true} />

      {/* Informational Logistics Matrix Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-2">
          <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-1">
            <Clock className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Tier-1 Metro Transit SLAs</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Metros including Mumbai, Delhi NCR, Bengaluru, Hyderabad, and Chennai enjoy 24-48 hour air courier priority dispatches.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Pan-India COD Collection</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Verified cash on delivery network powered by Delhivery and BlueDart with automated remittance cycles and real-time OTP handovers.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-1">
            <Layers className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Volumetric Weight Slabs</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Shipments are rated per 500g dead weight slab. Compact packaging optimization minimizes dead space to reduce your freight overheads.
          </p>
        </div>
      </div>

      {/* Direct Order CTA Banner */}
      <div className="rounded-3xl border border-brand-200/80 bg-gradient-to-r from-brand-600 to-indigo-600 p-6 sm:p-8 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-lg sm:text-xl font-bold">Ready to dispatch customer inventory?</h3>
          <p className="text-xs sm:text-sm text-indigo-100 mt-1 max-w-xl">
            Book a direct single-unit or bulk shipment right now through our simplified seller terminal.
          </p>
        </div>
        <Button
          variant="secondary"
          size="md"
          className="bg-white text-brand-700 hover:bg-indigo-50 shrink-0 font-bold"
          onClick={() => navigate('/orders/create')}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Create Customer Order
        </Button>
      </div>
    </div>
  );
};

