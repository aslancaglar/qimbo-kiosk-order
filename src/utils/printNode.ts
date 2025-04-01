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
  
  return {
    apiKey: settings?.apiKey || '',
    printerId: settings?.printerId || '',
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
 * Converts HTML to plain text for thermal printers
 */
const convertHtmlToPlainTextForPrinter = (htmlContent: string): string => {
  // Create a simple parser to extract text content
  const stripTags = (html: string) => {
    // Remove all HTML tags
    let text = html.replace(/<[^>]*>/g, '');
    // Replace HTML entities
    text = text.replace(/&nbsp;/g, ' ')
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&quot;/g, '"')
              .replace(/&#39;/g, "'");
    // Trim whitespace
    return text.trim();
  };
  
  // Extract main sections from the HTML receipt
  const extractSection = (html: string, startMarker: string, endMarker: string): string => {
    const startIdx = html.indexOf(startMarker);
    const endIdx = html.indexOf(endMarker, startIdx + startMarker.length);
    if (startIdx >= 0 && endIdx >= 0) {
      return html.substring(startIdx + startMarker.length, endIdx);
    }
    return '';
  };
  
  const lineWidth = 42; // Standard width for thermal printers
  const separator = '-'.repeat(lineWidth);
  let plainText = '\n';
  
  // Create header
  plainText += centerText('ORDER RECEIPT', lineWidth) + '\n\n';
  
  // Extract order details
  const orderSection = extractSection(htmlContent, '<div class="order-details">', '</div>');
  const orderLines = stripTags(orderSection).split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  orderLines.forEach(line => {
    plainText += line + '\n';
  });
  
  plainText += separator + '\n\n';
  plainText += centerText('ITEMS', lineWidth) + '\n\n';
  
  // Extract items
  const itemsSection = extractSection(htmlContent, '<h2>Items</h2>', '<div class="divider"></div>');
  const itemBlocks = itemsSection.split('<div class="order-item">');
  
  // Skip the first empty element
  for (let i = 1; i < itemBlocks.length; i++) {
    const itemBlock = itemBlocks[i];
    const itemLines = stripTags(itemBlock).split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    itemLines.forEach(line => {
      plainText += line + '\n';
    });
    plainText += '\n';
  }
  
  plainText += separator + '\n\n';
  
  // Extract totals
  const totalsSection = extractSection(htmlContent, '<div class="totals">', '</div>');
  const totalLines = stripTags(totalsSection).split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  totalLines.forEach(line => {
    plainText += line + '\n';
  });
  
  plainText += '\n';
  plainText += centerText('Thank you for your order!', lineWidth) + '\n';
  plainText += centerText('All prices include 10% tax', lineWidth) + '\n\n\n';
  
  // Add cut command for thermal printers
  plainText += '\x1D\x56\x41\x03'; // GS V A - Paper cut
  
  return plainText;
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
    // Check if content appears to be HTML
    const isHtml = content.trim().startsWith('<html') || content.includes('<body');
    
    // If it's HTML, convert it to plain text for thermal printer
    const printerContent = isHtml ? convertHtmlToPlainTextForPrinter(content) : content;
    
    // Convert printerId to number if it's a string
    const printerIdNum = typeof printerId === 'string' ? parseInt(printerId, 10) : printerId;
    
    // Use our safe encoding method instead of direct btoa
    const encodedContent = safeBase64Encode(printerContent);
    console.log('Content encoded successfully');
    
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
      console.error('PrintNode API error:', errorData);
      return false;
    }

    const result = await response.json();
    console.log('PrintNode print job submitted successfully:', result);
    
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
 * Formats order details for text receipt - DEPRECATED, keeping for backward compatibility
 * Now we use the HTML format for both PrintNode and browser
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
  const { formatOrderReceipt } = require('./printUtils');
  const htmlReceipt = formatOrderReceipt(orderNumber, items, orderType, tableNumber, subtotal, tax, total);
  
  // Add printer cut command at the end
  return htmlReceipt + '\x1D\x56\x41\x03'; // GS V A - Paper cut
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
