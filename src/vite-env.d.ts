/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_BASE_URL?: string;
  readonly VITE_DROPSHIPPER_AUTH_BYPASS?: string;
  readonly VITE_RAZORPAY_KEY_ID?: string;
  readonly VITE_DROPSHIPPER_STAFF_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

