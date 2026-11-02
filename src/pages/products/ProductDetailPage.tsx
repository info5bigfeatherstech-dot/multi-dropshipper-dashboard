import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ShoppingBag,
  Plus,
  Minus,
  ShieldCheck,
  Truck,
  Box,
  CheckCircle2,
  Copy,
  Sparkles,
  Star,
  ArrowUpRight,
  Package,
  Layers,
  Clock,
  Check,
  Share2,
  Download,
  FileText,
  Table,
  FileCode,
  Images,
  ChevronDown,
  Loader2,
  MessageCircle
} from 'lucide-react';
import { productsService } from '../../services/productsService';
import type { Product } from '../../types/dropshipper';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '../../components/ui/dropdown-menu';
import { formatCurrency } from '../../lib/utils';
import {
  downloadProductImage,
  downloadProductPDF,
  downloadProductCSV,
  downloadProductJSON,
  downloadProductText,
  downloadAllProductImages
} from '../../utils/exportUtils';
import { shareProductToWhatsApp } from '../../utils/whatsappShare';
import { ServiceabilityCheckerModal } from '../../components/shipping/ServiceabilityCheckerModal';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setSelectedProductForCreate } from '../../store/slices/productsSlice';
import { addToast } from '../../store/slices/uiSlice';
import { ProductCard } from '../../components/products/ProductCard';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const storeProducts = useAppSelector((state) => state.products.products);

  const storeProduct = useMemo(() => {
    return (
      storeProducts.find(
        (p) => p.id === id || p.slug === id || p.sku.toLowerCase() === id?.toLowerCase()
      ) || null
    );
  }, [storeProducts, id]);

  const [product, setProduct] = useState<Product | null>(storeProduct);
  const [loadingProduct, setLoadingProduct] = useState(!storeProduct);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [calculatorQty, setCalculatorQty] = useState(1);
  const [copiedSku, setCopiedSku] = useState(false);
  const [isDownloadingImage, setIsDownloadingImage] = useState(false);
  const [isDownloadingAllImages, setIsDownloadingAllImages] = useState(false);
  const [isSharingWhatsApp, setIsSharingWhatsApp] = useState(false);
  const [showServiceabilityModal, setShowServiceabilityModal] = useState(false);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    if (storeProduct) {
      setProduct(storeProduct);
      setLoadingProduct(false);
      return;
    }

    setLoadingProduct(true);
    productsService
      .getProduct(id)
      .then((p) => {
        if (isMounted) {
          setProduct(p);
          setLoadingProduct(false);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch product by id/slug:', err);
        if (isMounted) {
          setLoadingProduct(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id, storeProduct]);

  // Loading state
  if (loadingProduct) {
    return (
      <div className="py-24 text-center max-w-md mx-auto">
        <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h3 className="text-base font-semibold text-slate-800">Loading catalog item...</h3>
        <p className="text-xs text-slate-500 mt-1">Retrieving supplier verified specs and real-time inventory</p>
      </div>
    );
  }

  // Not found state
  if (!product) {
    return (
      <div className="py-16 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
          <Package className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Product Not Found</h2>
        <p className="text-sm text-slate-500 mb-6">
          The requested catalog product with ID "{id}" could not be located in active inventory.
        </p>
        <Button variant="primary" onClick={() => navigate('/products')} className="rounded-xl shadow-md">
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          <span>Return to Catalog</span>
        </Button>
      </div>
    );
  }

  const dropshipPrice = Number(product.dropshipPrice || 0);
  const suggestedRetailPrice = Number(
    product.suggestedRetailPrice || (dropshipPrice > 0 ? Math.round(dropshipPrice * 1.5) : 0)
  );
  const marginInr = suggestedRetailPrice - dropshipPrice;
  const marginPercent = suggestedRetailPrice > 0 ? Math.round((marginInr / suggestedRetailPrice) * 100) : 0;

  const images = Array.from(
    new Set([product.thumbnail, ...(Array.isArray(product.images) ? product.images : [])].filter(Boolean))
  );
  const activeImage = images[selectedImageIndex] || product.thumbnail;

  // Simulator calculations
  const totalDropshipCost = +(dropshipPrice * calculatorQty).toFixed(2);
  const totalSuggestedRevenue = +(suggestedRetailPrice * calculatorQty).toFixed(2);
  const totalEstimatedProfit = +(totalSuggestedRevenue - totalDropshipCost).toFixed(2);

  const categoryName = product.category || 'General';

  // Related products from same category
  const relatedProducts = storeProducts
    .filter((p) => p.category === categoryName && p.id !== product.id && p.sku !== product.sku)
    .slice(0, 3);

  const handleCreateOrderClick = () => {
    dispatch(setSelectedProductForCreate(product));
    navigate('/orders/create', { state: { preselectedProduct: product } });
  };

  const handleCopySku = () => {
    navigator.clipboard.writeText(product.sku);
    setCopiedSku(true);
    dispatch(
      addToast({
        type: 'info',
        title: 'SKU Copied',
        message: `${product.sku} copied to clipboard.`
      })
    );
    setTimeout(() => setCopiedSku(false), 2000);
  };

  const handleShare = async () => {
    if (isSharingWhatsApp) return;
    setIsSharingWhatsApp(true);
    try {
      await shareProductToWhatsApp(product, {
        onToast: (toast) => dispatch(addToast(toast))
      });
    } finally {
      setIsSharingWhatsApp(false);
    }
  };

  const handleDownloadActiveImage = async () => {
    setIsDownloadingImage(true);
    dispatch(
      addToast({
        type: 'info',
        title: 'Downloading Image',
        message: `Saving photo ${selectedImageIndex + 1} for ${product.name}...`
      })
    );
    const ok = await downloadProductImage(
      activeImage,
      `${product.sku}_photo_${selectedImageIndex + 1}.jpg`,
      product.thumbnail
    );
    setIsDownloadingImage(false);
    if (ok) {
      dispatch(
        addToast({
          type: 'success',
          title: 'Image Downloaded',
          message: `${product.sku} photo ${selectedImageIndex + 1} saved to your downloads.`
        })
      );
    } else {
      dispatch(
        addToast({
          type: 'error',
          title: 'Download Failed',
          message: 'Could not fetch image file. Please try again.'
        })
      );
    }
  };

  const handleDownloadSpecificImage = async (e: React.MouseEvent, imgUrl: string, idx: number) => {
    e.stopPropagation();
    dispatch(
      addToast({
        type: 'info',
        title: 'Downloading Image',
        message: `Fetching photo ${idx + 1}...`
      })
    );
    const ok = await downloadProductImage(
      imgUrl,
      `${product.sku}_photo_${idx + 1}.jpg`,
      product.thumbnail
    );
    if (ok) {
      dispatch(
        addToast({
          type: 'success',
          title: 'Image Downloaded',
          message: `Photo ${idx + 1} saved.`
        })
      );
    }
  };

  const handleDownloadAllImages = async () => {
    setIsDownloadingAllImages(true);
    dispatch(
      addToast({
        type: 'info',
        title: 'Downloading Gallery',
        message: `Downloading ${images.length} images for ${product.sku}...`
      })
    );
    const count = await downloadAllProductImages(product);
    setIsDownloadingAllImages(false);
    dispatch(
      addToast({
        type: 'success',
        title: 'Gallery Downloaded',
        message: `Successfully saved ${count} images to downloads.`
      })
    );
  };

  const handleDownloadPDF = () => {
    try {
      downloadProductPDF(product);
      dispatch(
        addToast({
          type: 'success',
          title: 'PDF Spec Sheet Downloaded',
          message: `${product.sku}_Product_Details.pdf generated.`
        })
      );
    } catch {
      dispatch(
        addToast({
          type: 'error',
          title: 'PDF Export Failed',
          message: 'Could not generate product PDF document.'
        })
      );
    }
  };

  const handleDownloadCSV = () => {
    try {
      downloadProductCSV(product);
      dispatch(
        addToast({
          type: 'success',
          title: 'CSV File Downloaded',
          message: `${product.sku}_details.csv exported for store import.`
        })
      );
    } catch {
      dispatch(
        addToast({
          type: 'error',
          title: 'CSV Export Failed',
          message: 'Could not export CSV.'
        })
      );
    }
  };

  const handleDownloadJSON = () => {
    try {
      downloadProductJSON(product);
      dispatch(
        addToast({
          type: 'success',
          title: 'JSON Data Downloaded',
          message: `${product.sku}_data.json saved.`
        })
      );
    } catch {
      dispatch(
        addToast({
          type: 'error',
          title: 'Export Failed',
          message: 'Could not export JSON.'
        })
      );
    }
  };

  const handleDownloadText = () => {
    try {
      downloadProductText(product);
      dispatch(
        addToast({
          type: 'success',
          title: 'Listing Copy Downloaded',
          message: `${product.sku}_listing.txt saved.`
        })
      );
    } catch {
      dispatch(
        addToast({
          type: 'error',
          title: 'Export Failed',
          message: 'Could not export text.'
        })
      );
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
    <div className="space-y-8 animate-in fade-in pb-12">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <button
            onClick={() => navigate('/products')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sourcing Catalog</span>
          </button>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Products</span>
            <span>/</span>
            <span className="text-slate-600 font-medium">{categoryName}</span>
            <span>/</span>
            <span className="font-mono text-slate-500">{product.sku}</span>
          </div>
        </div>

        {/* Top Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Direct Download Active Image */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadActiveImage}
            disabled={isDownloadingImage}
            leftIcon={
              isDownloadingImage ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-600" />
              ) : (
                <Download className="w-3.5 h-3.5 text-brand-600" />
              )
            }
            className="rounded-xl text-xs font-medium h-9 border-slate-200 hover:border-brand-300 hover:bg-brand-50/50"
            title="Download currently selected product photo"
          >
            Download Image
          </Button>

          {/* Download Product Details Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Download className="w-3.5 h-3.5 text-brand-600" />}
                rightIcon={<ChevronDown className="w-3 h-3 text-slate-400" />}
                className="rounded-xl text-xs font-semibold h-9 border-slate-200 hover:border-brand-400 hover:bg-brand-50/50 text-slate-800"
                title="Download product specifications and marketing assets"
              >
                Download Details
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 z-50 bg-white shadow-xl">
              <DropdownMenuLabel className="text-[11px] text-slate-400 font-bold uppercase tracking-wider px-2 py-1.5">
                Product Specification Downloads
              </DropdownMenuLabel>
              <DropdownMenuItem onClick={handleDownloadPDF} className="cursor-pointer gap-2 py-2">
                <FileText className="w-4 h-4 text-brand-600 shrink-0" />
                <div className="flex flex-col flex-1">
                  <span className="font-semibold text-xs text-slate-800">PDF Spec Sheet</span>
                  <span className="text-[10px] text-slate-400">Complete branded datasheet</span>
                </div>
                <span className="text-[10px] font-bold text-brand-600 border border-brand-200 bg-brand-50/80 px-1.5 py-0.5 rounded">
                  PDF
                </span>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={handleDownloadCSV} className="cursor-pointer gap-2 py-2">
                <Table className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="flex flex-col flex-1">
                  <span className="font-semibold text-xs text-slate-800">CSV Spreadsheet</span>
                  <span className="text-[10px] text-slate-400">Shopify & store import format</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 border border-emerald-200 bg-emerald-50/80 px-1.5 py-0.5 rounded">
                  CSV
                </span>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={handleDownloadText} className="cursor-pointer gap-2 py-2">
                <FileCode className="w-4 h-4 text-amber-600 shrink-0" />
                <div className="flex flex-col flex-1">
                  <span className="font-semibold text-xs text-slate-800">Listing Copy (.txt)</span>
                  <span className="text-[10px] text-slate-400">Title, description & specs</span>
                </div>
                <span className="text-[10px] font-bold text-amber-600 border border-amber-200 bg-amber-50/80 px-1.5 py-0.5 rounded">
                  TXT
                </span>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={handleDownloadJSON} className="cursor-pointer gap-2 py-2">
                <FileCode className="w-4 h-4 text-slate-600 shrink-0" />
                <div className="flex flex-col flex-1">
                  <span className="font-semibold text-xs text-slate-800">Raw JSON Data</span>
                  <span className="text-[10px] text-slate-400">Complete API data structure</span>
                </div>
                <span className="text-[10px] font-bold text-slate-600 border border-slate-200 bg-slate-50 px-1.5 py-0.5 rounded">
                  JSON
                </span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-1 border-t border-slate-100" />
              <DropdownMenuLabel className="text-[11px] text-slate-400 font-bold uppercase tracking-wider px-2 py-1.5">
                Photo Media Assets
              </DropdownMenuLabel>

              <DropdownMenuItem onClick={handleDownloadActiveImage} className="cursor-pointer gap-2 py-2">
                <Download className="w-4 h-4 text-brand-600 shrink-0" />
                <div className="flex flex-col flex-1">
                  <span className="font-semibold text-xs text-slate-800">Download Current Photo</span>
                  <span className="text-[10px] text-slate-400">
                    Photo {selectedImageIndex + 1} of {images.length}
                  </span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={handleDownloadAllImages} className="cursor-pointer gap-2 py-2">
                <Images className="w-4 h-4 text-indigo-600 shrink-0" />
                <div className="flex flex-col flex-1">
                  <span className="font-semibold text-xs text-slate-800">
                    Download All {images.length} Photos
                  </span>
                  <span className="text-[10px] text-slate-400">Batch download gallery photos</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Share Button (WhatsApp + Link) */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            disabled={isSharingWhatsApp}
            leftIcon={
              isSharingWhatsApp ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
              ) : (
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              )
            }
            className="rounded-xl text-xs font-semibold h-9 text-emerald-700 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300"
            title="Share Product Photo & Specs"
          >
            Share
          </Button>

          {/* Copy SKU */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopySku}
            leftIcon={
              copiedSku ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-400" />
              )
            }
            className="rounded-xl text-xs font-mono h-9"
            title="Copy SKU code"
          >
            {copiedSku ? 'Copied' : product.sku}
          </Button>

          {/* Create Order Button */}
          <Button
            variant="primary"
            size="sm"
            onClick={handleCreateOrderClick}
            disabled={product.stockStatus === 'out_of_stock'}
            leftIcon={<ShoppingBag className="w-3.5 h-3.5" />}
            className="rounded-xl text-xs font-semibold shadow-md h-9"
          >
            Create Order
          </Button>
        </div>
      </div>

      {/* Main Grid: Gallery & Logistics (Left) vs Pricing & Actions (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (7 cols): High-res Gallery & Technical Specifications */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Visual Display */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="relative aspect-[16/11] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 group">
              <img
                src={activeImage}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
                }}
              />

              {/* Badges on Hero Image (Top-Left) */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                <span className="bg-white/95 text-slate-900 shadow-md backdrop-blur-xs font-semibold text-xs px-3 py-1 rounded-lg border border-slate-200/60 inline-flex items-center">
                  {categoryName}
                </span>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/90 text-white text-[11px] font-semibold backdrop-blur-xs shadow-xs">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verified Supplier Batch</span>
                </div>
              </div>

              {/* Stock Badge (Top-Right) */}
              <div className="absolute top-4 right-4">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-md backdrop-blur-xs border ${
                    stockVariant === 'emerald'
                      ? 'bg-emerald-50/95 text-emerald-700 border-emerald-200/80'
                      : stockVariant === 'amber'
                      ? 'bg-amber-50/95 text-amber-700 border-amber-200/80'
                      : 'bg-rose-50/95 text-rose-700 border-rose-200/80'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
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

              {/* Floating Image Counter (Bottom-Left) */}
              <div className="absolute bottom-4 left-4">
                <span className="px-2.5 py-1 rounded-lg bg-slate-950/70 text-white text-[11px] font-medium backdrop-blur-md shadow-xs flex items-center gap-1.5">
                  <span>
                    Photo {selectedImageIndex + 1} of {images.length}
                  </span>
                </span>
              </div>

              {/* Download Image Button (Bottom-Right) */}
              <div className="absolute bottom-4 right-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadActiveImage}
                  disabled={isDownloadingImage}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/85 hover:bg-slate-900 text-white text-xs font-semibold backdrop-blur-md shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                  title="Download this specific product image"
                >
                  {isDownloadingImage ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  ) : (
                    <Download className="w-3.5 h-3.5 text-brand-300" />
                  )}
                  <span>Download Image</span>
                </button>
              </div>
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div className="flex items-center gap-3 mt-4 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group/thumb shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all block ${
                        selectedImageIndex === idx
                          ? 'border-brand-600 ring-4 ring-brand-500/20 scale-95 shadow-md'
                          : 'border-slate-200 hover:border-slate-300 opacity-75 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={img}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
                        }}
                      />
                    </button>
                    {/* Hover download button on thumbnail */}
                    <button
                      type="button"
                      onClick={(e) => handleDownloadSpecificImage(e, img, idx)}
                      className="absolute top-1 right-1 p-1 rounded-md bg-slate-900/80 hover:bg-brand-600 text-white opacity-0 group-hover/thumb:opacity-100 transition-opacity shadow-xs"
                      title={`Download image ${idx + 1}`}
                    >
                      <Download className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                {/* Quick Download All Thumbnails Button */}
                <button
                  type="button"
                  onClick={handleDownloadAllImages}
                  disabled={isDownloadingAllImages}
                  className="shrink-0 flex flex-col items-center justify-center w-20 h-20 rounded-xl border border-dashed border-slate-300 hover:border-brand-500 hover:bg-brand-50/50 text-slate-500 hover:text-brand-600 transition-all text-[11px] font-semibold gap-1 disabled:opacity-50"
                  title="Download all images in product gallery"
                >
                  {isDownloadingAllImages ? (
                    <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
                  ) : (
                    <Images className="w-4 h-4" />
                  )}
                  <span>Save All</span>
                </button>
              </div>
            )}
          </div>

          {/* Product Overview & Features Card */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2.5">
                Product Description
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                {product.description}
              </p>
            </div>

            {/* Feature Bullets */}
            {product.features && product.features.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
                  Key Specifications & Value Highlights
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {product.features.map((feat, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm text-slate-700 font-medium"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Logistics & Supplier Specifications Table */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
                Logistics & Carrier Compliance
              </h3>
              <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 text-xs">
                <div className="flex items-center justify-between p-3.5 bg-white">
                  <span className="text-slate-500 flex items-center gap-2 font-medium">
                    <Truck className="w-4 h-4 text-brand-600" /> Dispatch Turnaround
                  </span>
                  <span className="font-semibold text-slate-900">
                    {product.specs?.fulfillmentTime || '24-48 Hours'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-slate-50/60">
                  <span className="text-slate-500 flex items-center gap-2 font-medium">
                    <Box className="w-4 h-4 text-brand-600" /> Fulfillment Origin Hub
                  </span>
                  <span className="font-semibold text-slate-900">
                    {product.specs?.origin || 'India'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-white">
                  <span className="text-slate-500 font-medium">Parcel Dimensions</span>
                  <span className="font-semibold text-slate-900">
                    {product.specs?.dimensions || '15 x 10 x 5 cm'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-slate-50/60">
                  <span className="text-slate-500 font-medium">Gross Weight</span>
                  <span className="font-semibold text-slate-900">
                    {product.specs?.weight || '0.5 kg'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-white">
                  <span className="text-slate-500 font-medium">Material Composition</span>
                  <span className="font-semibold text-slate-900">
                    {product.specs?.material || 'Supplier Assured Grade'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-slate-50/60">
                  <span className="text-slate-500 flex items-center gap-2 font-medium">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Supplier Warranty
                  </span>
                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    {product.specs?.warranty || 'Supplier Assured'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Download Product Assets & Details Card (4 interactive tiles) */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Download className="w-4 h-4 text-brand-600" />
                Download Product Assets & Details
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Save official marketing imagery and supplier compliance datasheets for your store catalog.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* PDF Spec Sheet */}
              <div
                onClick={handleDownloadPDF}
                className="flex items-start gap-3.5 p-3.5 rounded-2xl border border-slate-200 hover:border-brand-500/80 bg-white hover:bg-brand-50/20 transition-all cursor-pointer group shadow-xs hover:shadow-md"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="text-xs font-bold text-slate-900 group-hover:text-brand-600 truncate">
                      PDF Spec Sheet
                    </span>
                    <span className="text-[10px] font-bold text-brand-600 border border-brand-200 bg-brand-50/60 px-1.5 py-0.5 rounded">
                      PDF
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2">
                    Printable product specification datasheet with wholesale pricing & margins
                  </p>
                </div>
              </div>

              {/* CSV Spreadsheet */}
              <div
                onClick={handleDownloadCSV}
                className="flex items-start gap-3.5 p-3.5 rounded-2xl border border-slate-200 hover:border-emerald-500/80 bg-white hover:bg-emerald-50/20 transition-all cursor-pointer group shadow-xs hover:shadow-md"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Table className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-600 truncate">
                      Store Import CSV
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 border border-emerald-200 bg-emerald-50/60 px-1.5 py-0.5 rounded">
                      CSV
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2">
                    Structured tabular data formatted for Shopify, WooCommerce or Excel
                  </p>
                </div>
              </div>

              {/* Active High-Res Image */}
              <div
                onClick={handleDownloadActiveImage}
                className="flex items-start gap-3.5 p-3.5 rounded-2xl border border-slate-200 hover:border-indigo-500/80 bg-white hover:bg-indigo-50/20 transition-all cursor-pointer group shadow-xs hover:shadow-md"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  {isDownloadingImage ? (
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                  ) : (
                    <Download className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 truncate">
                      Current Product Photo
                    </span>
                    <span className="text-[10px] font-bold text-indigo-600 border border-indigo-200 bg-indigo-50/60 px-1.5 py-0.5 rounded">
                      JPG
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2">
                    High-res image file of Photo {selectedImageIndex + 1}
                  </p>
                </div>
              </div>

              {/* All Gallery Photos */}
              <div
                onClick={handleDownloadAllImages}
                className="flex items-start gap-3.5 p-3.5 rounded-2xl border border-slate-200 hover:border-violet-500/80 bg-white hover:bg-violet-50/20 transition-all cursor-pointer group shadow-xs hover:shadow-md"
              >
                <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  {isDownloadingAllImages ? (
                    <Loader2 className="w-5 h-5 animate-spin text-violet-600" />
                  ) : (
                    <Images className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="text-xs font-bold text-slate-900 group-hover:text-violet-600 truncate">
                      All Gallery Photos
                    </span>
                    <span className="text-[10px] font-bold text-violet-600 border border-violet-200 bg-violet-50/60 px-1.5 py-0.5 rounded">
                      {images.length} FILES
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2">
                    Batch download all verified supplier product angles
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Financial Margin Breakdown & Live Simulator */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-20">
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-6">
            {/* Title & Metadata */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-slate-400">
                  {product.sku}
                </span>
                <div className="flex items-center gap-1 text-xs font-semibold text-amber-500 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{product.rating}</span>
                  <span className="text-slate-400 font-normal">({product.reviewCount} reviews)</span>
                </div>
              </div>

              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
                {product.name}
              </h1>
            </div>

            {/* Wholesale Pricing & Margin Banner */}
            <div className="bg-gradient-to-br from-indigo-50/90 via-white to-slate-50 p-5 rounded-2xl border border-indigo-100 shadow-xs space-y-4">
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-indigo-100/80">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Wholesale Dropship
                  </span>
                  <p className="text-3xl font-black text-brand-600 mt-0.5">
                    {formatCurrency(dropshipPrice)}
                  </p>
                  <span className="text-[11px] text-slate-500">Locked Supplier Cost</span>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Suggested MSRP
                  </span>
                  <p className="text-3xl font-bold text-slate-800 mt-0.5">
                    {formatCurrency(suggestedRetailPrice)}
                  </p>
                  <span className="text-[11px] text-slate-500">Recommended Retail</span>
                </div>
              </div>

              {/* Profit Callout */}
              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-800 uppercase flex items-center gap-1">
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                    Estimated Net Margin
                  </span>
                  <p className="text-xl font-black text-emerald-600 mt-0.5">
                    +{formatCurrency(marginInr)}
                  </p>
                </div>
                <span className="bg-white border border-emerald-300 text-emerald-700 font-bold px-3 py-1 rounded-full text-xs">
                  {marginPercent}% Return
                </span>
              </div>
            </div>

            {/* Live Interactive Profit Simulator */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                  Order Volume Simulator
                </span>
                <span className="text-xs text-slate-400">Scale your revenue</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-600">Simulate Units:</span>
                  <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1 shadow-xs">
                    <button
                      type="button"
                      onClick={() => setCalculatorQty(Math.max(1, calculatorQty - 1))}
                      className="h-7 w-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors"
                      title="Decrease"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-xs font-bold text-slate-900">
                      {calculatorQty}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCalculatorQty(Math.min(product.stock || 50, calculatorQty + 1))}
                      className="h-7 w-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors"
                      title="Increase"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-200/60 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Wholesale Dropship Outlay:</span>
                    <span className="font-semibold text-slate-800">
                      {formatCurrency(totalDropshipCost)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Customer Retail Revenue:</span>
                    <span className="font-semibold text-slate-800">
                      {formatCurrency(totalSuggestedRevenue)}
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-bold pt-1.5 border-t border-slate-200/80">
                    <span>Your Total Estimated Profit:</span>
                    <span className="text-sm font-extrabold text-emerald-600">
                      +{formatCurrency(totalEstimatedProfit)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <Button
                variant="primary"
                onClick={handleCreateOrderClick}
                disabled={product.stockStatus === 'out_of_stock'}
                leftIcon={<ShoppingBag className="w-4 h-4 shrink-0" />}
                className="w-full h-12 rounded-xl text-sm font-bold shadow-md shadow-brand-600/20 justify-center"
              >
                Create Order with this Product
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => setShowServiceabilityModal(true)}
                leftIcon={<Truck className="w-4 h-4 text-indigo-600 shrink-0" />}
                className="w-full h-11 rounded-xl text-xs font-semibold border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100/70 hover:border-indigo-300 transition-colors justify-center"
              >
                Check Delivery & Shipping Quotes
              </Button>

              <Button
                variant="outline"
                onClick={() => navigate('/products')}
                leftIcon={<Layers className="w-4 h-4 text-slate-400 shrink-0" />}
                className="w-full h-11 rounded-xl text-xs font-semibold hover:bg-slate-50 justify-center"
              >
                Browse More Sourcing Products
              </Button>

              {/* Download Product Details Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    leftIcon={<Download className="w-4 h-4 text-brand-600 shrink-0" />}
                    rightIcon={<ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                    className="w-full h-11 px-4 rounded-xl text-xs font-semibold border-slate-200 hover:border-brand-300 hover:bg-brand-50/40 text-slate-700 justify-between"
                  >
                    <span>Download Product Details</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 z-50 bg-white shadow-xl">
                  <DropdownMenuLabel className="text-[11px] text-slate-400 font-bold uppercase tracking-wider px-2 py-1.5">
                    Format Options
                  </DropdownMenuLabel>
                  <DropdownMenuItem onClick={handleDownloadPDF} className="cursor-pointer gap-2 py-2">
                    <FileText className="w-4 h-4 text-brand-600 shrink-0" />
                    <div className="flex flex-col flex-1">
                      <span className="font-semibold text-xs text-slate-800">PDF Spec Sheet</span>
                      <span className="text-[10px] text-slate-400">Complete branded datasheet</span>
                    </div>
                    <span className="text-[10px] font-bold text-brand-600 border border-brand-200 bg-brand-50/60 px-1.5 py-0.5 rounded">
                      PDF
                    </span>
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={handleDownloadCSV} className="cursor-pointer gap-2 py-2">
                    <Table className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div className="flex flex-col flex-1">
                      <span className="font-semibold text-xs text-slate-800">CSV Spreadsheet</span>
                      <span className="text-[10px] text-slate-400">Shopify & store import format</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 border border-emerald-200 bg-emerald-50/60 px-1.5 py-0.5 rounded">
                      CSV
                    </span>
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={handleDownloadText} className="cursor-pointer gap-2 py-2">
                    <FileCode className="w-4 h-4 text-amber-600 shrink-0" />
                    <div className="flex flex-col flex-1">
                      <span className="font-semibold text-xs text-slate-800">Listing Copy (.txt)</span>
                      <span className="text-[10px] text-slate-400">Title, description & specs</span>
                    </div>
                    <span className="text-[10px] font-bold text-amber-600 border border-amber-200 bg-amber-50/60 px-1.5 py-0.5 rounded">
                      TXT
                    </span>
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={handleDownloadJSON} className="cursor-pointer gap-2 py-2">
                    <FileCode className="w-4 h-4 text-slate-600 shrink-0" />
                    <div className="flex flex-col flex-1">
                      <span className="font-semibold text-xs text-slate-800">Raw JSON Data</span>
                      <span className="text-[10px] text-slate-400">Complete API data structure</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 border border-slate-200 bg-slate-50 px-1.5 py-0.5 rounded">
                      JSON
                    </span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="my-1 border-t border-slate-100" />
                  <DropdownMenuItem onClick={handleDownloadActiveImage} className="cursor-pointer gap-2 py-2">
                    <Download className="w-4 h-4 text-brand-600 shrink-0" />
                    <div className="flex flex-col flex-1">
                      <span className="font-semibold text-xs text-slate-800">Download Current Photo</span>
                      <span className="text-[10px] text-slate-400">
                        Photo {selectedImageIndex + 1} of {images.length}
                      </span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Wholesale Buyer Protection Policy */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 text-xs text-slate-500 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Supplier Wholesale Protection</span>
              </div>
              <p className="leading-relaxed text-[11px]">
                Orders placed through this portal are direct-to-consumer drop-shipped in blind generic packaging with zero middleman supplier branding.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Related Products */}
      {relatedProducts.length > 0 && (
        <div className="pt-8 border-t border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Related Sourcing Opportunities
              </h3>
              <p className="text-xs text-slate-500">
                Other in-stock items in {categoryName} with verified margins
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/products')}
              className="text-xs font-semibold"
            >
              <span>View All in Catalog</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* Route Serviceability Modal */}
      <ServiceabilityCheckerModal
        isOpen={showServiceabilityModal}
        onClose={() => setShowServiceabilityModal(false)}
        defaultWeightKg={
          product.specs?.weight?.toLowerCase().endsWith('kg')
            ? parseFloat(product.specs.weight) || 0.5
            : product.specs?.weight?.toLowerCase().endsWith('g')
            ? (parseFloat(product.specs.weight) || 500) / 1000
            : 0.5
        }
        defaultOrderAmount={dropshipPrice}
      />
    </div>
  );
};

export default ProductDetailPage;
