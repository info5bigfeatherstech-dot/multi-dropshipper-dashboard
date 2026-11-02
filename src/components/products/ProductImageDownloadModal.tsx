import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Product } from '../../types/dropshipper';
import { useAppDispatch } from '../../store/hooks';
import { addToast } from '../../store/slices/uiSlice';
import { downloadProductImage } from '../../utils/exportUtils';
import { shareProductToWhatsApp } from '../../utils/whatsappShare';
import { Button } from '../ui/Button';
import {
  X,
  Download,
  Check,
  RotateCw,
  Eye,
  CheckSquare,
  Square,
  Images,
  MessageCircle,
  Loader2
} from 'lucide-react';

interface ProductImageDownloadModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80';

export const ProductImageDownloadModal: React.FC<ProductImageDownloadModalProps> = ({
  product,
  isOpen,
  onClose
}) => {
  const dispatch = useAppDispatch();

  const rawImages = product
    ? [
        ...(Array.isArray(product.images) && product.images.length > 0
          ? product.images
          : []),
        product.thumbnail
      ].filter(Boolean)
    : [];

  const images = Array.from(new Set(rawImages));
  if (images.length === 0 && product) {
    images.push(DEFAULT_FALLBACK_IMAGE);
  }

  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(() => {
    return new Set(images.map((_, idx) => idx));
  });

  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharingWhatsApp, setIsSharingWhatsApp] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && images.length > 0) {
      setSelectedIndices(new Set(images.map((_, idx) => idx)));
      setIsDownloading(false);
      setPreviewImage(null);
    }
  }, [isOpen, product?.id]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (previewImage) {
          setPreviewImage(null);
        } else {
          onClose();
        }
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, previewImage, onClose]);

  if (!isOpen || !product) return null;

  const toggleSelect = (index: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIndices(new Set(images.map((_, idx) => idx)));
  };

  const deselectAll = () => {
    setSelectedIndices(new Set());
  };

  const handleDownloadSelected = async () => {
    if (selectedIndices.size === 0) {
      dispatch(addToast({
        type: 'warning',
        title: 'No Images Selected',
        message: 'Please choose at least one image to download.'
      }));
      return;
    }

    setIsDownloading(true);
    const selectedUrls = Array.from(selectedIndices).map((idx) => images[idx]);
    const filePrefix = product.sku ? product.sku : 'product';

    try {
      let successCount = 0;
      for (let i = 0; i < selectedUrls.length; i++) {
        await downloadProductImage(selectedUrls[i], `${filePrefix}_photo_${i + 1}.jpg`);
        successCount++;
        if (i < selectedUrls.length - 1) {
          await new Promise((r) => setTimeout(r, 200));
        }
      }

      dispatch(addToast({
        type: 'success',
        title: 'Download Complete',
        message: `Successfully downloaded ${successCount} image${successCount > 1 ? 's' : ''}.`
      }));
      onClose();
    } catch {
      dispatch(addToast({
        type: 'error',
        title: 'Download Incomplete',
        message: 'Some images could not be saved.'
      }));
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShareSelected = async () => {
    const selectedUrls = Array.from(selectedIndices).map((idx) => images[idx]);
    if (selectedUrls.length === 0) {
      dispatch(addToast({
        type: 'warning',
        title: 'No Images Selected',
        message: 'Select at least one photo to share.'
      }));
      return;
    }

    setIsSharingWhatsApp(true);
    try {
      await shareProductToWhatsApp(product, {
        images: selectedUrls,
        onToast: (toast) => dispatch(addToast(toast))
      });
      onClose();
    } finally {
      setIsSharingWhatsApp(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in-0">
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <Images className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Product Gallery & WhatsApp Share
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {product.sku} • {images.length} photos available
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Select All / Deselect All */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={selectAll}
              className="flex items-center gap-1.5 font-semibold text-brand-600 hover:text-brand-700"
            >
              <CheckSquare className="w-4 h-4" />
              Select All
            </button>
            <span className="text-slate-300">•</span>
            <button
              onClick={deselectAll}
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700"
            >
              <Square className="w-4 h-4" />
              Deselect All
            </button>
          </div>

          <span className="text-slate-500 font-medium">
            <strong>{selectedIndices.size}</strong> of {images.length} selected
          </span>
        </div>

        {/* Image Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {images.map((img, idx) => {
              const isSelected = selectedIndices.has(idx);
              return (
                <div
                  key={idx}
                  onClick={() => toggleSelect(idx)}
                  className={`group relative aspect-square rounded-2xl overflow-hidden border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-brand-600 ring-2 ring-brand-500/20 shadow-md'
                      : 'border-slate-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="Product" className="w-full h-full object-cover" />

                  {/* Checkbox overlay */}
                  <div
                    className={`absolute top-2.5 right-2.5 w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'bg-white/90 text-transparent border border-slate-300'
                    }`}
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>

                  {/* Preview button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewImage(img);
                    }}
                    className="absolute bottom-2.5 right-2.5 p-1.5 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                    title="Enlarge preview"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-white border-t border-slate-100 flex items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadSelected}
            disabled={isDownloading || selectedIndices.size === 0}
            leftIcon={
              isDownloading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )
            }
          >
            Download Selected ({selectedIndices.size})
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleShareSelected}
            disabled={isSharingWhatsApp || selectedIndices.size === 0}
            className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20"
            leftIcon={
              isSharingWhatsApp ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <MessageCircle className="w-4 h-4" />
              )
            }
          >
            Share Image + Text to WhatsApp
          </Button>
        </div>

        {/* Lightbox Preview */}
        {previewImage && (
          <div
            className="fixed inset-0 z-60 bg-black/85 flex items-center justify-center p-4 animate-in fade-in"
            onClick={() => setPreviewImage(null)}
          >
            <div className="relative max-w-2xl max-h-[85vh]">
              <img
                src={previewImage}
                alt="Enlarged"
                className="w-full h-full object-contain rounded-2xl"
              />
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute top-3 right-3 p-2 bg-black/60 text-white rounded-full hover:bg-black/90"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

