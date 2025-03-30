
import { CartItemType } from "@/components/cart/types";
import htmlToPdf from 'html-pdf-node';

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

// Storage key constants
const STORAGE_KEY = 'printnode_config';
const API_KEY_KEY = 'printnode_api_key';
const ENABLED_KEY = 'printnode_enabled';
const PRINTER_ID_KEY = 'printnode_printer_id';

/**
 * Get PrintNode configuration from localStorage with fallback mechanisms
 */
export const getPrintNodeConfig = (): PrintNodeConfig => {
  // Try to get the complete config object first
  const storedConfig = localStorage.getItem(STORAGE_KEY);
  
  try {
    // If we have a stored config, parse and return it
    if (storedConfig) {
      const config = JSON.parse(storedConfig);
      
      // Validate essential properties
      if (typeof config.apiKey === 'string') {
        console.log('Retrieved complete PrintNode config from storage');
        return config;
      }
    }
    
    // If complete config wasn't valid, try individual values as fallback
    const apiKey = localStorage.getItem(API_KEY_KEY) || '';
    const enabledStr = localStorage.getItem(ENABLED_KEY);
    const printerIdStr = localStorage.getItem(PRINTER_ID_KEY);
    
    const enabled = enabledStr === 'true';
    const defaultPrinterId = printerIdStr ? parseInt(printerIdStr, 10) : undefined;
    
    // If we have an API key from individual storage, use that
    if (apiKey) {
      console.log('Retrieved PrintNode config from individual keys');
      
      // Also save the complete object for future use
      const rebuiltConfig = { apiKey, enabled, defaultPrinterId };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rebuiltConfig));
      
      return rebuiltConfig;
    }
    
    // Default empty config
    console.log('No PrintNode config found, using defaults');
    return {
      apiKey: '',
      enabled: false
    };
    
  } catch (e) {
    console.error('Error parsing PrintNode config:', e);
    return {
      apiKey: '',
      enabled: false
    };
  }
};

/**
 * Save PrintNode configuration to localStorage using multiple storage methods for redundancy
 */
export const savePrintNodeConfig = (config: PrintNodeConfig): void => {
  try {
    // Store as complete object
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    
    // Also store as individual values for fallback
    localStorage.setItem(API_KEY_KEY, config.apiKey);
    localStorage.setItem(ENABLED_KEY, String(config.enabled));
    
    if (config.defaultPrinterId !== undefined) {
      localStorage.setItem(PRINTER_ID_KEY, String(config.defaultPrinterId));
    } else {
      localStorage.removeItem(PRINTER_ID_KEY);
    }
    
    console.log('PrintNode config saved successfully');
  } catch (error) {
    console.error('Failed to save PrintNode config:', error);
  }
};

/**
 * Test PrintNode API connection
 */
