import { CartItemType } from "../components/cart/types";
import { getPrintNodeCredentials, sendToPrintNode, formatTextReceipt } from "./printNode";

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

/**
 * Print to thermal printer via PrintNode
 */
export const printToThermalPrinter = async (
  orderNumber: string | number,
  items: CartItemType[],
  orderType: string,
  tableNumber: string | number | undefined,
  subtotal: number,
  tax: number,
  total: number
): Promise<boolean> => {
  try {
    console.log('Attempting to print receipt to PrintNode...');
    const credentials = await getPrintNodeCredentials();
    
    console.log('PrintNode credentials:', {
      enabled: credentials.enabled,
      hasApiKey: !!credentials.apiKey,
      hasPrinterId: !!credentials.printerId
    });
    
    if (!credentials.enabled || !credentials.apiKey || !credentials.printerId) {
      console.error('PrintNode is not enabled or configured correctly:', credentials);
      return false;
    }
    
    console.log('PrintNode credentials found, formatting receipt...');
    const textReceipt = formatTextReceipt(
      orderNumber,
      items,
      orderType,
      tableNumber,
      subtotal,
      tax,
      total
    );
    
    console.log('Sending receipt to PrintNode...');
    const result = await sendToPrintNode(textReceipt, credentials.apiKey, credentials.printerId);
    console.log('PrintNode send result:', result);
    return result;
  } catch (error) {
    console.error('Error printing to thermal printer:', error);
    return false;
  }
};

/**
 * Print to browser
 */
export const printToBrowser = (
  orderNumber: string | number,
  items: CartItemType[],
  orderType: string,
  tableNumber: string | number | undefined,
  subtotal: number,
  tax: number,
  total: number
): boolean => {
  try {
    console.log('Printing receipt in browser...');
    const receipt = formatOrderReceipt(
      orderNumber,
      items,
      orderType,
      tableNumber,
      subtotal,
      tax,
      total
    );
    
    // Create a hidden iframe for printing
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    
    document.body.appendChild(iframe);
    
    // Write receipt HTML to iframe and print it
    if (iframe.contentWindow) {
      iframe.contentWindow.document.open();
      iframe.contentWindow.document.write(receipt);
      iframe.contentWindow.document.close();
      
      iframe.contentWindow.onafterprint = () => {
        document.body.removeChild(iframe);
      };
      
      setTimeout(() => {
        iframe.contentWindow?.print();
      }, 500);
      
      return true;
    } else {
      console.error('Failed to access iframe content window');
      document.body.removeChild(iframe);
      return false;
    }
  } catch (error) {
    console.error('Error printing to browser:', error);
    return false;
  }
};

// Print order - Updated to allow multiple print targets
export const printOrder = async (
  orderNumber: string | number,
  items: CartItemType[],
  orderType: string,
  tableNumber: string | number | undefined,
  subtotal: number,
  tax: number,
  total: number,
  options: { 
    usePrintNode?: boolean; 
    useBrowserPrint?: boolean;
    fallbackToBrowser?: boolean;
  } = { usePrintNode: true, useBrowserPrint: false, fallbackToBrowser: true }
): Promise<boolean> => {
  console.log('Print order function called with order #:', orderNumber);
  let printSuccess = false;
  
  try {
    // Use PrintNode if requested
    if (options.usePrintNode) {
      const printNodeSuccess = await printToThermalPrinter(
        orderNumber, 
        items, 
        orderType, 
        tableNumber, 
        subtotal, 
        tax, 
        total
      );
      
      if (printNodeSuccess) {
        console.log('Order receipt successfully sent to PrintNode.');
        printSuccess = true;
      } else if (!options.useBrowserPrint && options.fallbackToBrowser) {
        // Only fallback to browser if browser printing isn't explicitly requested
        console.log('PrintNode printing failed. Falling back to browser printing.');
        const browserPrinted = printToBrowser(
          orderNumber,
          items,
          orderType,
          tableNumber,
          subtotal,
          tax,
          total
        );
        
        if (browserPrinted) {
          console.log('Order receipt successfully sent to browser printing (fallback).');
          printSuccess = true;
        }
      }
    }
    
    // Use browser printing if requested (can be in addition to PrintNode)
    if (options.useBrowserPrint) {
      const browserPrintSuccess = printToBrowser(
        orderNumber,
        items,
        orderType,
        tableNumber,
        subtotal,
        tax,
        total
      );
      
      if (browserPrintSuccess) {
        console.log('Order receipt successfully sent to browser printing.');
        printSuccess = true;
      }
    }
    
    if (!printSuccess) {
      console.warn('Failed to print receipt via any method.');
    }
    
    return printSuccess;
  } catch (error) {
    console.error('Error in printOrder:', error);
    
    // Last resort fallback to browser if an exception occurred
    if (options.fallbackToBrowser && !options.useBrowserPrint) {
      try {
        console.log('Error occurred. Attempting browser printing as last resort.');
        return printToBrowser(
          orderNumber, 
          items, 
          orderType, 
          tableNumber, 
          subtotal, 
          tax, 
          total
        );
      } catch (browserError) {
        console.error('Browser printing also failed:', browserError);
        return false;
      }
    }
    
    return false;
  }
};

// For direct browser printing
export const printOrderBrowser = (
  orderNumber: string | number,
  items: CartItemType[],
  orderType: string,
  tableNumber: string | number | undefined,
  subtotal: number,
  tax: number,
  total: number
): boolean => {
  console.log('Direct browser printing requested');
  const result = printOrder(
    orderNumber, 
    items, 
    orderType, 
    tableNumber, 
    subtotal, 
    tax, 
    total, 
    { usePrintNode: false, useBrowserPrint: true, fallbackToBrowser: false }
  );
  
  return true;
};

// Print to both PrintNode and browser
export const printOrderBoth = async (
  orderNumber: string | number,
  items: CartItemType[],
  orderType: string,
  tableNumber: string | number | undefined,
  subtotal: number,
  tax: number,
  total: number
): Promise<boolean> => {
  console.log('Printing to both PrintNode and browser');
  return printOrder(
    orderNumber, 
    items, 
    orderType, 
    tableNumber, 
    subtotal, 
    tax, 
    total, 
    { usePrintNode: true, useBrowserPrint: true, fallbackToBrowser: false }
  );
};
