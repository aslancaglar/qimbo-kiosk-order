import { CartItemType } from "../components/cart/types";
import { getPrintNodeCredentials, sendToPrintNode, formatTextReceipt } from "./printNode";
import { supabase } from "../integrations/supabase/client";

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
      hasPrinters: credentials.printers?.length > 0
    });
    
    if (!credentials.enabled || !credentials.apiKey || !credentials.printers || credentials.printers.length === 0) {
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
    
    console.log(`Sending receipt to ${credentials.printers.length} PrintNode printer(s)...`);
    
    // Send to all configured printers
    const results = await Promise.all(
      credentials.printers.map(printer => 
        sendToPrintNode(textReceipt, credentials.apiKey, printer.id)
      )
    );
    
    // If any printer succeeded, consider it successful
    const anySuccessful = results.some(result => result);
    console.log('PrintNode send results:', results);
    
    return anySuccessful;
  } catch (error) {
    console.error('Error printing to thermal printer:', error);
    return false;
  }
};

// Device detection helper
export const isMobileOrTablet = (): boolean => {
  // Use a simple user agent detection for mobile and tablet devices
  if (typeof navigator !== 'undefined' && navigator.userAgent) {
    const userAgent = navigator.userAgent.toLowerCase();
    
    // Check for common mobile/tablet indicators in user agent
    return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet|ipad|playbook|silk|android|mobile|tablet/i.test(userAgent);
  }
  
  // Default to false if navigator or userAgent is not available
  return false;
};

// Browser printing settings
let _browserPrintingEnabled = true;

/**
 * Enable or disable browser printing
 */
export const saveBrowserPrintSettings = async (enabled: boolean): Promise<boolean> => {
  try {
    _browserPrintingEnabled = enabled;
    
    // Store this in database with proper settings key
    const { data: existingData, error: checkError } = await supabase
      .from('settings')
      .select('id')
      .eq('key', 'browser_print_settings')
      .maybeSingle();
      
    if (checkError) {
      console.error('Error checking browser print settings:', checkError);
      return false;
    }
    
    let saveError;
    
    const settingsValue = {
      enabled: enabled,
      lastUpdated: new Date().toISOString(),
      disableOnMobile: true // New setting to disable on mobile by default
    };
    
    if (existingData) {
      const { error } = await supabase
        .from('settings')
        .update({
          value: settingsValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingData.id);
        
      saveError = error;
    } else {
      const { error } = await supabase
        .from('settings')
        .insert({
          key: 'browser_print_settings',
          value: settingsValue,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
      saveError = error;
    }

    if (saveError) {
      console.error('Error saving browser print settings to database:', saveError);
      return false;
    }
    
    console.log('Browser printing settings updated in database:', { enabled });
    return true;
  } catch (error) {
    console.error('Error saving browser print settings:', error);
    return false;
  }
};

/**
 * Check if browser printing is enabled
 */
export const isBrowserPrintingEnabled = async (): Promise<boolean> => {
  try {
    // First try to fetch settings from database
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'browser_print_settings')
      .maybeSingle();
      
    if (error) {
      console.error('Error fetching browser print settings:', error);
      // Fall back to in-memory value with mobile detection
      return isMobileOrTablet() ? false : _browserPrintingEnabled;
    }
    
    // Check if data exists and has the right structure
    if (data && data.value && typeof data.value === 'object') {
      // Type-safe way to access the 'enabled' property
      const settingsObj = data.value as Record<string, any>;
      
      // Check if we're on mobile/tablet and if the disableOnMobile setting is true
      if (
        isMobileOrTablet() && 
        settingsObj.disableOnMobile === true
      ) {
        console.log('Browser printing disabled on mobile/tablet device');
        return false;
      }
      
      if ('enabled' in settingsObj && typeof settingsObj.enabled === 'boolean') {
        _browserPrintingEnabled = settingsObj.enabled; // Update local cache
        console.log('Retrieved browser printing setting from database:', settingsObj.enabled);
        return settingsObj.enabled;
      }
    }
    
    // Fall back to in-memory value with mobile detection
    return isMobileOrTablet() ? false : _browserPrintingEnabled;
  } catch (error) {
    console.error('Error checking browser print settings:', error);
    // Fall back to in-memory value with mobile detection
    return isMobileOrTablet() ? false : _browserPrintingEnabled;
  }
};

/**
 * Print to browser
 */
export const printToBrowser = async (
  orderNumber: string | number,
  items: CartItemType[],
  orderType: string,
  tableNumber: string | number | undefined,
  subtotal: number,
  tax: number,
  total: number
): Promise<boolean> => {
  try {
    // Check if browser printing is enabled - use await as it's now async
    const browserPrintingEnabled = await isBrowserPrintingEnabled();
    
    // First check if we should print on this device type
    if (isMobileOrTablet()) {
      console.log('Browser printing skipped on mobile/tablet device');
      return false;
    }
    
    if (!browserPrintingEnabled) {
      console.log('Browser printing is disabled');
      return false;
    }
    
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
        const browserPrinted = await printToBrowser(
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
      const browserPrintSuccess = await printToBrowser(
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
        return await printToBrowser(
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
  const result = await printOrder(
    orderNumber, 
    items, 
    orderType, 
    tableNumber, 
    subtotal, 
    tax, 
    total, 
    { usePrintNode: false, useBrowserPrint: true, fallbackToBrowser: false }
  );
  
  return result;
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
