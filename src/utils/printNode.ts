import { supabase } from "@/integrations/supabase/client";
import { CartItemType } from "../components/cart/types";

interface PrintNodeCredentials {
  apiKey: string;
  printerId: string | number;
  enabled: boolean;
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
    return { apiKey: '', printerId: '', enabled: false };
  }

  // Fix type issue by safely accessing properties
  const settings = data.value as Record<string, any>;
  
  const credentials = {
    apiKey: settings?.apiKey || '',
    printerId: settings?.printerId || '',
    enabled: !!settings?.enabled
  };
  
  console.log('PrintNode credentials loaded:', {
    apiKeyExists: !!credentials.apiKey,
    apiKeyLength: credentials.apiKey?.length || 0,
    printerId: credentials.printerId,
    enabled: credentials.enabled
  });
  
  return credentials;
};

/**
 * Sends a text receipt to PrintNode printer
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
    // Ensure printerId is a number
    const printerIdNum = typeof printerId === 'string' ? parseInt(printerId, 10) : printerId;
    
    console.log(`Sending print job to PrintNode printer: ${printerIdNum}`);
    
    const printData = {
      printerId: printerIdNum,
      title: 'Receipt Print Job',
      contentType: 'raw_base64',
      content: btoa(content),
      source: 'POS System'
    };
    
    console.log('Print job data prepared:', JSON.stringify({
      ...printData,
      content: '[CONTENT REDACTED]', // Don't log the actual content
      printerId: printerIdNum,
      title: printData.title,
      contentType: printData.contentType
    }));
    
    console.log(`Using PrintNode API Key starting with: ${apiKey.substring(0, 4)}...`);
    
    const apiUrl = 'https://api.printnode.com/printjobs';
    console.log(`Sending request to: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(apiKey + ':')}`
      },
      body: JSON.stringify(printData)
    });

    console.log(`PrintNode API response status: ${response.status}`);
    
    const responseText = await response.text();
    console.log(`PrintNode API response body:`, responseText);

    if (!response.ok) {
      console.error('PrintNode API error:', responseText);
      return false;
    }

    // Try to parse JSON response
    let result;
    try {
      result = JSON.parse(responseText);
      console.log('PrintNode print job submitted successfully:', result);
    } catch (e) {
      console.log('Response is not JSON but the request was successful');
      result = { id: 'unknown' };
    }
    
    // Log the print job to our database
    await logPrintJob(printerId.toString(), result.id || 0, content, true);
    
    return true;
  } catch (error) {
    console.error('Error sending to PrintNode:', error);
    await logPrintJob(printerId.toString(), 0, content, false);
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
    receipt += `${' '.repeat(4)}${(item.product.price * item.quantity).toFixed(2)} €\n`;
    
    if (item.options && item.options.length > 0) {
      receipt += `${' '.repeat(2)}${item.options.map(o => o.value).join(', ')}\n`;
    }
    
    if (item.selectedToppings && item.selectedToppings.length > 0) {
      item.selectedToppings.forEach(topping => {
        receipt += `${' '.repeat(2)}+ ${topping.name} ${topping.price.toFixed(2)} €\n`;
      });
    }
    receipt += '\n';
  });
  
  receipt += separator + '\n\n';
  
  receipt += `Subtotal:${' '.repeat(lineWidth - 10 - subtotal.toFixed(2).length - 2)}${subtotal.toFixed(2)} €\n`;
  receipt += `Tax:${' '.repeat(lineWidth - 5 - tax.toFixed(2).length - 2)}${tax.toFixed(2)} €\n`;
  receipt += `TOTAL:${' '.repeat(lineWidth - 7 - total.toFixed(2).length - 2)}${total.toFixed(2)} €\n\n`;
  
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
    console.log('No PrintNode API key provided for fetching printers');
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
      const errorText = await response.text();
      console.error(`Failed to fetch printers: ${response.status} ${response.statusText}`, errorText);
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
  jobId: number | string,
  content: string,
  successful: boolean
): Promise<void> => {
  try {
    console.log(`Logging print job: Printer ID ${printerId}, Job ID ${jobId}, Success: ${successful}`);
    
    // Make sure field names match the database schema
    const { error } = await supabase.from('print_jobs').insert({
      printer_id: printerId,
      job_id: jobId.toString(), // Convert number to string as the schema expects string
      content_preview: content.substring(0, 255),
      successful: successful,
      status: successful ? 'completed' : 'failed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    if (error) {
      console.error('Error logging print job to database:', error);
    }
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

${centerText('If you can read this, your printer', 42)}
${centerText('is correctly configured!', 42)}

${centerText('----------------', 42)}
${centerText('End of test', 42)}

\x1D\x56\x41\x03
`;

  return await sendToPrintNode(testContent, apiKey, printerId);
};
