
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Check, X, AlertTriangle, Info, Printer } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { getPrintNodeConfig, savePrintNodeConfig, testPrintNodeConnection, fetchPrintNodePrinters, sendTestPage } from "@/utils/printNodeService";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PrintNodeSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  embedded?: boolean;
}

interface Printer {
  id: number;
  name: string;
  description?: string;
}

const PrintNodeSettings: React.FC<PrintNodeSettingsProps> = ({ 
  open, 
  onOpenChange,
  embedded = false
}) => {
  const [apiKey, setApiKey] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [selectedPrinterId, setSelectedPrinterId] = useState<number | undefined>(undefined);
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [sendingTestPage, setSendingTestPage] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [configLoaded, setConfigLoaded] = useState(false);

  // Load saved configuration on mount and when dialog opens
  useEffect(() => {
    if (open || embedded) {
      loadConfiguration();
    }
  }, [open, embedded]);

  const loadConfiguration = () => {
    const config = getPrintNodeConfig();
    console.log('Loading PrintNode config:', config);
    
    setApiKey(config.apiKey || "");
    setEnabled(config.enabled || false);
    setSelectedPrinterId(config.defaultPrinterId);
    setConfigLoaded(true);
    
    // If API key exists, fetch printers
    if (config.apiKey) {
      loadPrinters();
    }
  };

  const loadPrinters = async () => {
    if (!apiKey) {
      setErrorMessage("API key is required to load printers");
      return;
    }
    
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      // Ensure config is saved before fetching printers
      await savePrintNodeConfig({
        apiKey,
        defaultPrinterId: selectedPrinterId,
        enabled
      });
      
      const printersList = await fetchPrintNodePrinters();
      
      if (printersList.length === 0) {
        setErrorMessage("No printers found. Make sure you have printers configured in your PrintNode account.");
      }
      
      // Format printers for the select component
      const formattedPrinters = printersList.map((printer: any) => ({
        id: printer.id,
        name: printer.name,
        description: printer.description || printer.name
      }));
      
      setPrinters(formattedPrinters);
    } catch (error) {
      console.error("Error loading printers:", error);
      setErrorMessage("Failed to load printers. Please check your API key.");
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
    if (!apiKey) {
      setErrorMessage("API key is required to test connection");
      toast({
        title: "Error",
        description: "API key is required to test connection.",
        variant: "destructive",
      });
      return;
    }
    
    setTestStatus("loading");
    setErrorMessage(null);
    
    // Save the API key first, so the test can use it
    await savePrintNodeConfig({
      apiKey,
      defaultPrinterId: selectedPrinterId,
      enabled
    });
    
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
        setErrorMessage("Could not connect to PrintNode. Please check your API key.");
        toast({
          title: "Connection Failed",
          description: "Could not connect to PrintNode. Please check your API key.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setTestStatus("error");
      setErrorMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  const handleSendTestPage = async () => {
    if (!selectedPrinterId) {
      setErrorMessage("Please select a printer first");
      toast({
        title: "Error",
        description: "Please select a printer before sending a test page.",
        variant: "destructive",
      });
      return;
    }
    
    setSendingTestPage(true);
    setErrorMessage(null);
    
    // Ensure config is saved with latest values
    await savePrintNodeConfig({
      apiKey,
      defaultPrinterId: selectedPrinterId,
      enabled
    });
    
    try {
      const success = await sendTestPage();
      
      if (success) {
        toast({
          title: "Test Page Sent",
          description: "Test page has been sent to your printer.",
        });
      } else {
        setErrorMessage("Failed to send test page. Make sure your printer is online and correctly configured.");
        toast({
          title: "Error",
          description: "Failed to send test page. Make sure your printer is online and correctly configured.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error sending test page:", error);
      setErrorMessage(`Error sending test page: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast({
        title: "Error",
        description: "An error occurred while sending the test page.",
        variant: "destructive",
      });
    } finally {
      setSendingTestPage(false);
    }
  };

  const handleSave = async () => {
    // Save configuration
    await savePrintNodeConfig({
      apiKey,
      defaultPrinterId: selectedPrinterId,
      enabled
    });
    
    // Verify the configuration was saved correctly
    const savedConfig = getPrintNodeConfig();
    
    if (savedConfig.apiKey !== apiKey) {
      console.error('API key not saved correctly!', { saved: savedConfig.apiKey, expected: apiKey });
      toast({
        title: "Warning",
        description: "There might be an issue saving your API key. Please verify your settings.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Settings Saved",
        description: "PrintNode settings have been saved.",
      });
    }
    
    if (!embedded) {
      onOpenChange(false);
    }
  };

  const renderSettingsContent = () => (
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
      
      {!configLoaded && (
        <Alert className="mt-2">
          <Info className="h-4 w-4" />
          <AlertDescription>Loading configuration...</AlertDescription>
        </Alert>
      )}
      
      {errorMessage && (
        <Alert variant="destructive" className="mt-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      
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
      
      {selectedPrinterId && (
        <div className="col-span-4 flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleSendTestPage}
            disabled={sendingTestPage || !selectedPrinterId}
            className="mt-2"
          >
            {sendingTestPage ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Printer className="mr-2 h-4 w-4" />
            )}
            Send Test Page
          </Button>
        </div>
      )}
      
      <div className="col-span-4 mt-2">
        <p className="text-sm text-gray-500">
          <strong>Note:</strong> You need a valid PrintNode account and API key. 
          Visit <a href="https://www.printnode.com" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">PrintNode.com</a> to create an account.
        </p>
      </div>
    </div>
  );

  if (embedded) {
    return (
      <>
        {renderSettingsContent()}
        <div className="flex justify-end mt-4">
          <Button 
            type="button" 
            onClick={handleSave}
            disabled={!apiKey || (enabled && !selectedPrinterId)}
          >
            Save Changes
          </Button>
        </div>
      </>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>PrintNode Settings</DialogTitle>
        </DialogHeader>
        
        {renderSettingsContent()}
        
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
