import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  PlusCircle,
  Search,
  Filter,
  Eye,
  FileDown,
  Truck,
  CheckCircle2,
  Clock,
  Package,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchOrders, setSelectedOrderForDetail, setStatusFilter, setSearchQuery } from '../../store/slices/ordersSlice';
import { OrderDetailDrawer } from '../../components/orders/OrderDetailDrawer';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatCurrency, formatDate } from '../../lib/utils';
import { downloadOrderPDF, downloadOrderCSV } from '../../utils/exportUtils';
import type { Order } from '../../types/dropshipper';

export const OrdersPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { orders, statusFilter, searchQuery, loading } = useAppSelector((state) => state.orders);

  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);

  const handleStatusTab = (status: string) => {
    dispatch(setStatusFilter(status));
    dispatch(fetchOrders({ status }));
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setSearchQuery(e.target.value));
    dispatch(fetchOrders({ search: e.target.value }));
  };

  // Compute metrics
  const totalCount = orders.length;
  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const shippedCount = orders.filter((o) => o.status === 'shipped').length;
  const deliveredCount = orders.filter((o) => o.status === 'delivered').length;

  return (
    <div className="space-y-6">
      {/* Slide-over Detail Drawer */}
      <OrderDetailDrawer />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-brand-600 uppercase tracking-wider mb-1">
            <ShoppingBag className="w-3.5 h-3.5" />
            Merchant Fulfillment
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Orders & Courier Tracking
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Monitor real-time fulfillment pipelines, live Delhivery/BlueDart AWB dispatches, and download VAT invoices.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => dispatch(fetchOrders())}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/orders/create')}
            leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
          >
            New Order
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2">
            <span>TOTAL ORDERS</span>
            <Package className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{totalCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">Logged in seller ledger</p>
        </div>

        {/* Pending */}
        <div className="rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50/40 to-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-amber-700 font-semibold mb-2">
            <span>PENDING DISPATCH</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-amber-900">{pendingCount}</div>
          <p className="text-[11px] text-amber-700/80 mt-1">Awaiting hub pick & pack</p>
        </div>

        {/* Shipped */}
        <div className="rounded-2xl border border-blue-200/70 bg-gradient-to-br from-blue-50/40 to-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-blue-700 font-semibold mb-2">
            <span>IN TRANSIT</span>
            <Truck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-blue-900">{shippedCount}</div>
          <p className="text-[11px] text-blue-700/80 mt-1">Active courier manifests</p>
        </div>

        {/* Delivered */}
        <div className="rounded-2xl border border-teal-200/70 bg-gradient-to-br from-teal-50/40 to-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-teal-700 font-semibold mb-2">
            <span>DELIVERED</span>
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-extrabold text-teal-900">{deliveredCount}</div>
          <p className="text-[11px] text-teal-700/80 mt-1">Confirmed customer receipt</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'All Orders' },
              { id: 'pending', label: 'Pending' },
              { id: 'approved', label: 'Approved' },
              { id: 'shipped', label: 'Shipped' },
              { id: 'delivered', label: 'Delivered' }
            ].map((tab) => {
              const isSelected = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleStatusTab(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-brand-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by order #, customer, AWB..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200/90 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>
      </div>

      {/* Orders Data Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        {orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Order Number</th>
                  <th className="px-5 py-3.5">Product Item</th>
                  <th className="px-5 py-3.5">Customer & City</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Courier & AWB</th>
                  <th className="px-5 py-3.5 text-right">Amount</th>
                  <th className="px-5 py-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => {
                  const items = Array.isArray(order.items) && order.items.length > 0 
                    ? order.items 
                    : (order.item ? [order.item] : []);
                  const primaryItem = items[0] || {
                    productName: 'Order Item',
                    sku: 'SKU-INVENTORY',
                    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&auto=format&fit=crop&q=80',
                    dropshipPrice: 0,
                    quantity: 1,
                    total: 0
                  };

                  const customerName = order.customer?.name || (order as any).customerName || 'Customer';
                  const city = order.shippingAddress?.city || '—';
                  const state = order.shippingAddress?.state || '';
                  const total = order.totalAmount ?? order.subtotal ?? primaryItem.total;

                  return (
                    <tr
                      key={order.id}
                      onClick={() => dispatch(setSelectedOrderForDetail(order))}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      {/* Order Number & Date */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900 font-mono">{order.orderNumber || order.id}</div>
                        <div className="text-[11px] text-slate-400">{formatDate(order.createdAt)}</div>
                      </td>

                      {/* Item Preview */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3 min-w-[200px]">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200/60">
                            <img src={primaryItem.image} alt="Item" className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 truncate max-w-[220px]">
                              {primaryItem.productName}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Qty: <strong>{primaryItem.quantity}</strong> {items.length > 1 && `(+${items.length - 1} more)`}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Customer Info */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="font-medium text-slate-900">{customerName}</div>
                        <div className="text-[11px] text-slate-400">
                          {city}{state ? `, ${state}` : ''}
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <Badge status={order.status} size="sm" />
                      </td>

                      {/* Courier & Tracking */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="font-medium text-slate-800">
                          {order.shippingCarrier || order.shippingProvider || 'Delhivery'}
                        </div>
                        <div className="font-mono text-[11px] text-brand-600 font-semibold">
                          {order.trackingNumber || 'Manifest Pending'}
                        </div>
                      </td>

                      {/* Financial Total */}
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <div className="font-bold text-slate-900 text-sm">
                          {formatCurrency(total)}
                        </div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">
                          {order.shippingPaymentMode || 'Prepaid'}
                        </div>
                      </td>

                      {/* Row Action Buttons */}
                      <td className="px-5 py-4 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => dispatch(setSelectedOrderForDetail(order))}
                            className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Inspect Order Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => downloadOrderPDF(order)}
                            className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Download PDF Invoice"
                          >
                            <FileDown className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center space-y-3">
            <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-base font-bold text-slate-800">No Orders Found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              There are no orders matching your current criteria. Create your first dropship order now!
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/orders/create')}
              leftIcon={<PlusCircle className="w-4 h-4" />}
            >
              Create New Order
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

