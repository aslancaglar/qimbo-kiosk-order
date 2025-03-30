
import { CartItemType } from "../components/cart/types";
import { sendPrintJob } from "./printBiz";
import html2pdf from 'html2pdf.js';

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
      // iframe.contentWindow?.print(); - Disabled automatic printing
      
      // Remove the iframe after a delay
      setTimeout(() => {
        iframe.remove();
      }, 2000);
    }, 500);
  } catch (error) {
    console.error('Error printing order:', error);
  }
};

// Print order using PrintNode
export const printOrderPrintNode = async (
  orderNumber: string | number,
  items: CartItemType[],
  orderType: string,
  tableNumber: string | number | undefined,
  subtotal: number,
  tax: number,
  total: number
): Promise<boolean> => {
  try {
    // Generate receipt HTML
    const receiptHtml = formatOrderReceipt(
      orderNumber,
      items,
      orderType,
      tableNumber,
      subtotal,
      tax,
      total
    );
    
    // Create element for html2pdf
    const element = document.createElement('div');
    element.innerHTML = receiptHtml;
    document.body.appendChild(element);
    
    // Convert HTML to PDF using html2pdf
    const pdfBlob = await html2pdf().from(element).outputPdf('blob');
    
    // Remove the temporary element
    document.body.removeChild(element);
    
    // Convert blob to base64
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64data = reader.result?.toString().split(',')[1] || '';
        
        // Send to PrintNode
        const success = await sendPrintJob({
          printer_id: '', // Will use default from config
          content: base64data,
          type: 'receipt',
          copies: 1,
          metadata: {
            orderNumber,
            orderType,
            tableNumber,
          }
        });
        
        resolve(success);
      };
      reader.readAsDataURL(pdfBlob);
    });
  } catch (error) {
    console.error('Error printing order with PrintNode:', error);
    return false;
  }
};

// Print order - main function that decides which method to use
export const printOrder = async (
  orderNumber: string | number,
  items: CartItemType[],
  orderType: string,
  tableNumber: string | number | undefined,
  subtotal: number,
  tax: number,
  total: number
): Promise<void> => {
  // Try to print with PrintNode first
  const printNodeSuccess = await printOrderPrintNode(
    orderNumber, 
    items, 
    orderType, 
    tableNumber, 
    subtotal, 
    tax, 
    total
  );
  
  // If PrintNode fails, fall back to browser printing
  if (!printNodeSuccess) {
    printOrderBrowser(orderNumber, items, orderType, tableNumber, subtotal, tax, total);
  }
};
