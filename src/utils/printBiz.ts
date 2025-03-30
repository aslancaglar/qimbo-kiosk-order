
import html2pdf from 'html2pdf.js';

// PrintNode API configuration
export interface PrintBizConfig {
  enabled: boolean;
  apiKey: string;
  apiUrl: string;
  defaultPrinterId: string;
}

export interface PrintJob {
  printer_id: string;
  content: string;
  type: 'receipt' | 'kitchen' | 'label';
  copies?: number;
  metadata?: Record<string, any>;
}

// Default configuration
const defaultConfig: PrintBizConfig = {
  enabled: true,
  apiKey: process.env.PRINTNODE_API_KEY || 'YOUR_API_KEY_HERE',
  apiUrl: 'https://api.printnode.com',
  defaultPrinterId: ''
};

// Get configuration from localStorage or use defaults
const getConfig = (): PrintBizConfig => {
  try {
    const configFromStorage = localStorage.getItem('printBizConfig');
    return configFromStorage ? 
      { ...defaultConfig, ...JSON.parse(configFromStorage) } : 
      defaultConfig;
  } catch (error) {
    console.error('Failed to load PrintBiz configuration:', error);
    return defaultConfig;
  }
};

// Save configuration to localStorage
export const saveConfig = (config: Partial<PrintBizConfig>): void => {
  try {
    const currentConfig = getConfig();
    const newConfig = { ...currentConfig, ...config };
    localStorage.setItem('printBizConfig', JSON.stringify(newConfig));
  } catch (error) {
    console.error('Failed to save PrintBiz configuration:', error);
  }
};

// Create PDF from HTML content
const createPdfFromHtml = async (htmlContent: string): Promise<Uint8Array> => {
  // Create a temporary container for the HTML content
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.innerHTML = htmlContent;
  document.body.appendChild(container);
  
  try {
    // Set PDF options for thermal printer (80mm width)
    const options = {
      margin: [5, 5],
      filename: 'order_receipt.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        logging: false,
        dpi: 192,
        letterRendering: true,
        width: 302 // 80mm at 96 DPI ≈ 302px
      },
      jsPDF: { 
        unit: 'mm', 
        format: [80, 297], // 80mm width, variable height
        orientation: 'portrait',
        compress: true 
      }
    };
    
    // Generate PDF
    const pdf = await html2pdf().from(container).set(options).outputPdf('arraybuffer');
    
    // Convert ArrayBuffer to Uint8Array
    return new Uint8Array(pdf);
  } finally {
    // Clean up temporary container
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }
};

// Send print job to PrintNode
export const sendPrintJob = async (job: PrintJob): Promise<boolean> => {
  const config = getConfig();
  
  // If PrintBiz is disabled, log a message and return
  if (!config.enabled) {
    console.log('PrintBiz integration is disabled');
    return false;
  }
  
  try {
    // Convert HTML to PDF
    const pdfData = await createPdfFromHtml(job.content);
    
    // Convert binary data to base64
    const base64Pdf = btoa(
      Array.from(pdfData)
        .map(byte => String.fromCharCode(byte))
        .join('')
    );
    
    // Prepare the PrintNode API payload
    const printerId = job.printer_id || config.defaultPrinterId;
    
    if (!printerId) {
      console.error('No printer ID specified for print job');
      return false;
    }
    
    const payload = {
      printerId: parseInt(printerId, 10),
      title: `Order Receipt - ${job.metadata?.orderNumber || 'Unknown'}`,
      contentType: 'pdf_base64',
      content: base64Pdf,
      source: 'Lovable POS',
      options: {
        copies: job.copies || 1,
      }
    };
    
    // Send request to PrintNode API
    const response = await fetch(`${config.apiUrl}/printjobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(config.apiKey + ':')}`
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('PrintNode API error:', errorData);
      throw new Error(`PrintNode API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Print job sent successfully:', data);
    return true;
  } catch (error) {
    console.error('Failed to send print job:', error);
    return false;
  }
};

// Fetch available printers from PrintNode
export const fetchPrinters = async (): Promise<any[]> => {
  const config = getConfig();
  
  if (!config.enabled || !config.apiKey) {
    console.log('PrintBiz integration is disabled or not configured');
    return [];
  }
  
  try {
    const response = await fetch(`${config.apiUrl}/printers`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${btoa(config.apiKey + ':')}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('PrintNode API error:', errorData);
      throw new Error(`PrintNode API error: ${response.status} ${response.statusText}`);
    }
    
    const printers = await response.json();
    return printers;
  } catch (error) {
    console.error('Failed to fetch printers:', error);
    return [];
  }
};

// Test connection to PrintNode API
export const testConnection = async (): Promise<boolean> => {
  const config = getConfig();
  
  if (!config.enabled || !config.apiKey) {
    console.log('PrintBiz integration is disabled or not configured');
    return false;
  }
  
  try {
    const response = await fetch(`${config.apiUrl}/whoami`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${btoa(config.apiKey + ':')}`
      }
    });
    
    if (!response.ok) {
      console.error('PrintNode API connection test failed:', response.statusText);
      return false;
    }
    
    const data = await response.json();
    console.log('PrintNode API connection test successful:', data);
    return true;
  } catch (error) {
    console.error('PrintNode API connection test failed:', error);
    return false;
  }
};
