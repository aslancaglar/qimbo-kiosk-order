
import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer, RefreshCw, Check, AlertCircle } from "lucide-react";
import AdminLayout from '@/components/admin/AdminLayout';
import { fetchPrintNodePrinters, testPrintNodeConnection } from '@/utils/printNode';

interface PrinterOption {
  id: string;
  name: string;
  description?: string;
  state?: string;
}

const PrintSettings = () => {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState<string>("");
  const [printerId, setPrinterId] = useState<string>("");
  const [enabled, setEnabled] = useState<boolean>(false);
  const [printers, setPrinters] = useState<PrinterOption[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [testingConnection, setTestingConnection] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<'untested' | 'success' | 'failure'>('untested');

  // Load saved config on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('printnode_config');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        setApiKey(config.apiKey || "");
        setPrinterId(config.printerId || "");
        setEnabled(config.enabled || false);
        
        // Fetch printers if we have an API key
        if (config.apiKey) {
          fetchPrinters(config.apiKey);
        }
      } catch (e) {
        console.error('Error parsing saved PrintNode config:', e);
      }
    }
  }, []);

  const fetchPrinters = async (key: string) => {
    setLoading(true);
    try {
      const printersList = await fetchPrintNodePrinters(key);
      setPrinters(printersList);
      if (printersList.length === 0) {
        toast({
          title: "No Printers Found",
          description: "No printers were found with the provided API key.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching printers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch printers. Please check your API key.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshPrinters = () => {
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please enter a PrintNode API key before refreshing printers.",
        variant: "destructive",
      });
      return;
    }
    fetchPrinters(apiKey);
  };

  const handleTestConnection = async () => {
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please enter a PrintNode API key to test the connection.",
        variant: "destructive",
      });
      return;
    }

    setTestingConnection(true);
    setConnectionStatus('untested');

    try {
      const success = await testPrintNodeConnection(apiKey);
      
      if (success) {
        setConnectionStatus('success');
        toast({
          title: "Connection Successful",
          description: "Successfully connected to PrintNode API.",
        });
      } else {
        setConnectionStatus('failure');
        toast({
          title: "Connection Failed",
          description: "Failed to connect to PrintNode. Please check your API key.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setConnectionStatus('failure');
      toast({
        title: "Connection Error",
        description: "An error occurred while testing the connection.",
        variant: "destructive",
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveConfig = () => {
    const config = {
      apiKey,
      printerId,
      enabled
    };

    localStorage.setItem('printnode_config', JSON.stringify(config));
    
    toast({
      title: "Settings Saved",
      description: "PrintNode configuration has been saved.",
    });
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-8 space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Print Settings</h2>
          <p className="text-muted-foreground">
            Configure PrintNode integration for receipt printing
          </p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Printer className="mr-2 h-6 w-6" />
                PrintNode Configuration
              </CardTitle>
              <CardDescription>
                Connect to PrintNode to automatically print receipts from your thermal printer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="printnode-enabled">Enable PrintNode</Label>
                  <p className="text-sm text-muted-foreground">
                    Turn on to enable automatic printing with PrintNode
                  </p>
                </div>
                <Switch 
                  id="printnode-enabled" 
                  checked={enabled}
                  onCheckedChange={setEnabled}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="api-key">API Key</Label>
                <div className="flex space-x-2">
                  <Input 
                    id="api-key"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your PrintNode API key"
                    className="flex-1"
                  />
                  <Button 
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={testingConnection || !apiKey}
                  >
                    {testingConnection ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : connectionStatus === 'success' ? (
                      <Check className="mr-2 h-4 w-4 text-green-500" />
                    ) : connectionStatus === 'failure' ? (
                      <AlertCircle className="mr-2 h-4 w-4 text-red-500" />
                    ) : null}
                    Test Connection
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your API key can be found in your PrintNode account settings
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="printer-select">Printer</Label>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleRefreshPrinters}
                    disabled={loading || !apiKey}
                  >
                    <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
                <Select value={printerId} onValueChange={setPrinterId}>
                  <SelectTrigger id="printer-select">
                    <SelectValue placeholder="Select a printer" />
                  </SelectTrigger>
                  <SelectContent>
                    {printers.length === 0 ? (
                      <SelectItem value="no-printers" disabled>
                        No printers available
                      </SelectItem>
                    ) : (
                      printers.map((printer) => (
                        <SelectItem key={printer.id} value={printer.id.toString()}>
                          {printer.name} {printer.state ? `(${printer.state})` : ''}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {printers.length === 0 && apiKey && (
                  <p className="text-xs text-amber-500">
                    No printers found. Make sure your PrintNode client is running and connected.
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full"
                onClick={handleSaveConfig}
                disabled={loading}
              >
                Save Settings
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default PrintSettings;
