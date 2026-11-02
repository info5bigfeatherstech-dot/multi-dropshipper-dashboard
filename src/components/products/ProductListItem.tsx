import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, PlusCircle, MessageCircle, FileDown, Loader2 } from 'lucide-react';
import type { Product } from '../../types/dropshipper';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatCurrency } from '../../lib/utils';
import { downloadProductPDF } from '../../utils/exportUtils';
import { shareProductToWhatsApp } from '../../utils/whatsappShare';
import { useAppDispatch } from '../../store/hooks';
import { setSelectedProductForModal, setSelectedProductForCreate } from '../../store/slices/productsSlice';
import { addToast } from '../../store/slices/uiSlice';

interface ProductListItemProps {
  product: Product;
}

export const ProductListItem: React.FC<ProductListItemProps> = ({ product }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [isSharing, setIsSharing] = useState(false);

  const marginInr = product.suggestedRetailPrice - product.dropshipPrice;

  const handleCreateOrder = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(setSelectedProductForCreate(product));
    navigate('/orders/create', { state: { preselectedProduct: product } });
  };

  const handleShareWhatsApp = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSharing) return;
    setIsSharing(true);
    try {
      await shareProductToWhatsApp(product, {
        onToast: (toast) => dispatch(addToast(toast))
      });
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div
      onClick={() => navigate(`/products/${product.id || product.slug || product.sku}`)}
      className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs hover:shadow-card-hover transition-all duration-150 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer"
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-100 overflow-hidden shrink-0">
          <img
            src={product.thumbnail || product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge status={product.stockStatus} size="sm" />
            <span className="text-xs text-slate-400 font-mono">{product.sku}</span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-semibold text-slate-600">{product.category}</span>
          </div>
          <h3 className="text-sm sm:text-base font-semibold text-slate-900 group-hover:text-brand-600 transition-colors truncate">
            {product.name}
          </h3>
          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5 max-w-xl">
            {product.description}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto shrink-0 border-t md:border-t-0 pt-3 md:pt-0">
        <div className="text-left md:text-right">
          <div className="text-xs text-slate-400 font-medium">Wholesale Price</div>
          <div className="text-base sm:text-lg font-bold text-slate-900">
            {formatCurrency(product.dropshipPrice)}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold">
            Profit: +{formatCurrency(marginInr)}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShareWhatsApp}
            disabled={isSharing}
            className="p-2 rounded-xl text-emerald-600 hover:bg-emerald-50 transition-colors border border-emerald-200"
            title="Share Image & Specs to WhatsApp"
          >
            {isSharing ? <Loader2 className="w-4 h-4 animate-spin text-emerald-600" /> : <MessageCircle className="w-4 h-4" />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              downloadProductPDF(product);
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-brand-600 hover:bg-slate-100 transition-colors"
            title="Download PDF Dossier"
          >
            <FileDown className="w-4 h-4" />
          </button>

          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/products/${product.id || product.slug || product.sku}`);
            }}
            leftIcon={<Eye className="w-3.5 h-3.5" />}
          >
            Inspect
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleCreateOrder}
            leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
          >
            Create Order
          </Button>
        </div>
      </div>
    </div>
  );
};

