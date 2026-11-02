import type { Product } from '../types/dropshipper';
import { downloadProductImage } from './exportUtils';

/**
 * Converts a remote image URL into a binary File object.
 * Attempts direct fetch first, and falls back to canvas-rendered base64
 * to bypass CORS issues on external image CDNs.
 */
export async function fetchProductImageFile(
  imageUrl: string,
  filename: string
): Promise<File | null> {
  if (!imageUrl) return null;

  const safeFilename = `${filename.replace(/[^a-zA-Z0-9_-]/g, '_')}.jpg`;

  // 1. Direct fetch attempt
  try {
    const res = await fetch(imageUrl, { mode: 'cors' });
    if (res.ok) {
      const blob = await res.blob();
      if (blob && blob.size > 0) {
        return new File([blob], safeFilename, { type: blob.type || 'image/jpeg' });
      }
    }
  } catch {
    // CORS or network error, proceed to canvas fallback
  }

  // 2. Canvas crossOrigin fallback
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const filePromise = new Promise<File | null>((resolve) => {
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || 800;
          canvas.height = img.naturalHeight || 800;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            canvas.toBlob((blob) => {
              if (blob) {
                resolve(new File([blob], safeFilename, { type: 'image/jpeg' }));
                return;
              }
              resolve(null);
            }, 'image/jpeg', 0.95);
            return;
          }
          resolve(null);
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = imageUrl;
    });

    const file = await filePromise;
    if (file) return file;
  } catch (err) {
    console.warn('Canvas fallback failed to create image file:', err);
  }

  return null;
}

/**
 * Formats product details with WhatsApp-compatible markdown (*bold*, bullet points).
 * Wholesale dropship cost is strictly hidden so dropshippers can forward to clients.
 */
export function formatWhatsAppProductText(product: Product): string {
  const categoryLabel = product.category || 'General';
  const specs = product.specs || {};
  const specLines: string[] = [];

  if (specs.material) specLines.push(`• *Material:* ${specs.material}`);
  if (specs.dimensions) specLines.push(`• *Dimensions:* ${specs.dimensions}`);
  if (specs.weight) specLines.push(`• *Weight:* ${specs.weight}`);
  if (specs.origin) specLines.push(`• *Origin:* ${specs.origin}`);
  if (specs.fulfillmentTime) specLines.push(`• *Dispatch:* ${specs.fulfillmentTime}`);
  if (specs.warranty) specLines.push(`• *Warranty:* ${specs.warranty}`);

  const lines: string[] = [
    `📦 *${product.name || 'Product Details'}*`,
    `🏷️ *Item Code:* ${product.sku || 'SKU-INVENTORY'}`,
    `📁 *Category:* ${categoryLabel}`,
    `💰 *Price:* ₹${product.suggestedRetailPrice.toLocaleString('en-IN')}`,
    ''
  ];

  if (product.description) {
    lines.push('📝 *Product Description:*');
    lines.push(product.description.trim());
    lines.push('');
  }

  if (specLines.length > 0) {
    lines.push('✨ *Specifications:*');
    lines.push(...specLines);
    lines.push('');
  }

  lines.push('🚚 *Delivery:* Pan-India Express Delivery & Cash on Delivery Available');
  lines.push('');
  lines.push('💬 _Interested in this product or have questions? Reply directly to this message to order!_');

  return lines.join('\n');
}

/**
 * Shares product photo and formatted specifications to WhatsApp.
 * - Mobile / Web Share API: Attaches image File and formatted message as caption.
 * - Desktop Web Fallback: Downloads high-res photo, copies caption to clipboard, and opens web.whatsapp.com.
 */
export async function shareProductToWhatsApp(
  product: Product,
  options?: {
    images?: string[];
    onToast?: (toast: { type: 'info' | 'success' | 'error'; title: string; message: string }) => void;
  }
): Promise<boolean> {
  const onToast = options?.onToast;

  const targetImages =
    options?.images && options.images.length > 0
      ? options.images
      : Array.from(
          new Set(
            [
              product.thumbnail,
              ...(Array.isArray(product.images) ? product.images : [])
            ].filter(Boolean) as string[]
          )
        );

  const messageText = formatWhatsAppProductText(product);
  const filePrefix = product.sku ? product.sku : 'product';

  try {
    // 1. Fetch primary image as a File Blob
    const primaryUrl = targetImages[0] || product.thumbnail;
    const imageFile = await fetchProductImageFile(primaryUrl, `${filePrefix}_main`);

    // 2. Mobile / Modern browser Web Share with file attachment
    if (
      typeof navigator !== 'undefined' &&
      navigator.canShare &&
      imageFile &&
      navigator.canShare({ files: [imageFile] })
    ) {
      try {
        await navigator.share({
          title: product.name,
          text: messageText,
          files: [imageFile]
        });

        onToast?.({
          type: 'success',
          title: 'Shared to WhatsApp',
          message: 'Image and product specifications attached to WhatsApp.'
        });
        return true;
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          return false;
        }
        console.warn('Native Web Share failed, falling back to desktop WhatsApp:', err);
      }
    }

    // 3. Desktop / Web Fallback
    // Copy formatted text to clipboard
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(messageText);
      }
    } catch {
      // ignore
    }

    // Download photo so user can drop it directly into WhatsApp
    if (primaryUrl) {
      await downloadProductImage(primaryUrl, `${filePrefix}_photo.jpg`);
    }

    // Open WhatsApp Web with prefilled message
    const waUrl = `https://web.whatsapp.com/send?text=${encodeURIComponent(messageText)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');

    onToast?.({
      type: 'success',
      title: 'Opening WhatsApp Web',
      message: 'Product photo downloaded & text copied to clipboard! Paste directly into the chat.'
    });

    return true;
  } catch (error: any) {
    console.error('Error sharing to WhatsApp:', error);
    onToast?.({
      type: 'error',
      title: 'Share Failed',
      message: error?.message || 'Could not initiate WhatsApp share.'
    });
    return false;
  }
}
