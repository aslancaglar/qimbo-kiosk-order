
// This file now serves as a simple interface for print functionality
// and a compatibility layer for existing code

export interface PrintBizConfig {
  enabled: boolean;
}

export interface PrintJob {
  printer_id: string;
  content: string;
  type: 'receipt' | 'kitchen' | 'label';
  copies?: number;
  metadata?: Record<string, any>;
}

/**
 * This function is a placeholder. PrintBiz integration has been removed.
 * Use PrintNode functionality from printNode.ts instead.
 */
export const sendPrintJob = async (): Promise<boolean> => {
  console.log('PrintBiz integration has been removed, use PrintNode instead');
  return false;
};

/**
 * This function is a placeholder. PrintBiz integration has been removed.
 * Use PrintNode functionality from printNode.ts instead.
 */
export const fetchPrinters = async (): Promise<any[]> => {
  console.log('PrintBiz integration has been removed, use PrintNode instead');
  return [];
};

/**
 * This function is a placeholder. PrintBiz integration has been removed.
 * Use PrintNode functionality from printNode.ts instead.
 */
export const testConnection = async (): Promise<boolean> => {
  console.log('PrintBiz integration has been removed, use PrintNode instead');
  return false;
};
