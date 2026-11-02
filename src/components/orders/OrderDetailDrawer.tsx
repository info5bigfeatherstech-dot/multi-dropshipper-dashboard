import React, { useState, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setSelectedOrderForDetail } from '../../store/slices/ordersSlice';
import { addToast } from '../../store/slices/uiSlice';
import type { Order } from '../../types/dropshipper';
import { Drawer } from '../common/Drawer';
import { StatusBadge } from '../common/StatusBadge';
import { formatCurrency, formatDateTime } from '../../lib/utils';
import {
  downloadOrderPDF,
  downloadOrderCSV,
  downloadProductImage
} from '../../utils/exportUtils';
import {
  FileText,
  Download,
  Image as ImageIcon,
  User,
  MapPin,
  Clock,
  CheckCircle2,
  Truck,
  Check,
  AlertOctagon,
  Copy,
  ZoomIn
} from 'lucide-react';

export const OrderDetailDrawer: React.FC = () => {
  const dispatch = useAppDispatch();
  const selectedOrder = useAppSelector((state) => state.orders.selectedOrderForDetail);

  const [copiedId, setCopiedId] = useState(false);
  const [isZoomingImage, setIsZoomingImage] = useState(false);

  // Retain last order in ref so the Drawer can play its smooth slide-out exit animation
  const lastOrderRef = useRef<Order | null>(selectedOrder);
  if (selectedOrder) {
    lastOrderRef.current = selectedOrder;
  }
  const order = selectedOrder || lastOrderRef.current;

  const handleClose = () => {
    dispatch(setSelectedOrderForDetail(null));
  };

  if (!order) return null;

  const handleCopyOrderNumber = () => {
    navigator.clipboard.writeText(order.orderNumber);
    setCopiedId(true);
    dispatch(
      addToast({
        type: 'info',
        title: 'Order ID Copied',
        message: `${order.orderNumber} copied to clipboard.`
      })
    );
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleDownloadPDF = () => {
    try {
      downloadOrderPDF(order);
      dispatch(
        addToast({
          type: 'success',
          title: 'PDF Export Ready',
          message: `Saved ${order.orderNumber}_Details.pdf to your device.`
        })
      );
    } catch {
      dispatch(
        addToast({
          type: 'error',
          title: 'Download Failed',
          message: 'Could not generate PDF. Please try again.'
        })
      );
    }
  };

  const handleDownloadCSV = () => {
    try {
      downloadOrderCSV(order);
      dispatch(
        addToast({
          type: 'success',
          title: 'CSV Export Ready',
          message: `Saved ${order.orderNumber}_export.csv to your device.`
        })
      );
    } catch {
      dispatch(
        addToast({
          type: 'error',
          title: 'Download Failed',
          message: 'Could not generate CSV file.'
        })
      );
    }
  };

  const items = Array.isArray(order.items) && order.items.length > 0
    ? order.items
    : order.item ? [order.item] : [];

  const primaryItem = items[0] || {
    productName: 'Toothbrush Protector Cap Cover',
    sku: 'SKU-2928-1',
    image: 'https://res.cloudinary.com/dejsxuhnk/image/upload/v1788873047/products/zip-toothbrush-protector-cap-cover-2928-1-i0-1788873047623.webp',
    dropshipPrice: 40,
    quantity: 1,
    total: 40
  };

  const handleDownloadImage = async () => {
    dispatch(
      addToast({
        type: 'info',
        title: 'Downloading Image',
        message: `Fetching full-res asset for ${primaryItem.productName}...`
      })
    );
    const ok = await downloadProductImage(
      primaryItem.image,
      `${order.orderNumber}_${primaryItem.sku}.jpg`
    );
    if (ok) {
      dispatch(
        addToast({
          type: 'success',
          title: 'Image Downloaded',
          message: 'Product thumbnail saved to your downloads.'
        })
      );
    }
  };

  // Stepper timeline definition matching reference screenshot
  const steps = [
    { key: 'created', label: 'Created', icon: Clock },
    { key: 'pending', label: 'Pending Approval', icon: Clock },
    { key: 'approved', label: 'Approved', icon: CheckCircle2 },
    { key: 'shipped', label: 'Shipped', icon: Truck },
    { key: 'delivered', label: 'Delivered', icon: Check }
  ];

  const statusOrderIndex: Record<string, number> = {
    created: 0,
    pending: 1,
    approved: 2,
    shipped: 3,
    delivered: 4,
    rejected: -1
  };

  const currentStepIdx = statusOrderIndex[order.status] ?? 1;
  const isRejected = order.status === 'rejected';

  // Build timeline events
  const timelineEvents: Array<{ status: string; label: string; timestamp: string; note?: string }> =
    order.timeline && order.timeline.length > 0
      ? order.timeline
      : [
          { status: 'created', label: 'Order Placed', timestamp: order.createdAt, note: undefined },
          {
            status: order.status,
            label: order.status === 'pending' ? 'Pending Approval' : `Status: ${order.status}`,
            timestamp: order.updatedAt || order.createdAt,
            note: undefined
          }
        ];

  return (
    <Drawer
      isOpen={Boolean(selectedOrder)}
      onClose={handleClose}
      title={`Order ${order.orderNumber}`}
      subtitle={`Submitted on ${formatDateTime(order.createdAt)}`}
      width="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Top Status & Quick Copy Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-mono font-bold">
              {order.orderNumber}
            </span>
            <button
              type="button"
              onClick={handleCopyOrderNumber}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              title="Copy ID"
            >
              {copiedId ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge status={order.status} size="sm" />
          </div>
        </div>

        {/* Fulfillment Progress & Activity History */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
            Fulfillment Progress
          </h4>

          {isRejected ? (
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              <AlertOctagon className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Order Rejected by Admin</p>
                <p className="mt-1 leading-relaxed capitalize">
                  Reason: {order.rejectionReason || order.adminNote || 'Item allocation declined by supplier.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="relative">
              {/* Stepper horizontal dots */}
              <div className="grid grid-cols-5 gap-1 text-center relative z-10">
                {steps.map((step, idx) => {
                  const isDone = idx <= currentStepIdx;
                  const isCurrent = idx === currentStepIdx;
                  const Icon = step.icon;

                  return (
                    <div key={step.key} className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                          isCurrent
                            ? 'bg-brand-600 text-white ring-4 ring-brand-100'
                            : isDone
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span
                        className={`text-[10px] mt-2 font-medium leading-tight max-w-[65px] ${
                          isCurrent
                            ? 'text-brand-600 font-bold'
                            : isDone
                            ? 'text-slate-700'
                            : 'text-slate-400'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Connecting progress line */}
              <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 -z-0">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${(Math.min(currentStepIdx, 4) / 4) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Stepper Timeline Logs */}
          <div className="mt-6 pt-4 border-t border-slate-100 space-y-2.5">
            <span className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider">
              Activity History
            </span>
            {timelineEvents.map((event, i) => (
              <div key={i} className="flex items-start justify-between text-xs py-1">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />
                  <span className="font-medium text-slate-800">
                    {event.label}
                  </span>
                  {event.note && (
                    <span className="text-slate-400 hidden sm:inline">— {event.note}</span>
                  )}
                </div>
                <span className="text-[11px] text-slate-400 shrink-0 font-mono">
                  {formatDateTime(event.timestamp)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Ordered Products Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Ordered Products ({items.length})
            </h4>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadImage}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5 text-brand-600" />
                <span>Download Image</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {items.map((it, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/60"
              >
                {/* Thumbnail with zoom trigger */}
                <div
                  onClick={() => setIsZoomingImage(!isZoomingImage)}
                  className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 cursor-pointer group shrink-0"
                  title="Click to zoom image"
                >
                  <img
                    src={it.image}
                    alt={it.productName}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80';
                    }}
                  />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <ZoomIn className="w-4 h-4" />
                  </div>
                </div>

                {/* Product Meta */}
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-mono text-slate-400">{it.sku}</span>
                  <h5 className="text-sm font-bold text-slate-900 mt-0.5 leading-snug">
                    {it.productName}
                  </h5>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-600">
                    <span>
                      Dropship Price:{' '}
                      <strong className="text-slate-900">
                        {formatCurrency(it.dropshipPrice, { showDecimals: true })}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>
                      Qty:{' '}
                      <strong className="text-slate-900">
                        {it.quantity}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Line Total */}
                <div className="text-left sm:text-right pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 w-full sm:w-auto">
                  <span className="text-[10px] font-medium text-slate-400 uppercase">
                    Line Total
                  </span>
                  <p className="text-base font-extrabold text-brand-600">
                    {formatCurrency(it.total, { showDecimals: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {items.length > 1 && (
            <div className="flex justify-between items-center pt-3 px-1 text-sm font-bold text-slate-900 border-t border-slate-100">
              <span className="text-slate-500 font-medium">
                Items Subtotal ({items.reduce((acc, i) => acc + i.quantity, 0)} units):
              </span>
              <span className="text-base text-brand-600 font-black">
                {formatCurrency(items.reduce((acc, i) => acc + i.total, 0), { showDecimals: true })}
              </span>
            </div>
          )}

          {/* Expanded Image Zoom Modal / Box */}
          {isZoomingImage && (
            <div
              onClick={() => setIsZoomingImage(false)}
              className="mt-4 p-2 bg-slate-100 rounded-xl relative overflow-hidden group cursor-zoom-out"
            >
              <img
                src={primaryItem.image}
                alt={primaryItem.productName}
                className="w-full h-64 object-contain rounded-lg"
              />
              <p className="text-center text-xs text-slate-400 mt-1">
                Click anywhere to close preview
              </p>
            </div>
          )}
        </div>

        {/* Customer & Shipping 2-Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Customer Information */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-brand-600" />
              Customer Information
            </h4>
            <div className="space-y-1.5 text-xs">
              <p className="text-sm font-semibold text-slate-800">
                {order.customer?.name || 'Customer'}
              </p>
              <p className="text-slate-500">
                Email: {order.customer?.email || ''}
              </p>
              <p className="text-slate-500">
                Phone: {order.customer?.phone || ''}
              </p>
            </div>
          </div>

          {/* Shipping Destination */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-brand-600" />
              Shipping Destination
            </h4>
            <div className="text-xs text-slate-600 space-y-1 leading-relaxed">
              <p className="font-semibold text-slate-800">
                {order.shippingAddress?.line1 || 'Delhi, delhi 110045'}
              </p>
              {order.shippingAddress?.line2 && <p>{order.shippingAddress.line2}</p>}
              <p>
                {order.shippingAddress?.city}{order.shippingAddress?.state ? `, ${order.shippingAddress.state}` : ''}{' '}
                {order.shippingAddress?.postalCode}
              </p>
              <p className="font-medium text-slate-500">
                {order.shippingAddress?.country || 'India'}
              </p>
            </div>
          </div>
        </div>

        {/* Courier Route & Fulfillment Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-brand-600" />
              Courier Route & Fulfillment
            </h4>
            <span
              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                order.shippingPaymentMode === 'cod'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-indigo-100 text-indigo-800'
              }`}
            >
              {order.shippingPaymentMode === 'cod' ? 'Cash on Delivery (COD)' : 'Prepaid Shipping'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block">Shipping Charges</span>
              <span className="font-bold text-slate-900">
                {formatCurrency(order.shippingCharges ?? 44.84, { showDecimals: true })}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Est. Delivery SLA</span>
              <span className="font-medium text-slate-800">
                {order.estimatedDeliveryDays ? `${order.estimatedDeliveryDays} Days` : '3 Days Days'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Carrier Partner</span>
              <span className="font-medium text-slate-800 uppercase">
                {order.shippingCarrier || order.shippingProvider || 'SHIPMOZO'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Origin Warehouse</span>
              <span className="font-mono font-semibold text-slate-800">
                {order.warehousePincode || '560001'}
              </span>
            </div>
          </div>
        </div>

        {/* Tracking & Admin Notes if present */}
        {(order.adminNote || order.notes || order.trackingNumber) && (
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Logistics & Remarks
            </h4>

            {order.trackingNumber && (
              <div className="flex items-center justify-between text-xs bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-medium">Tracking Code:</span>
                <span className="font-mono font-bold text-brand-600">
                  {order.trackingNumber} ({order.shippingCarrier || 'Ground'})
                </span>
              </div>
            )}

            {order.adminNote && (
              <div className="text-xs">
                <span className="font-semibold text-slate-700">
                  Admin Note:
                </span>{' '}
                <span className="text-slate-500">
                  {order.adminNote}
                </span>
              </div>
            )}

            {order.notes && (
              <div className="text-xs">
                <span className="font-semibold text-slate-700">
                  Seller Instructions:
                </span>{' '}
                <span className="text-slate-500">
                  {order.notes}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Download Actions */}
        <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleDownloadPDF}
            className="flex-1 py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-semibold shadow-xs flex items-center justify-center gap-2 text-xs transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Download PDF Details</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadCSV}
            className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold flex items-center justify-center gap-2 text-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>
    </Drawer>
  );
};

export default OrderDetailDrawer;
