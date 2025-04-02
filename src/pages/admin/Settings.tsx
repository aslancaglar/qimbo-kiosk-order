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
import { Save, Settings2, RefreshCw, Upload, Bell, Volume2, Image, Images, Printer } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { clearAppCache } from "../../utils/serviceWorker";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { uploadFile } from '@/utils/fileUpload';
import { 
  testPrintNodeConnection, 
  fetchPrintNodePrinters, 
  sendTestPrint 
} from '@/utils/printNode';
import { saveBrowserPrintSettings as saveBrowserPrintSettingsUtil, isBrowserPrintingEnabled } from '@/utils/printUtils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from "@/components/ui/checkbox";

interface OrderingSettings {
  requireTableSelection: boolean;
}

interface NotificationSettings {
  soundEnabled: boolean;
  soundUrl?: string;
  soundName?: string;
  volume: number;
}

interface AppearanceSettings {
  logo?: string;
  slideshowImages: string[];
}

interface PrinterConfig {
  id: string;
  name: string;
}

interface PrintSettings {
  enabled: boolean;
  apiKey: string;
  printers: PrinterConfig[];
  browserPrintingEnabled: boolean;
}

interface PrinterOption {
  id: string | number;
  name: string;
  description?: string;
  state?: string;
}

const Settings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [testingSound, setTestingSound] = useState(false);
  const [uploadingSound, setUploadingSound] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [fetchingPrinters, setFetchingPrinters] = useState(false);
  const [testingPrinter, setTestingPrinter] = useState(false);
  const [availablePrinters, setAvailablePrinters] = useState<PrinterOption[]>([]);
  const [initialPrinterLoad, setInitialPrinterLoad] = useState(false);
  const [savingBrowserPrint, setSavingBrowserPrint] = useState(false);

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

  const [appearanceSettings, setAppearanceSettings] = useState<AppearanceSettings>({
    logo: '',
    slideshowImages: [
      "/lovable-uploads/6837434a-e5ba-495a-b295-9638c9b5c27f.png",
      "https://images.unsplash.com/photo-1546793665-c74683f339c1?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1482938289607-e9573fc25ebb?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    ]
  });

  const [printSettings, setPrintSettings] = useState<PrintSettings>({
    enabled: false,
    apiKey: '',
    printers: [],
    browserPrintingEnabled: true
  });

  useEffect(() => {
    fetchRestaurantInfo();
    fetchBusinessHours();
    fetchOrderingSettings();
    fetchNotificationSettings();
    fetchAppearanceSettings();
    fetchPrintSettings();
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

  const fetchAppearanceSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'appearance_settings')
        .maybeSingle();
        
      if (error) {
        console.error('Error fetching appearance settings:', error);
        toast({
          title: "Error",
          description: "Failed to load appearance settings",
          variant: "destructive"
        });
        return;
      }

      if (data && data.value) {
        const settings = data.value as Record<string, any>;
        setAppearanceSettings({
          logo: settings.logo || '',
          slideshowImages: settings.slideshowImages || [
            "/lovable-uploads/6837434a-e5ba-495a-b295-9638c9b5c27f.png",
            "https://images.unsplash.com/photo-1546793665-c74683f339c1?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1482938289607-e9573fc25ebb?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
          ]
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

  const fetchPrintSettings = async () => {
    try {
      setLoading(true);
      
      const { data: existingData, error: checkError } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'print_settings')
        .maybeSingle();
        
      if (checkError) {
        console.error('Error checking print settings:', checkError);
        toast({
          title: "Error",
          description: "Failed to load printer settings",
          variant: "destructive"
        });
        return;
      }

      const browserPrintingEnabled = await isBrowserPrintingEnabled();

      if (existingData && existingData.value) {
        const settings = existingData.value as Record<string, any>;
        const newSettings = {
          enabled: settings.enabled !== undefined ? !!settings.enabled : false,
          apiKey: settings.apiKey || '',
          printers: Array.isArray(settings.printers) ? settings.printers : [],
          browserPrintingEnabled
        };
        
        setPrintSettings(newSettings);
        
        if (newSettings.apiKey && !initialPrinterLoad) {
          console.log('Auto-fetching printers on initial load');
          setInitialPrinterLoad(true);
          
          setTimeout(async () => {
            try {
              setFetchingPrinters(true);
              const printers = await fetchPrintNodePrinters(newSettings.apiKey);
              setAvailablePrinters(printers);
              
              if (printers.length === 0 && newSettings.printers.length > 0) {
                console.log('No printers found but printers exist in settings, trying again...');
                setTimeout(async () => {
                  const retryPrinters = await fetchPrintNodePrinters(newSettings.apiKey);
                  setAvailablePrinters(retryPrinters);
                  setFetchingPrinters(false);
                }, 1000);
              } else {
                setFetchingPrinters(false);
              }
            } catch (error) {
              console.error('Error auto-fetching printers:', error);
              setFetchingPrinters(false);
            }
          }, 500);
        }
      } else {
        setPrintSettings(prev => ({
          ...prev,
          browserPrintingEnabled
        }));
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

  const handlePrintSettingChange = (field: string, value: any) => {
    setPrintSettings(prev => ({
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

  const saveAppearanceSettings = async () => {
    try {
      setLoading(true);
      
      const { data: existingData, error: checkError } = await supabase
        .from('settings')
        .select('id')
        .eq('key', 'appearance_settings')
        .maybeSingle();
        
      if (checkError) {
        console.error('Error checking appearance settings:', checkError);
        toast({
          title: "Error",
          description: "Failed to check if settings exist",
          variant: "destructive"
        });
        return;
      }
      
      let saveError;
      
      const settingsValue = {
        logo: appearanceSettings.logo,
        slideshowImages: appearanceSettings.slideshowImages
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
            key: 'appearance_settings',
            value: settingsValue,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
        saveError = error;
      }

      if (saveError) {
        console.error('Error saving appearance settings:', saveError);
        toast({
          title: "Error",
          description: "Failed to save appearance settings",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "Appearance settings saved successfully"
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

  const saveBrowserPrintSettings = async () => {
    try {
      setSavingBrowserPrint(true);
      const success = await saveBrowserPrintSettingsUtil(printSettings.browserPrintingEnabled);
      
      if (success) {
        toast({
          title: "Settings Saved",
          description: "Browser printing settings have been updated"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to save browser printing settings",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error saving browser print settings:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while saving browser print settings",
        variant: "destructive"
      });
    } finally {
      setSavingBrowserPrint(false);
    }
  };

  const savePrintSettings = async () => {
    try {
      setLoading(true);
      
      const { data: existingData, error: checkError } = await supabase
        .from('settings')
        .select('id')
        .eq('key', 'print_settings')
        .maybeSingle();
        
      if (checkError) {
        console.error('Error checking print settings:', checkError);
        toast({
          title: "Error",
          description: "Failed to check if settings exist",
          variant: "destructive"
        });
        return;
      }
      
      let saveError;
      
      const settingsValue = {
        enabled: printSettings.enabled,
        apiKey: printSettings.apiKey,
        printers: printSettings.printers
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
            key: 'print_settings',
            value: settingsValue,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
        saveError = error;
      }

      if (saveError) {
        console.error('Error saving print settings:', saveError);
        toast({
          title: "Error",
          description: "Failed to save print settings",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "Print settings saved successfully"
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
      
      const soundUrl = await uploadFile(file, 'menu-images');
      
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
        
        const audio = new Audio(soundUrl);
        audio.volume = notificationSettings.volume;
        audio.play().catch(error => {
          console.error('Error playing test sound:', error);
        });
      } else {
        toast({
          title: "Upload failed",
          description: "Failed to upload notification sound",
          variant: "destructive"
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

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) {
        return;
      }
      
      const file = e.target.files[0];
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file",
          description: "Please upload an image file (JPG, PNG, etc.)",
          variant: "destructive"
        });
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Image file must be less than 5MB",
          variant: "destructive"
        });
        return;
      }
      
      setUploadingLogo(true);
      
      const logoUrl = await uploadFile(file, 'menu-images');
      
      if (logoUrl) {
        setAppearanceSettings(prev => ({
          ...prev,
          logo: logoUrl
        }));
        
        toast({
          title: "Logo uploaded",
          description: "Logo uploaded successfully"
        });
      } else {
        toast({
          title: "Upload failed",
          description: "Failed to upload logo",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload logo",
        variant: "destructive"
      });
    } finally {
      setUploadingLogo(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleSlideImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) {
        return;
      }
      
      const file = e.target.files[0];
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file",
          description: "Please upload an image file (JPG, PNG, etc.)",
          variant: "destructive"
        });
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Image file must be less than 5MB",
          variant: "destructive"
        });
        return;
      }
      
      setUploadingImage(true);
      
      const imageUrl = await uploadFile(file, 'menu-images');
      
      if (imageUrl) {
        setAppearanceSettings(prev => ({
          ...prev,
          slideshowImages: [...prev.slideshowImages, imageUrl]
        }));
        
        toast({
          title: "Image uploaded",
          description: "Slideshow image uploaded successfully"
        });
      } else {
        toast({
          title: "Upload failed",
          description: "Failed to upload slideshow image",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error uploading slideshow image:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload slideshow image",
        variant: "destructive"
      });
    } finally {
      setUploadingImage(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleRemoveSlideImage = (index: number) => {
    setAppearanceSettings(prev => ({
      ...prev,
      slideshowImages: prev.slideshowImages.filter((_, i) => i !== index)
    }));
  };

  const handleTestSound = () => {
    if (!notificationSettings.soundUrl) {
      toast({
        title: "No sound selected",
        description: "Please upload a notification sound first",
        variant: "destructive"
      });
      return;
    }
    
    setTestingSound(true);
    
    try {
      const audio = new Audio(notificationSettings.soundUrl);
      audio.volume = notificationSettings.volume;
      audio.play().catch(error => {
        console.error('Error playing test sound:', error);
        toast({
          title: "Playback failed",
          description: "Failed to play notification sound",
          variant: "destructive"
        });
      }).finally(() => {
        setTestingSound(false);
      });
    } catch (error) {
      console.error('Error setting up audio:', error);
      setTestingSound(false);
      toast({
        title: "Playback failed",
        description: "Failed to play notification sound",
        variant: "destructive"
      });
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    try {
      const success = await testPrintNodeConnection(printSettings.apiKey);
      
      if (success) {
        toast({
          title: "Connection successful",
          description: "PrintNode API connection test passed"
        });
      } else {
        toast({
          title: "Connection failed",
          description: "PrintNode API connection test failed",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error testing PrintNode connection:', error);
      toast({
        title: "Test failed",
        description: "Failed to test PrintNode connection",
        variant: "destructive"
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleFetchPrinters = async () => {
    setFetchingPrinters(true);
    try {
      const printers = await fetchPrintNodePrinters(printSettings.apiKey);
      setAvailablePrinters(printers);
      
      if (printers.length === 0) {
        toast({
          title: "No printers found",
          description: "No printers were found with your PrintNode account"
        });
      } else {
        toast({
          title: "Printers fetched",
          description: `Found ${printers.length} printer${printers.length === 1 ? '' : 's'}`
        });
      }
    } catch (error) {
      console.error('Error fetching PrintNode printers:', error);
      toast({
        title: "Fetch failed",
        description: "Failed to fetch PrintNode printers",
        variant: "destructive"
      });
    } finally {
      setFetchingPrinters(false);
    }
  };

  const handleTogglePrinter = (printerId: string, printerName: string) => {
    setPrintSettings(prev => {
      const existingPrinterIndex = prev.printers.findIndex(p => p.id === printerId);
      
      if (existingPrinterIndex >= 0) {
        return {
          ...prev,
          printers: prev.printers.filter((_, index) => index !== existingPrinterIndex)
        };
      } else {
        if (prev.printers.length < 2) {
          return {
            ...prev,
            printers: [...prev.printers, { id: printerId, name: printerName }]
          };
        } else {
          toast({
            title: "Printer limit reached",
            description: "You can select a maximum of 2 printers"
          });
          return prev;
        }
      }
    });
  };

  const handleTestPrinter = async (printerId: string) => {
    setTestingPrinter(true);
    try {
      const success = await sendTestPrint(printSettings.apiKey, printerId);
      
      if (success) {
        toast({
          title: "Test print sent",
          description: "Test print job was sent successfully"
        });
      } else {
        toast({
          title: "Print failed",
          description: "Failed to send test print job",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error sending test print:', error);
      toast({
        title: "Print failed",
        description: "Failed to send test print job",
        variant: "destructive"
      });
    } finally {
      setTestingPrinter(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Settings</h1>
          <Button
            variant="outline"
            onClick={handleClearCache}
            disabled={clearingCache}
          >
            {clearingCache ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Clearing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Clear App Cache
              </>
            )}
          </Button>
        </div>

        <Tabs defaultValue="restaurant">
          <TabsList className="mb-6">
            <TabsTrigger value="restaurant">Restaurant Info</TabsTrigger>
            <TabsTrigger value="hours">Business Hours</TabsTrigger>
            <TabsTrigger value="ordering">Ordering</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="printing">Printing</TabsTrigger>
          </TabsList>

          <TabsContent value="restaurant">
            <Card>
              <CardHeader>
                <CardTitle>Restaurant Information</CardTitle>
                <CardDescription>
                  Edit your restaurant's basic information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="restaurant-name">Restaurant Name</Label>
                      <Input
                        id="restaurant-name"
                        placeholder="Restaurant Name"
                        value={restaurantInfo.name}
                        onChange={handleInfoChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="restaurant-phone">Phone Number</Label>
                      <Input
                        id="restaurant-phone"
                        placeholder="Phone Number"
                        value={restaurantInfo.phone}
                        onChange={handleInfoChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="restaurant-address">Address</Label>
                      <Input
                        id="restaurant-address"
                        placeholder="Restaurant Address"
                        value={restaurantInfo.address}
                        onChange={handleInfoChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="restaurant-description">Description</Label>
                      <Textarea
                        id="restaurant-description"
                        placeholder="A brief description of your restaurant"
                        value={restaurantInfo.description}
                        onChange={handleInfoChange}
                        rows={4}
                      />
                    </div>
                  </div>
                  
                  <Button 
                    onClick={saveRestaurantInfo} 
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Information
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="hours">
            <Card>
              <CardHeader>
                <CardTitle>Business Hours</CardTitle>
                <CardDescription>
                  Set your restaurant's operating hours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {businessHours.map((day) => (
                    <div key={day.day_of_week} className="grid grid-cols-3 gap-4 items-center">
                      <div className="font-medium">{day.day_of_week}</div>
                      <div>
                        <Input 
                          type="time" 
                          value={day.open_time}
                          onChange={(e) => handleHoursChange(day.day_of_week, 'open_time', e.target.value)}
                        />
                      </div>
                      <div>
                        <Input 
                          type="time" 
                          value={day.close_time}
                          onChange={(e) => handleHoursChange(day.day_of_week, 'close_time', e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                  
                  <Button 
                    onClick={saveBusinessHours} 
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Business Hours
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="ordering">
            <Card>
              <CardHeader>
                <CardTitle>Ordering Settings</CardTitle>
                <CardDescription>
                  Configure how customers place orders
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="table-required" 
                      checked={orderingSettings.requireTableSelection}
                      onCheckedChange={(checked) => handleOrderingSettingChange('requireTableSelection', checked)}
                    />
                    <Label htmlFor="table-required">Require table selection for eat-in orders</Label>
                  </div>
                  
                  <Button 
                    onClick={saveOrderingSettings} 
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Ordering Settings
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>
                  Configure sounds and alerts for new orders
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="sound-enabled" 
                      checked={notificationSettings.soundEnabled}
                      onCheckedChange={(checked) => handleNotificationSettingChange('soundEnabled', checked)}
                    />
                    <Label htmlFor="sound-enabled">Play sound on new order</Label>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Notification Sound</Label>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 p-2 border rounded bg-secondary/20 text-sm overflow-hidden overflow-ellipsis whitespace-nowrap">
                        {notificationSettings.soundName || 'Default notification sound'}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleTestSound}
                        disabled={testingSound || !notificationSettings.soundEnabled}
                      >
                        <Volume2 className="h-4 w-4" />
                      </Button>
                      <div className="relative">
                        <input
                          type="file"
                          accept="audio/*"
                          onChange={handleSoundUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          disabled={uploadingSound}
                        />
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled={uploadingSound}
                        >
                          {uploadingSound ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="volume">Volume</Label>
                      <span className="text-sm text-muted-foreground">{Math.round(notificationSettings.volume * 100)}%</span>
                    </div>
                    <input
                      id="volume"
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={notificationSettings.volume}
                      onChange={(e) => handleNotificationSettingChange('volume', parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  
                  <Button 
                    onClick={saveNotificationSettings} 
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Notification Settings
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Appearance Settings</CardTitle>
                <CardDescription>
                  Customize your restaurant's visual appearance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Restaurant Logo</Label>
                    <div className="flex flex-col space-y-2">
                      {appearanceSettings.logo && (
                        <div className="border rounded overflow-hidden w-48 h-48 flex items-center justify-center bg-white">
                          <img 
                            src={appearanceSettings.logo} 
                            alt="Restaurant logo"
                            className="max-w-full max-h-full object-contain" 
                          />
                        </div>
                      )}
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          disabled={uploadingLogo}
                        />
                        <Button 
                          variant="outline"
                          disabled={uploadingLogo}
                        >
                          {uploadingLogo ? (
                            <>
                              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Image className="mr-2 h-4 w-4" />
                              {appearanceSettings.logo ? 'Change Logo' : 'Upload Logo'}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Slideshow Images</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {appearanceSettings.slideshowImages.map((image, index) => (
                        <div key={index} className="relative group">
                          <div className="border rounded overflow-hidden aspect-video bg-white">
                            <img 
                              src={image} 
                              alt={`Slideshow image ${index + 1}`}
                              className="w-full h-full object-cover" 
                            />
                          </div>
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleRemoveSlideImage(index)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                          </Button>
                        </div>
                      ))}
                      <div className="border rounded border-dashed flex items-center justify-center aspect-video bg-muted/50">
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleSlideImageUpload}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            disabled={uploadingImage}
                          />
                          <Button 
                            variant="ghost"
                            disabled={uploadingImage}
                          >
                            {uploadingImage ? (
                              <RefreshCw className="h-5 w-5 animate-spin" />
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                                <path d="M12 5v14"></path>
                                <path d="M5 12h14"></path>
                              </svg>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={saveAppearanceSettings} 
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Appearance Settings
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="printing">
            <Card>
              <CardHeader>
                <CardTitle>Printing Settings</CardTitle>
                <CardDescription>
                  Configure receipt printing options
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Browser Printing</h3>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="browser-printing" 
                          checked={printSettings.browserPrintingEnabled}
                          onCheckedChange={(checked) => handlePrintSettingChange('browserPrintingEnabled', checked)}
                        />
                        <Label htmlFor="browser-printing">Enable browser-based printing</Label>
                      </div>
                      
                      <div>
                        <Button 
                          onClick={saveBrowserPrintSettings} 
                          disabled={savingBrowserPrint}
                          variant="outline"
                          size="sm"
                        >
                          {savingBrowserPrint ? (
                            <>
                              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Save Browser Print Settings
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Thermal Printer Configuration</h3>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="printnode-enabled" 
                          checked={printSettings.enabled}
                          onCheckedChange={(checked) => handlePrintSettingChange('enabled', checked)}
                        />
                        <Label htmlFor="printnode-enabled">Enable PrintNode integration</Label>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="printnode-api-key">PrintNode API Key</Label>
                        <Input 
                          id="printnode-api-key"
                          type="password"
                          value={printSettings.apiKey}
                          onChange={(e) => handlePrintSettingChange('apiKey', e.target.value)}
                          placeholder="Enter your PrintNode API key"
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button 
                          onClick={handleTestConnection} 
                          disabled={testingConnection || !printSettings.apiKey}
                          variant="outline"
                          size="sm"
                        >
                          {testingConnection ? (
                            <>
                              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                              Testing...
                            </>
                          ) : (
                            <>Test Connection</>
                          )}
                        </Button>
                        <Button 
                          onClick={handleFetchPrinters} 
                          disabled={fetchingPrinters || !printSettings.apiKey}
                          variant="outline"
                          size="sm"
                        >
                          {fetchingPrinters ? (
                            <>
                              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                              Fetching...
                            </>
                          ) : (
                            <>Fetch Printers</>
                          )}
                        </Button>
                      </div>
                      
                      {availablePrinters.length > 0 && (
                        <div className="space-y-2">
                          <Label>Available Printers (select up to 2)</Label>
                          <Alert>
                            <AlertDescription>
                              Select up to 2 printers to use for receipt printing. Print jobs will be sent to all selected printers.
                            </AlertDescription>
                          </Alert>
                          <div className="space-y-2 mt-4">
                            {availablePrinters.map(printer => (
                              <div key={printer.id} className="flex items-center justify-between border p-3 rounded-md">
                                <div className="flex items-center space-x-2">
                                  <Checkbox 
                                    id={`printer-${printer.id}`}
                                    checked={!!printSettings.printers.find(p => p.id === printer.id.toString())}
                                    onCheckedChange={() => handleTogglePrinter(printer.id.toString(), printer.name)}
                                    disabled={!printSettings.printers.find(p => p.id === printer.id.toString()) && printSettings.printers.length >= 2}
                                  />
                                  <Label htmlFor={`printer-${printer.id}`} className="flex-1">
                                    <div>{printer.name}</div>
                                    <div className="text-xs text-muted-foreground">{printer.description}</div>
                                    {printer.state && (
                                      <div className={`text-xs ${printer.state === 'online' ? 'text-green-600' : 'text-amber-600'}`}>
                                        {printer.state === 'online' ? 'Online' : 'Offline'}
                                      </div>
                                    )}
                                  </Label>
                                </div>
                                <Button 
                                  onClick={() => handleTestPrinter(printer.id.toString())} 
                                  disabled={testingPrinter || !printSettings.apiKey || printer.state === 'offline'}
                                  variant="outline"
                                  size="sm"
                                >
                                  {testingPrinter ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Printer className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <Button 
                        onClick={savePrintSettings} 
                        disabled={loading}
                        className="w-full"
                      >
                        {loading ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save PrintNode Settings
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
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
