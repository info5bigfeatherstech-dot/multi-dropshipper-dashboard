import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  PlusCircle,
  FileDown,
  MessageCircle,
  Download,
  Star,
  CheckCircle2,
  Truck,
  ShieldCheck,
  Clock,
  Layers,
  Sparkles,
  Images,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setSelectedProductForModal, setSelectedProductForCreate } from '../../store/slices/productsSlice';
import { addToast } from '../../store/slices/uiSlice';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatCurrency } from '../../lib/utils';
import { downloadProductPDF, downloadProductCSV, downloadProductImage } from '../../utils/exportUtils';
import { shareProductToWhatsApp } from '../../utils/whatsappShare';
import { ProductImageDownloadModal } from './ProductImageDownloadModal';

export const ProductDetailModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const product = useAppSelector((state) => state.products.selectedProductForModal);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isSharingWhatsApp, setIsSharingWhatsApp] = useState(false);

  if (!product) return null;

  const handleClose = () => {
    dispatch(setSelectedProductForModal(null));
    setActiveImageIndex(0);
  };

  const handleCreateOrder = () => {
    dispatch(setSelectedProductForCreate(product));
    handleClose();
    navigate('/orders/create', { state: { preselectedProduct: product } });
  };

  const handleShareWhatsApp = async () => {
    if (isSharingWhatsApp) return;
    setIsSharingWhatsApp(true);
    try {
      await shareProductToWhatsApp(product, {
        onToast: (toast) => dispatch(addToast(toast))
      });
    } catch (err: any) {
      dispatch(addToast({
        type: 'error',
        title: 'Share Failed',
        message: err?.message || 'Could not initiate WhatsApp share.'
      }));
    } finally {
      setIsSharingWhatsApp(false);
    }
  };

  const marginInr = product.suggestedRetailPrice - product.dropshipPrice;
  const marginPercent = Math.round((marginInr / product.suggestedRetailPrice) * 100);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        />

        {/* Slide-over Drawer */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className="relative w-full max-w-2xl bg-white shadow-2xl flex flex-col h-full z-10 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white sticky top-0 z-20">
            <div className="flex items-center gap-2">
              <Badge status={product.stockStatus} />
              <span className="text-xs font-mono text-slate-400">{product.sku}</span>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Gallery Section */}
            <div className="space-y-3">
              <div className="relative aspect-video w-full rounded-2xl bg-slate-100 overflow-hidden border border-slate-200/80">
                <img
                  src={product.images[activeImageIndex] || product.thumbnail}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => downloadProductImage(product.images[activeImageIndex] || product.thumbnail, `${product.sku}-photo.jpg`)}
                  className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-medium backdrop-blur-xs shadow-md transition-all"
                  title="Download Raw High-Res Photo"
                >
                  <Download className="w-3.5 h-3.5" />
                  Save Photo
                </button>
              </div>

              {/* Thumbnails list */}
              {product.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {product.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImageIndex(i)}
                      className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                        activeImageIndex === i ? 'border-brand-600 ring-2 ring-brand-500/20' : 'border-slate-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="Thumb" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Title & Category */}
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1">
                <span>{product.category}</span>
                <span>•</span>
                <div className="flex items-center text-amber-500">
                  <Star className="w-3.5 h-3.5 fill-amber-400 mr-1" />
                  {product.rating} ({product.reviewCount} reviews)
                </div>
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-snug">
                {product.name}
              </h2>
            </div>

            {/* Pricing Matrix Card */}
            <div className="rounded-2xl border border-brand-200/60 bg-gradient-to-br from-brand-50/50 to-indigo-50/20 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-brand-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-brand-600" />
                  B2B Wholesale Margin Breakdown
                </span>
                <span className="text-xs font-bold bg-emerald-600 text-white px-2.5 py-0.5 rounded-full">
                  +{marginPercent}% ROI
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-2 border-t border-brand-100">
                <div>
                  <span className="text-[11px] font-medium text-slate-500 block">Your Sourcing Cost</span>
                  <span className="text-lg font-bold text-slate-900">{formatCurrency(product.dropshipPrice)}</span>
                </div>
                <div>
                  <span className="text-[11px] font-medium text-slate-500 block">Suggested MSRP</span>
                  <span className="text-lg font-bold text-slate-700">{formatCurrency(product.suggestedRetailPrice)}</span>
                </div>
                <div>
                  <span className="text-[11px] font-medium text-emerald-700 block">Est. Profit Per Order</span>
                  <span className="text-lg font-bold text-emerald-600">+{formatCurrency(marginInr)}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</h4>
              <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                {product.description}
              </p>
            </div>

            {/* Features */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Key Highlights</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {product.features.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200/70">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Technical Specifications */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Fulfillment & Logistics Specs</h4>
              <div className="rounded-2xl border border-slate-200/80 overflow-hidden divide-y divide-slate-100 text-xs">
                <div className="flex justify-between p-3 bg-slate-50/50">
                  <span className="text-slate-500 flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-slate-400" /> Package Dimensions</span>
                  <span className="font-semibold text-slate-900">{product.specs.dimensions}</span>
                </div>
                <div className="flex justify-between p-3">
                  <span className="text-slate-500 flex items-center gap-1.5"><Truck className="w-3.5 h-3.5 text-slate-400" /> Dead Weight</span>
                  <span className="font-semibold text-slate-900">{product.specs.weight}</span>
                </div>
                <div className="flex justify-between p-3 bg-slate-50/50">
                  <span className="text-slate-500">Material Composition</span>
                  <span className="font-semibold text-slate-900">{product.specs.material}</span>
                </div>
                <div className="flex justify-between p-3">
                  <span className="text-slate-500 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-400" /> Warehouse SLA</span>
                  <span className="font-semibold text-slate-900">{product.specs.fulfillmentTime}</span>
                </div>
                <div className="flex justify-between p-3 bg-slate-50/50">
                  <span className="text-slate-500 flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-slate-400" /> Warranty</span>
                  <span className="font-semibold text-slate-900">{product.specs.warranty}</span>
                </div>
              </div>
            </div>

            {/* Export & Client Sharing Toolkit */}
            <div className="rounded-2xl border border-slate-200/80 p-4 bg-slate-50/60 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Seller Marketing & Client Export Toolkit
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                <button
                  onClick={handleShareWhatsApp}
                  disabled={isSharingWhatsApp}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-emerald-200 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 shadow-xs transition-colors"
                >
                  {isSharingWhatsApp ? (
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                  ) : (
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                  )}
                  WhatsApp (Image + Specs)
                </button>
                <button
                  onClick={() => setIsImageModalOpen(true)}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-slate-200/80 text-xs font-semibold text-slate-700 hover:text-brand-600 hover:border-brand-300 shadow-xs transition-colors"
                >
                  <Images className="w-4 h-4 text-brand-600" />
                  Download Photos
                </button>
                <button
                  onClick={() => downloadProductPDF(product)}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-slate-200/80 text-xs font-semibold text-slate-700 hover:text-brand-600 hover:border-brand-300 shadow-xs transition-colors"
                >
                  <FileDown className="w-4 h-4 text-indigo-600" />
                  Client PDF (No Cost)
                </button>
                <button
                  onClick={() => downloadProductCSV(product)}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-slate-200/80 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:border-slate-400 shadow-xs transition-colors"
                >
                  <Download className="w-4 h-4 text-slate-500" />
                  Catalog CSV
                </button>
              </div>
            </div>
          </div>

          {/* Footer Action */}
          <div className="p-4 sm:p-5 border-t border-slate-100 bg-white sticky bottom-0 z-20 flex items-center justify-between gap-4">
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">B2B Dropship Price</span>
              <span className="text-xl font-bold text-slate-900">{formatCurrency(product.dropshipPrice)}</span>
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={handleCreateOrder}
              leftIcon={<PlusCircle className="w-4 h-4" />}
              className="flex-1 max-w-xs shadow-md"
            >
              Create Order with Product
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Image Gallery & Selective Download/Share Modal */}
      <ProductImageDownloadModal
        product={product}
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
      />
    </AnimatePresence>
  );
};

