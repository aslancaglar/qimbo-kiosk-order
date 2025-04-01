
import { supabase } from "@/integrations/supabase/client";
import { CartItemType } from "../components/cart/types";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
 * Converts HTML to PDF using browser-compatible approach
 */
export const convertHtmlToPdf = async (htmlContent: string): Promise<Uint8Array> => {
  console.log('Converting HTML to PDF for PrintNode...');
  
  try {
    // Create a temporary container for the HTML content
    const container = document.createElement('div');
    container.innerHTML = htmlContent;
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    document.body.appendChild(container);
    
    // Generate a canvas from the HTML
    const canvas = await html2canvas(container, {
      scale: 2, // Higher quality
      useCORS: true,
      logging: false
    });
    
    document.body.removeChild(container);
    
    // Convert canvas to PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const imgData = canvas.toDataURL('image/png');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    
    // Get PDF as Uint8Array
    const pdfBytes = pdf.output('arraybuffer');
    return new Uint8Array(pdfBytes);
  } catch (error) {
    console.error('Error converting HTML to PDF:', error);
    throw error;
  }
};

/**
 * Sends a print job to PrintNode printer
 */
export const sendToPrintNode = async (
  content: string | Uint8Array,
  apiKey: string,
  printerId: string | number,
  contentType: 'raw_base64' | 'pdf_base64' | 'html_base64' = 'raw_base64'
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
    
    if (content instanceof Uint8Array) {
      // For PDF data, convert to base64 using browser-compatible approach
      encodedContent = btoa(Array.from(content)
        .map(byte => String.fromCharCode(byte))
        .join(''));
      contentPreview = 'PDF Document';
      contentType = 'pdf_base64';
      console.log('Sending PDF content to PrintNode');
    } else {
      // For HTML content, make sure we're using the correct content type
      // Check if the content is HTML and set the appropriate content type
      if (content.startsWith('<html')) {
        encodedContent = safeBase64Encode(content);
        contentPreview = content.substring(0, 255);
        contentType = 'html_base64';
        console.log('Sending content as HTML to PrintNode');
      } else {
        // For plain text content (like tickets)
        encodedContent = safeBase64Encode(content);
        contentPreview = content.substring(0, 255);
        contentType = 'raw_base64';
        console.log('Sending content as raw text to PrintNode');
      }
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
