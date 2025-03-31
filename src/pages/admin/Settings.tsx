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
import { Save, Settings2, RefreshCw, Upload, Bell, Volume2 } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { clearAppCache } from "../../utils/serviceWorker";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { uploadFile } from '@/utils/fileUpload';

interface OrderingSettings {
  requireTableSelection: boolean;
}

interface NotificationSettings {
  soundEnabled: boolean;
  soundUrl?: string;
  soundName?: string;
  volume: number;
}

const Settings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [testingSound, setTestingSound] = useState(false);
  const [uploadingSound, setUploadingSound] = useState(false);

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
  
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    soundEnabled: true,
    soundUrl: '/notification.mp3',
    soundName: 'Default notification',
    volume: 1.0
  });

  useEffect(() => {
    fetchRestaurantInfo();
    fetchBusinessHours();
    fetchOrderingSettings();
    fetchNotificationSettings();
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

  const fetchNotificationSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'notification_settings')
        .maybeSingle();
        
      if (error) {
        console.error('Error fetching notification settings:', error);
        toast({
          title: "Error",
          description: "Failed to load notification settings",
          variant: "destructive"
        });
        return;
      }

      if (data && data.value) {
        const settings = data.value as Record<string, any>;
        setNotificationSettings({
          soundEnabled: settings.soundEnabled !== undefined ? !!settings.soundEnabled : true,
          soundUrl: settings.soundUrl || '/notification.mp3',
          soundName: settings.soundName || 'Default notification',
          volume: settings.volume !== undefined ? Number(settings.volume) : 1.0
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
  
  const handleNotificationSettingChange = (field: string, value: any) => {
    setNotificationSettings(prev => ({
      ...prev,
      [field]: value
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

  const saveNotificationSettings = async () => {
    try {
      setLoading(true);
      
      const { data: existingData, error: checkError } = await supabase
        .from('settings')
        .select('id')
        .eq('key', 'notification_settings')
        .maybeSingle();
        
      if (checkError) {
        console.error('Error checking notification settings:', checkError);
        toast({
          title: "Error",
          description: "Failed to check if settings exist",
          variant: "destructive"
        });
        return;
      }
      
      let saveError;
      
      const settingsValue = {
        soundEnabled: notificationSettings.soundEnabled,
        soundUrl: notificationSettings.soundUrl,
        soundName: notificationSettings.soundName,
        volume: notificationSettings.volume
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
            key: 'notification_settings',
            value: settingsValue,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
        saveError = error;
      }

      if (saveError) {
        console.error('Error saving notification settings:', saveError);
        toast({
          title: "Error",
          description: "Failed to save notification settings",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "Notification settings saved successfully"
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

  const handleClearCache = async () => {
    try {
      setClearingCache(true);
      const success = await clearAppCache();
      
      if (success) {
        toast({
          title: "Cache cleared",
          description: "Application cache has been successfully cleared"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to clear application cache",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while clearing cache",
        variant: "destructive"
      });
    } finally {
      setClearingCache(false);
    }
  };

  const handleSoundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) {
        return;
      }
      
      const file = e.target.files[0];
      
      if (!file.type.startsWith('audio/')) {
        toast({
          title: "Invalid file",
          description: "Please upload an audio file (MP3, WAV, etc.)",
          variant: "destructive"
        });
        return;
      }
      
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Audio file must be less than 2MB",
          variant: "destructive"
        });
        return;
      }
      
      setUploadingSound(true);
      
      const soundUrl = await uploadFile(file, 'notification-sounds');
      
      if (soundUrl) {
        setNotificationSettings(prev => ({
          ...prev,
          soundUrl,
          soundName: file.name
        }));
        
        toast({
          title: "Sound uploaded",
          description: "Notification sound uploaded successfully"
        });
      }
    } catch (error) {
      console.error('Error uploading sound:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload notification sound",
        variant: "destructive"
      });
    } finally {
      setUploadingSound(false);
      if (e.target) e.target.value = '';
    }
  };

  const playTestSound = () => {
    if (!notificationSettings.soundUrl) return;
    
    setTestingSound(true);
    
    try {
      const audio = new Audio(notificationSettings.soundUrl);
      audio.volume = notificationSettings.volume;
      
      audio.onended = () => {
        setTestingSound(false);
      };
      
      audio.onerror = () => {
        setTestingSound(false);
        toast({
          title: "Playback error",
          description: "Failed to play the notification sound",
          variant: "destructive"
        });
      };
      
      audio.play().catch(err => {
        console.error('Error playing audio:', err);
        setTestingSound(false);
        toast({
          title: "Playback error",
          description: "Failed to play the notification sound. User interaction may be needed first.",
          variant: "destructive"
        });
      });
    } catch (error) {
      console.error('Error creating audio:', error);
      setTestingSound(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <Tabs defaultValue="general">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="ordering">Ordering</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
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
          
          <TabsContent value="ordering" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings2 className="h-5 w-5" />
                  Ordering Options
                </CardTitle>
                <CardDescription>
                  Configure ordering options and customer experience settings.
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
                    Require table selection for dine-in orders
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground pl-7">
                  When disabled, customers can place dine-in orders without selecting a table number.
                </p>
                
                <Button 
                  onClick={saveOrderingSettings}
                  disabled={loading}
                  className="mt-4"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : 'Save Settings'}
                </Button>
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
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Settings
                </CardTitle>
                <CardDescription>
                  Configure how notifications are handled throughout the system.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Sound Notifications</h3>
                  
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="sound-enabled"
                      checked={notificationSettings.soundEnabled}
                      onCheckedChange={(checked) => handleNotificationSettingChange('soundEnabled', checked)}
                    />
                    <Label htmlFor="sound-enabled">
                      Enable notification sounds
                    </Label>
                  </div>
                  
                  {notificationSettings.soundEnabled && (
                    <div className="pl-7 space-y-4">
                      <div className="space-y-2">
                        <Label>Current notification sound</Label>
                        <div className="flex items-center gap-2 p-3 rounded-md bg-muted text-sm">
                          <Volume2 className="h-5 w-5 text-muted-foreground" />
                          <span className="flex-1 truncate">
                            {notificationSettings.soundName || 'Default notification'}
                          </span>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={playTestSound}
                            disabled={testingSound}
                          >
                            {testingSound ? 'Playing...' : 'Test Sound'}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="notification-volume">Volume</Label>
                        <div className="flex items-center gap-4">
                          <input
                            id="notification-volume"
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={notificationSettings.volume}
                            onChange={(e) => handleNotificationSettingChange('volume', parseFloat(e.target.value))}
                            className="w-full"
                          />
                          <span className="text-sm">
                            {Math.round(notificationSettings.volume * 100)}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="pt-2">
                        <Label htmlFor="sound-file" className="block mb-2">Upload custom notification sound</Label>
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            <Input
                              id="sound-file"
                              type="file"
                              accept="audio/*"
                              onChange={handleSoundUpload}
                              disabled={uploadingSound}
                              className="flex-1"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Accepted formats: MP3, WAV, OGG (max 2MB)
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <Button 
                  onClick={saveNotificationSettings}
                  disabled={loading}
                  className="mt-4"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : 'Save Notification Settings'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="system" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  System Maintenance
                </CardTitle>
                <CardDescription>
                  Manage cache and system maintenance options.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <Alert>
                    <AlertDescription>
                      Clearing the application cache will remove stored data and reload the latest content.
                      This can help fix issues with outdated content or unexpected behavior.
                    </AlertDescription>
                  </Alert>
                  
                  <Button 
                    onClick={handleClearCache}
                    disabled={clearingCache}
                    className="mt-4"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${clearingCache ? 'animate-spin' : ''}`} />
                    {clearingCache ? 'Clearing Cache...' : 'Clear Application Cache'}
                  </Button>
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
