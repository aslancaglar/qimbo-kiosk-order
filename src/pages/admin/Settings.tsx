import React, { useEffect, useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "../../integrations/supabase/client";
import { Json } from "../../integrations/supabase/types";
import AdminLayout from '../../components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Save, Settings2, Globe } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useLanguage } from '@/context/LanguageContext';

interface OrderingSettings {
  requireTableSelection: boolean;
}

const Settings = () => {
  const { toast } = useToast();
  const { t, language, changeLanguage } = useLanguage();
  const [loading, setLoading] = useState(false);

  const [restaurantInfo, setRestaurantInfo] = useState({
    id: 1,
    name: '',
    phone: '',
    address: '',
    description: ''
  });

  const [businessHours, setBusinessHours] = useState([
    { id: 0, day_of_week: 'Monday', open_time: '09:00', close_time: '21:00' },
    { id: 0, day_of_week: 'Tuesday', open_time: '09:00', close_time: '21:00' },
    { id: 0, day_of_week: 'Wednesday', open_time: '09:00', close_time: '21:00' },
    { id: 0, day_of_week: 'Thursday', open_time: '09:00', close_time: '21:00' },
    { id: 0, day_of_week: 'Friday', open_time: '09:00', close_time: '21:00' },
    { id: 0, day_of_week: 'Saturday', open_time: '09:00', close_time: '21:00' },
    { id: 0, day_of_week: 'Sunday', open_time: '09:00', close_time: '21:00' }
  ]);

  const [orderingSettings, setOrderingSettings] = useState<OrderingSettings>({
    requireTableSelection: true
  });

  useEffect(() => {
    fetchRestaurantInfo();
    fetchBusinessHours();
    fetchOrderingSettings();
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

  const fetchOrderingSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'ordering_settings')
        .maybeSingle();

      if (error) {
        console.error('Error fetching ordering settings:', error);
        toast({
          title: "Error",
          description: "Failed to load ordering settings",
          variant: "destructive"
        });
        return;
      }

      if (data && data.value) {
        const settings = data.value as Record<string, any>;
        setOrderingSettings({
          requireTableSelection: settings.requireTableSelection !== undefined ? !!settings.requireTableSelection : true
        });
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

  const handleOrderingSettingChange = (field: string, checked: boolean) => {
    setOrderingSettings(prev => ({
      ...prev,
      [field]: checked
    }));
  };

  const handleLanguageChange = (value: string) => {
    changeLanguage(value);
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

  const saveOrderingSettings = async () => {
    try {
      setLoading(true);
      
      const { data: existingData, error: checkError } = await supabase
        .from('settings')
        .select('id')
        .eq('key', 'ordering_settings')
        .maybeSingle();
        
      if (checkError) {
        console.error('Error checking ordering settings:', checkError);
        toast({
          title: "Error",
          description: "Failed to check if settings exist",
          variant: "destructive"
        });
        return;
      }
      
      let saveError;
      
      const settingsValue = {
        requireTableSelection: orderingSettings.requireTableSelection
      } as Json;
      
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
            key: 'ordering_settings',
            value: settingsValue,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
        saveError = error;
      }

      if (saveError) {
        console.error('Error saving ordering settings:', saveError);
        toast({
          title: "Error",
          description: "Failed to save ordering settings",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "Ordering settings saved successfully"
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <Tabs defaultValue="general">
          <TabsList>
            <TabsTrigger value="general">{t.settings.general}</TabsTrigger>
            <TabsTrigger value="ordering">{t.settings.ordering}</TabsTrigger>
            <TabsTrigger value="appearance">{t.settings.appearance}</TabsTrigger>
            <TabsTrigger value="notifications">{t.settings.notifications}</TabsTrigger>
            <TabsTrigger value="language">{t.common.language}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t.settings.restaurantInfo}</CardTitle>
                <CardDescription>
                  {t.settings.restaurantInfoDesc}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="restaurant-name">{t.settings.restaurantName}</Label>
                    <Input 
                      id="restaurant-name" 
                      value={restaurantInfo.name} 
                      onChange={handleInfoChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="restaurant-phone">{t.settings.phoneNumber}</Label>
                    <Input 
                      id="restaurant-phone" 
                      value={restaurantInfo.phone} 
                      onChange={handleInfoChange}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="restaurant-address">{t.settings.address}</Label>
                  <Input 
                    id="restaurant-address" 
                    value={restaurantInfo.address} 
                    onChange={handleInfoChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="restaurant-description">{t.settings.description}</Label>
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
                  {loading ? t.settings.saving : t.settings.saveChanges}
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>{t.settings.businessHours}</CardTitle>
                <CardDescription>
                  {t.settings.businessHoursDesc}
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
                        <span>{t.orderConfirmation.to}</span>
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
                    {loading ? t.settings.saving : t.settings.saveHours}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="ordering" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings2 className="h-5 w-5" />
                  {t.settings.orderingOptions}
                </CardTitle>
                <CardDescription>
                  {t.settings.orderingOptionsDesc}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="require-table-selection"
                    checked={orderingSettings.requireTableSelection}
                    onCheckedChange={(checked) => handleOrderingSettingChange('requireTableSelection', checked)}
                  />
                  <Label htmlFor="require-table-selection">
                    {t.settings.requireTableSelection}
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground pl-7">
                  {t.settings.requireTableSelectionDesc}
                </p>
                
                <Button 
                  onClick={saveOrderingSettings}
                  disabled={loading}
                  className="mt-4"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? t.settings.saving : t.settings.saveSettings}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="appearance" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{t.settings.appearanceSettings}</CardTitle>
                <CardDescription>
                  {t.settings.appearanceSettingsDesc}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">{t.settings.comingSoon}</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{t.settings.notificationSettings}</CardTitle>
                <CardDescription>
                  {t.settings.notificationSettingsDesc}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">{t.settings.notificationsComingSoon}</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="language" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  {t.settings.languageSettings}
                </CardTitle>
                <CardDescription>
                  {t.settings.languageSettingsDesc}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="language-select">{t.settings.selectLanguage}</Label>
                  <RadioGroup defaultValue={language} onValueChange={handleLanguageChange}>
                    <div className="flex items-center space-x-2 py-2">
                      <RadioGroupItem value="en" id="language-en" />
                      <Label htmlFor="language-en">{t.settings.english}</Label>
                    </div>
                    <div className="flex items-center space-x-2 py-2">
                      <RadioGroupItem value="fr" id="language-fr" />
                      <Label htmlFor="language-fr">{t.settings.french}</Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default Settings;
