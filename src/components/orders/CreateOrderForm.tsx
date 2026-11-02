import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  Package,
  User,
  MapPin,
  CreditCard,
  Plus,
  Minus,
  Trash2,
  Truck,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  FileDown,
  Search,
  PackageSearch,
  ChevronDown
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '../ui/dropdown-menu';
import { openRazorpayCheckout } from '../../utils/razorpay';
import { ordersService, type QuoteResponse } from '../../services/ordersService';
import { productsService } from '../../services/productsService';
import type { Product, Order } from '../../types/dropshipper';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { addToast } from '../../store/slices/uiSlice';
import { addLocalOrder } from '../../store/slices/ordersSlice';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { formatCurrency } from '../../lib/utils';
import { downloadOrderPDF } from '../../utils/exportUtils';
import { validateEmail, validatePhone, sanitizeOrderAddress, cleanPersonFullName, cleanPhoneNumber } from '../../utils/validation';
import { ShippingRatesCard } from '../shipping/ShippingRatesCard';

export interface CreateOrderFormProps {
  initialProduct?: Product;
}

export const CreateOrderForm: React.FC<CreateOrderFormProps> = ({ initialProduct }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const storeProducts = useAppSelector((state) => state.products.products);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>(storeProducts || []);

  // Multi-product line items
  const [selectedItems, setSelectedItems] = useState<
    Array<{ product: Product; quantity: number }>
  >([]);

  // Search Bar state for adding products
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Customer contact
  const [customer, setCustomer] = useState({
    name: '',
    email: '',
    phone: ''
  });

  // Validation state
  const [formErrors, setFormErrors] = useState<{
    phone?: string;
    email?: string;
  }>({});
  const [touched, setTouched] = useState<{
    phone?: boolean;
    email?: boolean;
  }>({});

  // Shipping Address with explicit houseNumber & area to satisfy courier validation
  const [address, setAddress] = useState({
    houseNumber: '',
    building: '',
    area: '',
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

  // Shipping Rate
  const [courierName, setCourierName] = useState('Xpressbees Surface');
  const [deliveryCharges, setDeliveryCharges] = useState(48.72);
  const [estimatedDays, setEstimatedDays] = useState('5 Days');

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  // Load catalog products and initialize line items
  useEffect(() => {
    productsService.getProducts({ limit: 100 }).then((res) => {
      if (res.products && res.products.length > 0) {
        setCatalogProducts(res.products);
      }
      if (initialProduct && selectedItems.length === 0) {
        setSelectedItems([{ product: initialProduct, quantity: 1 }]);
      } else if (res.products && res.products.length > 0 && selectedItems.length === 0) {
        setSelectedItems([{ product: res.products[0], quantity: 1 }]);
      }
    });
  }, [initialProduct]);

  // Close search suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter products by Name, Category, or SKU
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return catalogProducts;
    const cleanQ = q.replace(/^sku-?/i, '');

    return catalogProducts.filter((p) => {
      const matchesName = (p.name || '').toLowerCase().includes(q);
      const matchesSku =
        (p.sku || '').toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(cleanQ) ||
        (p.id || '').toLowerCase().includes(q);
      const matchesCat = (p.category || '').toLowerCase().includes(q);

      return matchesName || matchesSku || matchesCat;
    });
  }, [catalogProducts, searchQuery]);

  const handleAddItem = (prod: Product, qty: number = 1) => {
    const existing = selectedItems.find((it) => it.product.id === prod.id || it.product.sku === prod.sku);
    if (existing) {
      setSelectedItems(
        selectedItems.map((it) =>
          it.product.id === prod.id || it.product.sku === prod.sku
            ? { ...it, quantity: it.quantity + qty }
            : it
        )
      );
      dispatch(
        addToast({
          type: 'info',
          title: 'Quantity Updated',
          message: `Increased quantity for ${prod.name} to ${existing.quantity + qty}.`
        })
      );
    } else {
      setSelectedItems([...selectedItems, { product: prod, quantity: qty }]);
      dispatch(
        addToast({
          type: 'success',
          title: 'Product Added to Order',
          message: `${prod.name} (${prod.sku}) added to this order.`
        })
      );
    }
    setSearchQuery('');
    setIsSearchOpen(false);
  };

  const handleUpdateQty = (productId: string, delta: number) => {
    setSelectedItems((prev) =>
      prev
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
    setSelectedItems((prev) => prev.filter((it) => it.product.id !== productId));
    dispatch(
      addToast({
        type: 'info',
        title: 'Product Removed',
        message: 'Product removed from this order.'
      })
    );
  };

  const handlePhoneChange = (val: string) => {
    // Strip non-digits and any pasted country code prefix (+91 or 0)
    let clean = val.replace(/\D/g, '');
    if (clean.startsWith('91') && clean.length > 10) {
      clean = clean.slice(2);
    } else if (clean.startsWith('0') && clean.length > 10) {
      clean = clean.slice(1);
    }
    clean = clean.slice(0, 10);

    setCustomer((prev) => ({ ...prev, phone: clean }));
    if (touched.phone) {
      const err = validatePhone(clean, true);
      setFormErrors((prev) => ({ ...prev, phone: err || undefined }));
    }
  };

  const handlePhoneBlur = () => {
    setTouched((prev) => ({ ...prev, phone: true }));
    const err = validatePhone(customer.phone, true);
    setFormErrors((prev) => ({ ...prev, phone: err || undefined }));
  };

  const handleEmailChange = (val: string) => {
    setCustomer((prev) => ({ ...prev, email: val }));
    if (touched.email && val.trim()) {
      const err = validateEmail(val, false);
      setFormErrors((prev) => ({ ...prev, email: err || undefined }));
    } else if (!val.trim()) {
      setFormErrors((prev) => ({ ...prev, email: undefined }));
    }
  };

  const handleEmailBlur = () => {
    setTouched((prev) => ({ ...prev, email: true }));
    if (customer.email.trim()) {
      const err = validateEmail(customer.email, false);
      setFormErrors((prev) => ({ ...prev, email: err || undefined }));
    } else {
      setFormErrors((prev) => ({ ...prev, email: undefined }));
    }
  };

  // Multi-product calculations
  const totalQuantity = selectedItems.reduce((acc, it) => acc + it.quantity, 0);
  const subtotal = selectedItems.reduce(
    (sum, it) => sum + (it.product.dropshipPrice || 0) * it.quantity,
    0
  );
  const totalPayable = subtotal + deliveryCharges;

  // Handle Order Placement & Razorpay Payment Modal
  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedItems.length === 0) {
      dispatch(addToast({ type: 'warning', title: 'Cart Empty', message: 'Please select at least one item.' }));
      return;
    }
    if (!customer.name || !customer.phone || !address.line1 || !address.postalCode) {
      dispatch(addToast({ type: 'warning', title: 'Incomplete Details', message: 'Please complete customer contact & delivery address.' }));
      return;
    }

    // Strict regex validation for phone number and email
    const phoneErr = validatePhone(customer.phone, true);
    const emailErr = customer.email.trim() ? validateEmail(customer.email, false) : null;

    if (phoneErr || emailErr) {
      setTouched({ phone: true, email: true });
      setFormErrors({
        phone: phoneErr || undefined,
        email: emailErr || undefined
      });
      dispatch(
        addToast({
          type: 'warning',
          title: 'Validation Error',
          message: phoneErr || emailErr || 'Please check your phone and email format.'
        })
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Intelligently sanitize recipient name, phone, and address to strictly satisfy backend courier validation
      const cleanName = cleanPersonFullName(customer.name);
      const cleanPhone = cleanPhoneNumber(customer.phone);

      const parsedAddr = sanitizeOrderAddress({
        houseNumber: address.houseNumber,
        building: address.building,
        area: address.area,
        landmark: address.line2,
        line1: address.line1,
        line2: address.line2,
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        country: address.country
      });

      // Step 1: Call backend to create order & generate Razorpay order
      const orderPayload = {
        items: selectedItems.map((it) => ({
          productId: it.product.id,
          productCode: it.product.sku.replace(/^SKU-/i, ''),
          sku: it.product.sku,
          productName: it.product.name,
          dropshipPrice: it.product.dropshipPrice,
          image: it.product.thumbnail || it.product.images[0],
          quantity: it.quantity
        })),
        customer: {
          ...customer,
          name: cleanName,
          fullName: cleanName,
          phone: cleanPhone,
          houseNumber: parsedAddr.houseNumber,
          building: parsedAddr.building,
          area: parsedAddr.area,
          landmark: parsedAddr.landmark,
          addressLine1: parsedAddr.addressLine1,
          addressLine2: parsedAddr.addressLine2,
          city: parsedAddr.city,
          state: parsedAddr.state,
          postalCode: parsedAddr.postalCode
        },
        address: {
          fullName: cleanName,
          name: cleanName,
          phone: cleanPhone,
          houseNumber: parsedAddr.houseNumber,
          building: parsedAddr.building,
          area: parsedAddr.area,
          landmark: parsedAddr.landmark,
          addressLine1: parsedAddr.addressLine1,
          addressLine2: parsedAddr.addressLine2,
          line1: parsedAddr.line1,
          line2: parsedAddr.line2,
          city: parsedAddr.city,
          state: parsedAddr.state,
          postalCode: parsedAddr.postalCode,
          pincode: parsedAddr.postalCode,
          country: parsedAddr.country
        },
        shippingAddress: {
          ...address,
          fullName: cleanName,
          name: cleanName,
          phone: cleanPhone,
          houseNumber: parsedAddr.houseNumber,
          building: parsedAddr.building,
          area: parsedAddr.area,
          landmark: parsedAddr.landmark,
          addressLine1: parsedAddr.addressLine1,
          addressLine2: parsedAddr.addressLine2,
          line1: parsedAddr.line1,
          line2: parsedAddr.line2,
          city: parsedAddr.city,
          state: parsedAddr.state,
          postalCode: parsedAddr.postalCode,
          pincode: parsedAddr.postalCode,
          country: parsedAddr.country
        },
        customerPincode: parsedAddr.postalCode,
        warehousePincode: warehousePincode || '421004',
        paymentMethod: 'online' as const,
        notes
      };

      const response = await ordersService.createOrder(orderPayload);
      const { orderId, razorpay } = response;

      // Handle COD Flow directly
      if (paymentMethod === 'cod' || !razorpay) {
        const codOrderObj: Order = {
          id: orderId,
          orderNumber: orderId,
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
          status: 'pending',
          shippingCharges: deliveryCharges,
          subtotal,
          totalAmount: totalPayable,
          shippingPaymentMode: 'cod',
          estimatedDeliveryDays: estimatedDays,
          shippingProvider: courierName,
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
        setIsSubmitting(false);
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        dispatch(addToast({
          type: 'success',
          title: 'COD Order Booked',
          message: `Order #${orderId} registered for COD pickup.`
        }));
        return;
      }

      // Step 2: Open Razorpay Popup
      await openRazorpayCheckout(
        {
          keyId: razorpay.keyId,
          orderId: razorpay.orderId,
          internalOrderId: orderId,
          amount: razorpay.amount, // already in paise from backend
          currency: razorpay.currency || 'INR',
          name: 'DropFlow Order Fulfillment',
          description: `Payment for Order #${orderId}`,
          prefill: {
            name: customer.name,
            email: customer.email,
            contact: customer.phone,
          },
          onSuccess: (verification) => {
            setIsSubmitting(false);

            // Construct verified order object
            const createdOrderObj: Order = {
              id: orderId,
              orderNumber: orderId,
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
              estimatedDeliveryDays: estimatedDays,
              shippingProvider: courierName,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              timeline: [
                {
                  status: 'created',
                  label: 'Order Placed & Paid',
                  timestamp: new Date().toISOString(),
                  note: `Razorpay Payment Verified`
                }
              ]
            };

            dispatch(addLocalOrder(createdOrderObj));
            setCompletedOrder(createdOrderObj);

            // Trigger confetti
            confetti({ particleCount: 120, spread: 75, origin: { y: 0.6 } });

            dispatch(addToast({
              type: 'success',
              title: 'Order Paid & Dispatched!',
              message: `Order #${orderId} successfully allocated to warehouse queue.`
            }));

            // Navigate to orders pipeline with newlyCreatedOrderId
            setTimeout(() => {
              navigate('/orders', { state: { newlyCreatedOrderId: orderId } });
            }, 1800);
          },
          onError: (err) => {
            setIsSubmitting(false);
            dispatch(addToast({
              type: 'error',
              title: 'Payment Incomplete',
              message: err?.message || 'Payment window closed or rejected by gateway.'
            }));
          },
        },
        ordersService.verifyPayment
      );
    } catch (err: any) {
      setIsSubmitting(false);
      dispatch(addToast({
        type: 'error',
        title: 'Failed to place order',
        message: err.message || 'Something went wrong.'
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Success Modal / Banner */}
      {completedOrder ? (
        <div className="rounded-3xl border border-emerald-200 bg-white p-8 text-center space-y-5 shadow-xl animate-in zoom-in-95">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Order Placed Successfully!</h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Your dropship order with {totalQuantity} item(s) has been assigned reference:
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
              onClick={() => navigate('/orders', { state: { newlyCreatedOrderId: completedOrder.orderNumber } })}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              View Orders Pipeline
            </Button>
          </div>
        </div>
      ) : (
        /* Stepped Form */
        <form onSubmit={handleOrderSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column (2 Cols): Items, Customer, Address */}
            <div className="lg:col-span-2 space-y-6">
              {/* Card 1: Selected Catalog Items & Multi-Product Picker */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-brand-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      1
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                      Selected Catalog Items
                    </h3>
                  </div>

                  {/* Add more item dropdown using shadcn DropdownMenu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-brand-300 bg-white hover:bg-brand-50 text-brand-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Another Product</span>
                        <ChevronDown className="w-3.5 h-3.5 opacity-60 ml-0.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-80 max-h-80 overflow-y-auto p-1.5 bg-white shadow-xl rounded-2xl border border-slate-200"
                    >
                      <DropdownMenuLabel className="text-[11px] text-slate-400 font-bold uppercase tracking-wider px-2.5 py-1.5">
                        Add Catalog Product
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {catalogProducts.map((p) => {
                        const inOrder = selectedItems.find((it) => it.product.id === p.id);
                        return (
                          <DropdownMenuItem
                            key={p.id}
                            onClick={() => handleAddItem(p)}
                            className="flex items-center gap-2.5 p-2 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors"
                          >
                            <img
                              src={p.thumbnail}
                              alt={p.name}
                              className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-50"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80';
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-800 truncate">{p.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono">SKU: {p.sku}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-xs font-bold text-brand-600 block">
                                {formatCurrency(p.dropshipPrice)}
                              </span>
                              {inOrder ? (
                                <span className="text-[10px] text-amber-600 font-medium">
                                  ({inOrder.quantity} added)
                                </span>
                              ) : (
                                <span className="text-[10px] text-emerald-600 font-medium">
                                  + Add
                                </span>
                              )}
                            </div>
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Integrated Product Search Bar */}
                <div className="relative" ref={searchContainerRef}>
                  <div className="relative">
                    <Search className="w-4 h-4 text-brand-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search and add products by name, product code or SKU (e.g. Pepper Grinder, 2916-1)..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setIsSearchOpen(true);
                      }}
                      onFocus={() => setIsSearchOpen(true)}
                      className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setIsSearchOpen(false);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Autocomplete Search Dropdown */}
                  {isSearchOpen && (
                    <div className="absolute z-30 left-0 right-0 top-full mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden max-h-72 overflow-y-auto animate-in fade-in-50 zoom-in-95">
                      <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                        <span>Available Products ({filteredProducts.length})</span>
                        <span className="text-[10px] text-slate-400">Click to add to order</span>
                      </div>

                      {filteredProducts.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-400">
                          <PackageSearch className="w-7 h-7 mx-auto mb-1.5 text-slate-300" />
                          <p className="font-semibold text-slate-600">No matching products found</p>
                          <p className="mt-0.5 text-slate-400">Try searching with a different product name or SKU code</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100">
                          {filteredProducts.map((p) => {
                            const inOrder = selectedItems.find((it) => it.product.id === p.id);
                            return (
                              <div
                                key={p.id}
                                onClick={() => handleAddItem(p)}
                                className="flex items-center justify-between gap-3 p-3 hover:bg-brand-50/50 cursor-pointer transition-colors group"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <img
                                    src={p.thumbnail}
                                    alt=""
                                    className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-50"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src =
                                        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80';
                                    }}
                                  />
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-xs text-slate-900 group-hover:text-brand-600 truncate">
                                        {p.name}
                                      </span>
                                      <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                                        {p.sku}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                                      <span className="font-bold text-brand-600">
                                        {formatCurrency(p.dropshipPrice)}
                                      </span>
                                      <span>•</span>
                                      <span className="text-slate-400">
                                        MSRP: {formatCurrency(p.suggestedRetailPrice)}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddItem(p);
                                  }}
                                  className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 group-hover:border-brand-500 group-hover:bg-brand-600 group-hover:text-white transition-colors shrink-0"
                                >
                                  {inOrder ? `+ Add More (${inOrder.quantity})` : '+ Add'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Selected Products List */}
                {selectedItems.length > 0 ? (
                  <div className="divide-y divide-slate-100 pt-1">
                    {selectedItems.map((item) => (
                      <div
                        key={item.product.id}
                        className="py-3.5 flex items-center justify-between gap-3 group"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <img
                            src={item.product.thumbnail || item.product.images[0]}
                            alt={item.product.name}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-50"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80';
                            }}
                          />
                          <div className="min-w-0">
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                              {item.product.name}
                            </h4>
                            <p className="text-[11px] font-mono text-slate-400">
                              SKU: {item.product.sku}
                            </p>
                            <p className="text-xs font-extrabold text-brand-600 mt-0.5">
                              {formatCurrency(item.product.dropshipPrice)} / unit
                            </p>
                          </div>
                        </div>

                        {/* Stepper & Trash Button */}
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="flex items-center border border-slate-200 rounded-full px-1 py-0.5 bg-white shadow-xs">
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(item.product.id, -1)}
                              className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-600 transition-colors text-xs font-bold cursor-pointer"
                              title="Decrease"
                            >
                              -
                            </button>
                            <span className="w-7 text-center text-xs font-bold text-slate-900">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(item.product.id, 1)}
                              className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-600 transition-colors text-xs font-bold cursor-pointer"
                              title="Increase"
                            >
                              +
                            </button>
                          </div>

                          <div className="text-right hidden sm:block min-w-[70px]">
                            <span className="text-[10px] text-slate-400 block font-medium uppercase">Total</span>
                            <span className="font-bold text-xs text-slate-900">
                              {formatCurrency(item.product.dropshipPrice * item.quantity)}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.product.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Remove product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    <div className="pt-3 flex items-center justify-between text-xs text-slate-600 font-medium">
                      <span>
                        Total Selected:{' '}
                        <strong className="text-slate-900">
                          {selectedItems.length} {selectedItems.length === 1 ? 'product' : 'products'} ({totalQuantity} units)
                        </strong>
                      </span>
                      <span>
                        Items Subtotal:{' '}
                        <strong className="text-brand-600 text-sm font-extrabold">
                          {formatCurrency(subtotal)}
                        </strong>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 px-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center">
                    <PackageSearch className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-700">No products added yet</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      Search above or pick from the dropdown to add single or multiple products.
                    </p>
                  </div>
                )}
              </div>

              {/* Card 2: Customer Contact with Strict Regex Validation */}
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
                    type="tel"
                    maxLength={10}
                    placeholder="98201 12345"
                    leftAddon={
                      <span className="flex items-center gap-1.5 font-bold text-slate-700 font-mono">
                        <span>🇮🇳</span>
                        <span>+91</span>
                      </span>
                    }
                    value={customer.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    onBlur={handlePhoneBlur}
                    error={formErrors.phone}
                    helperText={!formErrors.phone ? 'Enter 10-digit customer mobile number' : undefined}
                    required
                  />

                  <Input
                    label="Email Address (For Tracking)"
                    type="email"
                    placeholder="aditya@example.com"
                    value={customer.email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    onBlur={handleEmailBlur}
                    error={formErrors.email}
                    helperText={!formErrors.email ? 'Valid email format (e.g. name@domain.com)' : undefined}
                  />
                </div>
              </div>

              {/* Card 3: Shipping Destination Address */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-5">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <span className="w-6 h-6 rounded-full bg-brand-600 text-white font-bold text-xs flex items-center justify-center">
                    3
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    Shipping Destination Address
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Input
                      label="House / Flat / Building Number"
                      placeholder="e.g. Flat 402, Sea Breeze Tower"
                      value={address.houseNumber}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAddress((prev) => ({
                          ...prev,
                          houseNumber: val,
                          line1: `${val}, ${prev.area || ''}`.trim()
                        }));
                      }}
                      required
                    />
                  </div>

                  <div>
                    <Input
                      label="Area / Sector / Locality"
                      placeholder="e.g. Bandra West or Dwarka Sector 6"
                      value={address.area}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAddress((prev) => ({
                          ...prev,
                          area: val,
                          line1: `${prev.houseNumber || ''}, ${val}`.trim()
                        }));
                      }}
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Input
                      label="Street / Landmark (Optional)"
                      placeholder="e.g. Near Mehboob Studio or Metro Pillar 42"
                      value={address.line2}
                      onChange={(e) => setAddress((prev) => ({ ...prev, line2: e.target.value }))}
                    />
                  </div>

                  <Input
                    label="Destination PIN Code"
                    placeholder="e.g. 110043"
                    maxLength={6}
                    value={address.postalCode}
                    onChange={(e) => {
                      const newPin = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setAddress((prev) => ({ ...prev, postalCode: newPin }));
                    }}
                    required
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="City"
                      placeholder="e.g. Delhi or Mumbai"
                      value={address.city}
                      onChange={(e) => setAddress((prev) => ({ ...prev, city: e.target.value }))}
                      required
                    />

                    <Input
                      label="State"
                      placeholder="e.g. Delhi or Maharashtra"
                      value={address.state}
                      onChange={(e) => setAddress((prev) => ({ ...prev, state: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                {/* Shipping & Courier Rates Section inside this card */}
                <div className="pt-2">
                  <ShippingRatesCard
                    pincode={address.postalCode}
                    onPincodeChange={(newPin) => {
                      setAddress((prev) => ({ ...prev, postalCode: newPin }));
                    }}
                    weightKg={0.5}
                    orderAmount={subtotal || 999}
                    onRateCalculated={(r) => {
                      setCourierName(r.courierName);
                      setDeliveryCharges(r.deliveryCharges);
                      setEstimatedDays(r.estimatedDays);
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Financial Breakdown & Razorpay Checkout */}
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
                    <span>Items Subtotal ({totalQuantity} units):</span>
                    <span className="font-semibold text-slate-800">{formatCurrency(subtotal)}</span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>Courier Delivery Fee ({courierName}):</span>
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

                {/* Submit / Pay Button */}
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full shadow-md bg-brand-600 hover:bg-brand-700 font-bold"
                  isLoading={isSubmitting}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  {isSubmitting
                    ? 'Processing Payment…'
                    : paymentMethod === 'online'
                    ? `Pay ${formatCurrency(totalPayable)} via Razorpay`
                    : 'Confirm COD Dispatch'}
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
export default CreateOrderForm;

