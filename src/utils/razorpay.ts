declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface RazorpayCheckoutOptions {
  keyId?: string;
  orderId: string;         // Razorpay Order ID from backend (e.g. "order_ODx123")
  internalOrderId: string; // Your internal order ID (e.g. "OWB-DS-1002")
  amount: number;          // In PAISE (₹100 = 10000 paise)
  currency?: string;       // Default: "INR"
  name?: string;
  description?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  onSuccess: (verification: any) => void;
  onError: (error: any) => void;
}

/**
 * Loads the Razorpay checkout.js script once dynamically
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * Reusable modal launcher for Order and KYC Checkout
 */
export async function openRazorpayCheckout(
  options: RazorpayCheckoutOptions,
  verifyEndpoint: (payload: any) => Promise<any>
): Promise<void> {
  const isLoaded = await loadRazorpayScript();
  if (!isLoaded || typeof window === 'undefined' || !window.Razorpay) {
    options.onError(new Error('Failed to load Razorpay SDK. Please check your network.'));
    return;
  }

  const rzpOptions = {
    key: options.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TR7LF2Kmqn6Vey',
    amount: Math.round(options.amount), // Must be integer in paise
    currency: options.currency || 'INR',
    name: options.name || 'DropFlow Commerce',
    description: options.description || `Payment for order ${options.internalOrderId}`,
    order_id: options.orderId,
    prefill: options.prefill || {},
    theme: { color: '#4F46E5' }, // Soft Indigo
    handler: async (response: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    }) => {
      try {
        // Send signature to backend for verification
        const verification = await verifyEndpoint({
          orderId: options.internalOrderId,
          requestId: options.internalOrderId,
          razorpay_order_id: response.razorpay_order_id || options.orderId,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        });
        options.onSuccess(verification);
      } catch (err: any) {
        options.onError(err);
      }
    },
    modal: {
      ondismiss: () => {
        options.onError(new Error('Payment window closed by user.'));
      },
    },
  };

  const razorpayInstance = new window.Razorpay(rzpOptions);
  razorpayInstance.on('payment.failed', (resp: any) => {
    options.onError(new Error(resp?.error?.description || 'Payment rejected by gateway'));
  });
  razorpayInstance.open();
}
