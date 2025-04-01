
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Printer, Check, AlertCircle, RefreshCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { fetchPrintNodePrinters, testPrintNodeConnection, PrintNodeSettings, PrintNodePrinter } from '@/utils/printNode';

const PrinterSettings: React.FC = () => {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [printers, setPrinters] = useState<PrintNodePrinter[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState('');
  const [loading, setLoading] = useState(false);
  const [testingPrinter, setTestingPrinter] = useState(false);
  const [loadingPrinters, setLoadingPrinters] = useState(false);
  
  // Fetch settings from Supabase
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('*')
          .eq('key', 'printnode')
          .single();
          
        if (error) {
          if (error.code !== 'PGRST116') { // No rows returned
            console.error('Error fetching PrintNode settings:', error);
          }
          return;
        }
        
        if (data && data.value) {
          const settings = data.value as unknown as PrintNodeSettings;
          setApiKey(settings.apiKey || '');
          setEnabled(settings.enabled || false);
          setSelectedPrinter(settings.defaultPrinterId || '');
          
          // If we have an API key, fetch printers
          if (settings.apiKey) {
            fetchPrinters(settings.apiKey);
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    
    fetchSettings();
  }, []);
  
  // Fetch printers from PrintNode API
  const fetchPrinters = async (key = apiKey) => {
    if (!key) {
      toast({
        title: "API Key Required",
        description: "Please enter a PrintNode API key first",
        variant: "destructive"
      });
      return;
    }
    
    setLoadingPrinters(true);
    
    try {
      const result = await fetchPrintNodePrinters(key);
      
      if (result.success && result.printers) {
        setPrinters(result.printers);
        toast({
          title: "Printers Loaded",
          description: `Found ${result.printers.length} printers`,
          variant: "default"
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to load printers",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching printers:', error);
      toast({
        title: "Error",
        description: "Failed to connect to PrintNode API",
        variant: "destructive"
      });
    } finally {
      setLoadingPrinters(false);
    }
  };
  
  // Save settings to Supabase
  const saveSettings = async () => {
    if (enabled && (!apiKey || !selectedPrinter)) {
      toast({
        title: "Missing Information",
        description: "Please provide an API key and select a printer",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const settings: PrintNodeSettings = {
        apiKey,
        enabled,
        defaultPrinterId: selectedPrinter,
        printerName: printers.find(p => p.id === selectedPrinter)?.name
      };
      
      const { error } = await supabase
        .from('settings')
        .upsert({
          key: 'printnode',
          value: settings as any
        }, {
          onConflict: 'key'
        });
        
      if (error) {
        throw error;
      }
      
      toast({
        title: "Settings Saved",
        description: `PrintNode integration ${enabled ? 'enabled' : 'disabled'}`,
        variant: "default"
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Test printer connection
  const testPrinter = async () => {
    if (!apiKey || !selectedPrinter) {
      toast({
        title: "Missing Information",
        description: "Please provide an API key and select a printer",
        variant: "destructive"
      });
      return;
    }
    
    setTestingPrinter(true);
    
    try {
      const result = await testPrintNodeConnection(apiKey, selectedPrinter);
      
      if (result.success) {
        toast({
          title: "Test Successful",
          description: "Test receipt sent to printer",
          variant: "default"
        });
      } else {
        toast({
          title: "Test Failed",
          description: result.error || "Could not connect to printer",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error testing printer:', error);
      toast({
        title: "Error",
        description: "Failed to test printer connection",
        variant: "destructive"
      });
    } finally {
      setTestingPrinter(false);
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Printer className="mr-2 h-6 w-6" />
          Thermal Printer Settings
        </CardTitle>
        <CardDescription>
          Configure receipt printing with PrintNode for ITPP047 thermal printer
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Enable/Disable Setting */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="printer-enabled">Enable Thermal Printing</Label>
            <p className="text-sm text-muted-foreground">
              Send receipts directly to thermal printer
            </p>
          </div>
          <Switch 
            id="printer-enabled" 
            checked={enabled} 
            onCheckedChange={setEnabled} 
          />
        </div>
        
        {/* API Key Setting */}
        <div className="space-y-2">
          <Label htmlFor="printer-api-key">PrintNode API Key</Label>
          <Input
            id="printer-api-key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your PrintNode API key"
            type="password"
          />
          <p className="text-xs text-muted-foreground">
            Get your API key from <a href="https://app.printnode.com/app/apikeys" target="_blank" rel="noopener noreferrer" className="text-primary">PrintNode Dashboard</a>
          </p>
        </div>
        
        {/* Refresh Printers Button */}
        <Button 
          variant="outline" 
          onClick={() => fetchPrinters()} 
          disabled={!apiKey || loadingPrinters}
          className="w-full"
        >
          {loadingPrinters ? (
            <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCcw className="mr-2 h-4 w-4" />
          )}
          Refresh Printer List
        </Button>
        
        {/* Printer Selection */}
        <div className="space-y-2">
          <Label htmlFor="select-printer">Select Printer</Label>
          <Select value={selectedPrinter} onValueChange={setSelectedPrinter}>
            <SelectTrigger>
              <SelectValue placeholder="Select a printer" />
            </SelectTrigger>
            <SelectContent>
              {printers.map((printer) => (
                <SelectItem key={printer.id} value={printer.id}>
                  {printer.name} {printer.state && `(${printer.state})`}
                </SelectItem>
              ))}
              {printers.length === 0 && (
                <SelectItem value="none" disabled>
                  No printers found
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={testPrinter}
          disabled={!apiKey || !selectedPrinter || testingPrinter}
        >
          {testingPrinter ? (
            <>
              <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <Printer className="mr-2 h-4 w-4" />
              Print Test Receipt
            </>
          )}
        </Button>
        
        <Button onClick={saveSettings} disabled={loading}>
          {loading ? (
            <>
              <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PrinterSettings;
