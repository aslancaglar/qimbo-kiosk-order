
import { CartItemType } from "@/components/cart/types";
import { toast } from "@/hooks/use-toast";

// PrintNode API types
export interface PrintNodeConfig {
  apiKey: string;
  printerId: number;
  enabled: boolean;
}

export interface PrintNodeResponse {
  id: number;
  state: string;
  message?: string;
}

export interface PrintStatus {
  status: 'idle' | 'printing' | 'success' | 'error';
  message?: string;
  jobId?: number;
}

// PrintNode default configuration - replace with environment variables in production
const DEFAULT_CONFIG: PrintNodeConfig = {
  apiKey: "", // This should come from environment variables
  printerId: 0, // This should come from environment variables
  enabled: false,
};

// Get configuration from localStorage or default
export const getPrintNodeConfig = (): PrintNodeConfig => {
  try {
    const storedConfig = localStorage.getItem('printNodeConfig');
    if (storedConfig) {
      return JSON.parse(storedConfig);
    }
  } catch (error) {
    console.error('Error loading PrintNode config:', error);
  }
  return DEFAULT_CONFIG;
};

// Save configuration to localStorage
export const savePrintNodeConfig = (config: PrintNodeConfig): void => {
  try {
    localStorage.setItem('printNodeConfig', JSON.stringify(config));
  } catch (error) {
    console.error('Error saving PrintNode config:', error);
  }
};

// Check if the PrintNode integration is enabled
export const isPrintNodeEnabled = (): boolean => {
  const config = getPrintNodeConfig();
  return config.enabled && Boolean(config.apiKey) && config.printerId > 0;
};

// Format the receipt content following ESC/POS standards for 80mm printer
export const formatReceiptForPrinting = (
  orderNumber: string | number,
  items: CartItemType[],
  orderType: string,
  tableNumber: string | number | undefined,
  subtotal: number,
  tax: number,
  total: number,
  restaurantName: string = 'Your Restaurant Name'
): string => {
  // ESC/POS commands
  const ESC = '\x1B';
  const cmds = {
    INIT: ESC + '@',
    CUT: ESC + 'm',
    BOLD_ON: ESC + 'E' + '\x01',
    BOLD_OFF: ESC + 'E' + '\x00',
    ALIGN_LEFT: ESC + 'a' + '\x00',
    ALIGN_CENTER: ESC + 'a' + '\x01',
    DOUBLE_WIDTH: ESC + '!' + '\x10',
    NORMAL_TEXT: ESC + '!' + '\x00',
    PAPER_FEED: ESC + 'd' + '\x0A',
  };
  
  const orderDate = new Date().toLocaleString();
  const lineWidth = 48; // 48 characters per line for 80mm printer
  const separator = '='.repeat(lineWidth);
  const lightSeparator = '-'.repeat(lineWidth);
  
  let receipt = '';
  
  // Initialize the printer
  receipt += cmds.INIT;
  
  // Center align for header
  receipt += cmds.ALIGN_CENTER;
  
  // Restaurant name as bold and bigger
  receipt += cmds.BOLD_ON;
  receipt += cmds.DOUBLE_WIDTH;
  receipt += restaurantName;
  receipt += '\n\n';
  receipt += cmds.NORMAL_TEXT;
  receipt += cmds.BOLD_OFF;
  
  // Order header
  receipt += separator + '\n';
  
  receipt += cmds.BOLD_ON;
  receipt += 'Order #: ' + orderNumber + '    ' + orderDate + '\n';
  receipt += cmds.BOLD_OFF;
  
  if (orderType === 'eat-in' && tableNumber) {
    receipt += 'Table: ' + tableNumber + ' - Eat In\n';
  } else {
    receipt += 'Takeaway Order\n';
  }
  
  receipt += lightSeparator + '\n';
  
  // Left align for items
  receipt += cmds.ALIGN_LEFT;
  
  // Order items
  items.forEach((item) => {
    const itemPrice = item.product.price * item.quantity;
    const itemName = item.product.name.length > 30 ? 
      item.product.name.substring(0, 27) + '...' : 
      item.product.name;
      
    receipt += itemName.padEnd(34) + 
               'x' + item.quantity.toString().padStart(2) + 
               (itemPrice.toFixed(2) + ' €').padStart(10) + '\n';
    
    // Add options if available
    if (item.options && item.options.length > 0) {
      item.options.forEach(option => {
        receipt += '  ' + option.value + '\n';
      });
    }
    
    // Add toppings if available
    if (item.selectedToppings && item.selectedToppings.length > 0) {
      item.selectedToppings.forEach(topping => {
        receipt += '  + ' + topping.name.padEnd(28) + 
                  (topping.price.toFixed(2) + ' €').padStart(10) + '\n';
      });
    }
  });
  
  receipt += lightSeparator + '\n';
  
  // Totals section
  receipt += 'Subtotal:'.padStart(38) + (subtotal.toFixed(2) + ' €').padStart(10) + '\n';
  receipt += 'Tax:'.padStart(38) + (tax.toFixed(2) + ' €').padStart(10) + '\n';
  receipt += cmds.BOLD_ON;
  receipt += 'TOTAL:'.padStart(38) + (total.toFixed(2) + ' €').padStart(10) + '\n';
  receipt += cmds.BOLD_OFF;
  
  receipt += separator + '\n\n';
  
  // Thank you message
  receipt += cmds.ALIGN_CENTER;
  receipt += 'Thank you for your order!\n';
  receipt += 'We appreciate your business\n\n';
  
  // Feed paper and cut
  receipt += cmds.PAPER_FEED;
  receipt += cmds.CUT;
  
  return receipt;
};

