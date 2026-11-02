import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type {
  ServiceabilityCheckResponse
} from '../../types/dropshipper';
import { serviceabilityService } from '../../services/serviceabilityService';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import {
  Truck,
  X,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCw,
  CreditCard,
  Banknote,
  Loader2
} from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

interface ServiceabilityCheckerModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCustomerPincode?: string;
  defaultWeightKg?: number;
  defaultOrderAmount?: number;
}

export const ServiceabilityCheckerModal: React.FC<ServiceabilityCheckerModalProps> = ({
  isOpen,
  onClose,
  defaultCustomerPincode = '110001',
  defaultWeightKg = 0.5,
  defaultOrderAmount = 999
}) => {
  const [customerPin, setCustomerPin] = useState(defaultCustomerPincode);
  const [warehousePin, setWarehousePin] = useState('421004');
  const [weightKg, setWeightKg] = useState(defaultWeightKg);
  const [lengthCm, setLengthCm] = useState(10);
  const [widthCm, setWidthCm] = useState(10);
  const [heightCm, setHeightCm] = useState(5);
  const [orderAmount, setOrderAmount] = useState(defaultOrderAmount);
  const [storefront, setStorefront] = useState<'ecomm' | 'wholesale'>('ecomm');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<ServiceabilityCheckResponse | null>(null);
  const [selectedQuoteMode, setSelectedQuoteMode] = useState<'prepaid' | 'cod'>('prepaid');

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleRunCheck = async () => {
    if (!/^\d{6}$/.test(customerPin.trim())) {
      setErrorMsg('Customer pincode must be exactly 6 digits.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const resp = await serviceabilityService.checkServiceability({
        customerPincode: customerPin.trim(),
        warehousePincode: warehousePin.trim(),
        weightKg,
        lengthCm,
        widthCm,
        heightCm,
        paymentMode: 'both',
        orderAmount,
        storefront
      });

      setResult(resp);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to check serviceability.');
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-md">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Dropshipper Route Serviceability
              </h3>
              <p className="text-xs text-slate-400">
                Check warehouse to customer courier deliverability, ETA SLA, and shipping rates
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Form Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Customer Pincode */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Customer Delivery Pincode *
              </label>
              <Input
                type="text"
                maxLength={6}
                placeholder="e.g. 110001"
                value={customerPin}
                onChange={(e) => setCustomerPin(e.target.value.replace(/[^\d]/g, '').slice(0, 6))}
                className="font-mono font-bold tracking-wider"
              />
              <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[10px]">
                <span className="text-slate-400">Try:</span>
                {[
                  { pin: '110001', label: 'Delhi' },
                  { pin: '400001', label: 'Mumbai' },
                  { pin: '560001', label: 'Bangalore' },
                  { pin: '700001', label: 'Kolkata' }
                ].map((item) => (
                  <button
                    key={item.pin}
                    type="button"
                    onClick={() => setCustomerPin(item.pin)}
                    className="font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 hover:bg-brand-50 hover:text-brand-600 transition-colors"
                  >
                    {item.pin} ({item.label})
                  </button>
                ))}
              </div>
            </div>

            {/* Warehouse Pincode */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Warehouse Pickup Pincode *
              </label>
              <Input
                type="text"
                maxLength={6}
                value={warehousePin}
                onChange={(e) => setWarehousePin(e.target.value.replace(/[^\d]/g, '').slice(0, 6))}
                placeholder="e.g. 421004"
                className="font-mono text-xs"
              />
            </div>

            {/* Weight (Kg) */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Package Weight (Kg)
              </label>
              <Input
                type="number"
                step="0.05"
                min="0.05"
                value={weightKg}
                onChange={(e) => setWeightKg(Math.max(0.05, parseFloat(e.target.value) || 0.5))}
                className="font-mono"
              />
            </div>

            {/* Declared Order Amount (₹) */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Order Value (₹) — for COD fees
              </label>
              <Input
                type="number"
                min="0"
                value={orderAmount}
                onChange={(e) => setOrderAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="font-mono"
              />
            </div>

            {/* Dimensions */}
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Package Dimensions (L × W × H in cm)
              </label>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  type="number"
                  placeholder="Length"
                  min="1"
                  value={lengthCm}
                  onChange={(e) => setLengthCm(Math.max(1, parseInt(e.target.value, 10) || 10))}
                  className="font-mono text-xs"
                />
                <Input
                  type="number"
                  placeholder="Width"
                  min="1"
                  value={widthCm}
                  onChange={(e) => setWidthCm(Math.max(1, parseInt(e.target.value, 10) || 10))}
                  className="font-mono text-xs"
                />
                <Input
                  type="number"
                  placeholder="Height"
                  min="1"
                  value={heightCm}
                  onChange={(e) => setHeightCm(Math.max(1, parseInt(e.target.value, 10) || 5))}
                  className="font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Button */}
          <Button
            onClick={handleRunCheck}
            disabled={isLoading || customerPin.trim().length !== 6}
            className="w-full h-11 gap-2 font-bold shadow-md"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Checking Courier Network...</span>
              </>
            ) : (
              <>
                <RotateCw className="w-4 h-4" />
                <span>Check Serviceability & Freight Rates</span>
              </>
            )}
          </Button>

          {/* Result Card */}
          {result && (
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {result.isDeliverable ? (
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                      <XCircle className="w-5 h-5 text-rose-600" />
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      {result.isDeliverable ? 'Deliverable Route Verified' : 'Route Undeliverable'}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {result.warehousePincode} ➔ {result.customerPincode}
                    </p>
                  </div>
                </div>

                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    result.isDeliverable
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {result.isDeliverable ? 'Active Service' : 'Restricted'}
                </span>
              </div>

              {/* Quotes options */}
              {result.isDeliverable && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {/* Prepaid Quote */}
                  <div
                    onClick={() => setSelectedQuoteMode('prepaid')}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedQuoteMode === 'prepaid'
                        ? 'border-brand-600 bg-brand-50/40 ring-2 ring-brand-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-brand-600" />
                        Prepaid Delivery
                      </span>
                      <span className="text-xs font-extrabold text-brand-700">
                        {formatCurrency(result.quotes?.prepaid?.deliveryCharges || result.deliveryCharges || 60)}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      ETA: {result.quotes?.prepaid?.estimatedDays || result.estimatedDays || '2-3 Days'}
                    </div>
                  </div>

                  {/* COD Quote */}
                  <div
                    onClick={() => setSelectedQuoteMode('cod')}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedQuoteMode === 'cod'
                        ? 'border-brand-600 bg-brand-50/40 ring-2 ring-brand-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                        Cash on Delivery (COD)
                      </span>
                      <span className="text-xs font-extrabold text-slate-900">
                        {formatCurrency(result.quotes?.cod?.deliveryCharges || (result.deliveryCharges + 35))}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      ETA: {result.quotes?.cod?.estimatedDays || '3-4 Days'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Logistics Partner: Delhivery Surface Express</span>
          <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl">
            Close
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};

