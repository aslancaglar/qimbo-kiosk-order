import { supabase } from "@/integrations/supabase/client";
import { CartItemType } from "../components/cart/types";
import puppeteer from 'puppeteer';

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
 * Converts HTML to PDF using Puppeteer
 */
export const convertHtmlToPdf = async (htmlContent: string): Promise<Buffer> => {
  console.log('Converting HTML to PDF with Puppeteer...');
  
  try {
    // Launch a headless browser
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    // Create a new page
    const page = await browser.newPage();
    
    // Set content to our HTML
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '1cm',
        right: '1cm',
        bottom: '1cm',
        left: '1cm'
      }
    });
    
    // Close the browser
    await browser.close();
    
    console.log('PDF conversion successful');
    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error('Error converting HTML to PDF:', error);
    throw error;
  }
};

/**
 * Sends a print job to PrintNode printer
 * Now supports both raw text and PDF content
 */
export const sendToPrintNode = async (
  content: string | Buffer,
  apiKey: string,
  printerId: string | number,
  contentType: 'raw_base64' | 'pdf_base64' = 'raw_base64'
): Promise<boolean> => {
  if (!apiKey || !printerId) {
    console.error('PrintNode API key or printer ID is missing');
    return false;
  }

  try {
    // Convert printerId to number if it's a string
    const printerIdNum = typeof printerId === 'string' ? parseInt(printerId, 10) : printerId;
    
    // Encode the content
    let encodedContent: string;
    let contentPreview: string;
    
    if (content instanceof Buffer) {
      // For PDF buffer, convert to base64
      encodedContent = content.toString('base64');
      contentPreview = 'PDF Document';
      contentType = 'pdf_base64';
    } else {
      // For text content, use our safe encoding method
      encodedContent = safeBase64Encode(content);
      contentPreview = content.substring(0, 255);
    }
    
    console.log(`Content encoded successfully as ${contentType}`);
    
    const response = await fetch('https://api.printnode.com/printjobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(apiKey + ':')}`
      },
      body: JSON.stringify({
        printerId: printerIdNum,
        title: 'Receipt Print Job',
        contentType: contentType,
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
    await logPrintJob(printerId.toString(), result.id || 0, contentPreview, true);
    
    return true;
  } catch (error) {
    console.error('Error sending to PrintNode:', error);
    await logPrintJob(printerId.toString(), 0, typeof content === 'string' ? content.substring(0, 255) : 'PDF Document', false);
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
