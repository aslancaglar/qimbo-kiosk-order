
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
import { testConnection as testBizPrintConnection } from "../../utils/bizPrint";
import { type BizPrintConfig } from "../../utils/bizPrint";
import { Json } from "../../integrations/supabase/types";

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

  // BizPrint settings state
  const [bizPrintSettings, setBizPrintSettings] = useState<BizPrintConfig>({
    api_key: '',
    api_endpoint: 'https://api.getbizprint.com/v1',
    enabled: false,
    default_printer_id: '',
    auto_print: true
  });

  // Fetch restaurant info, business hours, and BizPrint settings on component mount
  useEffect(() => {
    fetchRestaurantInfo();
    fetchBusinessHours();
    fetchBizPrintSettings();
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

  const fetchBizPrintSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'bizprint_settings')
        .maybeSingle();

      if (error) {
        console.error('Error fetching BizPrint settings:', error);
        toast({
          title: "Error",
          description: "Failed to load BizPrint settings",
          variant: "destructive"
        });
        return;
      }

      if (data && data.value) {
        const settings = data.value as Json;
        if (typeof settings === 'object' && settings !== null && !Array.isArray(settings)) {
          setBizPrintSettings({
            api_key: (settings.api_key as string) || '',
            api_endpoint: (settings.api_endpoint as string) || 'https://api.getbizprint.com/v1',
            enabled: !!settings.enabled,
            default_printer_id: (settings.default_printer_id as string) || '',
            auto_print: settings.auto_print !== undefined ? !!settings.auto_print : true
          });
        }
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

  const handleBizPrintSettingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type, checked } = e.target;
    setBizPrintSettings(prev => ({
      ...prev,
      [id.replace('bizprint-', '')]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSwitchChange = (field: string, checked: boolean) => {
    setBizPrintSettings(prev => ({
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

  const saveBizPrintSettings = async () => {
    try {
      setLoading(true);
      
      const { data: existingData, error: checkError } = await supabase
        .from('settings')
        .select('id')
        .eq('key', 'bizprint_settings')
        .maybeSingle();
        
      if (checkError) {
        console.error('Error checking BizPrint settings:', checkError);
        toast({
          title: "Error",
          description: "Failed to check if settings exist",
          variant: "destructive"
        });
        return;
      }
      
      let saveError;
      
      const settingsValue = {
        api_key: bizPrintSettings.api_key,
        api_endpoint: bizPrintSettings.api_endpoint,
        enabled: bizPrintSettings.enabled, 
        default_printer_id: bizPrintSettings.default_printer_id,
        auto_print: bizPrintSettings.auto_print
      } as unknown as Json;
      
      if (existingData) {
        const { error } = await supabase
          .from('settings')
          .update({
            value: settingsValue,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingData.id);
          
        saveError = error;
      } else {
        const { error } = await supabase
          .from('settings')
          .insert({
            key: 'bizprint_settings',
            value: settingsValue,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
        saveError = error;
      }

      if (saveError) {
        console.error('Error saving BizPrint settings:', saveError);
        toast({
          title: "Error",
          description: "Failed to save BizPrint settings",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "BizPrint settings saved successfully"
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

  const testBizPrintConnection = async () => {
    try {
      setLoading(true);
      
      const success = await testBizPrintConnection(bizPrintSettings);
      
      if (success) {
        toast({
          title: "Test Successful",
          description: "Successfully connected to BizPrint API",
        });
      } else {
        toast({
          title: "Test Failed",
          description: "Failed to connect to BizPrint API. Please check your credentials.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error testing BizPrint connection:', error);
      toast({
        title: "Error",
        description: "Failed to connect to BizPrint API",
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
                  BizPrint Integration
                </CardTitle>
                <CardDescription>
                  Configure your BizPrint cloud printing service for remote receipt printing.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="bizprint-enabled"
                    checked={bizPrintSettings.enabled}
                    onCheckedChange={(checked) => handleSwitchChange('enabled', checked)}
                  />
                  <Label htmlFor="bizprint-enabled">Enable BizPrint integration</Label>
                </div>
                
                <div className="pt-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bizprint-api_key">API Key</Label>
                    <Input 
                      id="bizprint-api_key" 
                      value={bizPrintSettings.api_key}
                      onChange={handleBizPrintSettingChange}
                      placeholder="Enter your BizPrint API key"
                      disabled={!bizPrintSettings.enabled}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bizprint-api_endpoint">API Endpoint</Label>
                    <Input 
                      id="bizprint-api_endpoint" 
                      value={bizPrintSettings.api_endpoint}
                      onChange={handleBizPrintSettingChange}
                      placeholder="https://api.getbizprint.com/v1"
                      disabled={!bizPrintSettings.enabled}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bizprint-default_printer_id">Default Printer ID</Label>
                    <Input 
                      id="bizprint-default_printer_id" 
                      value={bizPrintSettings.default_printer_id}
                      onChange={handleBizPrintSettingChange}
                      placeholder="Enter your default printer ID"
                      disabled={!bizPrintSettings.enabled}
                    />
                    <p className="text-sm text-muted-foreground">
                      You can find printer IDs in your BizPrint dashboard
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch 
                      id="bizprint-auto_print"
                      checked={bizPrintSettings.auto_print}
                      onCheckedChange={(checked) => handleSwitchChange('auto_print', checked)}
                      disabled={!bizPrintSettings.enabled}
                    />
                    <Label htmlFor="bizprint-auto_print">Automatically print receipts for new orders</Label>
                  </div>
                  
                  <div className="flex gap-4 pt-4">
                    <Button 
                      onClick={saveBizPrintSettings}
                      disabled={loading || !bizPrintSettings.enabled}
                      className="mt-2"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? 'Saving...' : 'Save Settings'}
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={testBizPrintConnection}
                      disabled={loading || !bizPrintSettings.enabled || !bizPrintSettings.api_key}
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
