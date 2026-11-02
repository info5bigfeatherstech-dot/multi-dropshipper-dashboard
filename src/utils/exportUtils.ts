import jsPDF from 'jspdf';
import type { Order, Product } from '../types/dropshipper';

/**
 * Generates an official order invoice PDF via jsPDF
 */
export function downloadOrderPDF(order: Order): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryIndigo = [79, 70, 229]; // #4F46E5
  const darkSlate = [30, 41, 59];
  const mutedSlate = [100, 116, 139];
  const lightBg = [248, 250, 252];

  // Header Banner
  doc.setFillColor(primaryIndigo[0], primaryIndigo[1], primaryIndigo[2]);
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('DROPFLOW LOGISTICS', 14, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Official B2B Dropship Fulfillment Invoice', 14, 21);

  // Invoice / Order Badge
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(`INVOICE: ${order.orderNumber}`, 196, 14, { align: 'right' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`, 196, 21, { align: 'right' });

  // Status & Carrier strip
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.rect(14, 34, 182, 16, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(14, 34, 182, 16, 'D');

  doc.setFontSize(9);
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text(`Fulfillment Status:`, 18, 41);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryIndigo[0], primaryIndigo[1], primaryIndigo[2]);
  doc.text(order.status.toUpperCase(), 48, 41);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text(`Carrier: ${order.shippingCarrier || order.shippingProvider || 'Domestic Express'}`, 90, 41);
  doc.text(`AWB Tracking: ${order.trackingNumber || 'Pending AWB Generation'}`, 18, 46);
  doc.text(`Estimated Delivery: ${order.estimatedDeliveryDays || '2-4 Days'}`, 90, 46);

  // Customer & Shipping Address Block
  let y = 58;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text('Customer Details', 14, y);
  doc.text('Ship To Address', 110, y);

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);

  doc.text(`Name: ${order.customer?.name || 'Customer'}`, 14, y);
  doc.text(`${order.shippingAddress?.line1 || 'N/A'}`, 110, y);

  y += 5;
  doc.text(`Phone: ${order.customer?.phone || '—'}`, 14, y);
  if (order.shippingAddress?.line2) {
    doc.text(`${order.shippingAddress.line2}`, 110, y);
    y += 5;
  }
  doc.text(`Email: ${order.customer?.email || '—'}`, 14, y);
  doc.text(`${order.shippingAddress?.city || '—'}, ${order.shippingAddress?.state || ''} - ${order.shippingAddress?.postalCode || ''}`, 110, y);

  y += 5;
  doc.text(`Country: ${order.shippingAddress?.country || 'India'}`, 110, y);

  // Line Items Table Header
  y += 12;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, 182, 8, 'F');
  doc.setTextColor( darkSlate[0], darkSlate[1], darkSlate[2] );
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);

  doc.text('Item Description', 18, y + 5.5);
  doc.text('SKU', 105, y + 5.5);
  doc.text('Qty', 135, y + 5.5, { align: 'center' });
  doc.text('Wholesale Rate', 160, y + 5.5, { align: 'right' });
  doc.text('Total', 192, y + 5.5, { align: 'right' });

  // Line items
  y += 8;
  doc.setFont('helvetica', 'normal');
  const items = order.items && order.items.length > 0 ? order.items : [order.item];

  items.forEach((item) => {
    y += 6;
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    // Truncate long names
    const displayName = item.productName.length > 40 ? item.productName.substring(0, 37) + '...' : item.productName;
    doc.text(displayName, 18, y);
    doc.text(item.sku || 'N/A', 105, y);
    doc.text(String(item.quantity), 135, y, { align: 'center' });
    doc.text(`INR ${item.dropshipPrice}`, 160, y, { align: 'right' });
    doc.text(`INR ${item.total}`, 192, y, { align: 'right' });
  });

  // Financial Summary
  y += 14;
  doc.setDrawColor(226, 232, 240);
  doc.line(14, y, 196, y);

  y += 8;
  doc.setFontSize(9);
  doc.text('Subtotal:', 150, y, { align: 'right' });
  doc.text(`INR ${order.subtotal || order.item.total}`, 192, y, { align: 'right' });

  y += 6;
  doc.text('Shipping & Handling:', 150, y, { align: 'right' });
  doc.text(`INR ${order.shippingCharges || 0}`, 192, y, { align: 'right' });

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryIndigo[0], primaryIndigo[1], primaryIndigo[2]);
  doc.text('Total Amount Payable:', 150, y, { align: 'right' });
  doc.text(`INR ${order.totalAmount || ((order.subtotal || order.item.total) + (order.shippingCharges || 0))}`, 192, y, { align: 'right' });

  // Dispatch Timeline
  y += 16;
  doc.setFontSize(10);
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text('Dispatch & Tracking Timeline', 14, y);

  y += 6;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);

  if (order.timeline && order.timeline.length > 0) {
    order.timeline.forEach((event) => {
      doc.text(`• [${new Date(event.timestamp).toLocaleDateString('en-IN')}] ${event.label} - ${event.note || ''}`, 16, y);
      y += 5;
    });
  } else {
    doc.text('• Order successfully logged and verified in warehouse inventory queue.', 16, y);
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('DropFlow Commerce Network — Generated automatically for authorized dropship partners.', 105, 285, { align: 'center' });

  doc.save(`Invoice_${order.orderNumber}.pdf`);
}

/**
 * Generates a client-presentable product dossier PDF (wholesale price HIDDEN)
 */
export function downloadProductPDF(product: Product): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryIndigo = [79, 70, 229];
  const darkSlate = [30, 41, 59];
  const mutedSlate = [100, 116, 139];

  // Brand Header
  doc.setFillColor(primaryIndigo[0], primaryIndigo[1], primaryIndigo[2]);
  doc.rect(0, 0, 210, 24, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('PRODUCT SPECIFICATION DOSSIER', 14, 15);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Verified Retail Ready Specification Sheet', 196, 15, { align: 'right' });

  // Title & MSRP
  let y = 36;
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(product.name, 14, y);

  y += 6;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
  doc.text(`Category: ${product.category}  |  SKU: ${product.sku}  |  Rating: ${product.rating} / 5 (${product.reviewCount} reviews)`, 14, y);

  // Suggested Retail Price (Customer Facing)
  y += 10;
  doc.setFillColor(238, 242, 255);
  doc.rect(14, y, 182, 14, 'F');
  doc.setDrawColor(199, 210, 254);
  doc.rect(14, y, 182, 14, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryIndigo[0], primaryIndigo[1], primaryIndigo[2]);
  doc.text(`SUGGESTED RETAIL PRICE (MSRP): INR ${product.suggestedRetailPrice.toLocaleString('en-IN')}`, 20, y + 9);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text('Includes all statutory taxes & premium retail boxing', 130, y + 9);

  // Description
  y += 22;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text('Product Overview', 14, y);

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
  const splitDesc = doc.splitTextToSize(product.description, 182);
  doc.text(splitDesc, 14, y);
  y += (splitDesc.length * 5) + 6;

  // Features
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text('Key Features & Selling Points', 14, y);

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
  product.features.forEach((feat) => {
    doc.text(`✓  ${feat}`, 16, y);
    y += 5;
  });

  // Specifications Table
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text('Technical Specifications', 14, y);

  y += 6;
  const specsData = [
    ['Product Dimensions', product.specs.dimensions],
    ['Package Weight', product.specs.weight],
    ['Material Construction', product.specs.material],
    ['Country of Origin', product.specs.origin],
    ['Dispatch Window', product.specs.fulfillmentTime],
    ['Warranty Coverage', product.specs.warranty],
  ];

  specsData.forEach(([label, val], idx) => {
    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y - 4, 182, 7, 'F');
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
    doc.text(label, 18, y);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(mutedSlate[0], mutedSlate[1], mutedSlate[2]);
    doc.text(val, 90, y);
    y += 7;
  });

  // Notice at bottom
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Wholesale commercial sourcing confidential. For retail distribution inquiries contact your DropFlow representative.', 105, 285, { align: 'center' });

  doc.save(`Product_Dossier_${product.sku}.pdf`);
}

/**
 * Downloads Order as a CSV file
 */
export function downloadOrderCSV(order: Order): void {
  const items = order.items && order.items.length > 0 ? order.items : [order.item];
  const headers = [
    'OrderNumber',
    'Date',
    'CustomerName',
    'CustomerPhone',
    'CustomerEmail',
    'AddressLine1',
    'City',
    'State',
    'Pincode',
    'ItemName',
    'SKU',
    'Quantity',
    'DropshipUnitPrice',
    'ItemTotal',
    'ShippingCharges',
    'TotalAmount',
    'Status',
    'TrackingAWB',
    'Carrier'
  ];

  const rows = items.map((it) => [
    `"${order.orderNumber || order.id}"`,
    `"${new Date(order.createdAt).toISOString()}"`,
    `"${(order.customer?.name || 'Customer').replace(/"/g, '""')}"`,
    `"${order.customer?.phone || ''}"`,
    `"${order.customer?.email || ''}"`,
    `"${(order.shippingAddress?.line1 || '').replace(/"/g, '""')}"`,
    `"${order.shippingAddress?.city || ''}"`,
    `"${order.shippingAddress?.state || ''}"`,
    `"${order.shippingAddress?.postalCode || ''}"`,
    `"${(it.productName || '').replace(/"/g, '""')}"`,
    `"${it.sku || ''}"`,
    it.quantity,
    it.dropshipPrice,
    it.total,
    order.shippingCharges || 0,
    order.totalAmount || it.total,
    `"${order.status}"`,
    `"${order.trackingNumber || ''}"`,
    `"${order.shippingCarrier || order.shippingProvider || ''}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Order_${order.orderNumber}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Downloads Product info as a structured CSV spreadsheet (Shopify/WooCommerce friendly)
 */
export function downloadProductCSV(product: Product): void {
  const marginInr = product.suggestedRetailPrice - product.dropshipPrice;
  const marginPercent = product.suggestedRetailPrice > 0 ? Math.round((marginInr / product.suggestedRetailPrice) * 100) : 0;

  const headers = [
    'SKU',
    'Product Name',
    'Category',
    'Dropship Price (INR)',
    'Suggested MSRP (INR)',
    'Estimated Margin (INR)',
    'Margin Percentage (%)',
    'Stock Status',
    'Inventory Count',
    'Rating',
    'Review Count',
    'Turnaround',
    'Origin Hub',
    'Dimensions',
    'Weight',
    'Material',
    'Warranty',
    'Description',
    'Features',
    'Primary Image',
    'Gallery Images'
  ];

  const escapeCsv = (val: string | number) => `"${String(val ?? '').replace(/"/g, '""')}"`;

  const row = [
    escapeCsv(product.sku),
    escapeCsv(product.name),
    escapeCsv(product.category),
    product.dropshipPrice.toFixed(2),
    product.suggestedRetailPrice.toFixed(2),
    marginInr.toFixed(2),
    marginPercent.toString(),
    escapeCsv(product.stockStatus),
    product.stock.toString(),
    product.rating.toString(),
    product.reviewCount.toString(),
    escapeCsv(product.specs?.fulfillmentTime || '24-48 Hours'),
    escapeCsv(product.specs?.origin || 'India'),
    escapeCsv(product.specs?.dimensions || '15 x 10 x 5 cm'),
    escapeCsv(product.specs?.weight || '0.5kg'),
    escapeCsv(product.specs?.material || 'Supplier Assured Grade'),
    escapeCsv(product.specs?.warranty || 'Supplier Assured'),
    escapeCsv(product.description),
    escapeCsv((product.features || []).join(' | ')),
    escapeCsv(product.thumbnail),
    escapeCsv((product.images || []).join('; '))
  ];

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), row.join(',')].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${product.sku}_details.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Downloads Product info as a formatted JSON document
 */
