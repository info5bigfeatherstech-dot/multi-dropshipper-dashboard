import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  FileDown,
  Download,
  Truck,
  User,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Phone,
  Mail,
  ShieldCheck,
  CreditCard
} from 'lucide-react';
import type { Order } from '../../types/dropshipper';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setSelectedOrderForDetail, updateOrderStatus } from '../../store/slices/ordersSlice';
import { addToast } from '../../store/slices/uiSlice';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatCurrency, formatDate } from '../../lib/utils';
import { downloadOrderPDF, downloadOrderCSV, downloadProductImage } from '../../utils/exportUtils';

export const OrderDetailDrawer: React.FC = () => {
  const dispatch = useAppDispatch();
  const order = useAppSelector((state) => state.orders.selectedOrderForDetail);

  if (!order) return null;

  const handleClose = () => {
    dispatch(setSelectedOrderForDetail(null));
  };

  const items = Array.isArray(order.items) && order.items.length > 0 
    ? order.items 
    : (order.item ? [order.item] : []);

  const handleAdvanceStatus = () => {
    let nextStatus: any = 'approved';
    if (order.status === 'pending') nextStatus = 'approved';
    else if (order.status === 'approved') nextStatus = 'shipped';
    else if (order.status === 'shipped') nextStatus = 'delivered';

    dispatch(updateOrderStatus({
      orderId: order.id,
      status: nextStatus,
      note: `Updated via dashboard simulation to ${nextStatus}`
    }));

    dispatch(addToast({
      type: 'success',
      title: 'Status Updated',
      message: `Order marked as ${nextStatus.toUpperCase()}`
    }));
  };

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

        {/* Drawer Shell */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className="relative w-full max-w-xl bg-white shadow-2xl flex flex-col h-full z-10 overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-20">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-slate-400">ORDER</span>
                <span className="text-base font-bold text-slate-900">{order.orderNumber}</span>
                <Badge status={order.status} />
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Placed {formatDate(order.createdAt)}
              </p>
            </div>

            <button
              onClick={handleClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Courier / Shipping Strip */}
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-brand-600" />
                  Courier Fulfillment Details
                </span>
                <span className="font-semibold text-brand-600">
                  {order.shippingCarrier || order.shippingProvider || 'Delhivery Surface'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 text-xs border-t border-slate-200/60">
                <div>
                  <span className="text-slate-400 block text-[11px]">AWB Tracking No</span>
                  <span className="font-mono font-bold text-slate-800">
                    {order.trackingNumber || 'Queued for Label Gen'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Estimated Delivery</span>
                  <span className="font-semibold text-slate-800">
                    {order.estimatedDeliveryDays || '2-4 Business Days'}
                  </span>
                </div>
              </div>
            </div>

            {/* Customer & Address Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Customer Card */}
              <div className="rounded-2xl border border-slate-200/80 p-4 bg-white space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wide">
                  <User className="w-3.5 h-3.5 text-brand-600" />
                  Customer Details
                </div>
                <div className="text-xs text-slate-600 space-y-1 pt-1">
                  <p className="font-semibold text-slate-900">{order.customer?.name || 'Customer'}</p>
                  <p className="flex items-center gap-1.5 text-slate-500">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {order.customer?.phone || 'No phone recorded'}
                  </p>
                  <p className="flex items-center gap-1.5 text-slate-500 truncate">
                    <Mail className="w-3 h-3 text-slate-400" />
                    {order.customer?.email || 'No email recorded'}
                  </p>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="rounded-2xl border border-slate-200/80 p-4 bg-white space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wide">
                  <MapPin className="w-3.5 h-3.5 text-brand-600" />
                  Shipment Destination
                </div>
                <div className="text-xs text-slate-600 space-y-0.5 pt-1">
                  <p className="font-medium text-slate-800">{order.shippingAddress?.line1 || 'N/A'}</p>
                  {order.shippingAddress?.line2 && <p className="text-slate-500">{order.shippingAddress.line2}</p>}
                  <p className="text-slate-500">
                    {order.shippingAddress?.city || '—'}, {order.shippingAddress?.state || ''} {order.shippingAddress?.postalCode ? `- ${order.shippingAddress.postalCode}` : ''}
                  </p>
                  <p className="text-[11px] font-semibold text-brand-700">{order.shippingAddress?.country || 'India'}</p>
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Itemized Products</h4>
              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-slate-200/70 bg-white"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200/60">
                        <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <h5 className="text-xs font-semibold text-slate-900 truncate">{item.productName}</h5>
                        <p className="text-[11px] font-mono text-slate-400">SKU: {item.sku}</p>
                        <p className="text-[11px] text-slate-500">
                          Qty: <strong>{item.quantity}</strong> × {formatCurrency(item.dropshipPrice)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-slate-900">{formatCurrency(item.total)}</span>
                      <button
                        onClick={() => downloadProductImage(item.image, `${item.sku}.jpg`)}
                        className="block text-[10px] text-brand-600 hover:underline mt-0.5"
                      >
                        Save Photo
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Timeline Stepper */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Fulfillment Journey</h4>
              <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {order.timeline && order.timeline.length > 0 ? (
                  order.timeline.map((evt, idx) => (
                    <div key={idx} className="relative flex items-start gap-3">
                      <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-brand-600 border-2 border-white flex items-center justify-center text-white shadow-xs">
                        <CheckCircle2 className="w-3 h-3" />
                      </div>
                      <div className="min-w-0 text-xs">
                        <p className="font-semibold text-slate-900">{evt.label}</p>
                        {evt.note && <p className="text-slate-500 text-[11px]">{evt.note}</p>}
                        <p className="text-[10px] text-slate-400 mt-0.5">{formatDate(evt.timestamp)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">Order logged and waiting in queue.</p>
                )}
              </div>
            </div>

            {/* Financial Ledger */}
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal:</span>
                <span className="font-medium text-slate-800">{formatCurrency(order.subtotal || order.item.total)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Courier Logistics Charge:</span>
                <span className="font-medium text-slate-800">{formatCurrency(order.shippingCharges || 0)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Payment Mode:</span>
                <span className="font-semibold text-brand-700 capitalize">{order.shippingPaymentMode || 'Online Prepaid'}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Amount Paid:</span>
                <span className="text-brand-600 font-extrabold">{formatCurrency(order.totalAmount || (order.subtotal || order.item.total) + (order.shippingCharges || 0))}</span>
              </div>
            </div>
          </div>

          {/* Drawer Actions Footer */}
          <div className="p-4 sm:p-5 border-t border-slate-100 bg-white sticky bottom-0 z-20 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadOrderPDF(order)}
                leftIcon={<FileDown className="w-4 h-4 text-brand-600" />}
              >
                Invoice PDF
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadOrderCSV(order)}
                leftIcon={<Download className="w-4 h-4 text-slate-500" />}
              >
                Export CSV
              </Button>
            </div>

            {order.status !== 'delivered' && (
              <Button
                variant="soft"
                size="sm"
                className="w-full text-xs font-semibold"
                onClick={handleAdvanceStatus}
              >
                Simulate Next Dispatch Step ({order.status === 'pending' ? 'Approve' : order.status === 'approved' ? 'Ship' : 'Deliver'})
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

