
import { CartItemType } from "../components/cart/types";
import { sendPrintJob } from "./printBiz";
import { toast } from "sonner";

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

// Print order using PrintNode integration
export const printOrder = async (
  orderNumber: string | number,
  items: CartItemType[],
  orderType: string,
  tableNumber: string | number | undefined,
  subtotal: number,
  tax: number,
  total: number
): Promise<boolean> => {
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
    
    const result = await sendPrintJob({
      printer_id: localStorage.getItem('defaultPrinterId') || '',
      content: htmlContent,
      type: 'receipt',
      copies: 1,
      metadata: {
        orderNumber,
        orderType,
        tableNumber,
        total
      }
    });
    
    if (!result) {
      toast.error("Failed to print receipt", {
        description: "Please check printer configuration and try again"
      });
      return false;
    }
    
    toast.success("Receipt printed successfully", {
      description: `Order #${orderNumber} sent to printer`
    });
    return true;
  } catch (error) {
    console.error('Error printing order:', error);
    toast.error("Error printing receipt", {
      description: "An unexpected error occurred"
    });
    return false;
  }
};

// Legacy function kept for compatibility
export const printOrderBrowser = (
  orderNumber: string | number,
  items: CartItemType[],
  orderType: string,
  tableNumber: string | number | undefined,
  subtotal: number,
  tax: number,
  total: number
): void => {
  console.warn("Browser printing is disabled. Using PrintNode integration instead.");
  printOrder(orderNumber, items, orderType, tableNumber, subtotal, tax, total);
};
