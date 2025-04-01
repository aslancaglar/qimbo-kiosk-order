
import { supabase } from "@/integrations/supabase/client";
import { CartItemType } from "../components/cart/types";

interface PrintNodeCredentials {
  apiKey: string;
  printers: PrinterConfig[];
  enabled: boolean;
}

interface PrinterConfig {
  id: string | number;
  name: string;
  description?: string;
}

/**
 * Gets PrintNode credentials from Supabase settings
 */
export const getPrintNodeCredentials = async (): Promise<PrintNodeCredentials> => {
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'print_settings')
    .maybeSingle();

  if (error || !data) {
    console.error('Error fetching PrintNode credentials:', error);
    return { apiKey: '', printers: [], enabled: false };
  }

  // Fix type issue by safely accessing properties
  const settings = data.value as Record<string, any>;
  
  // Handle both old format (single printer) and new format (multiple printers)
  let printers: PrinterConfig[] = [];
  
  if (settings?.printers && Array.isArray(settings.printers)) {
    // New format with multiple printers
    printers = settings.printers;
  } else if (settings?.printerId) {
    // Old format with single printer - convert to array format
    printers = [{
      id: settings.printerId,
      name: settings.printerName || `Printer ${settings.printerId}`
    }];
  }
  
  return {
    apiKey: settings?.apiKey || '',
    printers: printers,
    enabled: !!settings?.enabled
  };
};

/**
 * Safely encodes a string to base64, handling non-ASCII characters
 */
const safeBase64Encode = (str: string): string => {
  // First encode as UTF-8
  const utf8Bytes = new TextEncoder().encode(str);
  // Convert bytes to string
  let binaryString = '';
  utf8Bytes.forEach(byte => {
    binaryString += String.fromCharCode(byte);
  });
  // Now use btoa on the binary string
  return btoa(binaryString);
};

/**
 * Sends a text receipt to a PrintNode printer
 */
export const sendToPrintNode = async (
  content: string,
  apiKey: string,
  printerId: string | number
): Promise<boolean> => {
  if (!apiKey || !printerId) {
    console.error('PrintNode API key or printer ID is missing');
    return false;
  }

  try {
    // Convert printerId to number if it's a string
    const printerIdNum = typeof printerId === 'string' ? parseInt(printerId, 10) : printerId;
    
    // Use our safe encoding method instead of direct btoa
    const encodedContent = safeBase64Encode(content);
    console.log(`Content encoded successfully for printer ID: ${printerId}`);
    
    const response = await fetch('https://api.printnode.com/printjobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(apiKey + ':')}`
      },
      body: JSON.stringify({
        printerId: printerIdNum,
        title: 'Receipt Print Job',
        contentType: 'raw_base64',
        content: encodedContent,
        source: 'POS System'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`PrintNode API error for printer ${printerId}:`, errorData);
      return false;
    }

    const result = await response.json();
    console.log(`PrintNode print job submitted successfully to printer ${printerId}:`, result);
    
    // Log the print job to our database
    await logPrintJob(printerId.toString(), result.id || 0, content, true);
    
    return true;
  } catch (error) {
    console.error(`Error sending to PrintNode printer ${printerId}:`, error);
    await logPrintJob(printerId.toString(), 0, content, false);
    return false;
  }
};

/**
 * Sends a text receipt to multiple PrintNode printers
 */
export const sendToPrintNodeMultiple = async (
  content: string,
  apiKey: string,
  printers: Array<string | number>
): Promise<boolean> => {
  if (!apiKey || !printers.length) {
    console.error('PrintNode API key or printer IDs are missing');
    return false;
  }

  try {
    console.log(`Sending print job to ${printers.length} printers:`, printers);
    
    const results = await Promise.all(
      printers.map(printerId => sendToPrintNode(content, apiKey, printerId))
    );
    
    // Return true if at least one printer succeeded
    const anySuccess = results.some(result => result);
    if (!anySuccess) {
      console.error('All print jobs failed');
    } else {
      console.log(`Print jobs completed. Success: ${results.filter(Boolean).length}/${printers.length}`);
    }
    
    return anySuccess;
  } catch (error) {
    console.error('Error sending to multiple PrintNode printers:', error);
    return false;
  }
};

/**
 * Formats order details for text receipt
 */
export const formatTextReceipt = (
  orderNumber: string | number,
  items: CartItemType[],
  orderType: string,
  tableNumber: string | number | undefined,
  subtotal: number,
  tax: number,
  total: number
): string => {
  const orderDate = new Date().toLocaleString();
  const lineWidth = 42; // Characters per line on most thermal printers
  const separator = '-'.repeat(lineWidth);
  
  // Use the Euro symbol with appropriate encoding for thermal printers
  // Most thermal printers use code page 858 or similar where Euro is represented
  const currencySymbol = "€";
  
  let receipt = '\n';
  receipt += centerText('ORDER RECEIPT', lineWidth) + '\n\n';
  receipt += `Order #: ${orderNumber}\n`;
  receipt += `Date: ${orderDate}\n`;
  receipt += `Type: ${orderType === 'eat-in' ? 'Eat In' : 'Takeaway'}\n`;
  if (orderType === 'eat-in' && tableNumber) {
    receipt += `Table #: ${tableNumber}\n`;
  }
  receipt += separator + '\n\n';
  
  receipt += centerText('ITEMS', lineWidth) + '\n\n';
  
  items.forEach(item => {
    receipt += `${item.quantity}x ${item.product.name}\n`;
    receipt += `${' '.repeat(4)}${(item.product.price * item.quantity).toFixed(2)} ${currencySymbol}\n`;
    
    if (item.options && item.options.length > 0) {
      receipt += `${' '.repeat(2)}${item.options.map(o => o.value).join(', ')}\n`;
    }
    
    if (item.selectedToppings && item.selectedToppings.length > 0) {
      item.selectedToppings.forEach(topping => {
        receipt += `${' '.repeat(2)}+ ${topping.name} ${topping.price.toFixed(2)} ${currencySymbol}\n`;
      });
    }
    receipt += '\n';
  });
  
  receipt += separator + '\n\n';
  
  receipt += `Subtotal:${' '.repeat(lineWidth - 10 - subtotal.toFixed(2).length - currencySymbol.length - 1)}${subtotal.toFixed(2)} ${currencySymbol}\n`;
  receipt += `Tax:${' '.repeat(lineWidth - 5 - tax.toFixed(2).length - currencySymbol.length - 1)}${tax.toFixed(2)} ${currencySymbol}\n`;
  receipt += `TOTAL:${' '.repeat(lineWidth - 7 - total.toFixed(2).length - currencySymbol.length - 1)}${total.toFixed(2)} ${currencySymbol}\n\n`;
  
  receipt += centerText('Thank you for your order!', lineWidth) + '\n';
  receipt += centerText('All prices include 10% tax', lineWidth) + '\n\n\n\n';
  
  // Add cut command for thermal printers
  receipt += '\x1D\x56\x41\x03'; // GS V A - Paper cut
  
  return receipt;
};

