
import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';
import { Loader2, RefreshCw, Save, Check, AlertCircle } from 'lucide-react';
import { PrintBizConfig, fetchPrinters, testConnection, savePrintBizConfig } from '@/utils/printBiz';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

const Settings = () => {
  // PrintNode settings state
  const [printNodeConfig, setPrintNodeConfig] = useState<PrintBizConfig>({ enabled: false });
  const [apiKey, setApiKey] = useState('');
  const [isEnabled, setIsEnabled] = useState(false);
  const [printers, setPrinters] = useState<any[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState('');
  const [isLoadingPrinters, setIsLoadingPrinters] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Load saved PrintNode config on component mount
  useEffect(() => {
    const loadPrintNodeConfig = () => {
      try {
        const configStr = localStorage.getItem('printBizConfig');
        if (configStr) {
          const config = JSON.parse(configStr);
          setPrintNodeConfig(config);
          setApiKey(config.apiKey || '');
          setIsEnabled(config.enabled || false);
          setSelectedPrinter(config.defaultPrinterId || '');
        }
      } catch (error) {
        console.error('Error loading PrintBiz config:', error);
      }
    };
    
    loadPrintNodeConfig();
  }, []);
  
  // Fetch printers when API key changes and is valid
  const handleFetchPrinters = async () => {
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please enter a PrintNode API key",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoadingPrinters(true);
    
    try {
      // Temporarily save the API key to use with fetchPrinters
      savePrintBizConfig({
        ...printNodeConfig,
        apiKey,
        enabled: true,
      });
      
      const fetchedPrinters = await fetchPrinters();
      setPrinters(fetchedPrinters);
      
      if (fetchedPrinters.length > 0) {
        toast({
          title: "Printers Retrieved",
          description: `Found ${fetchedPrinters.length} printers`,
        });
      } else {
        toast({
          title: "No Printers Found",
          description: "No printers were found for your account",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch printers",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPrinters(false);
    }
  };
  
  // Test PrintNode connection
  const handleTestConnection = async () => {
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please enter a PrintNode API key",
        variant: "destructive",
      });
      return;
    }
    
    setIsTesting(true);
    
    try {
      // Temporarily save the API key to use with testConnection
      savePrintBizConfig({
        ...printNodeConfig,
        apiKey,
        enabled: true,
      });
      
      const isConnected = await testConnection();
      
      if (isConnected) {
        toast({
          title: "Connection Successful",
          description: "Successfully connected to PrintNode API",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: "Failed to connect to PrintNode API",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while testing the connection",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };
  
  // Save PrintNode config
  const handleSaveConfig = () => {
    setIsSaving(true);
    
    try {
      const newConfig: PrintBizConfig = {
        enabled: isEnabled,
        apiKey: apiKey,
        defaultPrinterId: selectedPrinter,
      };
      
      savePrintBizConfig(newConfig);
      setPrintNodeConfig(newConfig);
      
      toast({
        title: "Settings Saved",
        description: "PrintNode settings have been saved",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <AdminLayout>
      <ScrollArea className="h-[calc(100vh-80px)]">
        <div className="p-6 max-w-5xl mx-auto">
          <Tabs defaultValue="printing">
            <TabsList className="mb-8">
              <TabsTrigger value="printing">Printing</TabsTrigger>
              <TabsTrigger value="other">Other Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="printing">
              <Card>
                <CardHeader>
                  <CardTitle>PrintNode Integration</CardTitle>
                  <CardDescription>
                    Configure your PrintNode settings to enable automated receipt printing.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="print-enabled" className="flex flex-col space-y-1">
                      <span>Enable PrintNode</span>
                      <span className="font-normal text-sm text-muted-foreground">
                        When enabled, receipts will be sent to your thermal printer
                      </span>
                    </Label>
                    <Switch
                      id="print-enabled" 
                      checked={isEnabled}
                      onCheckedChange={setIsEnabled}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="api-key">PrintNode API Key</Label>
                    <Input 
                      type="password" 
                      id="api-key" 
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Enter your PrintNode API key"
                    />
                    <p className="text-sm text-muted-foreground">
                      You can find your API key in your PrintNode account settings.
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      onClick={handleTestConnection}
                      disabled={!apiKey || isTesting}
                      variant="outline"
                    >
                      {isTesting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Test Connection
                        </>
                      )}
                    </Button>
                    
                    <Button 
                      onClick={handleFetchPrinters}
                      disabled={!apiKey || isLoadingPrinters}
                      variant="outline"
                    >
                      {isLoadingPrinters ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Fetch Printers
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="printer">Default Printer</Label>
                    <Select 
                      value={selectedPrinter} 
                      onValueChange={setSelectedPrinter}
                      disabled={printers.length === 0}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a printer" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Available Printers</SelectLabel>
                          {printers.map((printer) => (
                            <SelectItem 
                              key={printer.id} 
                              value={printer.id.toString()}
                            >
                              {printer.name} - {printer.description || 'No description'}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    {printers.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No printers available. Please fetch printers first.
                      </p>
                    )}
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <Button onClick={handleSaveConfig} disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Settings
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="other">
              <Card>
                <CardHeader>
                  <CardTitle>Other Settings</CardTitle>
                  <CardDescription>
                    Additional settings for your restaurant management system.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Preserve existing settings UI */}
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Other settings will be available in future updates.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </AdminLayout>
  );
};

export default Settings;
