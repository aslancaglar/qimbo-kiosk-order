import { PrintJob } from "@/utils/printBiz";

/**
 * Test connection to PrintNode API
 */
export const testPrintNodeConnection = async (apiKey: string): Promise<boolean> => {
  try {
    const response = await fetch('https://api.printnode.com/whoami', {
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + btoa(apiKey + ':'),
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error('PrintNode connection test failed:', await response.text());
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error testing PrintNode connection:', error);
    return false;
  }
};

/**
 * Fetch printers from PrintNode API
 */
export const fetchPrintNodePrinters = async (apiKey: string): Promise<any[]> => {
  try {
    const response = await fetch('https://api.printnode.com/printers', {
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + btoa(apiKey + ':'),
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error('PrintNode fetch printers failed:', await response.text());
      return [];
    }
    
    const printers = await response.json();
    return printers.map((printer: any) => ({
      id: printer.id,
      name: printer.name,
      description: printer.description,
      state: printer.state
    }));
  } catch (error) {
    console.error('Error fetching PrintNode printers:', error);
    return [];
  }
};

/**
 * Send test print job to PrintNode API
 */
export const sendTestPrint = async (apiKey: string, printerId: string): Promise<boolean> => {
  try {
    const printJob: PrintJob = {
      printer_id: printerId,
      content: 'This is a test receipt from Lovable.',
      type: 'receipt',
      copies: 1,
      metadata: {
        test: true
      }
    };
    
    const response = await fetch('https://api.printnode.com/printjobs', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(apiKey + ':'),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(printJob)
    });
    
    if (!response.ok) {
      console.error('PrintNode send test print failed:', await response.text());
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error sending test print to PrintNode:', error);
    return false;
  }
};
