
import { CartItemType } from "../components/cart/types";
import { sendPrintJob, PrintBizConfig } from "./printBiz";

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
  
  // This formats the receipt as HTML for browser printing
  // In a real implementation with PrintBiz, you might need to format differently
  // based on their API requirements (HTML, plain text, template language, etc.)
  
  return `
    <html>
      <head>
        <title>Order #${orderNumber}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            max-width: 400px;
            margin: 0 auto;
          }
          h1, h2 {
            text-align: center;
          }
          .order-details {
            margin-bottom: 20px;
          }
          .order-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
          }
          .topping-item {
            display: flex;
            justify-content: space-between;
            margin-left: 20px;
            font-size: 0.9em;
            color: #666;
          }
          .divider {
            border-top: 1px dashed #ccc;
            margin: 15px 0;
          }
          .totals {
            margin-top: 20px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
          }
          .final-total {
            font-weight: bold;
            font-size: 1.2em;
            margin-top: 10px;
            border-top: 1px solid black;
            padding-top: 10px;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 0.9em;
            color: #666;
          }
        </style>
      </head>
      <body>
        <h1>Order Receipt</h1>
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
            <span>$${(item.product.price * item.quantity).toFixed(2)}</span>
          </div>
          ${item.selectedToppings && item.selectedToppings.length > 0 ? 
            item.selectedToppings.map((topping) => `
              <div class="topping-item">
                <span>+ ${topping.name}</span>
                <span>$${topping.price.toFixed(2)}</span>
              </div>
            `).join('') : 
            ''}
        `).join('')}
        
        <div class="divider"></div>
        
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

// Print order using browser's print functionality
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
    
    // Print using browser
    setTimeout(() => {
      iframe.contentWindow?.print();
      
      // Remove the iframe after printing
      setTimeout(() => {
        iframe.remove();
      }, 2000);
    }, 500);
  } catch (error) {
    console.error('Error printing order:', error);
  }
};

// Print order using PrintBiz cloud printing
export const printOrderViaPrintBiz = async (
  printBizConfig: PrintBizConfig,
  orderNumber: string | number,
  items: CartItemType[],
  orderType: string,
  tableNumber: string | number | undefined,
  subtotal: number,
  tax: number,
  total: number
): Promise<boolean> => {
  if (!printBizConfig.enabled || !printBizConfig.api_key) {
    console.log('PrintBiz is not enabled, falling back to browser printing');
    printOrderBrowser(orderNumber, items, orderType, tableNumber, subtotal, tax, total);
    return false;
  }
  
  try {
    const content = formatOrderReceipt(
      orderNumber,
      items,
      orderType,
      tableNumber,
      subtotal,
      tax,
      total
    );
    
    const printJob = {
      printer_id: printBizConfig.default_printer_id,
      content,
      type: 'receipt' as const,
      copies: 1,
      metadata: {
        order_id: orderNumber,
        order_type: orderType,
        table: tableNumber
      }
    };
    
    const success = await sendPrintJob(printBizConfig, printJob);
    
    if (!success) {
      console.log('Failed to print via PrintBiz, falling back to browser printing');
      printOrderBrowser(orderNumber, items, orderType, tableNumber, subtotal, tax, total);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error printing via PrintBiz:', error);
    console.log('Falling back to browser printing');
    printOrderBrowser(orderNumber, items, orderType, tableNumber, subtotal, tax, total);
    return false;
  }
};
