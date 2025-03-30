
import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer, RefreshCw, CheckCircle2, XCircle, Save } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { fetchPrinters, testConnection } from "@/utils/printBiz";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Printer {
  id: number;
  name: string;
  description: string;
  state: string;
}

const PrintSettings = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [defaultPrinterId, setDefaultPrinterId] = useState("");
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Load saved config on component mount
  useEffect(() => {
    const configStr = localStorage.getItem('printBizConfig');
    if (configStr) {
      try {
        const config = JSON.parse(configStr);
        setIsEnabled(config.enabled || false);
        setApiKey(config.apiKey || "");
        setDefaultPrinterId(config.defaultPrinterId || "");
      } catch (error) {
        console.error('Error loading print config:', error);
      }
    }
  }, []);

  const handleSaveConfig = () => {
    try {
      const config = {
        enabled: isEnabled,
        apiKey,
        defaultPrinterId
      };
      
      localStorage.setItem('printBizConfig', JSON.stringify(config));
      
      toast({
        title: "Settings saved",
        description: "PrintNode configuration has been updated",
      });
    } catch (error) {
      console.error('Error saving print config:', error);
      toast({
        title: "Error",
        description: "Failed to save configuration",
        variant: "destructive",
      });
    }
  };

  const handleTestConnection = async () => {
    try {
      setIsTesting(true);
      setConnectionStatus('idle');
      
      // Save current config to use for testing
      const config = {
        enabled: true,
        apiKey,
        defaultPrinterId
      };
      localStorage.setItem('printBizConfig', JSON.stringify(config));
      
      // Test connection
      const success = await testConnection();
      
      if (success) {
        setConnectionStatus('success');
        toast({
          title: "Connection successful",
          description: "PrintNode API is working correctly",
        });
      } else {
        setConnectionStatus('error');
        toast({
          title: "Connection failed",
          description: "Could not connect to PrintNode API",
          variant: "destructive",
        });
      }
    } catch (error) {
      setConnectionStatus('error');
      toast({
        title: "Error",
        description: "Failed to test connection",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleFetchPrinters = async () => {
    try {
      setIsLoading(true);
      
      // Save current config to use for fetching
      const config = {
        enabled: true,
        apiKey,
        defaultPrinterId
      };
      localStorage.setItem('printBizConfig', JSON.stringify(config));
      
      // Fetch printers
      const fetchedPrinters = await fetchPrinters();
      
      if (Array.isArray(fetchedPrinters) && fetchedPrinters.length > 0) {
        setPrinters(fetchedPrinters);
        toast({
          title: "Printers loaded",
          description: `Found ${fetchedPrinters.length} printer(s)`,
        });
      } else {
        toast({
          title: "No printers found",
          description: "Check your PrintNode account",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching printers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch printers",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <ScrollArea className="h-[calc(100vh-80px)]">
        <div className="space-y-6 pb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Print Settings</h1>
            <Button onClick={handleSaveConfig}>
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Printer className="mr-2 h-5 w-5" />
                PrintNode Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="print-enabled" 
                  checked={isEnabled}
                  onCheckedChange={setIsEnabled}
                />
                <Label htmlFor="print-enabled">
                  Enable PrintNode Integration
                </Label>
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="api-key">API Key</Label>
                <Input
                  id="api-key"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your PrintNode API key"
                />
                
                <div className="flex space-x-2 mt-2">
                  <Button 
                    variant="outline" 
                    onClick={handleTestConnection}
                    disabled={!apiKey || isTesting}
                    className="flex-1"
                  >
                    {isTesting ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : connectionStatus === 'success' ? (
                      <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                    ) : connectionStatus === 'error' ? (
                      <XCircle className="mr-2 h-4 w-4 text-red-500" />
                    ) : null}
                    Test Connection
                  </Button>
                  
                  <Button 
                    onClick={handleFetchPrinters} 
                    disabled={!apiKey || isLoading}
                    variant="outline"
                    className="flex-1"
                  >
                    {isLoading ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    Fetch Printers
                  </Button>
                </div>
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="default-printer">Default Printer</Label>
                <Select 
                  value={defaultPrinterId} 
                  onValueChange={setDefaultPrinterId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a printer" />
                  </SelectTrigger>
                  <SelectContent>
                    {printers.length === 0 ? (
                      <SelectItem value="none" disabled>No printers found</SelectItem>
                    ) : (
                      printers.map((printer) => (
                        <SelectItem key={printer.id} value={printer.id.toString()}>
                          {printer.name} - {printer.description || 'No description'}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                
                <p className="text-sm text-gray-500 mt-1">
                  This printer will be used for all receipts.
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Print Format Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>
                  This system is configured for thermal printers with 80mm width.
                </p>
                <p className="text-sm text-gray-500">
                  Receipts will be automatically formatted for optimal display on thermal paper.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </AdminLayout>
  );
};

export default PrintSettings;
