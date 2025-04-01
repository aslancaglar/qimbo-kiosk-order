import { CartItemType } from "../components/cart/types";
import { getPrintNodeCredentials, sendToPrintNode, formatTextReceipt } from "./printNode";
import { supabase } from "@/integrations/supabase/client";

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

// Print order using browser's print functionality
export const printOrderBrowser = (
  orderNumber: string | number,
  items: CartItemType[],
  orderType: string,
  tableNumber: string | number | undefined,
  subtotal: number,
  tax: number,
  total: number
): void => {
  try {
    console.log('Printing receipt in browser for order:', orderNumber);
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    if (!iframe.contentDocument) {
      console.error("Could not access iframe document");
      return;
    }
    
    iframe.contentDocument.write(formatOrderReceipt(
      orderNumber,
      items,
      orderType,
      tableNumber,
      subtotal,
      tax,
      total
    ));
    
    iframe.contentDocument.close();
    
    // Print using browser
    setTimeout(() => {
      iframe.contentWindow?.print();
      
      // Remove the iframe after printing
      setTimeout(() => {
        iframe.remove();
      }, 2000);
    }, 500);
  } catch (error) {
    console.error('Error printing order in browser:', error);
  }
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
    console.log('Attempting to print to thermal printer via PrintNode for order:', orderNumber);
    const credentials = await getPrintNodeCredentials();
    
    if (!credentials.enabled) {
      console.log('PrintNode is not enabled in settings');
      return false;
    }
    
    if (!credentials.apiKey || !credentials.apiKey.trim()) {
      console.log('PrintNode API key is not set');
      return false;
    }
    
    if (!credentials.printerId) {
      console.log('PrintNode printer ID is not set');
      return false;
    }
    
    console.log('PrintNode credentials found:', {
      enabled: credentials.enabled,
      apiKey: credentials.apiKey ? `${credentials.apiKey.substring(0, 4)}...` : 'Not set',
      printerId: credentials.printerId
    });
    
    const textReceipt = formatTextReceipt(
      orderNumber,
      items,
      orderType,
      tableNumber,
      subtotal,
      tax,
      total
    );
    
    console.log('Text receipt generated, sending to PrintNode...');
    const result = await sendToPrintNode(textReceipt, credentials.apiKey, credentials.printerId);
    console.log('PrintNode result:', result);
    return result;
  } catch (error) {
    console.error('Error printing to thermal printer:', error);
    return false;
  }
};

// Print order - try thermal printer first, fallback to browser
export const printOrder = async (
  orderNumber: string | number,
  items: CartItemType[],
  orderType: string,
  tableNumber: string | number | undefined,
  subtotal: number,
  tax: number,
  total: number
): Promise<boolean> => {
  console.log(`Printing order #${orderNumber} with ${items.length} items...`);
  
  const thermalPrinted = await printToThermalPrinter(
    orderNumber, 
    items, 
    orderType, 
    tableNumber, 
    subtotal, 
    tax, 
    total
  );
  
  if (!thermalPrinted) {
    console.log('Thermal printing failed, falling back to browser printing');
    printOrderBrowser(orderNumber, items, orderType, tableNumber, subtotal, tax, total);
  } else {
    console.log('Successfully printed to thermal printer');
  }
  
  return thermalPrinted;
};

/**
 * Test function to print the latest order via PrintNode
 */
export const testPrintLatestOrder = async (): Promise<{ success: boolean; message: string }> => {
  try {
    console.log('Fetching the latest order for test printing...');
    
    // Get the latest order from the database
    const { data: latestOrder, error: orderError } = await supabase
      .from('orders')
      .select('*, order_items(*, product:products(*))')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (orderError || !latestOrder) {
      console.error('Error fetching latest order:', orderError);
      return { 
        success: false, 
        message: `Failed to fetch latest order: ${orderError?.message || 'No orders found'}` 
      };
    }
    
    console.log('Latest order fetched:', latestOrder.id);
    
    // Convert order data to the format needed for printing
    const items: CartItemType[] = latestOrder.order_items.map((item: any) => ({
      quantity: item.quantity,
      product: item.product,
      options: [], // Add any options if your order schema includes them
      selectedToppings: [], // Add any toppings if your order schema includes them
    }));
    
    // Get the order details
    const orderNumber = latestOrder.order_number || latestOrder.id;
    const orderType = latestOrder.order_type || 'takeaway';
    const tableNumber = latestOrder.table_number;
    const subtotal = latestOrder.subtotal || 0;
    const tax = latestOrder.tax_amount || 0;
    const total = latestOrder.total_amount || 0;
    
    console.log('Sending test print to PrintNode with order details:', {
      orderNumber,
      items: items.length,
      orderType,
      tableNumber,
      total
    });
    
    // Send directly to thermal printer, skipping the fallback to browser
    const success = await printToThermalPrinter(
      orderNumber,
      items,
      orderType,
      tableNumber,
      subtotal,
      tax,
      total
    );
    
    if (success) {
      return {
        success: true,
        message: `Successfully sent order #${orderNumber} to PrintNode printer`
      };
    } else {
      return {
        success: false,
        message: `Failed to send order #${orderNumber} to PrintNode printer. Check console logs for details.`
      };
    }
    
  } catch (error) {
    console.error('Error in test print function:', error);
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`
    };
  }
};
