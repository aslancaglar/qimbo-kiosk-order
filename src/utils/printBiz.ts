
// This file is kept as a placeholder to avoid breaking imports but functionality is removed.
// The PrintBiz integration has been replaced with PrintNode integration.

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
 */
export const sendPrintJob = async (): Promise<boolean> => {
  console.log('PrintBiz integration has been removed, using PrintNode instead');
  return false;
};

/**
 * This function is a placeholder. PrintBiz integration has been removed.
 */
export const fetchPrinters = async (): Promise<any[]> => {
  console.log('PrintBiz integration has been removed, using PrintNode instead');
  return [];
};

/**
 * This function is a placeholder. PrintBiz integration has been removed.
 */
export const testConnection = async (): Promise<boolean> => {
  console.log('PrintBiz integration has been removed, using PrintNode instead');
  return false;
};
