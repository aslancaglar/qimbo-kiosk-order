
import { CartItemType } from "@/components/cart/types";

// PrintNode API configuration
interface PrintNodeConfig {
  apiKey: string;
  defaultPrinterId?: number;
  enabled: boolean;
}

// PrintNode job interface
interface PrintNodeJob {
  printerId: number;
  title: string;
  content: string;
  contentType: "pdf_uri" | "pdf_base64" | "raw_uri" | "raw_base64";
  source: string;
}

// Store configuration in localStorage for persistence
const STORAGE_KEY = 'printnode_config';

/**
 * Get PrintNode configuration from localStorage
 */
export const getPrintNodeConfig = (): PrintNodeConfig => {
  const storedConfig = localStorage.getItem(STORAGE_KEY);
  if (storedConfig) {
    try {
      return JSON.parse(storedConfig);
    } catch (e) {
      console.error('Error parsing PrintNode config:', e);
    }
  }
  
  return {
    apiKey: '',
    enabled: false
  };
};

/**
 * Save PrintNode configuration to localStorage
 */
export const savePrintNodeConfig = (config: PrintNodeConfig): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
};

/**
 * Test PrintNode API connection
 */
export const testPrintNodeConnection = async (): Promise<boolean> => {
  const config = getPrintNodeConfig();
  
  if (!config.apiKey) {
    return false;
  }
  
  try {
    const response = await fetch('https://api.printnode.com/whoami', {
      headers: {
        'Authorization': `Basic ${btoa(config.apiKey + ':')}`
      }
    });
    
    return response.ok;
  } catch (error) {
    console.error('PrintNode connection test failed:', error);
    return false;
  }
};

/**
 * Fetch available printers from PrintNode
 */
export const fetchPrintNodePrinters = async (): Promise<any[]> => {
  const config = getPrintNodeConfig();
  
  if (!config.apiKey || !config.enabled) {
    return [];
  }
  
  try {
    const response = await fetch('https://api.printnode.com/printers', {
      headers: {
        'Authorization': `Basic ${btoa(config.apiKey + ':')}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    
    const printers = await response.json();
    return printers;
  } catch (error) {
    console.error('Error fetching PrintNode printers:', error);
    return [];
  }
};

/**
 * Generate HTML content for receipt
 */
export const generateReceiptHTML = (
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
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Order #${orderNumber}</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 10px;
            width: 80mm;
            font-size: 12px;
          }
          .header {
            text-align: center;
            margin-bottom: 10px;
            border-bottom: 1px dashed #000;
            padding-bottom: 10px;
          }
          .order-info {
            margin-bottom: 10px;
          }
          .items {
            width: 100%;
            border-collapse: collapse;
          }
          .items td {
            padding: 3px 0;
          }
          .items .qty {
            text-align: center;
            width: 30px;
          }
          .items .price {
            text-align: right;
            width: 60px;
          }
          .topping {
            padding-left: 15px;
            font-size: 11px;
          }
          .totals {
            margin-top: 10px;
            text-align: right;
          }
          .total-line {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
          }
          .grand-total {
            font-weight: bold;
            border-top: 1px solid #000;
            padding-top: 5px;
            margin-top: 5px;
          }
          .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 11px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2 style="margin: 0;">ORDER #${orderNumber}</h2>
          <p>${orderDate}</p>
        </div>
        
        <div class="order-info">
          <p><strong>Type:</strong> ${orderType === 'eat-in' ? 'Eat In' : 'Takeaway'}</p>
          ${orderType === 'eat-in' && tableNumber ? `<p><strong>Table #:</strong> ${tableNumber}</p>` : ''}
        </div>
        
        <table class="items">
          <tbody>
            ${items.map(item => `
              <tr>
                <td class="qty">${item.quantity}x</td>
                <td>${item.product.name}</td>
                <td class="price">${(item.product.price * item.quantity).toFixed(2)} €</td>
              </tr>
              ${item.selectedToppings && item.selectedToppings.length > 0 ? 
                item.selectedToppings.map(topping => `
                  <tr>
                    <td class="qty"></td>
                    <td class="topping">+ ${topping.name}</td>
                    <td class="price">${topping.price.toFixed(2)} €</td>
                  </tr>
                `).join('') : 
                ''}
            `).join('')}
          </tbody>
        </table>
        
        <div class="totals">
          <div class="total-line">
            <span>Subtotal:</span>
            <span>${subtotal.toFixed(2)} €</span>
          </div>
          <div class="total-line">
            <span>Tax:</span>
            <span>${tax.toFixed(2)} €</span>
          </div>
          <div class="total-line grand-total">
            <span>TOTAL:</span>
            <span>${total.toFixed(2)} €</span>
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
 * Send print job to PrintNode
 */
export const sendToPrintNode = async (
  orderNumber: string | number,
  items: CartItemType[],
  orderType: string,
  tableNumber: string | number | undefined,
  subtotal: number,
  tax: number,
  total: number
): Promise<boolean> => {
  const config = getPrintNodeConfig();
  
  if (!config.apiKey || !config.enabled || !config.defaultPrinterId) {
    console.log('PrintNode not configured or disabled');
    return false;
  }
  
  try {
    // Generate HTML content
    const htmlContent = generateReceiptHTML(
      orderNumber,
      items,
      orderType,
      tableNumber,
      subtotal,
      tax,
      total
    );
    
    // Convert HTML to base64
    const base64Content = btoa(unescape(encodeURIComponent(htmlContent)));
    
    // Prepare the print job
    const printJob = {
      printerId: config.defaultPrinterId,
      title: `Order #${orderNumber}`,
      contentType: "raw_base64",
      content: base64Content,
      source: "POS System"
    };
    
    // Send to PrintNode API
    const response = await fetch('https://api.printnode.com/printjobs', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(config.apiKey + ':')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(printJob)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error ${response.status}: ${errorText}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error sending print job to PrintNode:', error);
    return false;
  }
};
