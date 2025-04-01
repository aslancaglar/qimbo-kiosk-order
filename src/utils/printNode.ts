
interface PrintNodeConfig {
  apiKey: string;
  enabled: boolean;
  defaultPrinterId?: string;
}

export interface Printer {
  id: string;
  name: string;
  description?: string;
  state?: string;
  capabilities?: any;
}

export interface PrintJob {
  printer_id: string;
  content: string;
  title: string;
  content_type: 'raw_base64' | 'pdf_base64' | 'pdf_uri' | 'raw_uri';
  source: string;
  options?: {
    copies?: number;
    bin?: string;
    dpi?: string;
    paper?: string;
    orientation?: 'portrait' | 'landscape';
    [key: string]: any;
  };
}

/**
 * Fetch available printers from PrintNode API
 */
export const fetchPrinters = async (apiKey: string): Promise<Printer[]> => {
  try {
    if (!apiKey) {
      throw new Error('PrintNode API key not provided');
    }

    const authHeader = 'Basic ' + btoa(apiKey + ':');
    const response = await fetch('https://api.printnode.com/printers', {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('PrintNode API error:', errorText);
      throw new Error(`PrintNode API error: ${response.status} ${response.statusText}`);
    }

    const printers = await response.json();
    return printers.map((printer: any) => ({
      id: printer.id,
      name: printer.name,
      description: printer.description,
      state: printer.state,
      capabilities: printer.capabilities
    }));
  } catch (error) {
    console.error('Error fetching printers:', error);
    return [];
  }
};

/**
 * Test PrintNode connection with provided API key
 */
export const testPrintNodeConnection = async (apiKey: string): Promise<boolean> => {
  try {
    if (!apiKey) return false;
    
    const authHeader = 'Basic ' + btoa(apiKey + ':');
    const response = await fetch('https://api.printnode.com/whoami', {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error testing PrintNode connection:', error);
    return false;
  }
};

/**
 * Send a print job to PrintNode
 */
export const sendPrintJob = async (
  apiKey: string, 
  printJob: PrintJob
): Promise<{ success: boolean; jobId?: string; error?: string }> => {
  try {
    if (!apiKey || !printJob.printer_id) {
      throw new Error('PrintNode API key or printer ID not provided');
    }

    const authHeader = 'Basic ' + btoa(apiKey + ':');
    const response = await fetch('https://api.printnode.com/printjobs', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(printJob)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('PrintNode API error:', errorText);
      return { 
        success: false, 
        error: `PrintNode API error: ${response.status} ${response.statusText}` 
      };
    }

    const result = await response.json();
    return {
      success: true,
      jobId: result.id?.toString()
    };
  } catch (error: any) {
    console.error('Error sending print job:', error);
    return {
      success: false,
      error: error.message || 'Unknown error sending print job'
    };
  }
};

/**
 * Format receipt content for thermal printer
 * This generates an HTML template suitable for thermal printers
 */
export const formatReceiptForPrinting = (
  restaurantName: string,
  logoUrl: string | null,
  orderNumber: string,
  items: any[],
  total: number,
  subtotal: number,
  taxAmount: number,
  orderType: string,
  tableNumber?: string | number,
  paymentMethod: string = 'Cash',
  timestamp: Date = new Date()
): string => {
  // Convert HTML to base64 for PrintNode
  const receiptHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Receipt #${orderNumber}</title>
      <style>
        body {
          font-family: 'Courier New', Courier, monospace;
          width: 76mm; /* 80mm width with margins */
          margin: 0;
          padding: 2mm;
          font-size: 10pt;
          line-height: 1.2;
        }
        .center {
          text-align: center;
        }
        .header {
          margin-bottom: 5mm;
        }
        .logo {
          max-width: 72mm;
          max-height: 20mm;
          display: block;
          margin: 0 auto;
        }
        .divider {
          border-bottom: 1px dashed #000;
          margin: 3mm 0;
        }
        .receipt-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1mm;
        }
        .item-detail {
          padding-left: 5mm;
          font-size: 9pt;
        }
        .totals {
          margin-top: 3mm;
        }
        .total {
          font-weight: bold;
        }
        .footer {
          margin-top: 5mm;
          font-size: 9pt;
        }
      </style>
    </head>
    <body>
      <div class="header center">
        ${logoUrl ? `<img src="${logoUrl}" alt="Logo" class="logo">` : ''}
        <h2 style="margin: 3mm 0">${restaurantName}</h2>
        <p>Receipt #${orderNumber}</p>
        <p>${new Date(timestamp).toLocaleString()}</p>
        <p>${orderType.toUpperCase()}${tableNumber ? ` - Table #${tableNumber}` : ''}</p>
      </div>

      <div class="divider"></div>

      <div class="items">
        ${items.map(item => `
          <div class="receipt-item">
            <div>${item.quantity}x ${item.product.name}</div>
            <div>${(item.product.price * item.quantity).toFixed(2)} €</div>
          </div>
          ${(item.selectedToppings && item.selectedToppings.length > 0) ? 
            item.selectedToppings.map(topping => `
              <div class="receipt-item item-detail">
                <div>+ ${topping.name}</div>
                <div>${topping.price.toFixed(2)} €</div>
              </div>
            `).join('') : ''
          }
        `).join('')}
      </div>

      <div class="divider"></div>

      <div class="totals">
        <div class="receipt-item">
          <div>Subtotal:</div>
          <div>${subtotal.toFixed(2)} €</div>
        </div>
        <div class="receipt-item">
          <div>Tax (included):</div>
          <div>${taxAmount.toFixed(2)} €</div>
        </div>
        <div class="receipt-item total">
          <div>Total:</div>
          <div>${total.toFixed(2)} €</div>
        </div>
      </div>

      <div class="divider"></div>

      <div class="payment center">
        <p>Payment Method: ${paymentMethod}</p>
      </div>

      <div class="footer center">
        <p>Thank you for your order!</p>
        <p>All prices include tax.</p>
      </div>
    </body>
    </html>
  `;

  return btoa(receiptHtml);
};

export const printReceipt = async (
  apiKey: string,
  printerId: string,
  restaurantName: string,
  logoUrl: string | null,
  orderNumber: string,
  items: any[],
  total: number,
  subtotal: number,
  taxAmount: number,
  orderType: string,
  tableNumber?: string | number,
  paymentMethod: string = 'Cash'
): Promise<{ success: boolean; jobId?: string; error?: string }> => {
  try {
    if (!apiKey || !printerId) {
      console.error('PrintNode API key or printer ID not provided');
      return {
        success: false,
        error: 'PrintNode API key or printer ID not provided'
      };
    }
    
    const receiptContent = formatReceiptForPrinting(
      restaurantName,
      logoUrl,
      orderNumber,
      items,
      total,
      subtotal,
      taxAmount,
      orderType,
      tableNumber,
      paymentMethod
    );

    const printJob: PrintJob = {
      printer_id: printerId,
      content: receiptContent,
      title: `Order #${orderNumber}`,
      content_type: 'raw_base64', // HTML content encoded as base64
      source: 'Order System'
    };

    return await sendPrintJob(apiKey, printJob);
  } catch (error: any) {
    console.error('Error printing receipt:', error);
    return {
      success: false,
      error: error.message || 'Unknown error printing receipt'
    };
  }
};
