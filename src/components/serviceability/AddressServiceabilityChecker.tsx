import React, { useState } from 'react';
import { Truck, CheckCircle2, XCircle, Search, Clock, ShieldCheck, ArrowRight, DollarSign } from 'lucide-react';
import { serviceabilityService } from '../../services/serviceabilityService';
import type { ServiceabilityCheckResponse } from '../../types/dropshipper';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { formatCurrency } from '../../lib/utils';

interface AddressServiceabilityCheckerProps {
  initialPincode?: string;
  onSelectCourier?: (courier: any) => void;
  standalone?: boolean;
}

export const AddressServiceabilityChecker: React.FC<AddressServiceabilityCheckerProps> = ({
  initialPincode = '',
  onSelectCourier,
  standalone = false,
}) => {
  const [pincode, setPincode] = useState(initialPincode);
  const [warehousePincode, setWarehousePincode] = useState('421004');
  const [weightKg, setWeightKg] = useState('0.5');
  const [orderAmount, setOrderAmount] = useState('999');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ServiceabilityCheckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pincode || pincode.trim().length !== 6) {
      setError('Please enter a valid 6-digit Indian PIN code');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await serviceabilityService.checkServiceability({
        customerPincode: pincode.trim(),
        warehousePincode: warehousePincode.trim(),
        weightKg: parseFloat(weightKg) || 0.5,
        orderAmount: parseFloat(orderAmount) || 999,
        paymentMode: 'both'
      });
      setResult(res);
      if (!res.isDeliverable && res.message) {
        setError(res.message);
      }
    } catch (err: any) {
      setError(err.message || 'Serviceability check failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`space-y-6 ${standalone ? 'rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs' : ''}`}>
      {standalone && (
        <div className="border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 text-brand-600 font-semibold text-xs uppercase tracking-wider mb-1">
            <Truck className="w-4 h-4" />
            Domestic Logistics Intelligence
          </div>
          <h2 className="text-xl font-bold text-slate-900">Check Pincode Serviceability & Courier Rates</h2>
          <p className="text-xs text-slate-500 mt-1">
            Simulate real-time air and surface logistics feasibility from warehouse hub to destination pin.
          </p>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleCheck} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
        <div>
          <Input
            label="Customer Pincode"
            placeholder="e.g. 110001 or 400053"
            value={pincode}
            maxLength={6}
            onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
            required
            error={error || undefined}
          />
        </div>

        <div>
          <Input
            label="Origin Warehouse Pin"
            placeholder="e.g. 421004"
            value={warehousePincode}
            maxLength={6}
            onChange={(e) => setWarehousePincode(e.target.value.replace(/\D/g, ''))}
          />
        </div>

        <div>
          <Input
            label="Shipment Weight (Kg)"
            type="number"
            step="0.1"
            min="0.1"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
          />
        </div>

        <div>
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            isLoading={loading}
            leftIcon={<Search className="w-4 h-4" />}
          >
            Check Route
          </Button>
        </div>
      </form>

      {/* Results Display */}
      {result && result.isDeliverable && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/60 text-emerald-900 text-xs font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Serviceable Route!</strong> Pin code <strong>{result.customerPincode}</strong> is eligible for express dispatch.
              </span>
            </div>
            <span className="hidden sm:inline-block font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
              Standard SLA: {result.estimatedDays}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Prepaid Courier Card */}
            {result.quotes.prepaid && (
              <div className="rounded-2xl border-2 border-brand-200/80 bg-gradient-to-br from-white to-brand-50/20 p-5 shadow-xs relative">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2.5 py-1 rounded-md">
                    Prepaid Dispatch
                  </span>
                  <span className="text-lg font-bold text-slate-900">
                    {formatCurrency(result.quotes.prepaid.deliveryCharges)}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Carrier Partner:</span>
                    <span className="font-semibold text-slate-800">{result.quotes.prepaid.courierName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Base Freight:</span>
                    <span className="font-medium text-slate-800">{formatCurrency(result.quotes.prepaid.freightInr)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">COD Collection Fee:</span>
                    <span className="font-medium text-emerald-600">₹0 (Waived)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Transit TAT:</span>
                    <span className="font-semibold text-slate-800">{result.quotes.prepaid.estimatedDays}</span>
                  </div>
                </div>

                {onSelectCourier && (
                  <Button
                    variant="soft"
                    size="sm"
                    className="w-full mt-4"
                    onClick={() => onSelectCourier(result.quotes.prepaid)}
                  >
                    Select Prepaid Route
                  </Button>
                )}
              </div>
            )}

            {/* COD Courier Card */}
            {result.quotes.cod && (
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs relative">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md">
                    Cash On Delivery (COD)
                  </span>
                  <span className="text-lg font-bold text-slate-900">
                    {formatCurrency(result.quotes.cod.deliveryCharges)}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Carrier Partner:</span>
                    <span className="font-semibold text-slate-800">{result.quotes.cod.courierName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Base Freight:</span>
                    <span className="font-medium text-slate-800">{formatCurrency(result.quotes.cod.freightInr)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">COD Surcharge:</span>
                    <span className="font-medium text-amber-700">+{formatCurrency(result.quotes.cod.codFeeInr)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Transit TAT:</span>
                    <span className="font-semibold text-slate-800">{result.quotes.cod.estimatedDays}</span>
                  </div>
                </div>

                {onSelectCourier && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-4"
                    onClick={() => onSelectCourier(result.quotes.cod)}
                  >
                    Select COD Route
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {result && !result.isDeliverable && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200/70 text-rose-800 text-xs flex items-center gap-3">
          <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <div>
            <h5 className="font-bold text-rose-900">Unserviceable Pincode</h5>
            <p className="mt-0.5">The postal code entered ({result.customerPincode}) is currently outside courier express dispatch zones.</p>
          </div>
        </div>
      )}
    </div>
  );
};

