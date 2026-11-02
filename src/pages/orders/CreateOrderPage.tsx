import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  Package,
  User,
  MapPin,
  CreditCard,
  Plus,
  Trash2,
  Truck,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  FileDown
} from 'lucide-react';
import { ordersService, type QuoteResponse } from '../../services/ordersService';
import { productsService } from '../../services/productsService';
import type { Product, Order } from '../../types/dropshipper';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { addToast } from '../../store/slices/uiSlice';
import { addLocalOrder } from '../../store/slices/ordersSlice';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { formatCurrency } from '../../lib/utils';
import { loadRazorpayScript } from '../../utils/razorpay';
import { downloadOrderPDF } from '../../utils/exportUtils';

export const CreateOrderPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // Selected product passed via state or store
  const preselected = (location.state as any)?.preselectedProduct as Product | undefined;
  const storePreselected = useAppSelector((state) => state.products.selectedProductForCreate);
  const initialProduct = preselected || storePreselected;

  // Available catalog products for picker
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);

  // Stepped Form State
  // 1. Line Items
  const [selectedItems, setSelectedItems] = useState<
    Array<{ product: Product; quantity: number }>
  >([]);

  // 2. Customer
  const [customer, setCustomer] = useState({
    name: '',
    email: '',
    phone: ''
  });

  // 3. Shipping Address
  const [address, setAddress] = useState({
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India'
  });

  const [warehousePincode, setWarehousePincode] = useState('421004');
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');
  const [notes, setNotes] = useState('');

  // Live Shipping Quote
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  // Initialize line items
  useEffect(() => {
    productsService.getProducts().then((res) => {
      setCatalogProducts(res.products);
      if (initialProduct) {
        setSelectedItems([{ product: initialProduct, quantity: 1 }]);
      } else if (res.products.length > 0) {
        setSelectedItems([{ product: res.products[0], quantity: 1 }]);
      }
    });
  }, [initialProduct]);

  // Fetch live shipping quote when pincode or items change
  useEffect(() => {
    if (address.postalCode.length === 6 && selectedItems.length > 0) {
      setQuoteLoading(true);
      ordersService
        .getQuote({
          items: selectedItems.map((item) => ({
            productId: item.product.id,
            sku: item.product.sku,
            quantity: item.quantity
          })),
          customerPincode: address.postalCode,
          warehousePincode,
          paymentMode: paymentMethod === 'online' ? 'prepaid' : 'cod'
        })
        .then((q) => setQuote(q))
        .catch((err) => console.error(err))
        .finally(() => setQuoteLoading(false));
    }
  }, [address.postalCode, selectedItems, warehousePincode, paymentMethod]);

  const handleAddItem = (prod: Product) => {
    const existing = selectedItems.find((it) => it.product.id === prod.id);
    if (existing) {
      setSelectedItems(
        selectedItems.map((it) =>
          it.product.id === prod.id ? { ...it, quantity: it.quantity + 1 } : it
        )
      );
    } else {
      setSelectedItems([...selectedItems, { product: prod, quantity: 1 }]);
    }
  };

  const handleUpdateQty = (productId: string, delta: number) => {
    setSelectedItems(
      selectedItems
        .map((it) => {
          if (it.product.id === productId) {
            const nextQty = it.quantity + delta;
            return nextQty > 0 ? { ...it, quantity: nextQty } : null;
          }
          return it;
        })
        .filter(Boolean) as Array<{ product: Product; quantity: number }>
    );
  };

  const handleRemoveItem = (productId: string) => {
    setSelectedItems(selectedItems.filter((it) => it.product.id !== productId));
  };

  // Price computations
  const subtotal = selectedItems.reduce(
    (sum, it) => sum + it.product.dropshipPrice * it.quantity,
    0
  );
  const deliveryCharges = quote ? quote.deliveryCharges : 65;
  const totalPayable = subtotal + deliveryCharges;

  // Submit Order & Razorpay Flow
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedItems.length === 0) {
      dispatch(addToast({ type: 'warning', title: 'Cart Empty', message: 'Please select at least one item.' }));
      return;
    }
    if (!customer.name || !customer.phone || !address.line1 || !address.postalCode) {
      dispatch(addToast({ type: 'warning', title: 'Incomplete Details', message: 'Please complete customer contact & delivery address.' }));
      return;
    }

    setSubmitting(true);

    try {
      // 1. Submit order to backend
      const orderPayload = {
        items: selectedItems.map((it) => ({
          productId: it.product.id,
          sku: it.product.sku,
          productName: it.product.name,
          dropshipPrice: it.product.dropshipPrice,
          image: it.product.thumbnail || it.product.images[0],
          quantity: it.quantity
        })),
        customer,
        shippingAddress: address,
        customerPincode: address.postalCode,
        warehousePincode,
        paymentMethod,
        notes
      };

      const res = await ordersService.createOrder(orderPayload);
      const internalOrderId = res.orderId;

      // 2. Open Razorpay Modal if paymentMethod is online
      if (res.razorpay && paymentMethod === 'online') {
        await loadRazorpayScript();

        const options = {
          key: res.razorpay.keyId,
          amount: res.razorpay.amount,
          currency: res.razorpay.currency || 'INR',
          name: 'DropFlow Logistics',
          description: `Fulfillment Order #${internalOrderId}`,
          order_id: res.razorpay.orderId,
          prefill: {
            name: customer.name,
            email: customer.email,
            contact: customer.phone
          },
          theme: {
            color: '#4F46E5'
          },
          handler: async (response: any) => {
            try {
              // Verify Payment on Backend
              await ordersService.verifyPayment({
                orderId: internalOrderId,
                razorpay_order_id: response.razorpay_order_id || res.razorpay!.orderId,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature || 'simulated_sig'
              });

              // Create local order structure for immediate download & state sync
              const createdOrderObj: Order = {
                id: internalOrderId,
                orderNumber: internalOrderId,
                customer,
                shippingAddress: address,
                item: {
                  productId: selectedItems[0].product.id,
                  productName: selectedItems[0].product.name,
                  sku: selectedItems[0].product.sku,
                  image: selectedItems[0].product.thumbnail,
                  dropshipPrice: selectedItems[0].product.dropshipPrice,
                  quantity: selectedItems[0].quantity,
                  total: selectedItems[0].product.dropshipPrice * selectedItems[0].quantity
                },
                items: selectedItems.map((it) => ({
                  productId: it.product.id,
                  productName: it.product.name,
                  sku: it.product.sku,
                  image: it.product.thumbnail,
                  dropshipPrice: it.product.dropshipPrice,
                  quantity: it.quantity,
                  total: it.product.dropshipPrice * it.quantity
                })),
                status: 'approved',
                shippingCharges: deliveryCharges,
                subtotal,
                totalAmount: totalPayable,
                shippingPaymentMode: 'prepaid',
                estimatedDeliveryDays: quote?.shipping.estimatedDays || '3 Business Days',
                shippingProvider: quote?.shipping.courierName || 'Delhivery Express',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                timeline: [
                  {
                    status: 'created',
                    label: 'Order Placed & Paid',
                    timestamp: new Date().toISOString(),
                    note: `Razorpay Payment ID: ${response.razorpay_payment_id}`
                  }
                ]
              };

              dispatch(addLocalOrder(createdOrderObj));
              setCompletedOrder(createdOrderObj);

              // Confetti
              confetti({
                particleCount: 130,
                spread: 80,
                origin: { y: 0.6 }
              });

              dispatch(addToast({
                type: 'success',
                title: 'Order Paid & Dispatched!',
                message: `Order #${internalOrderId} successfully allocated to warehouse queue.`
              }));
            } catch (err: any) {
              dispatch(addToast({ type: 'error', title: 'Payment Verification Error', message: err.message }));
            }
          },
          modal: {
            ondismiss: () => {
              dispatch(addToast({ type: 'info', title: 'Checkout Closed', message: 'You can complete payment anytime.' }));
              setSubmitting(false);
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // COD Direct confirmation
        const codOrderObj: Order = {
          id: internalOrderId,
          orderNumber: internalOrderId,
          customer,
          shippingAddress: address,
          item: {
            productId: selectedItems[0].product.id,
            productName: selectedItems[0].product.name,
            sku: selectedItems[0].product.sku,
            image: selectedItems[0].product.thumbnail,
            dropshipPrice: selectedItems[0].product.dropshipPrice,
            quantity: selectedItems[0].quantity,
            total: selectedItems[0].product.dropshipPrice * selectedItems[0].quantity
          },
          status: 'pending',
          shippingCharges: deliveryCharges,
          subtotal,
          totalAmount: totalPayable,
          shippingPaymentMode: 'cod',
          estimatedDeliveryDays: '3 - 4 Days',
          shippingProvider: 'BlueDart Air COD',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          timeline: [
            {
              status: 'created',
              label: 'COD Order Created',
              timestamp: new Date().toISOString()
            }
          ]
        };

        dispatch(addLocalOrder(codOrderObj));
        setCompletedOrder(codOrderObj);

        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });

        dispatch(addToast({
          type: 'success',
          title: 'COD Order Booked',
          message: `Order #${internalOrderId} registered for COD pickup.`
        }));
      }
    } catch (err: any) {
      dispatch(addToast({ type: 'error', title: 'Failed to create order', message: err.message }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-brand-600 uppercase tracking-wider mb-1">
          <Package className="w-3.5 h-3.5" />
          Direct Dropship Order Terminal
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Create New Dropship Order
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Enter customer shipping details, compute live air/surface freight, and trigger direct factory dispatch.
        </p>
      </div>

      {/* Success Modal / Banner */}
      {completedOrder ? (
        <div className="rounded-3xl border border-emerald-200 bg-white p-8 text-center space-y-5 shadow-xl">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Order Placed Successfully!</h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Your dropship order has been logged and assigned order reference:
          </p>
          <div className="inline-block bg-brand-50 border border-brand-200 px-5 py-2 rounded-2xl font-mono font-extrabold text-brand-700 text-lg">
            {completedOrder.orderNumber}
          </div>

          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <Button
              variant="outline"
              size="md"
              onClick={() => downloadOrderPDF(completedOrder)}
              leftIcon={<FileDown className="w-4 h-4 text-brand-600" />}
            >
              Download PDF Invoice
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/orders')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              View Orders Pipeline
            </Button>
          </div>
        </div>
      ) : (
        /* Stepped Form */
        <form onSubmit={handleSubmitOrder} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column (2 Cols): Items, Customer, Address */}
            <div className="lg:col-span-2 space-y-6">
              {/* Card 1: Selected Items & Quantity */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-brand-600 text-white font-bold text-xs flex items-center justify-center">
                      1
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                      Selected Catalog Items
                    </h3>
                  </div>

                  {/* Add more item dropdown */}
                  <select
                    onChange={(e) => {
                      const found = catalogProducts.find((p) => p.id === e.target.value);
                      if (found) handleAddItem(found);
                      e.target.value = '';
                    }}
                    defaultValue=""
                    className="text-xs border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-brand-500 font-medium"
                  >
                    <option value="" disabled>+ Add Another Product</option>
                    {catalogProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({formatCurrency(p.dropshipPrice)})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedItems.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {selectedItems.map((item) => (
                      <div key={item.product.id} className="py-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={item.product.thumbnail || item.product.images[0]}
                            alt={item.product.name}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200/70"
                          />
                          <div className="min-w-0">
                            <h4 className="text-xs font-semibold text-slate-900 truncate max-w-xs sm:max-w-md">
                              {item.product.name}
                            </h4>
                            <p className="text-[11px] font-mono text-slate-400">SKU: {item.product.sku}</p>
                            <p className="text-xs font-bold text-brand-600">
                              {formatCurrency(item.product.dropshipPrice)} / unit
                            </p>
                          </div>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(item.product.id, -1)}
                              className="px-2.5 py-1 hover:bg-slate-200 text-xs font-bold transition-colors"
                            >
                              -
                            </button>
                            <span className="px-3 py-1 text-xs font-semibold">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(item.product.id, 1)}
                              className="px-2.5 py-1 hover:bg-slate-200 text-xs font-bold transition-colors"
                            >
                              +
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.product.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 text-center py-4">No items selected.</p>
                )}
              </div>

              {/* Card 2: Customer Contact */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <span className="w-6 h-6 rounded-full bg-brand-600 text-white font-bold text-xs flex items-center justify-center">
                    2
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    Recipient / Customer Details
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="Customer Full Name"
                    placeholder="e.g. Aditya Sharma"
                    value={customer.name}
                    onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                    required
                  />

                  <Input
                    label="Mobile Phone Number"
                    placeholder="+91 98201 12345"
                    value={customer.phone}
                    onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                    required
                  />

                  <Input
                    label="Email Address (For AWB Tracking)"
                    type="email"
                    placeholder="aditya@example.com"
                    value={customer.email}
                    onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                  />
                </div>
              </div>

              {/* Card 3: Shipping Address & Live Quote */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <span className="w-6 h-6 rounded-full bg-brand-600 text-white font-bold text-xs flex items-center justify-center">
                    3
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    Shipping Destination Address
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-3">
                    <Input
                      label="Flat, Building, Street Address"
                      placeholder="Flat 402, Sea Breeze Tower, Bandra West"
                      value={address.line1}
                      onChange={(e) => setAddress({ ...address, line1: e.target.value })}
                      required
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <Input
                      label="Landmark / Locality (Optional)"
                      placeholder="Near Mehboob Studio"
                      value={address.line2}
                      onChange={(e) => setAddress({ ...address, line2: e.target.value })}
                    />
                  </div>

                  <Input
                    label="Destination PIN Code"
                    placeholder="e.g. 400050"
                    maxLength={6}
                    value={address.postalCode}
                    onChange={(e) => setAddress({ ...address, postalCode: e.target.value.replace(/\D/g, '') })}
                    required
                    helperText="Triggers real-time logistics route quote"
                  />

                  <Input
                    label="City"
                    placeholder="Mumbai"
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    required
                  />

                  <Input
                    label="State"
                    placeholder="Maharashtra"
                    value={address.state}
                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                    required
                  />
                </div>

                {/* Live Route Quote Preview */}
                {quoteLoading ? (
                  <div className="p-3.5 rounded-xl bg-slate-50 text-xs text-slate-500 animate-pulse flex items-center gap-2">
                    <Truck className="w-4 h-4 text-brand-600 animate-bounce" />
                    Calculating live express courier freight...
                  </div>
                ) : quote ? (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-brand-50/70 to-indigo-50/40 border border-brand-200/80 text-xs space-y-1.5">
                    <div className="flex items-center justify-between font-bold text-brand-900">
                      <span className="flex items-center gap-1.5">
                        <Truck className="w-4 h-4 text-brand-600" />
                        Logistics Partner: {quote.shipping.courierName}
                      </span>
                      <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
                        Serviceable Route
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Estimated Transit SLA:</span>
                      <span className="font-semibold text-slate-800">{quote.shipping.estimatedDays}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Logistics Delivery Charge:</span>
                      <span className="font-bold text-slate-900">{formatCurrency(quote.deliveryCharges)}</span>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Right Column (1 Col): Financial Breakdown & Payment Checkout */}
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-5 sticky top-24">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <span className="w-6 h-6 rounded-full bg-brand-600 text-white font-bold text-xs flex items-center justify-center">
                    4
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    Payment & Settlement
                  </h3>
                </div>

                {/* Payment Mode Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 block">Payment Method</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('online')}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all text-left ${
                        paymentMethod === 'online'
                          ? 'border-brand-600 bg-brand-50/60 text-brand-700 shadow-xs ring-1 ring-brand-500/20'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 mb-1 text-brand-600" />
                      Razorpay Online (UPI/Cards)
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cod')}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all text-left ${
                        paymentMethod === 'cod'
                          ? 'border-brand-600 bg-brand-50/60 text-brand-700 shadow-xs ring-1 ring-brand-500/20'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Truck className="w-4 h-4 mb-1 text-brand-600" />
                      Cash on Delivery (COD)
                    </button>
                  </div>
                </div>

                {/* Cost Summary Table */}
                <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Items Subtotal:</span>
                    <span className="font-semibold text-slate-800">{formatCurrency(subtotal)}</span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>Courier Delivery Fee:</span>
                    <span className="font-semibold text-slate-800">{formatCurrency(deliveryCharges)}</span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>Platform Insurance & Packing:</span>
                    <span className="font-semibold text-emerald-600">Free (Waived)</span>
                  </div>

                  <div className="flex justify-between text-base font-extrabold text-slate-900 pt-3 border-t border-slate-200">
                    <span>Total Payable:</span>
                    <span className="text-brand-600">{formatCurrency(totalPayable)}</span>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full shadow-md"
                  isLoading={submitting}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  {paymentMethod === 'online' ? `Pay ${formatCurrency(totalPayable)} via Razorpay` : 'Confirm COD Dispatch'}
                </Button>

                <div className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Encrypted Razorpay Checkout & Verified Warehouse SLA
                </div>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
