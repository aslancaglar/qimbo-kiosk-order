
import { CartItemType } from "../components/cart/types";

export interface PrintNodeSettings {
  apiKey: string;
  enabled: boolean;
  defaultPrinterId?: string;
  printerName?: string;
}

export interface PrintNodePrinter {
  id: string;
  name: string;
  description?: string;
  state?: string;
}

/**
 * Format order receipt for thermal printer
 * This formats plain text specifically for thermal printers like ITPP047
 */
export const formatThermalReceipt = (
  orderNumber: string | number,
  items: CartItemType[],
  orderType: string,
  tableNumber: string | number | undefined,
  subtotal: number,
  tax: number,
  total: number
): string => {
  const orderDate = new Date().toLocaleString();
  const dashes = '-'.repeat(40);
  
  // Header
  let receipt = '\n\n';
  receipt += '           PIZZA RESTAURANT           \n\n';
  receipt += `ORDER #: ${orderNumber}\n`;
  receipt += `DATE: ${orderDate}\n`;
  receipt += `TYPE: ${orderType === 'eat-in' ? 'EAT IN' : 'TAKEAWAY'}\n`;
  
  if (orderType === 'eat-in' && tableNumber) {
    receipt += `TABLE: ${tableNumber}\n`;
  }
  
  receipt += `\n${dashes}\n\n`;
  
  // Items
  receipt += 'ITEMS:\n\n';
  
  for (const item of items) {
    const itemPrice = (item.product.price * item.quantity).toFixed(2);
    receipt += `${item.quantity}x ${item.product.name.padEnd(25, ' ')} ${itemPrice} €\n`;
    
    // Add options if present
    if (item.options && item.options.length > 0) {
      receipt += `   ${item.options.map(o => o.value).join(', ')}\n`;
    }
    
    // Add toppings if present
    if (item.selectedToppings && item.selectedToppings.length > 0) {
      for (const topping of item.selectedToppings) {
        receipt += `   + ${topping.name.padEnd(21, ' ')} ${topping.price.toFixed(2)} €\n`;
      }
    }
    
    receipt += '\n';
  }
  
  // Totals
  receipt += `${dashes}\n\n`;
  receipt += `SUBTOTAL:${' '.repeat(22)}${subtotal.toFixed(2)} €\n`;
  receipt += `TAX:${' '.repeat(27)}${tax.toFixed(2)} €\n`;
  receipt += `\nTOTAL:${' '.repeat(24)}${total.toFixed(2)} €\n\n`;
  receipt += `${dashes}\n\n`;
  receipt += '          Thank you for your order!          \n';
  receipt += '\n\n\n'; // Extra space for cutting the receipt
  
  return receipt;
};

/**
 * Send print job to PrintNode API
 */
export const sendToPrintNode = async (
  apiKey: string, 
  printerId: string,
  content: string,
  title: string
): Promise<{ success: boolean, jobId?: string, error?: string }> => {
  try {
    // Basic auth with API key as username and empty password
    const auth = btoa(`${apiKey}:`);
    
    const response = await fetch('https://api.printnode.com/printjobs', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        printerId: parseInt(printerId),
        title: title,
        contentType: 'raw_text',
        content: content,
        source: 'Pizza POS App'
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return { 
        success: false, 
        error: errorData.message || `Error: ${response.status}` 
      };
    }
    
    const data = await response.json();
    return { success: true, jobId: data.toString() };
  } catch (error) {
    console.error('PrintNode API error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

/**
 * Fetch available printers from PrintNode
 */
export const fetchPrintNodePrinters = async (
  apiKey: string
): Promise<{ success: boolean, printers?: PrintNodePrinter[], error?: string }> => {
  try {
    const auth = btoa(`${apiKey}:`);
    
    const response = await fetch('https://api.printnode.com/printers', {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return { 
        success: false, 
        error: errorData.message || `Error: ${response.status}` 
      };
    }
    
    const data = await response.json();
    
    // Map PrintNode response to our interface
    const printers: PrintNodePrinter[] = data.map((printer: any) => ({
      id: printer.id.toString(),
      name: printer.name,
      description: printer.description,
      state: printer.state
    }));
    
    return { success: true, printers };
  } catch (error) {
    console.error('PrintNode API error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

/**
 * Test PrintNode connection and printer
 */
export const testPrintNodeConnection = async (
  apiKey: string,
  printerId: string
): Promise<{ success: boolean, error?: string }> => {
  try {
    // First test if we can get printers list
    const printersResult = await fetchPrintNodePrinters(apiKey);
    
    if (!printersResult.success) {
      return { success: false, error: printersResult.error || 'Failed to connect to PrintNode' };
    }
    
    // Then send a test print
    const testContent = '\n\nPrintNode Connection Test\n\n' +
                      'This is a test print sent from\n' +
                      'Pizza POS App\n\n' +
                      `Time: ${new Date().toLocaleString()}\n\n\n\n`;
    
    const printResult = await sendToPrintNode(
      apiKey,
      printerId,
      testContent,
      'PrintNode Test'
    );
    
    return printResult;
  } catch (error) {
    console.error('PrintNode test failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};
