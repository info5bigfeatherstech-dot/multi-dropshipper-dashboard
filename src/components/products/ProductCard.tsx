import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Eye,
  PlusCircle,
  ArrowUpRight,
  MoreVertical,
  Download,
  Images,
  Layers,
  FileText,
  MessageCircle,
  Loader2
} from 'lucide-react';
import type { Product } from '../../types/dropshipper';
import { Button } from '../ui/Button';
import { formatCurrency } from '../../lib/utils';
import {
  downloadProductImage,
  downloadAllProductImages,
  downloadProductPDF
} from '../../utils/exportUtils';
import { shareProductToWhatsApp } from '../../utils/whatsappShare';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '../ui/dropdown-menu';
import { ProductImageDownloadModal } from './ProductImageDownloadModal';
import { useAppDispatch } from '../../store/hooks';
import { setSelectedProductForModal, setSelectedProductForCreate } from '../../store/slices/productsSlice';
import { addToast } from '../../store/slices/uiSlice';

interface ProductCardProps {
  product: Product;
}

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80';

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isSharingWhatsApp, setIsSharingWhatsApp] = useState(false);

  const dropshipPrice = Number(product.dropshipPrice || 0);
  const suggestedRetailPrice = Number(
    product.suggestedRetailPrice || (dropshipPrice > 0 ? Math.round(dropshipPrice * 1.5) : 0)
  );

  const marginInr = suggestedRetailPrice - dropshipPrice;
  const marginPercent = suggestedRetailPrice > 0 ? Math.round((marginInr / suggestedRetailPrice) * 100) : 0;

  const categoryLabel = product.category || 'General';
  const thumbnail = product.thumbnail || product.images?.[0] || DEFAULT_IMAGE;

  // Extract all unique images
  const allImages = Array.from(
    new Set([thumbnail, ...(Array.isArray(product.images) ? product.images : [])].filter(Boolean))
  );

  const handleDetails = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigate(`/products/${product.id || product.slug || product.sku}`);
  };

  const handleCreateOrder = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    dispatch(setSelectedProductForCreate(product));
    navigate('/orders/create', { state: { preselectedProduct: product } });
  };

  const handleShareWhatsApp = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isSharingWhatsApp) return;

    setIsSharingWhatsApp(true);
    dispatch(addToast({
      type: 'info',
      title: 'Preparing WhatsApp Share',
      message: 'Fetching photo and formatting product details...'
    }));

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

  const handleDownloadPDF = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      dispatch(addToast({
        type: 'info',
        title: 'Generating PDF',
        message: `Creating ${product.sku} product sheet with specs & image...`
      }));
      downloadProductPDF(product);
      dispatch(addToast({
        type: 'success',
        title: 'PDF Dossier Ready',
        message: 'Product PDF (with wholesale cost hidden) saved to downloads.'
      }));
    } catch {
      dispatch(addToast({
        type: 'error',
        title: 'PDF Generation Error',
        message: 'Could not generate product PDF.'
      }));
    }
  };

  const handleDownloadMainImage = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      dispatch(addToast({
        type: 'info',
        title: 'Downloading Image',
        message: `Saving ${product.sku} primary photo...`
      }));
      await downloadProductImage(thumbnail, `${product.sku}_main.jpg`);
      dispatch(addToast({
        type: 'success',
        title: 'Image Downloaded',
        message: 'Product image saved to your downloads.'
      }));
    } catch {
      dispatch(addToast({
        type: 'error',
        title: 'Download Failed',
        message: 'Could not download product image.'
      }));
    }
  };

  const handleDownloadAllImages = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      dispatch(addToast({
        type: 'info',
        title: 'Downloading Gallery',
        message: `Starting download of ${allImages.length} images...`
      }));
      const count = await downloadAllProductImages(product);
      dispatch(addToast({
        type: 'success',
        title: 'Gallery Saved',
        message: `Downloaded ${count} images for ${product.sku}.`
      }));
    } catch {
      dispatch(addToast({
        type: 'error',
        title: 'Download Failed',
        message: 'Could not complete gallery download.'
      }));
    }
  };

  // Stock status badge label
  let stockLabel = 'In Stock';
  let stockVariant: 'emerald' | 'amber' | 'rose' = 'emerald';
  if (product.stockStatus === 'out_of_stock' || product.stock === 0) {
    stockLabel = 'Out of Stock';
    stockVariant = 'rose';
  } else if (product.stockStatus === 'low_stock' || (product.stock && product.stock <= 5)) {
    stockLabel = `Low Stock (${product.stock})`;
    stockVariant = 'amber';
  } else if (product.stock) {
    stockLabel = `In Stock (${product.stock})`;
  }

  return (
    <>
      <div
        onClick={handleDetails}
        className="group rounded-2xl border border-slate-200/80 bg-white shadow-xs hover:shadow-card-hover transition-all duration-200 overflow-hidden flex flex-col justify-between cursor-pointer"
      >
        <div>
          {/* Image Container */}
          <div className="relative aspect-[16/11] w-full bg-slate-100 overflow-hidden">
            <img
              src={thumbnail}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).src = DEFAULT_IMAGE;
              }}
            />

            {/* Top Left: In Stock Badge */}
            <div className="absolute top-2.5 left-2.5 z-10">
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold shadow-xs backdrop-blur-xs border ${
                  stockVariant === 'emerald'
                    ? 'bg-emerald-50/95 text-emerald-700 border-emerald-200/80'
                    : stockVariant === 'amber'
                    ? 'bg-amber-50/95 text-amber-700 border-amber-200/80'
                    : 'bg-rose-50/95 text-rose-700 border-rose-200/80'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    stockVariant === 'emerald'
                      ? 'bg-emerald-500'
                      : stockVariant === 'amber'
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                />
                {stockLabel}
              </span>
            </div>

            {/* Top Right: Three Dots Action Menu */}
            <div
              className="absolute top-2.5 right-2.5 z-20"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white/95 hover:bg-white text-slate-700 hover:text-brand-600 shadow-md backdrop-blur-md flex items-center justify-center transition-all border border-slate-200/60 cursor-pointer"
                    title="Product actions"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 sm:w-72 p-1.5 z-50 shadow-2xl bg-white rounded-2xl border border-slate-100">
                  {/* Download One Image */}
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDownloadMainImage(e);
                    }}
                    className="flex items-center gap-3 p-2 cursor-pointer rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Download className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs text-slate-900">Download One Image</p>
                      <p className="text-[10px] text-slate-400 font-medium">Save primary main photo</p>
                    </div>
                  </DropdownMenuItem>

                  {/* Download Selected Images */}
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsImageModalOpen(true);
                    }}
                    className="flex items-center gap-3 p-2 cursor-pointer rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <Images className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs text-slate-900">Download Selected Images</p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        Select & pick specific photos ({allImages.length})
                      </p>
                    </div>
                  </DropdownMenuItem>

                  {/* Download All Images */}
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDownloadAllImages(e);
                    }}
                    className="flex items-center gap-3 p-2 cursor-pointer rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs text-slate-900">Download All Images</p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        Save all {allImages.length} gallery photos
                      </p>
                    </div>
                  </DropdownMenuItem>

                  {/* Divider */}
                  <div className="h-px bg-slate-100 my-1 mx-1" />

                  {/* Download Product PDF */}
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDownloadPDF(e);
                    }}
                    className="flex items-center gap-3 p-2 cursor-pointer rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs text-slate-900">Download Product PDF</p>
                      <p className="text-[10px] text-slate-400 font-medium">Photo & specs sheet (no prices)</p>
                    </div>
                  </DropdownMenuItem>

                  {/* Divider */}
                  <div className="h-px bg-slate-100 my-1 mx-1" />

                  {/* Share to WhatsApp */}
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleShareWhatsApp(e);
                    }}
                    disabled={isSharingWhatsApp}
                    className="flex items-center gap-3 p-2 cursor-pointer rounded-xl hover:bg-emerald-50/50 transition-colors text-emerald-700"
                  >
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      {isSharingWhatsApp ? (
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                      ) : (
                        <MessageCircle className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                        <span>Share to WhatsApp</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                          Image + Specs
                        </span>
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">Send photo & customer description</p>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Card Details */}
          <div className="p-3.5 sm:p-4">
            {/* Category Tag & SKU */}
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100/80 truncate max-w-[150px]">
                {categoryLabel}
              </span>
              <span className="text-[11px] text-slate-400 font-mono shrink-0">
                {product.sku || 'SKU-INVENTORY'}
              </span>
            </div>

            {/* Product Title */}
            <h3
              onClick={handleDetails}
              className="text-sm sm:text-[15px] font-semibold text-slate-900 line-clamp-1 hover:text-brand-600 transition-colors"
              title={product.name}
            >
              {product.name}
            </h3>

            {/* Description Subtitle */}
            <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 mb-3 leading-relaxed">
              {product.description || 'Verified factory supplier catalog inventory.'}
            </p>

            {/* Grey Pricing Highlight Box */}
            <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 mb-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                    Dropship Price
                  </span>
                  <div className="text-lg font-extrabold text-brand-600">
                    {formatCurrency(dropshipPrice)}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[9px] uppercase text-slate-400">MSRP</span>
                  <div className="text-[11px] font-medium text-slate-400 line-through">
                    {formatCurrency(suggestedRetailPrice)}
                  </div>
                </div>
              </div>

              {/* Your Margin */}
              <div className="mt-2 pt-2 border-t border-slate-200/70 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 flex items-center gap-1 font-medium">
                  <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                  Your Margin
                </span>
                <span className="font-bold text-emerald-600">
                  +{formatCurrency(marginInr)} ({marginPercent}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3-Button Action Row */}
        <div className="px-3.5 pb-3.5 sm:px-4 sm:pb-4 pt-0 flex items-center gap-1.5">
          {/* Details Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDetails}
            leftIcon={<Eye className="w-3 h-3 text-slate-400" />}
            className="flex-1 h-8 px-2 text-[11px] font-semibold rounded-lg"
          >
            Details
          </Button>

          {/* Share Button (WhatsApp with Image & Text) */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleShareWhatsApp}
            disabled={isSharingWhatsApp}
            title="Share Product with Photo & Specs to WhatsApp"
            leftIcon={
              isSharingWhatsApp ? (
                <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />
              ) : (
                <MessageCircle className="w-3 h-3 text-emerald-600" />
              )
            }
            className="h-8 px-2.5 text-[11px] font-semibold text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 rounded-lg shrink-0 transition-colors"
          >
            Share
          </Button>

          {/* Order Button */}
          <Button
            variant="primary"
            size="sm"
            onClick={handleCreateOrder}
            disabled={product.stockStatus === 'out_of_stock'}
            leftIcon={<PlusCircle className="w-3 h-3" />}
            className="flex-1 h-8 px-2.5 text-[11px] font-semibold rounded-lg"
          >
            Order
          </Button>
        </div>
      </div>

      {/* Gallery & Custom Selection Modal */}
      <ProductImageDownloadModal
        product={product}
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
      />
    </>
  );
};