export function downloadProductJSON(product: Product): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(product, null, 2));
  const link = document.createElement('a');
  link.setAttribute('href', dataStr);
  link.setAttribute('download', `${product.sku}_data.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Downloads Product copy and specifications as plain text (.txt)
 */
export function downloadProductText(product: Product): void {
  const marginInr = product.suggestedRetailPrice - product.dropshipPrice;
  const marginPercent = product.suggestedRetailPrice > 0 ? Math.round((marginInr / product.suggestedRetailPrice) * 100) : 0;

  const content = `PRODUCT SPECIFICATION SHEET
=============================================
Product Name: ${product.name}
SKU: ${product.sku}
Category: ${product.category}
Status: ${product.stockStatus.toUpperCase()} (${product.stock} units in stock)
Rating: ${product.rating} / 5.0 (${product.reviewCount} customer reviews)

PRICING & MARGINS
---------------------------------------------
Wholesale Dropship Cost: ₹${product.dropshipPrice.toFixed(2)}
Suggested Retail Price:  ₹${product.suggestedRetailPrice.toFixed(2)}
Estimated Net Profit:    +₹${marginInr.toFixed(2)} (${marginPercent}% Margin)

OVERVIEW & DESCRIPTION
---------------------------------------------
${product.description}

KEY FEATURES & VALUE HIGHLIGHTS
---------------------------------------------
${(product.features || []).map((f) => `* ${f}`).join('\n')}

LOGISTICS & CARRIER SPECIFICATIONS
---------------------------------------------
Dispatch Turnaround:   ${product.specs?.fulfillmentTime || '24-48 Hours'}
Fulfillment Origin Hub: ${product.specs?.origin || 'India'}
Parcel Dimensions:     ${product.specs?.dimensions || '15 x 10 x 5 cm'}
Gross Weight:          ${product.specs?.weight || '0.5kg'}
Material Composition:  ${product.specs?.material || 'Supplier Assured Grade'}
Supplier Warranty:     ${product.specs?.warranty || 'Supplier Assured'}

IMAGES
---------------------------------------------
Primary Thumbnail: ${product.thumbnail}
${(product.images || []).map((img, i) => `Image ${i + 1}: ${img}`).join('\n')}
=============================================
Exported from DropFlow Sourcing Portal
`;

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${product.sku}_listing.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Downloads all images for a product sequentially
 */
export async function downloadAllProductImages(product: Product): Promise<number> {
  const raw = [product.thumbnail, ...(Array.isArray(product.images) ? product.images : [])].filter(Boolean);
  const urls = Array.from(new Set(raw));
  let count = 0;

  for (let i = 0; i < urls.length; i++) {
    try {
      const ok = await downloadProductImage(urls[i], `${product.sku}_photo_${i + 1}.jpg`);
      if (ok) count++;
      if (i < urls.length - 1) {
        await new Promise((r) => setTimeout(r, 250));
      }
    } catch {
      // continue
    }
  }

  return count;
}

export async function downloadProductImage(
  url: string,
  filename = 'product-image.jpg',
  fallbackUrl = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'
): Promise<boolean> {
  const safeFilename = `${filename.replace(/[^a-zA-Z0-9_-]/g, '_')}.jpg`;

  const attemptDownload = async (targetUrl: string): Promise<boolean> => {
    try {
      const res = await fetch(targetUrl, { mode: 'cors' });
      if (res.ok) {
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = safeFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(objectUrl);
        return true;
      }
    } catch {
      // continue to canvas fallback
    }

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      return await new Promise<boolean>((resolve) => {
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
                  const objectUrl = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = objectUrl;
                  link.download = safeFilename;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(objectUrl);
                  resolve(true);
                  return;
                }
                resolve(false);
              }, 'image/jpeg', 0.95);
              return;
            }
          } catch {
            resolve(false);
          }
          resolve(false);
        };
        img.onerror = () => resolve(false);
        img.src = targetUrl;
      });
    } catch {
      return false;
    }
  };

  const firstOk = await attemptDownload(url);
  if (firstOk) return true;
  if (fallbackUrl && fallbackUrl !== url) {
    return await attemptDownload(fallbackUrl);
  }
  return false;
}