/**
 * Helper to center text for thermal printer receipts
 */
function centerText(text: string, width: number): string {
  if (text.length >= width) return text;
  const spaces = Math.floor((width - text.length) / 2);
  return ' '.repeat(spaces) + text;
}

/**
 * Tests PrintNode connection with the provided credentials
 */
export const testPrintNodeConnection = async (
  apiKey: string,
  printerId: string | number
): Promise<boolean> => {
  if (!apiKey) {
    console.error('PrintNode API key is missing');
    return false;
  }
  
  try {
    // First, test if the API key is valid by getting whoami info
    const whoamiResponse = await fetch('https://api.printnode.com/whoami', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${btoa(apiKey + ':')}`
      }
    });
    
    if (!whoamiResponse.ok) {
      const errorData = await whoamiResponse.text();
      console.error('PrintNode API key validation failed:', errorData);
      return false;
    }
    
    console.log('PrintNode API key is valid');
    
    // If printerId is provided, also test that specific printer
    if (printerId) {
      // Convert printerId to number if it's a string
      const printerIdNum = typeof printerId === 'string' ? parseInt(printerId, 10) : printerId;
      
      const printerResponse = await fetch(`https://api.printnode.com/printers/${printerIdNum}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(apiKey + ':')}`
        }
      });
      
      if (!printerResponse.ok) {
        const errorData = await printerResponse.text();
        console.error('PrintNode printer check failed:', errorData);
        return false;
      }
      
      console.log('PrintNode printer is accessible');
    }
    
    return true;
  } catch (error) {
    console.error('Error testing PrintNode connection:', error);
    return false;
  }
};

/**
 * Fetches available printers from PrintNode
 */
export const fetchPrintNodePrinters = async (apiKey: string): Promise<any[]> => {
  if (!apiKey) {
    return [];
  }
  
  try {
    console.log('Fetching PrintNode printers...');
    const response = await fetch('https://api.printnode.com/printers', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${btoa(apiKey + ':')}`
      }
    });
    
    if (!response.ok) {
      console.error('Failed to fetch printers:', await response.text());
      return [];
    }
    
    const printers = await response.json();
    console.log(`Found ${printers.length} printers`);
    return printers.map((printer: any) => ({
      id: printer.id,
      name: printer.name,
      description: printer.description || '',
      state: printer.state || ''
    }));
  } catch (error) {
    console.error('Error fetching PrintNode printers:', error);
    return [];
  }
};

/**
 * Logs print job to database
 */
const logPrintJob = async (
  printerId: string,
  jobId: number,
  content: string,
  successful: boolean
): Promise<void> => {
  try {
    // Make sure field names match the database schema
    await supabase.from('print_jobs').insert({
      printer_id: printerId,
      job_id: jobId.toString(), // Convert number to string as the schema expects string
      content_preview: content.substring(0, 255),
      successful: successful,
      status: successful ? 'completed' : 'failed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error logging print job:', error);
  }
};

/**
 * Sends a test print job to configured printer
 */
export const sendTestPrint = async (apiKey: string, printerId: string | number): Promise<boolean> => {
  const testContent = `
${centerText('TEST RECEIPT', 42)}
${centerText('----------------', 42)}

This is a test receipt from your
Point of Sale system.

Printer: ${printerId}
Time: ${new Date().toLocaleString()}

Sample price: 10.00 €

${centerText('If you can read this, your printer', 42)}
${centerText('is correctly configured!', 42)}

${centerText('----------------', 42)}
${centerText('End of test', 42)}

\x1D\x56\x41\x03
`;

  return await sendToPrintNode(testContent, apiKey, printerId);
};

/**
 * Sends a test print job to multiple configured printers
 */
export const sendTestPrintMultiple = async (apiKey: string, printerIds: Array<string | number>): Promise<boolean> => {
  const testContent = `
${centerText('TEST RECEIPT (MULTI-PRINTER)', 42)}
${centerText('----------------', 42)}

This is a test receipt from your
Point of Sale system.

Printers: ${printerIds.join(', ')}
Time: ${new Date().toLocaleString()}

Sample price: 10.00 €

${centerText('If you can read this, your', 42)}
${centerText('multi-printer setup works!', 42)}

${centerText('----------------', 42)}
${centerText('End of test', 42)}

\x1D\x56\x41\x03
`;

  return await sendToPrintNodeMultiple(testContent, apiKey, printerIds);
};
