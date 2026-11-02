export type OrderStatus = 'pending' | 'approved' | 'shipped' | 'delivered' | 'rejected';
export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export interface ProductSpecs {
  weight: string;
  dimensions: string;
  material: string;
  origin: string;
  fulfillmentTime: string;
  warranty: string;
}

export interface Product {
  id: string;
  _id?: string;
  slug?: string;
  name: string;
  sku: string;
  category: string;
  categoryId?: string;
  dropshipPrice: number;        // Cost to dropshipper
  suggestedRetailPrice: number; // MSRP
  costEstimate?: number;
  stock: number;
  stockStatus: StockStatus;
  images: string[];
  thumbnail: string;
  description: string;
  features: string[];
  specs: ProductSpecs;
  tags: string[];
  rating: number;
  reviewCount: number;
  createdAt: string;
}

export interface Customer {
  name: string;
  email: string;
  phone: string;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  image: string;
  dropshipPrice: number;
  quantity: number;
  total: number;
}

export interface OrderTimelineEvent {
  status: OrderStatus | 'created';
  label: string;
  timestamp: string;
  note?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customer: Customer;
  shippingAddress: Address;
  item: OrderItem;
  items?: OrderItem[];
  status: OrderStatus;
  adminNote?: string;
  rejectionReason?: string;
  trackingNumber?: string;
  shippingCarrier?: string;
  shippingCharges?: number;
  totalAmount?: number;
  subtotal?: number;
  shippingPaymentMode?: 'prepaid' | 'cod';
  estimatedDeliveryDays?: string;
  warehousePincode?: string;
  shippingProvider?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  timeline: OrderTimelineEvent[];
}

export interface ServiceabilityQuote {
  isDeliverable: boolean;
  deliveryCharges: number;
  freightInr: number;
  codFeeInr: number;
  estimatedDays: string;
  courierName?: string;
  courierCompanyId?: string;
  codAvailable?: boolean;
  message?: string;
  shippingProvider?: string;
}

export interface ServiceabilityCheckResponse {
  success: boolean;
  message: string;
  customerPincode: string;
  warehousePincode: string;
  package: { weightKg: number; lengthCm: number; widthCm: number; heightCm: number };
  paymentMode: 'prepaid' | 'cod' | 'both';
  isDeliverable: boolean;
  estimatedDays: string;
  deliveryCharges: number;
  shippingProvider: string;
  quotes: {
    prepaid?: ServiceabilityQuote;
    cod?: ServiceabilityQuote;
  };
}

// Dropshipper and Auth specific types
export interface SubscriptionSettings {
  feeAmount: number;
  currency: string;
  planDuration: string;
  isActive: boolean;
  openForRegistration: boolean;
  features: string[];
  terms?: string[];
}

export interface RegistrationStatusResponse {
  requestId: string;
  status: 'pending_payment' | 'admin_approval' | 'approved' | 'rejected' | 'activated';
  rejectionReason?: string;
  applicantName?: string;
  email?: string;
  phone?: string;
  businessName?: string;
  submittedAt?: string;
  reviewedAt?: string;
}

export interface DropshipperProfile {
  id: string;
  _id?: string;
  fullName: string;
  name?: string;
  email: string;
  phone: string;
  businessName: string;
  gstNumber?: string;
  panNumber?: string;
  status: 'active' | 'suspended' | 'pending';
  walletBalance?: number;
  subscriptionExpiresAt?: string;
  createdAt?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  dropshipper?: DropshipperProfile;
  user?: DropshipperProfile;
}

