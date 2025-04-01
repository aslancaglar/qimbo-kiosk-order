
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { 
  getPrintNodeConfig, 
  savePrintNodeConfig, 
  PrintNodeConfig,
  checkPrinterStatus
} from "@/utils/printNode";
import { Printer, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PrintSettings: React.FC = () => {
  const [config, setConfig] = useState<PrintNodeConfig>({ 
    apiKey: "", 
    printerId: 0, 
    enabled: false 
  });
  const [printerStatus, setPrinterStatus] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    // Load stored configuration
    const storedConfig = getPrintNodeConfig();
    setConfig(storedConfig);
  }, []);
  
  const handleSaveConfig = () => {
    savePrintNodeConfig(config);
    toast({
      title: "Settings saved",
      description: "PrintNode configuration has been updated"
    });
  };
  
  const handleCheckStatus = async () => {
    setIsChecking(true);
    setPrinterStatus(null);
    
    try {
      const isOnline = await checkPrinterStatus();
      setPrinterStatus(isOnline);
      
      toast({
        title: isOnline ? "Printer is online" : "Printer is offline",
        description: isOnline 
          ? "The printer is connected and ready to use." 
          : "Please check the printer connection and settings.",
        variant: isOnline ? "default" : "destructive"
      });
    } catch (error) {
      console.error('Error checking printer status:', error);
      
      toast({
        title: "Error checking printer",
        description: "Could not determine printer status.",
        variant: "destructive"
      });
      
      setPrinterStatus(false);
    } finally {
      setIsChecking(false);
    }
  };
  
  return (
    <div className="space-y-6 p-6 pt-0">
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-medium">Receipt Printer Settings</h3>
        <p className="text-sm text-gray-500">
          Configure your PrintNode integration for thermal receipt printing
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <label className="text-sm font-medium">Enable Printing</label>
            <p className="text-xs text-gray-500">
              Turn on automatic receipt printing
            </p>
          </div>
          <Switch
            checked={config.enabled}
            onCheckedChange={(checked) => setConfig({...config, enabled: checked})}
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">PrintNode API Key</label>
          <Input
            type="password"
            value={config.apiKey}
            onChange={(e) => setConfig({...config, apiKey: e.target.value})}
            placeholder="Enter your PrintNode API key"
          />
          <p className="text-xs text-gray-500">
            Get this from your PrintNode account dashboard
          </p>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Printer ID</label>
          <Input
            type="number"
            value={config.printerId || ""}
            onChange={(e) => setConfig({...config, printerId: parseInt(e.target.value) || 0})}
            placeholder="Enter your printer ID"
          />
          <p className="text-xs text-gray-500">
            Find this in your PrintNode dashboard under Printers
          </p>
        </div>
        
        <div className="flex flex-col gap-4 pt-2">
          <Button onClick={handleSaveConfig}>
            Save Settings
          </Button>
          
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={handleCheckStatus} 
            disabled={isChecking || !config.apiKey || !config.printerId}
          >
            <Printer size={16} />
            Check Printer Status
            {printerStatus !== null && (
              printerStatus 
                ? <CheckCircle2 size={16} className="ml-2 text-green-500" /> 
                : <AlertCircle size={16} className="ml-2 text-red-500" />
            )}
          </Button>
        </div>
      </div>
      
      <div className="mt-6 px-4 py-3 bg-blue-50 text-blue-700 rounded-md text-sm">
        <p><strong>Note:</strong> The ITPP047 80mm thermal printer requires:</p>
        <ul className="list-disc pl-5 mt-2">
          <li>Paper width: 80mm (48 chars/line)</li>
          <li>DPI: 203 (standard thermal)</li>
          <li>Orientation: Portrait</li>
        </ul>
      </div>
    </div>
  );
};

export default PrintSettings;
