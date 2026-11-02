import React from 'react';
import { useLocation } from 'react-router-dom';
import { Package } from 'lucide-react';
import type { Product } from '../../types/dropshipper';
import { useAppSelector } from '../../store/hooks';
import { CreateOrderForm } from '../../components/orders/CreateOrderForm';

export const CreateOrderPage: React.FC = () => {
  const location = useLocation();
  const preselected = (location.state as any)?.preselectedProduct as Product | undefined;
  const storePreselected = useAppSelector((state) => state.products.selectedProductForCreate);
  const initialProduct = preselected || storePreselected;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-brand-600 uppercase tracking-wider mb-1">
          <Package className="w-3.5 h-3.5" />
          Direct Dropship Order Terminal
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Create New Dropship Order
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5 capitalize">
          Select single or multiple products, enter customer shipping details, compute live express freight, and trigger direct factory dispatch.
        </p>
      </div>

      <CreateOrderForm initialProduct={initialProduct || undefined} />
    </div>
  );
};

export default CreateOrderPage;
