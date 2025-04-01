
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { isBrowserPrintingEnabled, saveBrowserPrintSettings } from "@/utils/printUtils";
import { useToast } from "@/hooks/use-toast";

export function BrowserPrintSettings() {
  const { toast } = useToast();
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function loadSettings() {
      try {
        const browserPrintingEnabled = await isBrowserPrintingEnabled();
        setEnabled(browserPrintingEnabled);
      } catch (error) {
        console.error('Error loading browser print settings:', error);
        toast({
          title: "Error",
          description: "Failed to load browser printing settings",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }
    
    loadSettings();
  }, [toast]);
  
  const handleToggleChange = async (checked: boolean) => {
    setEnabled(checked);
    
    try {
      const success = await saveBrowserPrintSettings(checked);
      if (success) {
        toast({
          title: "Success",
          description: `Browser printing ${checked ? 'enabled' : 'disabled'}`,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update browser printing settings",
          variant: "destructive"
        });
        // Revert the toggle if saving failed
        setEnabled(!checked);
      }
    } catch (error) {
      console.error('Error saving browser print settings:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while saving settings",
        variant: "destructive"
      });
      // Revert the toggle if saving failed
      setEnabled(!checked);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Browser Printing</CardTitle>
        <CardDescription>Configure browser printing settings</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between space-x-2">
          <Label htmlFor="browser-printing" className="flex flex-col space-y-1">
            <span>Enable Browser Printing</span>
            <span className="font-normal text-sm text-gray-500">
              When enabled, receipts can be printed directly from the browser
            </span>
          </Label>
          <Switch 
            id="browser-printing" 
            checked={enabled} 
            onCheckedChange={handleToggleChange}
            disabled={loading}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export default BrowserPrintSettings;
