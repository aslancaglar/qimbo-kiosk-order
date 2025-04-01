
import { CartItemType } from "../components/cart/types";
import { getPrintNodeCredentials, sendToPrintNode, convertHtmlToPdf } from "./printNode";

// Format order for printing - optimized for 80mm thermal POS printer
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
  const receiptWidth = "80mm"; // Standard thermal receipt width
  
  return `
    <html>
      <head>
        <title>Order #${orderNumber}</title>
        <style>
          body {
            font-family: 'Courier New', monospace;
            margin: 0;
            padding: 0;
            width: ${receiptWidth};
            max-width: ${receiptWidth};
            font-size: 12px;
            line-height: 1.2;
          }
          h1, h2 {
            text-align: center;
            font-size: 14px;
            margin: 5px 0;
          }
          p {
            margin: 2px 0;
          }
          .order-details {
            margin-bottom: 10px;
          }
          .divider {
            border-top: 1px dashed #000;
            margin: 8px 0;
          }
          .item-row {
            margin-bottom: 5px;
          }
          .item-name {
            width: 60%;
            display: inline-block;
          }
          .item-qty {
            width: 8%;
            display: inline-block;
            text-align: center;
          }
          .item-price {
            width: 30%;
            display: inline-block;
            text-align: right;
          }
          .topping-item {
            padding-left: 10px;
          }
          .topping-name {
            width: 60%;
            display: inline-block;
          }
          .topping-price {
            width: 38%;
            display: inline-block;
            text-align: right;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
          }
          .final-total {
            font-weight: bold;
            border-top: 1px solid black;
            border-bottom: 1px solid black;
            padding: 3px 0;
            margin: 5px 0;
          }
          .footer {
            text-align: center;
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
        <h1>ORDER RECEIPT</h1>
        <div class="order-details">
          <p>Order: #${orderNumber}</p>
          <p>Date: ${orderDate}</p>
          <p>Type: ${orderType === 'eat-in' ? 'Eat In' : 'Takeaway'}</p>
          ${orderType === 'eat-in' && tableNumber ? `<p>Table: #${tableNumber}</p>` : ''}
        </div>
        
        <div class="divider"></div>
        
        <h2>ITEMS</h2>
        
        <div>
          <div class="item-row">
            <span class="item-qty">QTY</span>
            <span class="item-name">ITEM</span>
            <span class="item-price">PRICE</span>
          </div>
          
          ${items.map((item) => `
            <div class="item-row">
              <span class="item-qty">${item.quantity}</span>
              <span class="item-name">${item.product.name}</span>
              <span class="item-price">${(item.product.price * item.quantity).toFixed(2)} €</span>
            </div>
            ${item.options && item.options.length > 0 ? 
              `<div class="topping-item">
                <span class="topping-name">${item.options.map((o) => o.value).join(', ')}</span>
              </div>` : 
              ''}
            ${item.selectedToppings && item.selectedToppings.length > 0 ? 
              item.selectedToppings.map((topping) => `
                <div class="topping-item">
                  <span class="topping-name">+ ${topping.name}</span>
                  <span class="topping-price">${topping.price.toFixed(2)} €</span>
                </div>
              `).join('') : 
              ''}
          `).join('')}
        </div>
        
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
            <span>TOTAL:</span>
            <span>${total?.toFixed(2) || '0.00'} €</span>
          </div>
        </div>
        
        <div class="footer">
          <p>Thank you for your order!</p>
          <p>* * * * * * * * * * * * *</p>
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
    // Generate HTML receipt
    const htmlReceipt = formatOrderReceipt(
      orderNumber,
      items,
      orderType,
      tableNumber,
      subtotal,
      tax,
      total
    );
    
    console.log('Converting HTML to PDF for PrintNode...');
    // Convert the HTML content to PDF
    const pdfData = await convertHtmlToPdf(htmlReceipt);
    
    console.log('Sending PDF to PrintNode...');
    // Send the PDF to PrintNode
    const result = await sendToPrintNode(pdfData, credentials.apiKey, credentials.printerId);
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
export const printOrderBrowser = async (
  orderNumber: string | number,
  items: CartItemType[],
  orderType: string,
  tableNumber: string | number | undefined,
  subtotal: number,
  tax: number,
  total: number
): Promise<boolean> => {
  console.log('Direct browser printing requested');
  return await printOrder(
    orderNumber, 
    items, 
    orderType, 
    tableNumber, 
    subtotal, 
    tax, 
    total, 
    { usePrintNode: false, useBrowserPrint: true, fallbackToBrowser: false }
  );
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
  return await printOrder(
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
