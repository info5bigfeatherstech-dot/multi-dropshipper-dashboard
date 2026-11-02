import React, { useState } from 'react';
import { serviceabilityService } from '../../services/serviceabilityService';
import type { ServiceabilityCheckResponse } from '../../types/dropshipper';
import { formatCurrency } from '../../lib/utils';
import { Truck, CheckCircle2, XCircle, Search, Clock, Calendar } from 'lucide-react';

export interface AddressServiceabilityCheckerProps {
  initialPincode?: string;
  onSelectCourier?: (courier: any) => void;
  standalone?: boolean;
}

export const AddressServiceabilityChecker: React.FC<AddressServiceabilityCheckerProps> = ({
  initialPincode = '',
  standalone = true,
}) => {
  const [customerPin, setCustomerPin] = useState(initialPincode);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ServiceabilityCheckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customerPin || customerPin.trim().length !== 6) {
      setError('Please enter a valid 6-digit Indian PIN code');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // POST http://localhost:5174/api/dropshipper/serviceability/check
      const data = await serviceabilityService.checkServiceability({
        customerPincode: customerPin.trim(),
        warehousePincode: '421004',
        weightKg: 0.5,
        lengthCm: 10,
        widthCm: 10,
        heightCm: 5,
        paymentMode: 'both',
        orderAmount: 999
      });
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Serviceability check failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`space-y-5 ${standalone ? 'p-6 bg-white rounded-2xl border border-slate-200/90 shadow-xs' : ''}`}>
      {standalone && (
        <div className="border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 text-brand-600 font-semibold text-xs uppercase tracking-wider mb-1">
            <Truck className="w-4 h-4" />
            Domestic Logistics Intelligence
          </div>
          <h2 className="text-xl font-bold text-slate-900">Check Pincode Serviceability & Courier Rates</h2>
          <p className="text-xs text-slate-500 mt-1 capitalize">
            Real-time courier deliverability, ETA & lowest freight rates from warehouse to destination pincode.
          </p>
        </div>
      )}

      {/* Input Form matching implementation */}
      <form onSubmit={handleCheck} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            maxLength={6}
            placeholder="Enter 6-digit Customer Pincode (e.g. 110043)"
            value={customerPin}
            onChange={(e) => setCustomerPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all font-mono"
          />
        </div>

        <button
          type="submit"
          disabled={loading || customerPin.length !== 6}
          className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-semibold text-xs transition-all shadow-xs disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 shrink-0"
        >
          {loading ? (
            <span>Checking…</span>
          ) : (
            <>
              <Search className="w-3.5 h-3.5" />
              <span>Check Coverage</span>
            </>
          )}
        </button>
      </form>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <XCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className="mt-4 p-5 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {result.isDeliverable ? (
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
              ) : (
                <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <XCircle className="w-4 h-4 text-rose-600" />
                </div>
              )}
              <span className={result.isDeliverable ? 'text-emerald-700 font-bold text-sm' : 'text-rose-700 font-bold text-sm'}>
                {result.isDeliverable ? `✓ Delivery Available to ${result.customerPincode}` : `✗ Delivery Not Available to ${result.customerPincode}`}
              </span>
            </div>

            <span className="text-xs text-slate-500 font-medium">
              TAT: <strong className="text-slate-800">{result.estimatedDays} Days</strong>
            </span>
          </div>

          {result.isDeliverable && result.quotes && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
                <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">
                  Prepaid Delivery
                </span>
                <span className="text-xl font-extrabold text-slate-900 block">
                  {formatCurrency(result.quotes.prepaid?.deliveryCharges ?? result.deliveryCharges)}
                </span>
                <p className="text-[11px] text-slate-500">
                  {result.quotes.prepaid?.courierName || 'Surface Express'}
                </p>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
                <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">
                  COD Total (Freight + Fee)
                </span>
                <span className="text-xl font-extrabold text-slate-900 block">
                  {formatCurrency(result.quotes.cod?.deliveryCharges ?? result.deliveryCharges + 15)}
                </span>
                <p className="text-[11px] text-slate-500">
                  {result.quotes.cod?.courierName || 'Express COD Carrier'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default AddressServiceabilityChecker;