export const testPrintNodeConnection = async (): Promise<boolean> => {
  const config = getPrintNodeConfig();
  
  if (!config.apiKey) {
    console.log('PrintNode API key is empty');
    return false;
  }
  
  try {
    console.log('Testing PrintNode connection...');
    
    const response = await fetch('https://api.printnode.com/whoami', {
      headers: {
        'Authorization': `Basic ${btoa(config.apiKey + ':')}`
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`PrintNode API error: ${response.status} - ${errorText}`);
      return false;
    }
    
    const data = await response.json();
    console.log('PrintNode connection successful', data);
    return true;
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
    console.log('Cannot fetch printers: API key is empty or printing is disabled');
    return [];
  }
  
  try {
    console.log('Fetching PrintNode printers...');
    
    const response = await fetch('https://api.printnode.com/printers', {
      headers: {
        'Authorization': `Basic ${btoa(config.apiKey + ':')}`
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error fetching PrintNode printers: ${response.status} - ${errorText}`);
      throw new Error(`HTTP error ${response.status}: ${errorText}`);
    }
    
    const printers = await response.json();
    console.log(`Found ${printers.length} printers:`, printers);
    return printers;
  } catch (error) {
    console.error('Error fetching PrintNode printers:', error);
    return [];
  }
};

/**
 * Generate test receipt HTML content
 */
export const generateTestReceiptHTML = (): string => {
  const testDate = new Date().toLocaleString();
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Test Receipt</title>
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
          .content {
            margin: 15px 0;
          }
          .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 11px;
            border-top: 1px dashed #000;
            padding-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2 style="margin: 0;">TEST RECEIPT</h2>
          <p>${testDate}</p>
        </div>
        
        <div class="content">
          <p>This is a test receipt from your POS system.</p>
          <p>If you can read this message, your printer is configured correctly!</p>
          
          <p style="text-align: center; margin: 20px 0; font-size: 14px;">
            <strong>PrintNode Integration Test</strong>
          </p>
          
          <p>Below is a test of different formatting:</p>
          <ul style="list-style-type: none; padding-left: 10px;">
            <li><strong>Bold text</strong></li>
            <li><em>Italic text</em></li>
            <li>Normal text</li>
            <li>---------</li>
          </ul>
        </div>
        
        <div class="footer">
          <p>Test completed at: ${testDate}</p>
          <p>Thank you for using our POS system!</p>
        </div>
      </body>
    </html>
  `;
};

/**
 * Convert HTML content to PDF buffer with thermal printer optimizations
 */
const convertHTMLToPDF = async (htmlContent: string): Promise<Buffer> => {
  try {
    console.log('Converting HTML to PDF for thermal printer...');
    const options = { 
      format: {
        width: '80mm',
        height: 'auto'
      },
      printBackground: true,
      preferCSSPageSize: true,
      margin: { 
        top: '5mm',
        right: '3mm',
        bottom: '5mm',
        left: '3mm' 
      }
    };
    
    const file = { content: htmlContent };
    const pdfBuffer = await htmlToPdf.generatePdf(file, options);
    console.log('PDF generated successfully with thermal printer optimizations');
    return pdfBuffer;
  } catch (error) {
    console.error('Error converting HTML to PDF:', error);
    throw error;
  }
};

/**
 * Send test page to PrintNode printer
 */
export const sendTestPage = async (): Promise<boolean> => {
  const config = getPrintNodeConfig();
  
  if (!config.apiKey || !config.enabled || !config.defaultPrinterId) {
    console.log('PrintNode not configured or disabled');
    return false;
  }
  
  try {
    console.log('Sending test page to PrintNode...');
    
    // Generate HTML content
    const htmlContent = generateTestReceiptHTML();
    
    // Convert HTML to PDF
    const pdfBuffer = await convertHTMLToPDF(htmlContent);
    
    // Convert PDF to base64
    const base64Content = pdfBuffer.toString('base64');
    
    // Prepare the print job
    const printJob = {
      printerId: config.defaultPrinterId,
      title: `Test Receipt`,
      contentType: "pdf_base64",
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
      console.error(`Error sending test page: ${response.status} - ${errorText}`);
      throw new Error(`HTTP error ${response.status}: ${errorText}`);
    }
    
    console.log('Test page sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending test page to PrintNode:', error);
    return false;
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
  
  // Improved receipt HTML with better formatting for thermal printers
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
    console.log('PrintNode not configured or disabled:', { 
      hasApiKey: !!config.apiKey, 
      enabled: config.enabled, 
      hasPrinter: !!config.defaultPrinterId 
    });
    return false;
  }
  
  try {
    console.log('Generating receipt HTML for order #', orderNumber);
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
    
    console.log('Converting receipt HTML to PDF...');
    // Convert HTML to PDF
    const pdfBuffer = await convertHTMLToPDF(htmlContent);
    
    // Convert PDF to base64
    const base64Content = pdfBuffer.toString('base64');
    
    // Prepare the print job
    const printJob = {
      printerId: config.defaultPrinterId,
      title: `Order #${orderNumber}`,
      contentType: "pdf_base64",
      content: base64Content,
      source: "POS System"
    };
    
    console.log(`Sending print job to PrintNode printer ID: ${config.defaultPrinterId}`);
    
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
      console.error(`Error sending print job: ${response.status} - ${errorText}`);
      throw new Error(`HTTP error ${response.status}: ${errorText}`);
    }
    
    const responseData = await response.text();
    console.log('PrintNode print job successful, response:', responseData);
    return true;
  } catch (error) {
    console.error('Error sending print job to PrintNode:', error);
    return false;
  }
};
