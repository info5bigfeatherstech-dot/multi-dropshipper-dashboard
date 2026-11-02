import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchOrders,
  setSelectedOrderForDetail,
  setStatusFilter as setReduxStatusFilter,
  setSearchQuery as setReduxSearchQuery
} from '../../store/slices/ordersSlice';
import { addToast } from '../../store/slices/uiSlice';
import type { Order, OrderStatus } from '../../types/dropshipper';
import { StatusBadge } from '../../components/common/StatusBadge';
import { StatCard } from '../../components/common/StatCard';
import { OrderDetailDrawer } from '../../components/orders/OrderDetailDrawer';
import { ServiceabilityCheckerModal } from '../../components/shipping/ServiceabilityCheckerModal';
import { Button } from '../../components/ui/Button';
import { formatCurrency, formatDate } from '../../lib/utils';
import { downloadOrderPDF, downloadOrderCSV } from '../../utils/exportUtils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  Truck,
  Search,
  Eye,
  FileText,
  ChevronLeft,
  ChevronRight,
  Plus,
  MoreHorizontal,
  Download,
  Copy,
  ChevronDown,
  RefreshCw,
  Loader2
} from 'lucide-react';

export const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();

  const newlyCreatedOrderId = (location.state as any)?.newlyCreatedOrderId;
  const { orders, loading, totalOrdersCount: reduxTotalCount } = useAppSelector((state) => state.orders);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [dateRange, setDateRange] = useState<'all' | 'today' | '7days' | '30days'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showServiceabilityModal, setShowServiceabilityModal] = useState(false);
  const pageSize = 10;

  // Initial load
  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await dispatch(fetchOrders()).unwrap();
      dispatch(
        addToast({
          type: 'success',
          title: 'Orders Refreshed',
          message: 'Synchronized latest orders from server.'
        })
      );
    } catch {
      dispatch(
        addToast({
          type: 'error',
          title: 'Refresh Failed',
          message: 'Could not synchronize orders.'
        })
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  // Stat calculations
  const totalOrdersCount = orders.length || reduxTotalCount;
  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const approvedCount = orders.filter((o) => o.status === 'approved').length;
  const shippedOrDeliveredCount = orders.filter(
    (o) => o.status === 'shipped' || o.status === 'delivered'
  ).length;

  // Filter orders client-side
  const filteredOrders = useMemo(() => {
    let result = [...orders];

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (o) =>
          o.orderNumber?.toLowerCase().includes(q) ||
          o.customer?.name?.toLowerCase().includes(q) ||
          o.customer?.email?.toLowerCase().includes(q) ||
          o.customer?.phone?.toLowerCase().includes(q) ||
          o.item?.productName?.toLowerCase().includes(q) ||
          o.item?.sku?.toLowerCase().includes(q) ||
          (Array.isArray(o.items) && o.items.some((it) => it.productName.toLowerCase().includes(q) || it.sku.toLowerCase().includes(q)))
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((o) => o.status === statusFilter);
    }

    if (dateRange !== 'all') {
      const now = new Date().getTime();
      const oneDay = 24 * 60 * 60 * 1000;
      if (dateRange === 'today') {
        result = result.filter((o) => now - new Date(o.createdAt).getTime() <= oneDay);
      } else if (dateRange === '7days') {
        result = result.filter((o) => now - new Date(o.createdAt).getTime() <= 7 * oneDay);
      } else if (dateRange === '30days') {
        result = result.filter((o) => now - new Date(o.createdAt).getTime() <= 30 * oneDay);
      }
    }

    return result;
  }, [orders, search, statusFilter, dateRange]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredOrders.length / pageSize) || 1;
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredOrders.slice(startIndex, startIndex + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  // Adjust page if out of bounds
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const handleFilterByStatus = (status: OrderStatus | 'all') => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleQuickDownloadPDF = (e: React.MouseEvent, order: Order) => {
    e.stopPropagation();
    try {
      downloadOrderPDF(order);
      dispatch(
        addToast({
          type: 'success',
          title: 'PDF Export Ready',
          message: `Saved ${order.orderNumber}_Details.pdf`
        })
      );
    } catch {
      dispatch(
        addToast({
          type: 'error',
          title: 'Download Failed',
          message: 'Could not export PDF.'
        })
      );
    }
  };

  const handleQuickDownloadCSV = (order: Order) => {
    try {
      downloadOrderCSV(order);
      dispatch(
        addToast({
          type: 'success',
          title: 'CSV Export Ready',
          message: `Saved ${order.orderNumber}_export.csv`
        })
      );
    } catch {
      dispatch(
        addToast({
          type: 'error',
          title: 'Download Failed',
          message: 'Could not export CSV.'
        })
      );
    }
  };

  const handleCopyId = (orderNumber: string) => {
    navigator.clipboard.writeText(orderNumber);
    dispatch(
      addToast({
        type: 'info',
        title: 'Order Number Copied',
        message: `${orderNumber} copied to clipboard.`
      })
    );
  };

  const handleBatchCopyIDs = () => {
    if (filteredOrders.length === 0) return;
    const ids = filteredOrders.map((o) => o.orderNumber).join(', ');
    navigator.clipboard.writeText(ids);
    dispatch(
      addToast({
        type: 'info',
        title: 'Copied Batch IDs',
        message: `${filteredOrders.length} order IDs copied to clipboard.`
      })
    );
  };

  const statusChips: Array<{ key: OrderStatus | 'all'; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending Approval' },
    { key: 'approved', label: 'Approved' },
    { key: 'shipped', label: 'Shipped' },
    { key: 'delivered', label: 'Delivered' },
    { key: 'rejected', label: 'Rejected' }
  ];

  return (
    <div className="space-y-5 animate-in fade-in pb-12">
      {/* Slide-over Order Detail Drawer */}
      <OrderDetailDrawer />

      {/* Header with Title, Badge & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              All Orders
            </h2>
            <span className="font-semibold text-xs px-2.5 py-0.5 rounded-full text-brand-700 bg-brand-50 border border-brand-200">
              {totalOrdersCount} Total
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time fulfillment tracking, admin verification states, and on-demand dropship dispatch.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || loading}
            className="rounded-xl shadow-xs gap-1.5 text-xs font-semibold text-slate-700 h-9"
            title="Refresh orders"
          >
            {isRefreshing || loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
          </Button>

          {/* Check Serviceability Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowServiceabilityModal(true)}
            leftIcon={<Truck className="w-3.5 h-3.5 text-indigo-600" />}
            className="rounded-xl shadow-xs gap-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:border-indigo-200 h-9"
          >
            Check Serviceability
          </Button>

          {/* Export & Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Download className="w-3.5 h-3.5 text-brand-600" />}
                rightIcon={<ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                className="rounded-xl shadow-xs gap-1.5 text-xs font-semibold text-slate-700 h-9"
              >
                Export & Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white shadow-xl">
              <DropdownMenuLabel>Data Exports</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  if (filteredOrders.length > 0) {
                    handleQuickDownloadCSV(filteredOrders[0]);
                  }
                }}
                className="cursor-pointer"
              >
                <FileText className="w-4 h-4 text-brand-600 mr-2" />
                <span>Export CSV Data</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  if (filteredOrders.length > 0) {
                    handleQuickDownloadPDF(e, filteredOrders[0]);
                  }
                }}
                className="cursor-pointer"
              >
                <Download className="w-4 h-4 text-brand-600 mr-2" />
                <span>Download Sample PDF</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Batch Utilities</DropdownMenuLabel>
              <DropdownMenuItem onClick={handleBatchCopyIDs} className="cursor-pointer">
                <Copy className="w-4 h-4 text-slate-500 mr-2" />
                <span>Copy Visible IDs</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Create Order Button */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/orders/create')}
            leftIcon={<Plus className="w-4 h-4" />}
            className="rounded-xl shadow-md gap-1.5 text-xs font-bold h-9"
          >
            Create Order
          </Button>
        </div>
      </div>

      {/* 4 Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="TOTAL ORDERS"
          value={totalOrdersCount}
          subtext="All customer bookings"
          icon={<ShoppingBag className="w-5 h-5" />}
          accent="indigo"
          isActive={statusFilter === 'all'}
          onClick={() => handleFilterByStatus('all')}
        />

        <StatCard
          label="PENDING APPROVAL"
          value={pendingCount}
          subtext="Waiting for admin hold"
          icon={<Clock className="w-5 h-5" />}
          accent="amber"
          isActive={statusFilter === 'pending'}
          onClick={() => handleFilterByStatus('pending')}
        />

        <StatCard
          label="APPROVED"
          value={approvedCount}
          subtext="Dispatched to warehouse"
          icon={<CheckCircle2 className="w-5 h-5" />}
          accent="emerald"
          isActive={statusFilter === 'approved'}
          onClick={() => handleFilterByStatus('approved')}
        />

        <StatCard
          label="SHIPPED / DELIVERED"
          value={shippedOrDeliveredCount}
          subtext="In transit or finished"
          icon={<Truck className="w-5 h-5" />}
          accent="blue"
          isActive={statusFilter === 'shipped' || statusFilter === 'delivered'}
          onClick={() => handleFilterByStatus('shipped')}
        />
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by order #, customer, email or product SKU..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Status Select */}
          <div className="w-full sm:w-44">
            <Select
              value={statusFilter}
              onValueChange={(val) => {
                handleFilterByStatus(val as any);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending Approval</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range Select */}
          <div className="w-full sm:w-40">
            <Select
              value={dateRange}
              onValueChange={(val: any) => {
                setDateRange(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Last 24 Hours</SelectItem>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Status Chips Row */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 no-scrollbar">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1 shrink-0">
            STATUS:
          </span>
          {statusChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => handleFilterByStatus(chip.key)}
              className={`text-xs px-3 py-1 rounded-lg shrink-0 transition-colors cursor-pointer ${
                statusFilter === chip.key
                  ? 'bg-brand-600 text-white font-semibold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Newly Placed Order Success Banner */}
      {newlyCreatedOrderId && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-900 shadow-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm text-emerald-950">
                Payment Completed & Order Placed Successfully!
              </p>
              <p className="text-emerald-700 mt-0.5">
                Order <span className="font-mono font-bold text-emerald-900">{newlyCreatedOrderId}</span> is recorded and verified.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            disabled={loading || isRefreshing}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
            className="bg-white border-emerald-300 text-emerald-800 hover:bg-emerald-100 self-start sm:self-auto text-xs font-semibold"
          >
            Refresh API
          </Button>
        </div>
      )}

      {/* Orders Data Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        {loading && orders.length === 0 ? (
          /* Loading skeleton */
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4 animate-pulse">
                <div className="w-24 h-4 bg-slate-200 rounded" />
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 bg-slate-200 rounded-xl shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <div className="w-48 h-3.5 bg-slate-200 rounded" />
                    <div className="w-24 h-3 bg-slate-100 rounded" />
                  </div>
                </div>
                <div className="w-28 h-3 bg-slate-200 rounded hidden md:block" />
                <div className="w-20 h-3 bg-slate-100 rounded hidden sm:block" />
                <div className="w-16 h-4 bg-slate-200 rounded" />
                <div className="w-20 h-6 bg-slate-200 rounded-lg" />
                <div className="flex gap-1.5">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg" />
                  <div className="w-8 h-8 bg-slate-100 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : paginatedOrders.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-base font-bold text-slate-800">No Orders Found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              We couldn't find any orders matching your search or filters. You can create a new order anytime.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/orders/create')}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Create New Order
            </Button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4 sm:px-6">ORDER ID</th>
                    <th className="py-3.5 px-4">PRODUCT DETAILS</th>
                    <th className="py-3.5 px-4 hidden md:table-cell">CUSTOMER</th>
                    <th className="py-3.5 px-4 hidden sm:table-cell">DATE</th>
                    <th className="py-3.5 px-4">AMOUNT</th>
                    <th className="py-3.5 px-4">STATUS</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedOrders.map((order) => {
                    const isNewlyCreated = Boolean(
                      newlyCreatedOrderId &&
                        (order.orderNumber === newlyCreatedOrderId || order.id === newlyCreatedOrderId)
                    );

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

                    const hasMultiple = items.length > 1;
                    const totalQty = items.reduce((acc, it) => acc + (it.quantity || 1), 0);
                    const totalAmount =
                      order.totalAmount ??
                      order.subtotal ??
                      (items.reduce((acc, it) => acc + (it.total || 0), 0) + (order.shippingCharges || 0));

                    return (
                      <tr
                        key={order.id}
                        onClick={() => dispatch(setSelectedOrderForDetail(order))}
                        className={`hover:bg-slate-50/80 transition-colors cursor-pointer group ${
                          isNewlyCreated
                            ? 'bg-emerald-50/80 hover:bg-emerald-100/70 border-l-4 border-l-emerald-500'
                            : ''
                        }`}
                      >
                        {/* Order ID */}
                        <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              dispatch(setSelectedOrderForDetail(order));
                            }}
                            className="font-mono font-bold text-brand-600 hover:text-brand-700 hover:underline cursor-pointer"
                          >
                            {order.orderNumber}
                          </span>
                          {isNewlyCreated && (
                            <span className="ml-2 bg-emerald-600 text-white text-[9px] font-bold uppercase tracking-wider py-0.5 px-1.5 rounded-md">
                              Just Placed
                            </span>
                          )}
                        </td>

                        {/* Product Details */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3 min-w-[200px]">
                            <div className="relative shrink-0">
                              <img
                                src={primaryItem.image}
                                alt=""
                                className="w-10 h-10 rounded-xl object-cover border border-slate-200 bg-slate-50"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80';
                                }}
                              />
                              {hasMultiple && (
                                <span className="absolute -top-1.5 -right-1.5 bg-brand-600 text-white font-bold text-[9px] px-1.5 py-0.5 rounded-full shadow-xs">
                                  +{items.length - 1}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 truncate max-w-[220px]">
                                {primaryItem.productName}
                              </p>
                              <span className="text-[11px] text-slate-400 font-mono">
                                {hasMultiple
                                  ? `Qty: ${totalQty} across ${items.length} items`
                                  : `Qty: ${primaryItem.quantity} • ${primaryItem.sku}`}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Customer */}
                        <td className="py-4 px-4 hidden md:table-cell">
                          <div>
                            <p className="font-medium text-slate-800">
                              {order.customer?.name || 'Customer'}
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono">
                              {order.customer?.phone || order.customer?.email || '—'}
                            </p>
                          </div>
                        </td>

                        {/* Date */}
                        <td className="py-4 px-4 hidden sm:table-cell text-slate-500 whitespace-nowrap">
                          {formatDate(order.createdAt)}
                        </td>

                        {/* Amount */}
                        <td className="py-4 px-4 font-bold text-slate-900 whitespace-nowrap text-sm">
                          {formatCurrency(totalAmount)}
                        </td>

                        {/* Status Badge with dot and icon */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <StatusBadge status={order.status} size="sm" />
                        </td>

                        {/* Actions */}
                        <td
                          className="py-4 px-4 sm:px-6 text-right whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1">
                            {/* Eye button to open Order Drawer */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                dispatch(setSelectedOrderForDetail(order));
                              }}
                              className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors cursor-pointer"
                              title="Inspect Order Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Three dots dropdown menu */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  type="button"
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                  title="More Actions"
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 bg-white shadow-xl">
                                <DropdownMenuLabel>Order {order.orderNumber}</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    dispatch(setSelectedOrderForDetail(order));
                                  }}
                                  className="cursor-pointer"
                                >
                                  <Eye className="w-4 h-4 text-brand-600 mr-2" />
                                  <span>View Drawer</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => handleQuickDownloadPDF(e, order)}
                                  className="cursor-pointer"
                                >
                                  <FileText className="w-4 h-4 text-brand-600 mr-2" />
                                  <span>Download PDF</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleQuickDownloadCSV(order);
                                  }}
                                  className="cursor-pointer"
                                >
                                  <Download className="w-4 h-4 text-brand-600 mr-2" />
                                  <span>Export CSV</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyId(order.orderNumber);
                                  }}
                                  className="cursor-pointer"
                                >
                                  <Copy className="w-4 h-4 text-slate-500 mr-2" />
                                  <span>Copy Order ID</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-t border-slate-200/80 bg-slate-50/50 text-xs text-slate-500">
              <div>
                Showing{' '}
                <span className="font-semibold text-slate-700">
                  {filteredOrders.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
                </span>{' '}
                to{' '}
                <span className="font-semibold text-slate-700">
                  {Math.min(currentPage * pageSize, filteredOrders.length)}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-slate-700">
                  {filteredOrders.length}
                </span>{' '}
                orders
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-slate-600"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-mono text-xs text-slate-600 font-semibold px-1">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-slate-600"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Serviceability Checker Modal */}
      <ServiceabilityCheckerModal
        isOpen={showServiceabilityModal}
        onClose={() => setShowServiceabilityModal(false)}
      />
    </div>
  );
};

export default OrdersPage;
