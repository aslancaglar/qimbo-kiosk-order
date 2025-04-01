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
  sendToPrintNode 
} from '@/utils/printNode';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';

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
  printerIds: string[];
  printerNames?: Record<string, string>;
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
  const [selectedTestPrinter, setSelectedTestPrinter] = useState<string>('');

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
    printerIds: [],
    printerNames: {}
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
        let printerIds: string[] = [];
        let printerNames: Record<string, string> = {};
        
        if (settings.printerIds && Array.isArray(settings.printerIds)) {
          printerIds = settings.printerIds;
        } else if (settings.printerId) {
          printerIds = [settings.printerId];
        }
        
        if (settings.printerNames && typeof settings.printerNames === 'object') {
          printerNames = settings.printerNames;
        } else if (settings.printerName && settings.printerId) {
          printerNames = { [settings.printerId]: settings.printerName };
        }
        
        const newSettings = {
          enabled: settings.enabled !== undefined ? !!settings.enabled : false,
          apiKey: settings.apiKey || '',
          printerIds: printerIds,
          printerNames: printerNames
        };
        
        setPrintSettings(newSettings);
        
        if (newSettings.apiKey && !initialPrinterLoad) {
          setInitialPrinterLoad(true);
          
          setTimeout(async () => {
            try {
              setFetchingPrinters(true);
              const printers = await fetchPrintNodePrinters(newSettings.apiKey);
              setAvailablePrinters(printers);
              
              if (printers.length === 0 && newSettings.printerIds.length > 0) {
                console.log('No printers found but printerIds exist in settings, trying again...');
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
      
      let printerNames: Record<string, string> = {};
      
      printSettings.printerIds.forEach(printerId => {
        const printer = availablePrinters.find(p => p.id.toString() === printerId);
        if (printer) {
          printerNames[printerId] = printer.name;
        }
      });
      
      let saveError;
      
      const settingsValue = {
        enabled: printSettings.enabled,
        apiKey: printSettings.apiKey,
        printerIds: printSettings.printerIds,
        printerNames: printerNames
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
    
    toast({
      title: "Image removed",
      description: "Slideshow image removed successfully"
    });
  };
  
  const handleTestPrintNodeConnection = async () => {
    try {
      setTestingConnection(true);
      
      if (!printSettings.apiKey) {
        toast({
          title: "API key required",
          description: "Please enter a PrintNode API key",
          variant: "destructive"
        });
        return;
      }
      
      const success = await testPrintNodeConnection(printSettings.apiKey);
      
      if (success) {
        toast({
          title: "Connection successful",
          description: "Successfully connected to PrintNode API"
        });
        
        await handleFetchPrinters();
      } else {
        toast({
          title: "Connection failed",
          description: "Failed to connect to PrintNode API. Please check your API key.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error testing PrintNode connection:', error);
      toast({
        title: "Connection error",
        description: "An error occurred while testing PrintNode connection",
        variant: "destructive"
      });
    } finally {
      setTestingConnection(false);
    }
  };
  
  const handleFetchPrinters = async () => {
    try {
      setFetchingPrinters(true);
      
      if (!printSettings.apiKey) {
        toast({
          title: "API key required",
          description: "Please enter a PrintNode API key",
          variant: "destructive"
        });
        return;
      }
      
      const printers = await fetchPrintNodePrinters(printSettings.apiKey);
      setAvailablePrinters(printers);
      
      if (printers.length === 0) {
        toast({
          title: "No printers found",
          description: "No printers were found in your PrintNode account",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Printers fetched",
          description: `Found ${printers.length} printer(s) in your PrintNode account`
        });
      }
    } catch (error) {
      console.error('Error fetching printers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch printers from PrintNode",
        variant: "destructive"
      });
    } finally {
      setFetchingPrinters(false);
    }
  };
  
  const handleTestPrint = async () => {
    try {
      setTestingPrinter(true);
      
      if (!printSettings.apiKey) {
        toast({
          title: "API key required",
          description: "Please enter a PrintNode API key",
          variant: "destructive"
        });
        return;
      }
      
      if (!selectedTestPrinter) {
        toast({
          title: "Printer required",
          description: "Please select a printer for test printing",
          variant: "destructive"
        });
        return;
      }
      
      const testContent = `
        <html>
        <body>
          <h1>Test Receipt</h1>
          <p>This is a test receipt from your restaurant ordering system.</p>
          <p>Date: ${new Date().toLocaleString()}</p>
          <p>If you can read this, printing is working correctly!</p>
        </body>
        </html>
      `;
      
      const success = await sendToPrintNode(
        printSettings.apiKey,
        selectedTestPrinter,
        testContent,
        'Test Print'
      );
      
      if (success) {
        toast({
          title: "Test print sent",
          description: "Test receipt has been sent to the printer"
        });
      } else {
        toast({
          title: "Print failed",
          description: "Failed to send test receipt to printer",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error sending test print:', error);
      toast({
        title: "Print error",
        description: "An error occurred while sending test print",
        variant: "destructive"
      });
    } finally {
      setTestingPrinter(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Settings2 className="size-6" />
          Settings
        </h1>
        
        <Tabs defaultValue="restaurant" className="w-full">
          <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 mb-4">
            <TabsTrigger value="restaurant">Restaurant</TabsTrigger>
            <TabsTrigger value="hours">Hours</TabsTrigger>
            <TabsTrigger value="ordering">Ordering</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="printing">Printing</TabsTrigger>
          </TabsList>
          
          <TabsContent value="restaurant">
            <Card>
              <CardHeader>
                <CardTitle>Restaurant Information</CardTitle>
                <CardDescription>
                  Update your restaurant information and contact details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); saveRestaurantInfo(); }}>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="restaurant-name">Restaurant Name</Label>
                      <Input 
                        id="restaurant-name" 
                        value={restaurantInfo.name} 
                        onChange={handleInfoChange}
                        placeholder="Enter restaurant name" 
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="restaurant-phone">Phone Number</Label>
                      <Input 
                        id="restaurant-phone" 
                        value={restaurantInfo.phone} 
                        onChange={handleInfoChange}
                        placeholder="Enter phone number" 
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="restaurant-address">Address</Label>
                      <Input 
                        id="restaurant-address" 
                        value={restaurantInfo.address} 
                        onChange={handleInfoChange}
                        placeholder="Enter restaurant address" 
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="restaurant-description">Description</Label>
                      <Textarea 
                        id="restaurant-description" 
                        value={restaurantInfo.description} 
                        onChange={handleInfoChange}
                        placeholder="Enter restaurant description" 
                      />
                    </div>
                  </div>
                  
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                    ) : (
                      <><Save className="mr-2 h-4 w-4" /> Save Information</>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
            
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>System</CardTitle>
                <CardDescription>
                  System maintenance and cache settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  <Alert>
                    <AlertDescription>
                      Clearing the application cache can help resolve issues with outdated data or display problems.
                    </AlertDescription>
                  </Alert>
                  
                  <Button 
                    variant="outline" 
                    onClick={handleClearCache} 
                    disabled={clearingCache}
                  >
                    {clearingCache ? (
                      <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Clearing Cache...</>
                    ) : (
                      <><RefreshCw className="mr-2 h-4 w-4" /> Clear Application Cache</>
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
                  Set your restaurant's opening and closing hours for each day
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); saveBusinessHours(); }}>
                  <div className="grid gap-4">
                    {businessHours.map((day) => (
                      <div key={day.day_of_week} className="grid grid-cols-3 gap-4 items-center">
                        <div className="font-medium">{day.day_of_week}</div>
                        <div className="grid gap-2">
                          <Label htmlFor={`open-${day.day_of_week}`}>Open</Label>
                          <Input 
                            id={`open-${day.day_of_week}`} 
                            type="time" 
                            value={day.open_time} 
                            onChange={(e) => handleHoursChange(day.day_of_week, 'open_time', e.target.value)}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor={`close-${day.day_of_week}`}>Close</Label>
                          <Input 
                            id={`close-${day.day_of_week}`} 
                            type="time" 
                            value={day.close_time} 
                            onChange={(e) => handleHoursChange(day.day_of_week, 'close_time', e.target.value)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                    ) : (
                      <><Save className="mr-2 h-4 w-4" /> Save Hours</>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="ordering">
            <Card>
              <CardHeader>
                <CardTitle>Ordering Settings</CardTitle>
                <CardDescription>
                  Configure how customers place orders in your restaurant
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); saveOrderingSettings(); }}>
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="require-table" 
                      checked={orderingSettings.requireTableSelection}
                      onCheckedChange={(checked) => handleOrderingSettingChange('requireTableSelection', checked)} 
                    />
                    <Label htmlFor="require-table">Require table selection for orders</Label>
                  </div>
                  
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                    ) : (
                      <><Save className="mr-2 h-4 w-4" /> Save Settings</>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>
                  Configure notification sounds and alerts for new orders
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); saveNotificationSettings(); }}>
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="sound-enabled" 
                      checked={notificationSettings.soundEnabled}
                      onCheckedChange={(checked) => handleNotificationSettingChange('soundEnabled', checked)} 
                    />
                    <Label htmlFor="sound-enabled">Enable notification sounds</Label>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label>Notification Sound</Label>
                    <div className="flex items-center gap-2">
                      <div className="text-sm text-muted-foreground">
                        {notificationSettings.soundName || 'Default sound'}
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const audio = new Audio(notificationSettings.soundUrl);
                          audio.volume = notificationSettings.volume;
                          audio.play().catch(error => {
                            console.error('Error playing test sound:', error);
                          });
                        }}
                        disabled={testingSound}
                      >
                        <Volume2 className="mr-2 h-4 w-4" />
                        Test Sound
                      </Button>
                    </div>
                    
                    <div className="grid gap-2 mt-2">
                      <Label htmlFor="sound-upload">Upload New Sound</Label>
                      <div className="flex items-center gap-2">
                        <Input 
                          id="sound-upload" 
                          type="file" 
                          accept="audio/*"
                          onChange={handleSoundUpload}
                          disabled={uploadingSound}
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={uploadingSound}
                        >
                          {uploadingSound ? (
                            <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Uploading...</>
                          ) : (
                            <><Upload className="h-4 w-4" /></>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="volume">Volume</Label>
                    <Input 
                      id="volume" 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.1"
                      value={notificationSettings.volume}
                      onChange={(e) => handleNotificationSettingChange('volume', parseFloat(e.target.value))}
                    />
                    <div className="text-right text-sm text-muted-foreground">
                      {Math.round(notificationSettings.volume * 100)}%
                    </div>
                  </div>
                  
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                    ) : (
                      <><Save className="mr-2 h-4 w-4" /> Save Settings</>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Appearance Settings</CardTitle>
                <CardDescription>
                  Customize the look and feel of your restaurant ordering system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); saveAppearanceSettings(); }}>
                  <div className="grid gap-2">
                    <Label>Restaurant Logo</Label>
                    {appearanceSettings.logo ? (
                      <div className="relative w-64 h-64">
                        <img 
                          src={appearanceSettings.logo} 
                          alt="Restaurant Logo" 
                          className="object-contain w-full h-full border rounded"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center w-64 h-64 border rounded bg-muted">
                        <p className="text-sm text-muted-foreground">No logo uploaded</p>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 mt-2">
                      <Input 
                        id="logo-upload" 
                        type="file" 
                        accept="image/*"
                        onChange={handleLogoUpload}
                        disabled={uploadingLogo}
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={uploadingLogo}
                      >
                        {uploadingLogo ? (
                          <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Uploading...</>
                        ) : (
                          <><Upload className="h-4 w-4" /></>
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label>Slideshow Images</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {appearanceSettings.slideshowImages.map((image, index) => (
                        <div key={index} className="relative aspect-video">
                          <img 
                            src={image} 
                            alt={`Slideshow Image ${index + 1}`} 
                            className="object-cover w-full h-full rounded"
                          />
                          <Button
                            type="button"
                            size="icon"
                            variant="destructive"
                            className="absolute top-2 right-2 h-6 w-6"
                            onClick={() => handleRemoveSlideImage(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      
                      <div className="flex flex-col items-center justify-center aspect-video border rounded bg-muted">
                        <div className="flex items-center gap-2">
                          <label 
                            htmlFor="image-upload" 
                            className="cursor-pointer flex flex-col items-center justify-center p-4"
                          >
                            <Images className="h-8 w-8 text-muted-foreground mb-2" />
                            <span className="text-sm text-muted-foreground">Add Image</span>
                            <Input 
                              id="image-upload" 
                              type="file" 
                              accept="image/*"
                              onChange={handleSlideImageUpload}
                              disabled={uploadingImage}
                              className="hidden"
                            />
                          </label>
                        </div>
                        {uploadingImage && <RefreshCw className="h-4 w-4 animate-spin mt-2" />}
                      </div>
                    </div>
                  </div>
                  
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                    ) : (
                      <><Save className="mr-2 h-4 w-4" /> Save Settings</>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="printing">
            <Card>
              <CardHeader>
                <CardTitle>Thermal Printer Configuration</CardTitle>
                <CardDescription>
                  Configure your PrintNode integration for receipt printing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); savePrintSettings(); }}>
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="print-enabled" 
                      checked={printSettings.enabled}
                      onCheckedChange={(checked) => handlePrintSettingChange('enabled', checked)} 
                    />
                    <Label htmlFor="print-enabled">Enable receipt printing</Label>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="print-api-key">PrintNode API Key</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        id="print-api-key" 
                        value={printSettings.apiKey} 
                        onChange={(e) => handlePrintSettingChange('apiKey', e.target.value)}
                        placeholder="Enter PrintNode API key" 
                        type="password"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleTestPrintNodeConnection}
                        disabled={testingConnection || !printSettings.apiKey}
                      >
                        {testingConnection ? (
                          <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Testing...</>
                        ) : (
                          <>Test Connection</>
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="printers">Available Printers</Label>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleFetchPrinters}
                        disabled={fetchingPrinters || !printSettings.apiKey}
                      >
                        {fetchingPrinters ? (
                          <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Fetching...</>
                        ) : (
                          <><RefreshCw className="mr-2 h-4 w-4" /> Refresh Printers</>
                        )}
                      </Button>
                    </div>
                    
                    {availablePrinters.length > 0 ? (
                      <>
                        <div className="grid gap-4">
                          <div>
                            <Label htmlFor="selected-printers" className="mb-2 block">Selected Printers for Order Receipts</Label>
                            <MultiSelect
                              options={availablePrinters.map(printer => ({
                                label: printer.name,
                                value: printer.id.toString()
                              }))}
                              selected={printSettings.printerIds}
                              onChange={(selected) => handlePrintSettingChange('printerIds', selected)}
                              placeholder="Select printers for order receipts"
                              disabled={availablePrinters.length === 0}
                            />
                            <p className="text-sm text-muted-foreground mt-1">
                              Order receipts will be sent to all selected printers
                            </p>
                          </div>
                          
                          <div>
                            <Label htmlFor="test-printer">Test Printer</Label>
                            <Select
                              value={selectedTestPrinter}
                              onValueChange={setSelectedTestPrinter}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a printer for test printing" />
                              </SelectTrigger>
                              <SelectContent>
                                {availablePrinters.map(printer => (
                                  <SelectItem key={printer.id} value={printer.id.toString()}>
                                    {printer.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            
                            <div className="flex justify-end mt-2">
                              <Button
                                type="button"
                                size="sm"
                                onClick={handleTestPrint}
                                disabled={testingPrinter || !selectedTestPrinter}
                              >
                                {testingPrinter ? (
                                  <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Printing...</>
                                ) : (
                                  <><Printer className="mr-2 h-4 w-4" /> Test Print</>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-4 border rounded">
                        <p className="text-muted-foreground">No printers available. Click "Refresh Printers" to fetch printers from PrintNode.</p>
                      </div>
                    )}
                  </div>
                  
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                    ) : (
                      <><Save className="mr-2 h-4 w-4" /> Save Settings</>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default Settings;
