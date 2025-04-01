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
  sendTestPrint,
  sendTestPrintMultiple
} from '@/utils/printNode';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, MultiSelect } from '@/components/ui/select';

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

interface PrintSettings {
  enabled: boolean;
  apiKey: string;
  printers: PrinterOption[];
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
    printers: []
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
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'print_settings')
        .maybeSingle();
        
      if (error) {
        console.error('Error fetching print settings:', error);
        toast({
          title: "Error",
          description: "Failed to load printer settings",
          variant: "destructive"
        });
        return;
      }

      if (data && data.value) {
        const settings = data.value as Record<string, any>;
        
        // Handle both old format (single printer) and new format (multiple printers)
        let printers: PrinterOption[] = [];
        
        if (settings.printers && Array.isArray(settings.printers)) {
          // New format with array of printers
          printers = settings.printers;
        } else if (settings.printerId) {
          // Old format with single printer - convert to array format
          printers = [{
            id: settings.printerId,
            name: settings.printerName || `Printer ${settings.printerId}`
          }];
        }
        
        const newSettings = {
          enabled: settings.enabled !== undefined ? !!settings.enabled : false,
          apiKey: settings.apiKey || '',
          printers: printers
        };
        
        setPrintSettings(newSettings);
        
        // If we have an API key, auto-fetch printers on initial load
        if (newSettings.apiKey && !initialPrinterLoad) {
          console.log('Auto-fetching printers on initial load');
          setInitialPrinterLoad(true);
          
          // We need to wait for the state to update
          setTimeout(async () => {
            try {
              setFetchingPrinters(true);
              const printers = await fetchPrintNodePrinters(newSettings.apiKey);
              setAvailablePrinters(printers);
              
              if (printers.length === 0 && newSettings.printers.length > 0) {
                console.log('No printers found but printer IDs exist in settings, trying again...');
                // Try once more after a short delay
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
          description: "Failed to upload image",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload image",
        variant: "destructive"
      });
    } finally {
      setUploadingImage(false);
      if (e.target) e.target.value = '';
    }
  };

  const removeSlideImage = (index: number) => {
    setAppearanceSettings(prev => ({
      ...prev,
      slideshowImages: prev.slideshowImages.filter((_, i) => i !== index)
    }));
  };

  const playTestSound = () => {
    if (!notificationSettings.soundUrl) return;
    
    setTestingSound(true);
    
    try {
      const audio = new Audio(notificationSettings
