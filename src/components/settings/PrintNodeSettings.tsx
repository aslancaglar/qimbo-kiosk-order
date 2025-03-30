
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Check, X } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { getPrintNodeConfig, savePrintNodeConfig, testPrintNodeConnection, fetchPrintNodePrinters } from "@/utils/printNodeService";

interface PrintNodeSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Printer {
  id: number;
  name: string;
  description?: string;
}

const PrintNodeSettings: React.FC<PrintNodeSettingsProps> = ({ 
  open, 
  onOpenChange 
}) => {
  const [apiKey, setApiKey] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [selectedPrinterId, setSelectedPrinterId] = useState<number | undefined>(undefined);
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  // Load saved configuration on mount
  useEffect(() => {
    if (open) {
      const config = getPrintNodeConfig();
      setApiKey(config.apiKey || "");
      setEnabled(config.enabled || false);
      setSelectedPrinterId(config.defaultPrinterId);
      
      // If API key exists, fetch printers
      if (config.apiKey) {
        loadPrinters();
      }
    }
  }, [open]);

  const loadPrinters = async () => {
    if (!apiKey) return;
    
    setIsLoading(true);
    try {
      const printersList = await fetchPrintNodePrinters();
      
      // Format printers for the select component
      const formattedPrinters = printersList.map((printer: any) => ({
        id: printer.id,
        name: printer.name,
        description: printer.description || printer.name
      }));
      
      setPrinters(formattedPrinters);
    } catch (error) {
      console.error("Error loading printers:", error);
      toast({
        title: "Error",
        description: "Failed to load printers. Please check your API key.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setTestStatus("loading");
    
    try {
      const isConnected = await testPrintNodeConnection();
      
      if (isConnected) {
        setTestStatus("success");
        await loadPrinters();
        toast({
          title: "Connection Successful",
          description: "Successfully connected to PrintNode.",
        });
      } else {
        setTestStatus("error");
        toast({
          title: "Connection Failed",
          description: "Could not connect to PrintNode. Please check your API key.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setTestStatus("error");
      toast({
        title: "Error",
        description: "An error occurred while testing the connection.",
        variant: "destructive",
      });
    }
    
    // Reset status after a delay
    setTimeout(() => {
      setTestStatus("idle");
    }, 3000);
  };

  const handleSave = () => {
    // Save configuration
    savePrintNodeConfig({
      apiKey,
      defaultPrinterId: selectedPrinterId,
      enabled
    });
    
    toast({
      title: "Settings Saved",
      description: "PrintNode settings have been saved.",
    });
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>PrintNode Settings</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="print-enabled" className="text-right">
              Enable automatic printing
            </Label>
            <Switch 
              id="print-enabled" 
              checked={enabled} 
              onCheckedChange={setEnabled} 
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="api-key" className="text-right col-span-1">
              API Key
            </Label>
            <div className="col-span-3 flex gap-2">
              <Input
                id="api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Your PrintNode API key"
                className="flex-1"
              />
              <Button 
                type="button" 
                size="sm" 
                variant="outline"
                onClick={handleTestConnection}
                disabled={!apiKey || testStatus === "loading"}
              >
                {testStatus === "loading" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {testStatus === "success" && <Check className="mr-2 h-4 w-4 text-green-500" />}
                {testStatus === "error" && <X className="mr-2 h-4 w-4 text-red-500" />}
                Test
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="printer-select" className="text-right col-span-1">
              Printer
            </Label>
            <div className="col-span-3">
              <Select 
                value={selectedPrinterId?.toString()} 
                onValueChange={(value) => setSelectedPrinterId(Number(value))}
                disabled={printers.length === 0}
              >
                <SelectTrigger id="printer-select">
                  <SelectValue placeholder="Select a printer" />
                </SelectTrigger>
                <SelectContent>
                  {printers.map((printer) => (
                    <SelectItem key={printer.id} value={printer.id.toString()}>
                      {printer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {printers.length === 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  {isLoading ? "Loading printers..." : "No printers available. Check your API key."}
                </p>
              )}
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleSave}
            disabled={!apiKey || (enabled && !selectedPrinterId)}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PrintNodeSettings;
