
// PrintNode integration for printing receipts
import html2pdf from 'html2pdf.js';

export interface PrintBizConfig {
  enabled: boolean;
  apiKey?: string;
  defaultPrinterId?: string;
}

export interface PrintJob {
  printer_id: string;
  content: string;
  type: 'receipt' | 'kitchen' | 'label';
  copies?: number;
  metadata?: Record<string, any>;
}

// Get PrintNode configuration from localStorage
const getConfig = (): PrintBizConfig => {
  const configStr = localStorage.getItem('printBizConfig');
  if (configStr) {
    return JSON.parse(configStr);
  }
  return { enabled: false };
};

// Convert HTML to PDF using html2pdf
const convertHtmlToPdf = async (html: string): Promise<Blob> => {
  const options = {
    margin: [0, 0, 0, 0],
    filename: 'receipt.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: [80, 297], orientation: 'portrait' } // 80mm thermal paper width
  };

  return new Promise((resolve, reject) => {
    html2pdf()
      .from(html)
      .set(options)
      .outputPdf('blob')
      .then(resolve)
      .catch(reject);
  });
};

// Send print job to PrintNode
export const sendPrintJob = async (printJob: PrintJob): Promise<boolean> => {
  try {
    const config = getConfig();

    if (!config.enabled || !config.apiKey || !config.defaultPrinterId) {
      console.warn('PrintNode not configured');
      return false;
    }

    // Use printer ID from job or default from config
    const printerId = printJob.printer_id || config.defaultPrinterId;
    
    // Convert HTML to PDF
    const pdfBlob = await convertHtmlToPdf(printJob.content);
    const base64Data = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.readAsDataURL(pdfBlob);
    });

    // Prepare PrintNode API request
    const printNodeJob = {
      printerId: parseInt(printerId),
      title: `Order Receipt - ${new Date().toISOString()}`,
      contentType: 'pdf_base64',
      content: base64Data,
      source: 'Restaurant POS',
      options: {
        copies: printJob.copies || 1
      }
    };

    // Send to PrintNode API
    const response = await fetch('https://api.printnode.com/printjobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(config.apiKey + ':')}`
      },
      body: JSON.stringify(printNodeJob)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('PrintNode API error:', errorData);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending print job:', error);
    return false;
  }
};

// Fetch available printers from PrintNode
export const fetchPrinters = async (): Promise<any[]> => {
  try {
    const config = getConfig();
    
    if (!config.enabled || !config.apiKey) {
      console.warn('PrintNode not configured');
      return [];
    }

    const response = await fetch('https://api.printnode.com/printers', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${btoa(config.apiKey + ':')}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('PrintNode API error:', errorData);
      return [];
    }

    const printers = await response.json();
    return printers;
  } catch (error) {
    console.error('Error fetching printers:', error);
    return [];
  }
};

// Test PrintNode connection
export const testConnection = async (): Promise<boolean> => {
  try {
    const config = getConfig();
    
    if (!config.enabled || !config.apiKey) {
      return false;
    }

    const response = await fetch('https://api.printnode.com/whoami', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${btoa(config.apiKey + ':')}`
      }
    });

    return response.ok;
  } catch (error) {
    console.error('Error testing PrintNode connection:', error);
    return false;
  }
};
