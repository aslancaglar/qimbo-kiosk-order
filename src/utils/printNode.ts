
import { PrintJob } from "@/utils/printBiz";

/**
 * Get PrintNode credentials from localStorage
 */
export const getPrintNodeCredentials = async (): Promise<{ enabled: boolean, apiKey: string | null, printerId: string | null }> => {
  try {
    const printNodeEnabled = localStorage.getItem('printnode_enabled') === 'true';
    const apiKey = localStorage.getItem('printnode_api_key');
    const printerId = localStorage.getItem('printnode_printer_id');
    
    return {
      enabled: printNodeEnabled,
      apiKey,
      printerId
    };
  } catch (error) {
    console.error('Error getting PrintNode credentials:', error);
    return {
      enabled: false,
      apiKey: null,
      printerId: null
    };
  }
};

/**
 * Format text receipt for PrintNode
 */
export const formatTextReceipt = (
  orderNumber: string | number,
  items: any[],
  orderType: string,
  tableNumber: string | number | undefined,
  subtotal: number,
  tax: number,
  total: number
): string => {
  const orderDate = new Date().toLocaleString();
  const dashes = '-'.repeat(40);
  
  let receipt = `
ORDER RECEIPT
${dashes}

Order #: ${orderNumber}
Date: ${orderDate}
Order Type: ${orderType === 'eat-in' ? 'Eat In' : 'Takeaway'}
${orderType === 'eat-in' && tableNumber ? `Table #: ${tableNumber}` : ''}

${dashes}
ITEMS
${dashes}

`;

  items.forEach(item => {
    receipt += `${item.quantity} x ${item.product.name} ${(item.product.price * item.quantity).toFixed(2)} €\n`;
    
    if (item.options && item.options.length > 0) {
      receipt += `   ${item.options.map((o: any) => o.value).join(', ')}\n`;
    }
    
    if (item.selectedToppings && item.selectedToppings.length > 0) {
      item.selectedToppings.forEach((topping: any) => {
        receipt += `   + ${topping.name} ${topping.price.toFixed(2)} €\n`;
      });
    }
  });
  
  receipt += `
${dashes}

Subtotal: ${subtotal?.toFixed(2) || '0.00'} €
Tax: ${tax?.toFixed(2) || '0.00'} €
TOTAL: ${total?.toFixed(2) || '0.00'} €

${dashes}
Thank you for your order!
${dashes}
`;

  return receipt;
};

/**
 * Send print job to PrintNode API
 */
export const sendToPrintNode = async (content: string, apiKey: string, printerId: string): Promise<boolean> => {
  try {
    const printJob: PrintJob = {
      printer_id: printerId,
      content: content,
      type: 'receipt',
      copies: 1,
      metadata: {
        source: 'POS System'
      }
    };
    
    const response = await fetch('https://api.printnode.com/printjobs', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(apiKey + ':'),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(printJob)
    });
    
    if (!response.ok) {
      console.error('PrintNode send print job failed:', await response.text());
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error sending print job to PrintNode:', error);
    return false;
  }
};

/**
 * Test connection to PrintNode API
 */
export const testPrintNodeConnection = async (apiKey: string): Promise<boolean> => {
  try {
    const response = await fetch('https://api.printnode.com/whoami', {
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + btoa(apiKey + ':'),
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error('PrintNode connection test failed:', await response.text());
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error testing PrintNode connection:', error);
    return false;
  }
};

/**
 * Fetch printers from PrintNode API
 */
export const fetchPrintNodePrinters = async (apiKey: string): Promise<any[]> => {
  try {
    const response = await fetch('https://api.printnode.com/printers', {
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + btoa(apiKey + ':'),
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error('PrintNode fetch printers failed:', await response.text());
      return [];
    }
    
    const printers = await response.json();
    return printers.map((printer: any) => ({
      id: printer.id,
      name: printer.name,
      description: printer.description,
      state: printer.state
    }));
  } catch (error) {
    console.error('Error fetching PrintNode printers:', error);
    return [];
  }
};

/**
 * Send test print job to PrintNode API
 */
export const sendTestPrint = async (apiKey: string, printerId: string): Promise<boolean> => {
  try {
    const printJob: PrintJob = {
      printer_id: printerId,
      content: 'This is a test receipt from Lovable.',
      type: 'receipt',
      copies: 1,
      metadata: {
        test: true
      }
    };
    
    const response = await fetch('https://api.printnode.com/printjobs', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(apiKey + ':'),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(printJob)
    });
    
    if (!response.ok) {
      console.error('PrintNode send test print failed:', await response.text());
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error sending test print to PrintNode:', error);
    return false;
  }
};
