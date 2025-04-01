
import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Printer, RefreshCw, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PrintNodeSettings } from '@/components/cart/types';

const Settings = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [printers, setPrinters] = useState<any[]>([]);
  const [testingConnection, setTestingConnection] = useState(false);
  const [loadingPrinters, setLoadingPrinters] = useState(false);
  const [printNodeSettings, setPrintNodeSettings] = useState<PrintNodeSettings>({
    apiKey: '',
    enabled: false,
    defaultPrinterId: '',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      // Fetch PrintNode settings
      const { data: printNodeData, error: printNodeError } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'printnode_settings')
        .single();

      if (printNodeData?.value) {
        setPrintNodeSettings(printNodeData.value as PrintNodeSettings);
      }
      
      if (printNodeError) {
        console.error('Error fetching PrintNode settings:', printNodeError);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testPrintNodeConnection = async () => {
    setTestingConnection(true);
    try {
      // Simple test request to PrintNode API
      const response = await fetch(`https://api.printnode.com/printers`, {
        headers: {
          'Authorization': `Basic ${btoa(printNodeSettings.apiKey + ':')}`
        }
      });

      if (response.ok) {
        toast({
          title: "Connection successful",
          description: "Successfully connected to PrintNode API",
        });
        
        // If successful, also fetch printers
        fetchPrinters();
      } else {
        toast({
          title: "Connection failed",
          description: "Failed to connect to PrintNode API. Check your API key.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error testing PrintNode connection:', error);
      toast({
        title: "Connection error",
        description: "An error occurred while testing the connection",
        variant: "destructive",
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const fetchPrinters = async () => {
    if (!printNodeSettings.apiKey) {
      toast({
        title: "API Key required",
        description: "Please enter a PrintNode API key",
        variant: "destructive",
      });
      return;
    }

    setLoadingPrinters(true);
    try {
      const response = await fetch(`https://api.printnode.com/printers`, {
        headers: {
          'Authorization': `Basic ${btoa(printNodeSettings.apiKey + ':')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPrinters(data);
      } else {
        toast({
          title: "Error fetching printers",
          description: "Failed to retrieve printers from PrintNode",
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
      setLoadingPrinters(false);
    }
  };

  const savePrintNodeSettings = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({
          key: 'printnode_settings',
          value: printNodeSettings
        });

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "PrintNode settings have been updated successfully",
      });
    } catch (error) {
      console.error('Error saving PrintNode settings:', error);
      toast({
        title: "Error",
        description: "Failed to save PrintNode settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <Tabs defaultValue="printing">
          <TabsList className="mb-6">
            <TabsTrigger value="printing">Receipt Printing</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="general">General Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="printing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Printer className="h-5 w-5" />
                  PrintNode Integration
                </CardTitle>
                <CardDescription>
                  Connect to PrintNode for receipt printing capabilities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="print-enabled">Enable receipt printing</Label>
                    <Switch
                      id="print-enabled"
                      checked={printNodeSettings.enabled}
                      onCheckedChange={(checked) => {
                        setPrintNodeSettings({ ...printNodeSettings, enabled: checked });
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="printnode-api-key">PrintNode API Key</Label>
                    <Input
                      id="printnode-api-key"
                      value={printNodeSettings.apiKey}
                      onChange={(e) => {
                        setPrintNodeSettings({ ...printNodeSettings, apiKey: e.target.value });
                      }}
                      placeholder="Enter your PrintNode API key"
                    />
                    <p className="text-sm text-muted-foreground">
                      Get your API key from your PrintNode account
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={testPrintNodeConnection}
                      disabled={testingConnection || !printNodeSettings.apiKey}
                    >
                      {testingConnection ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        "Test Connection"
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      onClick={fetchPrinters}
                      disabled={loadingPrinters || !printNodeSettings.apiKey}
                    >
                      {loadingPrinters ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        "Refresh Printers"
                      )}
                    </Button>
                  </div>
                </div>

                {printers.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="default-printer">Default Printer</Label>
                    <Select
                      value={printNodeSettings.defaultPrinterId}
                      onValueChange={(value) => {
                        setPrintNodeSettings({
                          ...printNodeSettings,
                          defaultPrinterId: value,
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a printer" />
                      </SelectTrigger>
                      <SelectContent>
                        {printers.map((printer) => (
                          <SelectItem key={printer.id} value={printer.id.toString()}>
                            {printer.name} - {printer.description || "No description"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button 
                  onClick={savePrintNodeSettings}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Save Settings
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Appearance Settings</CardTitle>
                <CardDescription>
                  Customize how your application looks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Appearance settings will be implemented here</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>
                  Basic configuration for your application
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>General settings will be implemented here</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default Settings;
