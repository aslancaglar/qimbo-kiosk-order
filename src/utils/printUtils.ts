import { CartItemType } from "../components/cart/types";
import { getPrintNodeCredentials, sendToPrintNode, formatTextReceipt } from "./printNode";
import { supabase } from "../integrations/supabase/client";

// Format order for printing - Updated to match PrintNode thermal printer style
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
  const lineWidth = 48; // Characters per line similar to thermal printers
  
  // HTML version of the thermal receipt look
  return `
    <html>
      <head>
        <title>Order #${orderNumber}</title>
        <style>
          @media print {
            @page {
              margin: 0;
              size: 80mm auto;  /* Thermal printer width */
            }
            body {
              margin: 0;
              padding: 5mm;
            }
          }
          
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.2;
            width: 80mm;
            max-width: 80mm;
            margin: 0 auto;
            padding: 5mm;
            background-color: white;
            color: black;
          }
          
          .center {
            text-align: center;
          }
          
          .header, .footer {
            text-align: center;
            font-weight: bold;
            margin: 8px 0;
          }
          
          .divider {
            border-top: 1px dashed #000;
            margin: 8px 0;
          }
          
          .order-info {
            margin-bottom: 8px;
          }
          
          .order-items {
            width: 100%;
          }
          
          .item {
            display: flex;
            justify-content: space-between;
            margin: 3px 0;
          }
          
          .item-details {
            flex: 1;
          }
          
          .topping {
            padding-left: 10px;
            display: flex;
            justify-content: space-between;
          }
          
          .item-price {
            text-align: right;
            white-space: nowrap;
          }
          
          .totals {
            margin-top: 8px;
          }
          
          .total-row {
            display: flex;
            justify-content: space-between;
            margin: 2px 0;
          }
          
          .grand-total {
            font-weight: bold;
            border-top: 1px solid #000;
            padding-top: 5px;
            margin-top: 5px;
          }
        </style>
      </head>
      <body>
        <div class="header">ORDER RECEIPT</div>
        
        <div class="order-info">
          <div>Order #: ${orderNumber}</div>
          <div>Date: ${orderDate}</div>
          <div>Type: ${orderType === 'eat-in' ? 'Eat In' : 'Takeaway'}</div>
          ${orderType === 'eat-in' && tableNumber ? `<div>Table #: ${tableNumber}</div>` : ''}
        </div>
        
        <div class="divider"></div>
        
        <div class="center">ITEMS</div>
        
        <div class="order-items">
          ${items.map(item => `
            <div class="item">
              <div class="item-details">${item.quantity}x ${item.product.name}</div>
              <div class="item-price">${(item.product.price * item.quantity).toFixed(2)} €</div>
            </div>
            ${item.options && item.options.length > 0 ? 
              `<div style="padding-left: 10px; font-size: 11px;">${item.options.map(o => o.value).join(', ')}</div>` : 
              ''}
            ${item.selectedToppings && item.selectedToppings.length > 0 ? 
              item.selectedToppings.map(topping => `
                <div class="topping">
                  <div>+ ${topping.name}</div>
                  <div>${topping.price.toFixed(2)} €</div>
                </div>
              `).join('') : 
              ''}
          `).join('<div style="margin: 4px 0;"></div>')}
        </div>
        
        <div class="divider"></div>
        
        <div class="totals">
          <div class="total-row">
            <div>Subtotal:</div>
            <div>${subtotal?.toFixed(2) || '0.00'} €</div>
          </div>
          <div class="total-row">
            <div>Tax:</div>
            <div>${tax?.toFixed(2) || '0.00'} €</div>
          </div>
          <div class="total-row grand-total">
            <div>TOTAL:</div>
            <div>${total?.toFixed(2) || '0.00'} €</div>
          </div>
        </div>
        
        <div class="divider"></div>
        
        <div class="footer">Merci!</div>
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
      enabled: enabled
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
      return _browserPrintingEnabled; // Fall back to in-memory value
    }
    
    // Check if data exists and has the right structure
    if (data && data.value && typeof data.value === 'object') {
      // Type-safe way to access the 'enabled' property
      const settingsObj = data.value as Record<string, any>;
      if ('enabled' in settingsObj && typeof settingsObj.enabled === 'boolean') {
        _browserPrintingEnabled = settingsObj.enabled; // Update local cache
        console.log('Retrieved browser printing setting from database:', settingsObj.enabled);
        return settingsObj.enabled;
      }
    }
    
    return _browserPrintingEnabled; // Fall back to in-memory value
  } catch (error) {
    console.error('Error checking browser print settings:', error);
    return _browserPrintingEnabled; // Fall back to in-memory value
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
