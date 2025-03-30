
import { CartItemType } from "../components/cart/types";

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
          body {
            font-family: 'Courier New', monospace;
            padding: 0;
            margin: 1mm;
            width: 72mm; /* Accounting for margins */
            font-size: 9pt;
            line-height: 1.2;
          }
          h1 {
            text-align: center;
            font-size: 12pt;
            margin: 2mm 0;
          }
          h2 {
            text-align: center;
            font-size: 10pt;
            margin: 2mm 0;
          }
          .order-details {
            margin-bottom: 3mm;
          }
          .order-details p {
            margin: 0.5mm 0;
          }
          .order-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 1mm;
          }
          .topping-item {
            display: flex;
            justify-content: space-between;
            margin-left: 5mm;
            font-size: 8pt;
          }
          .divider {
            text-align: center;
            margin: 2mm 0;
            font-weight: normal;
          }
          .totals {
            margin-top: 3mm;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 1mm;
          }
          .final-total {
            font-weight: bold;
            font-size: 10pt;
            margin-top: 2mm;
            border-top: 0.5pt solid black;
            padding-top: 1mm;
          }
          .footer {
            margin-top: 5mm;
            text-align: center;
            font-size: 8pt;
          }
        </style>
      </head>
      <body>
        <h1>Order Receipt</h1>
        <div class="order-details">
          <p>Order #: ${orderNumber}</p>
          <p>Date: ${orderDate}</p>
          <p>Type: ${orderType === 'eat-in' ? 'Eat In' : 'Takeaway'}</p>
          ${orderType === 'eat-in' && tableNumber ? `<p>Table #: ${tableNumber}</p>` : ''}
        </div>
        
        <div class="divider">----------------------------</div>
        
        <h2>Items</h2>
        ${items.map((item) => `
          <div class="order-item">
            <span>${item.quantity} x ${item.product.name}</span>
            <span>$${(item.product.price * item.quantity).toFixed(2)}</span>
          </div>
          ${item.selectedToppings && item.selectedToppings.length > 0 ? 
            item.selectedToppings.map((topping) => `
              <div class="topping-item">
                <span>+ ${topping.name}</span>
                <span>$${topping.price.toFixed(2)}</span>
              </div>
            `).join('') : ''}
        `).join('')}
        
        <div class="divider">----------------------------</div>
        
        <div class="totals">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>$${subtotal?.toFixed(2) || '0.00'}</span>
          </div>
          <div class="total-row">
            <span>Tax:</span>
            <span>$${tax?.toFixed(2) || '0.00'}</span>
          </div>
          <div class="total-row final-total">
            <span>Total:</span>
            <span>$${total?.toFixed(2) || '0.00'}</span>
          </div>
        </div>
        
        <div class="footer">
          <p>Thank you for your order!</p>
        </div>
      </body>
    </html>
  `;
};

// Manual print function for browser (no longer auto-prints)
export const printOrderBrowser = (
  orderNumber: string | number,
  items: CartItemType[],
  orderType: string,
  tableNumber: string | number | undefined,
  subtotal: number,
  tax: number,
  total: number
): void => {
  try {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    if (!iframe.contentDocument) {
      console.error("Could not access iframe document");
      return;
    }
    
    iframe.contentDocument.write(formatOrderReceipt(
      orderNumber,
      items,
      orderType,
      tableNumber,
      subtotal,
      tax,
      total
    ));
    
    iframe.contentDocument.close();
    
    // Make iframe available for manual printing, but don't auto-print
    setTimeout(() => {
      iframe.contentWindow?.focus(); // Focus the iframe
      // Note: We removed the auto-print functionality
      
      // Remove the iframe after a delay
      setTimeout(() => {
        iframe.remove();
      }, 10000);
    }, 500);
  } catch (error) {
    console.error('Error preparing order for printing:', error);
  }
};

// Updated print order function - delegates to PrintNode integration
export const printOrder = (
  orderNumber: string | number,
  items: CartItemType[],
  orderType: string,
  tableNumber: string | number | undefined,
  subtotal: number,
  tax: number,
  total: number
): void => {
  // Import and use PrintNode functionality
  import('./printNode').then(({ printOrderWithPrintNode }) => {
    // Try to get PrintNode config from localStorage
    const configStr = localStorage.getItem('printnode_config');
    if (configStr) {
      try {
        const config = JSON.parse(configStr);
        if (config.enabled && config.apiKey && config.printerId) {
          // Use PrintNode for printing
          printOrderWithPrintNode(
            orderNumber, 
            items, 
            orderType, 
            tableNumber, 
            subtotal, 
            tax, 
            total,
            config
          ).then(success => {
            if (!success) {
              console.warn('PrintNode printing failed, fallback to browser print dialog');
              printOrderBrowser(orderNumber, items, orderType, tableNumber, subtotal, tax, total);
            }
          });
          return;
        }
      } catch (e) {
        console.error('Error parsing PrintNode config', e);
      }
    }
    
    // Fallback to browser printing dialog (no auto-print)
    printOrderBrowser(orderNumber, items, orderType, tableNumber, subtotal, tax, total);
  }).catch(err => {
    console.error('Error loading PrintNode module:', err);
    // Fallback to browser printing
    printOrderBrowser(orderNumber, items, orderType, tableNumber, subtotal, tax, total);
  });
};
