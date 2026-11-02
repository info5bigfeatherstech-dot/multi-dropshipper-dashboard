import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Truck, X } from 'lucide-react';
import { ShippingRatesCard } from './ShippingRatesCard';

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
  defaultCustomerPincode = '110045',
  defaultWeightKg = 0.5,
}) => {
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
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body with exact ShippingRatesCard */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/30">
          <ShippingRatesCard
            initialPincode={defaultCustomerPincode}
            weightKg={defaultWeightKg}
          />
        </div>
      </div>
    </div>,
    document.body
  );
};
