
// PrintBiz integration for PrintNode API

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

// Sends a print job to PrintNode
export const sendPrintJob = async (job: PrintJob): Promise<boolean> => {
  try {
    const config = getPrintBizConfig();
    
    if (!config.enabled || !config.apiKey) {
      console.warn('PrintBiz is not enabled or missing API key');
      return false;
    }
    
    const printerId = job.printer_id || config.defaultPrinterId;
    
    if (!printerId) {
      console.error('No printer ID specified for print job');
      return false;
    }
    
    console.log(`Sending print job to printer ${printerId}`);
    
    const response = await fetch('https://api.printnode.com/printjobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(config.apiKey + ':')}`
      },
      body: JSON.stringify({
        printerId: parseInt(printerId, 10),
        title: `Order Receipt ${job.metadata?.orderNumber || ''}`,
        contentType: 'pdf_base64',
        content: job.content,
        source: 'POS System',
        options: {
          copies: job.copies || 1
        }
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('PrintNode API error:', response.status, errorText);
      return false;
    }
    
    const result = await response.json();
    console.log('Print job sent successfully:', result);
    return true;
  } catch (error) {
    console.error('Error sending print job:', error);
    return false;
  }
};

// Get printers from PrintNode
export const fetchPrinters = async (): Promise<any[]> => {
  try {
    const config = getPrintBizConfig();
    
    if (!config.enabled || !config.apiKey) {
      console.warn('PrintBiz is not enabled or missing API key');
      return [];
    }
    
    const response = await fetch('https://api.printnode.com/printers', {
      headers: {
        'Authorization': `Basic ${btoa(config.apiKey + ':')}`
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('PrintNode API error:', response.status, errorText);
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
    const config = getPrintBizConfig();
    
    if (!config.enabled || !config.apiKey) {
      console.warn('PrintBiz is not enabled or missing API key');
      return false;
    }
    
    const response = await fetch('https://api.printnode.com/whoami', {
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

// Get config from localStorage
const getPrintBizConfig = (): PrintBizConfig => {
  const configStr = localStorage.getItem('printBizConfig');
  
  if (!configStr) {
    return { enabled: false };
  }
  
  try {
    return JSON.parse(configStr);
  } catch (error) {
    console.error('Error parsing PrintBiz config:', error);
    return { enabled: false };
  }
};

// Save config to localStorage
export const savePrintBizConfig = (config: PrintBizConfig): void => {
  localStorage.setItem('printBizConfig', JSON.stringify(config));
};