// Send print job to PrintNode API
export const printReceipt = async (
  orderNumber: string | number,
  items: CartItemType[],
  orderType: string,
  tableNumber: string | number | undefined,
  subtotal: number,
  tax: number,
  total: number
): Promise<PrintStatus> => {
  try {
    const config = getPrintNodeConfig();
    
    if (!isPrintNodeEnabled()) {
      console.warn("PrintNode is not properly configured");
      return { 
        status: 'error',
        message: 'Printing is not configured. Please check settings.'
      };
    }
    
    // Format receipt content
    const content = formatReceiptForPrinting(
      orderNumber,
      items,
      orderType,
      tableNumber,
      subtotal,
      tax,
      total
    );
    
    // In a real implementation, this would be an API endpoint call
    // For demonstration, we'll simulate a successful print job
    // In production, you'd make a fetch call to your backend service
    // that integrates with PrintNode API
    
    const printJobData = {
      printerId: config.printerId,
      title: `Order #${orderNumber}`,
      contentType: 'raw_base64',
      content: btoa(content), // Base64 encode the content
      source: 'Self-Order App'
    };
    
    console.log('Printing receipt for order:', orderNumber);
    console.log('Print job data:', printJobData);
    
    // Simulating API call to PrintNode
    // In production, replace with actual API call:
    // const response = await fetch('/api/print-receipt', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(printJobData)
    // });
    // const data = await response.json();
    
    // Simulate successful response
    const mockResponse: PrintNodeResponse = {
      id: Math.floor(Math.random() * 10000),
      state: 'queued'
    };
    
    return { 
      status: 'success',
      message: 'Print job sent successfully',
      jobId: mockResponse.id
    };
  } catch (error) {
    console.error('Error sending print job:', error);
    return { 
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown printing error'
    };
  }
};

// Check printer status
export const checkPrinterStatus = async (): Promise<boolean> => {
  try {
    const config = getPrintNodeConfig();
    
    if (!isPrintNodeEnabled()) {
      return false;
    }
    
    // In production, this would be an API call to check printer status
    // For demo purposes, we'll simulate it
    console.log('Checking printer status for printer ID:', config.printerId);
    
    // Simulating online status (true = online)
    return true;
  } catch (error) {
    console.error('Error checking printer status:', error);
    return false;
  }
};
