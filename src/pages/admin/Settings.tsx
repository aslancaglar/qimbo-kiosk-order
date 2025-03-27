import React, { useEffect, useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "../../integrations/supabase/client";
import AdminLayout from '../../components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Save, Printer } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { testConnection as testPrintBizApiConnection } from "../../utils/printBiz";
import { type PrintBizConfig } from "../../utils/printBiz";

const Settings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Restaurant info state
  const [restaurantInfo, setRestaurantInfo] = useState({
    id: 1,
    name: '',
    phone: '',
    address: '',
    description: ''
  });

  // Business hours state
  const [businessHours, setBusinessHours] = useState([
    { id: 0, day_of_week: 'Monday', open_time: '09:00', close_time: '21:00' },
    { id: 0, day_of_week: 'Tuesday', open_time: '09:00', close_time: '21:00' },
    { id: 0, day_of_week: 'Wednesday', open_time: '09:00', close_time: '21:00' },
    { id: 0, day_of_week: 'Thursday', open_time: '09:00', close_time: '21:00' },
    { id: 0, day_of_week: 'Friday', open_time: '09:00', close_time: '21:00' },
    { id: 0, day_of_week: 'Saturday', open_time: '09:00', close_time: '21:00' },
    { id: 0, day_of_week: 'Sunday', open_time: '09:00', close_time: '21:00' }
  ]);

  // PrintBiz settings state
  const [printBizSettings, setPrintBizSettings] = useState<PrintBizConfig>({
    api_key: '',
    api_endpoint: 'https://api.printbiz.io/v1',
    enabled: false,
    default_printer_id: '',
    auto_print: true
  });

  // Fetch restaurant info, business hours, and PrintBiz settings on component mount
  useEffect(() => {
    fetchRestaurantInfo();
    fetchBusinessHours();
    fetchPrintBizSettings();
  }, []);

  const fetchRestaurantInfo = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('restaurant_info')
        .select('*')
        .order('id', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching restaurant info:', error);
        toast({
          title: "Error",
          description: "Failed to load restaurant information",
          variant: "destructive"
        });
        return;
      }

      if (data) {
        setRestaurantInfo(data);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBusinessHours = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('business_hours')
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        console.error('Error fetching business hours:', error);
        toast({
          title: "Error",
          description: "Failed to load business hours",
          variant: "destructive"
        });
        return;
      }

      if (data && data.length > 0) {
        setBusinessHours(data);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPrintBizSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'printbiz_settings')
        .maybeSingle();

      if (error) {
        console.error('Error fetching PrintBiz settings:', error);
        toast({
          title: "Error",
          description: "Failed to load PrintBiz settings",
          variant: "destructive"
        });
        return;
      }

      if (data && data.value) {
        setPrintBizSettings(data.value as PrintBizConfig);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setRestaurantInfo(prev => ({
      ...prev,
      [id.replace('restaurant-', '')]: value
    }));
  };

  const handleHoursChange = (day: string, field: 'open_time' | 'close_time', value: string) => {
    setBusinessHours(prev => 
      prev.map(item => 
        item.day_of_week === day 
          ? { ...item, [field]: value } 
          : item
      )
    );
  };

  const handlePrintBizSettingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type, checked } = e.target;
    setPrintBizSettings(prev => ({
      ...prev,
      [id.replace('printbiz-', '')]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSwitchChange = (field: string, checked: boolean) => {
    setPrintBizSettings(prev => ({
      ...prev,
      [field]: checked
    }));
  };

  const saveRestaurantInfo = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('restaurant_info')
        .update({
          name: restaurantInfo.name,
          phone: restaurantInfo.phone,
          address: restaurantInfo.address,
          description: restaurantInfo.description,
          updated_at: new Date().toISOString()
        })
        .eq('id', restaurantInfo.id);

      if (error) {
        console.error('Error updating restaurant info:', error);
        toast({
          title: "Error",
          description: "Failed to update restaurant information",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "Restaurant information updated successfully"
      });
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveBusinessHours = async () => {
    try {
      setLoading(true);
      
      // Update each day's business hours
      for (const hours of businessHours) {
        const { error } = await supabase
          .from('business_hours')
          .update({
            open_time: hours.open_time,
            close_time: hours.close_time,
            updated_at: new Date().toISOString()
          })
          .eq('id', hours.id);

        if (error) {
          console.error(`Error updating business hours for ${hours.day_of_week}:`, error);
          toast({
            title: "Error",
            description: `Failed to update business hours for ${hours.day_of_week}`,
            variant: "destructive"
          });
          return;
        }
      }

      toast({
        title: "Success",
        description: "Business hours updated successfully"
      });
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const savePrintBizSettings = async () => {
    try {
      setLoading(true);
      
      // Check if settings record exists
      const { data: existingData, error: checkError } = await supabase
        .from('settings')
        .select('id')
        .eq('key', 'printbiz_settings')
        .maybeSingle();
        
      if (checkError) {
        console.error('Error checking PrintBiz settings:', checkError);
        toast({
          title: "Error",
          description: "Failed to check if settings exist",
          variant: "destructive"
        });
        return;
      }
      
      let saveError;
      
      if (existingData) {
        // Update existing record
        const { error } = await supabase
          .from('settings')
          .update({
            value: printBizSettings,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingData.id);
          
        saveError = error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from('settings')
          .insert({
            key: 'printbiz_settings',
            value: printBizSettings,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
        saveError = error;
      }

      if (saveError) {
        console.error('Error saving PrintBiz settings:', saveError);
        toast({
          title: "Error",
          description: "Failed to save PrintBiz settings",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "PrintBiz settings saved successfully"
      });
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const testPrintBizConnection = async () => {
    try {
      setLoading(true);
      
      // Use our actual test connection function from printBiz.ts
      const success = await testPrintBizApiConnection(printBizSettings);
      
      if (success) {
        toast({
          title: "Test Successful",
          description: "Successfully connected to PrintBiz API",
        });
      } else {
        toast({
          title: "Test Failed",
          description: "Failed to connect to PrintBiz API. Please check your credentials.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error testing PrintBiz connection:', error);
      toast({
        title: "Error",
        description: "Failed to connect to PrintBiz API",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <Tabs defaultValue="general">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="printing">Printing</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Restaurant Information</CardTitle>
                <CardDescription>
                  Update your restaurant's basic information.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="restaurant-name">Restaurant Name</Label>
                    <Input 
                      id="restaurant-name" 
                      value={restaurantInfo.name} 
                      onChange={handleInfoChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="restaurant-phone">Phone Number</Label>
                    <Input 
                      id="restaurant-phone" 
                      value={restaurantInfo.phone} 
                      onChange={handleInfoChange}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="restaurant-address">Address</Label>
                  <Input 
                    id="restaurant-address" 
                    value={restaurantInfo.address} 
                    onChange={handleInfoChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="restaurant-description">Description</Label>
                  <Textarea 
                    id="restaurant-description" 
                    value={restaurantInfo.description || ''} 
                    onChange={handleInfoChange}
                    rows={3}
                  />
                </div>
                
                <Button 
                  className="mt-4" 
                  onClick={saveRestaurantInfo} 
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Business Hours</CardTitle>
                <CardDescription>
                  Set your restaurant's opening hours.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {businessHours.map((day, i) => (
                    <div key={i} className="flex items-center justify-between pb-2 border-b">
                      <span className="font-medium">{day.day_of_week}</span>
                      <div className="flex gap-2 items-center">
                        <Input
                          type="time"
                          value={day.open_time}
                          onChange={(e) => handleHoursChange(day.day_of_week, 'open_time', e.target.value)}
                          className="w-24"
                        />
                        <span>to</span>
                        <Input
                          type="time"
                          value={day.close_time}
                          onChange={(e) => handleHoursChange(day.day_of_week, 'close_time', e.target.value)}
                          className="w-24"
                        />
                      </div>
                    </div>
                  ))}
                  <Button 
                    className="mt-4"
                    onClick={saveBusinessHours}
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Hours'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="printing" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Printer className="h-5 w-5" />
                  PrintBiz Integration
                </CardTitle>
                <CardDescription>
                  Configure your PrintBiz cloud printing service for remote receipt printing.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="printbiz-enabled"
                    checked={printBizSettings.enabled}
                    onCheckedChange={(checked) => handleSwitchChange('enabled', checked)}
                  />
                  <Label htmlFor="printbiz-enabled">Enable PrintBiz integration</Label>
                </div>
                
                <div className="pt-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="printbiz-api_key">API Key</Label>
                    <Input 
                      id="printbiz-api_key" 
                      value={printBizSettings.api_key}
                      onChange={handlePrintBizSettingChange}
                      placeholder="Enter your PrintBiz API key"
                      disabled={!printBizSettings.enabled}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="printbiz-api_endpoint">API Endpoint</Label>
                    <Input 
                      id="printbiz-api_endpoint" 
                      value={printBizSettings.api_endpoint}
                      onChange={handlePrintBizSettingChange}
                      placeholder="https://api.printbiz.io/v1"
                      disabled={!printBizSettings.enabled}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="printbiz-default_printer_id">Default Printer ID</Label>
                    <Input 
                      id="printbiz-default_printer_id" 
                      value={printBizSettings.default_printer_id}
                      onChange={handlePrintBizSettingChange}
                      placeholder="Enter your default printer ID"
                      disabled={!printBizSettings.enabled}
                    />
                    <p className="text-sm text-muted-foreground">
                      You can find printer IDs in your PrintBiz dashboard
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch 
                      id="printbiz-auto_print"
                      checked={printBizSettings.auto_print}
                      onCheckedChange={(checked) => handleSwitchChange('auto_print', checked)}
                      disabled={!printBizSettings.enabled}
                    />
                    <Label htmlFor="printbiz-auto_print">Automatically print receipts for new orders</Label>
                  </div>
                  
                  <div className="flex gap-4 pt-4">
                    <Button 
                      onClick={savePrintBizSettings}
                      disabled={loading || !printBizSettings.enabled}
                      className="mt-2"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? 'Saving...' : 'Save Settings'}
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={testPrintBizConnection}
                      disabled={loading || !printBizSettings.enabled || !printBizSettings.api_key}
                      className="mt-2"
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Test Connection
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="appearance" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Appearance Settings</CardTitle>
                <CardDescription>
                  Customize how your restaurant's ordering system looks.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">Appearance settings coming soon.</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>
                  Configure how you receive order notifications.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">Notification settings coming soon.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default Settings;
