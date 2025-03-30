
import { CartItemType } from "../components/cart/types";
import html2pdf from 'html2pdf.js';

// Convert HTML to PDF using html2pdf.js
export const convertHTMLToPDF = async (htmlContent: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Create a container element to render the HTML
    const element = document.createElement('div');
    element.innerHTML = htmlContent;
    
    // Configure html2pdf options for thermal receipt printer
    const options = {
      margin: [0, 0, 0, 0],
      filename: 'receipt.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { 
        unit: 'mm', 
        format: [80, 297], // 80mm width, auto height
        orientation: 'portrait',
        hotfixes: ["px_scaling"]
      }
    };
    
    html2pdf()
      .from(element)
      .set(options)
      .outputPdf('datauristring')
      .then((pdfBase64: string) => {
        // Remove the data URI prefix to get just the base64 content
        const base64Content = pdfBase64.replace('data:application/pdf;base64,', '');
        resolve(base64Content);
      })
      .catch((error: any) => {
        console.error('PDF conversion error:', error);
        reject(error);
      });
  });
};

// Format order for printing
export const formatOrderReceipt = (
  orderNumber: string | number,
  items: CartItemType[],
  orderType: string,
  tableNumber: string | number | undefined,
  subtotal: number,
  tax: number,
  total: number
): string => {
  const orderDate = new Date().toLocaleString();
  
  return `
    <html>
      <head>
        <title>Order #${orderNumber}</title>
        <style>
          @page {
            margin: 0mm;
            size: 80mm auto;
          }
          body {
            font-family: 'Courier', monospace;
            padding: 10px;
            width: 80mm;
            margin: 0;
            font-size: 12px;
            line-height: 1.2;
          }
          h1, h2 {
            text-align: center;
            margin: 5px 0;
          }
          .order-details {
            margin-bottom: 15px;
          }
          .order-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
          }
          .topping-item {
            display: flex;
            justify-content: space-between;
            margin-left: 15px;
            font-size: 10px;
          }
          .divider {
            border-top: 1px dashed #ccc;
            margin: 10px 0;
          }
          .totals {
            margin-top: 15px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
          }
          .final-total {
            font-weight: bold;
            font-size: 14px;
            margin-top: 10px;
            border-top: 1px solid black;
            padding-top: 5px;
          }
          .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 10px;
          }
        </style>
      </head>
      <body>
        <h1>Order Receipt</h1>
        <div class="divider"></div>
        <div class="order-details">
          <p><strong>Order #:</strong> ${orderNumber}</p>
          <p><strong>Date:</strong> ${orderDate}</p>
          <p><strong>Order Type:</strong> ${orderType === 'eat-in' ? 'Eat In' : 'Takeaway'}</p>
          ${orderType === 'eat-in' && tableNumber ? `<p><strong>Table #:</strong> ${tableNumber}</p>` : ''}
        </div>
        
        <div class="divider"></div>
        
        <h2>Items</h2>
        ${items.map((item) => `
          <div class="order-item">
            <div>
              <span>${item.quantity} x ${item.product.name}</span>
              ${item.options && item.options.length > 0 ? 
                `<br><small>${item.options.map((o) => o.value).join(', ')}</small>` : 
                ''}
            </div>
            <span>${(item.product.price * item.quantity).toFixed(2)} €</span>
          </div>
          ${item.selectedToppings && item.selectedToppings.length > 0 ? 
            item.selectedToppings.map((topping) => `
              <div class="topping-item">
                <span>+ ${topping.name}</span>
                <span>${topping.price.toFixed(2)} €</span>
              </div>
            `).join('') : 
            ''}
        `).join('')}
        
        <div class="divider"></div>
        
        <div class="totals">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>${subtotal?.toFixed(2) || '0.00'} €</span>
          </div>
          <div class="total-row">
            <span>Tax:</span>
            <span>${tax?.toFixed(2) || '0.00'} €</span>
          </div>
          <div class="total-row final-total">
            <span>Total:</span>
            <span>${total?.toFixed(2) || '0.00'} €</span>
          </div>
        </div>
        
        <div class="footer">
          <p>Thank you for your order!</p>
        </div>
      </body>
    </html>
  `;
};

// Print order using browser's print functionality
export const printOrderBrowser = async (
  orderNumber: string | number,
  items: CartItemType[],
  orderType: string,
  tableNumber: string | number | undefined,
  subtotal: number,
  tax: number,
  total: number
): Promise<void> => {
  try {
    const htmlContent = formatOrderReceipt(
      orderNumber,
      items,
      orderType,
      tableNumber,
      subtotal,
      tax,
      total
    );
    
    // First try to convert to PDF for better print formatting
    try {
      const pdfData = await convertHTMLToPDF(htmlContent);
      const pdfBlob = new Blob([atob(pdfData).split('').map(char => char.charCodeAt(0))], { type: 'application/pdf' });
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      // Open PDF in new window and print it
      const printWindow = window.open(pdfUrl);
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
          setTimeout(() => printWindow.close(), 500);
        };
      } else {
        throw new Error("Could not open print window");
      }
    } catch (pdfError) {
      console.warn('PDF generation failed, falling back to HTML print:', pdfError);
      
      // Fallback to iframe HTML printing if PDF conversion fails
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      
      if (!iframe.contentDocument) {
        console.error("Could not access iframe document");
        return;
      }
      
      iframe.contentDocument.write(htmlContent);
      iframe.contentDocument.close();
      
      // Print using browser
      setTimeout(() => {
        iframe.contentWindow?.print();
        
        // Remove the iframe after printing
        setTimeout(() => {
          iframe.remove();
        }, 2000);
      }, 500);
    }
  } catch (error) {
    console.error('Error printing order:', error);
  }
};

// Print order - this is now just a wrapper around browser printing
export const printOrder = (
  orderNumber: string | number,
  items: CartItemType[],
  orderType: string,
  tableNumber: string | number | undefined,
  subtotal: number,
  tax: number,
  total: number
): void => {
  printOrderBrowser(orderNumber, items, orderType, tableNumber, subtotal, tax, total);
};
