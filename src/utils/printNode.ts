
import { PrintBizConfig, PrintJob } from './printBiz';
import html2pdf from 'html2pdf.js';

interface PrintNodeConfig {
  apiKey: string;
  printerId: string;
  enabled: boolean;
}

/**
 * Converts HTML content to a PDF blob
 */
export const htmlToPdf = async (htmlContent: string): Promise<Blob> => {
  const options = {
    margin: 0, // Zero margin
    filename: 'receipt.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 2,
      logging: true,
      letterRendering: true 
    },
    jsPDF: { 
      unit: 'mm', 
      format: [72, 300], // 80mm thermal paper width (adjusted for margins)
      orientation: 'portrait',
      compress: true,
      precision: 16,
      hotfixes: ['px_scaling']
    }
  };

  try {
    // Wrap HTML in a div with specific width to ensure proper rendering
    const wrappedHtml = `
      <div style="width: 72mm;">
        ${htmlContent}
      </div>
    `;
    
    // Generate PDF
    return await html2pdf()
      .from(wrappedHtml)
      .set(options)
      .outputPdf('blob');
  } catch (error) {
    console.error('Error converting HTML to PDF:', error);
    throw new Error('Failed to convert receipt to PDF');
  }
};

/**
 * Sends a print job to PrintNode API
 */
export const sendToPrintNode = async (
  pdfBlob: Blob, 
  config: PrintNodeConfig
): Promise<boolean> => {
  if (!config.enabled || !config.apiKey || !config.printerId) {
    console.log('PrintNode integration is disabled or not configured');
    return false;
  }

  try {
    // Convert blob to base64
    const reader = new FileReader();
    const base64Data = await new Promise<string>((resolve) => {
      reader.onload = () => {
        const base64 = reader.result as string;
        // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
        const base64Content = base64.split(',')[1];
        resolve(base64Content);
      };
      reader.readAsDataURL(pdfBlob);
    });

    // Prepare PrintNode API request
    const response = await fetch('https://api.printnode.com/printjobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(config.apiKey + ':')}`,
      },
      body: JSON.stringify({
        printerId: parseInt(config.printerId, 10),
        title: `Receipt ${new Date().toISOString()}`,
        contentType: 'pdf_base64',
        content: base64Data,
        source: 'Foodie Kiosk App',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('PrintNode API error:', errorData);
      throw new Error(`PrintNode API error: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('PrintNode job created successfully:', result);
    return true;
  } catch (error) {
    console.error('Error sending print job to PrintNode:', error);
    return false;
  }
};

/**
 * Fetch printers available in PrintNode account
 */
export const fetchPrintNodePrinters = async (apiKey: string): Promise<any[]> => {
  if (!apiKey) {
    return [];
  }

  try {
    const response = await fetch('https://api.printnode.com/printers', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${btoa(apiKey + ':')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch printers: ${response.statusText}`);
    }

    const printers = await response.json();
    return printers.map((printer: any) => ({
      id: printer.id,
      name: printer.name,
      description: printer.description,
      state: printer.state,
    }));
  } catch (error) {
    console.error('Error fetching PrintNode printers:', error);
    return [];
  }
};

/**
 * Test PrintNode connection
 */
export const testPrintNodeConnection = async (apiKey: string): Promise<boolean> => {
  if (!apiKey) {
    return false;
  }

  try {
    const response = await fetch('https://api.printnode.com/whoami', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${btoa(apiKey + ':')}`,
      },
    });

    return response.ok;
  } catch (error) {
    console.error('Error testing PrintNode connection:', error);
    return false;
  }
};

/**
 * Print order receipt using PrintNode
 */
export const printOrderWithPrintNode = async (
  orderNumber: string | number,
  items: any[],
  orderType: string,
  tableNumber: string | number | undefined,
  subtotal: number,
  tax: number,
  total: number,
  config: PrintNodeConfig
): Promise<boolean> => {
  try {
    // Import formatOrderReceipt dynamically to avoid circular dependencies
    const { formatOrderReceipt } = await import('./printUtils');
    
    // Generate HTML receipt
    const receiptHtml = formatOrderReceipt(
      orderNumber, 
      items, 
      orderType, 
      tableNumber, 
      subtotal, 
      tax, 
      total
    );
    
    // Convert HTML to PDF
    const pdfBlob = await htmlToPdf(receiptHtml);
    
    // Send PDF to PrintNode
    return await sendToPrintNode(pdfBlob, config);
  } catch (error) {
    console.error('Error printing with PrintNode:', error);
    return false;
  }
};
