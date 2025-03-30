
import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/context/LanguageContext';
import AdminLayout from '@/components/admin/AdminLayout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button"; // Import Button from shadcn/ui

interface RestaurantInfo {
  id: number;
  name: string;
  phone: string; // Changed from phone_number to phone to match DB schema
  address: string;
  description: string;
}

interface BusinessHours {
  monday: { open: string; close: string };
  tuesday: { open: string; close: string };
  wednesday: { open: string; close: string };
  thursday: { open: string; close: string };
  friday: { open: string; close: string };
  saturday: { open: string; close: string };
  sunday: { open: string; close: string };
}

interface OrderingSettings {
  requireTableSelection: boolean;
}

const Settings: React.FC = () => {
  const { t, language, changeLanguage } = useLanguage();
  const queryClient = useQueryClient();
  const [restaurantInfo, setRestaurantInfo] = useState<RestaurantInfo | null>(null);
  const [businessHours, setBusinessHours] = useState<BusinessHours>({
    monday: { open: '09:00', close: '17:00' },
    tuesday: { open: '09:00', close: '17:00' },
    wednesday: { open: '09:00', close: '17:00' },
    thursday: { open: '09:00', close: '17:00' },
    friday: { open: '09:00', close: '17:00' },
    saturday: { open: '10:00', close: '16:00' },
    sunday: { open: 'closed', close: 'closed' },
  });
  const [orderingSettings, setOrderingSettings] = useState<OrderingSettings>({
    requireTableSelection: true
  });
  const [isSavingRestaurantInfo, setIsSavingRestaurantInfo] = useState(false);
  const [isSavingBusinessHours, setIsSavingBusinessHours] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Fetch restaurant information
  const { isLoading: isLoadingRestaurantInfo, error: errorRestaurantInfo } = useQuery({
    queryKey: ['restaurantInfo'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurant_info')
        .select('*')
        .single();

      if (error) {
        console.error(t.errors.failedToLoadRestaurantInfo, error);
        throw new Error(t.errors.failedToLoadRestaurantInfo);
      }

      if (!data) {
        console.warn(t.errors.noRestaurantInfoFound);
        return null;
      }

      setRestaurantInfo({
        id: data.id,
        name: data.name,
        phone: data.phone, // Changed from phone_number to phone
        address: data.address,
        description: data.description,
      });

      return data;
    },
    meta: {
      onError: () => {
        toast.error(`${t.toast.failedToLoad} ${t.settings.restaurantInfo}`);
      },
    }
  });

  // Fetch business hours
  useEffect(() => {
    const fetchBusinessHours = async () => {
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('*')
          .eq('key', 'business_hours')
          .maybeSingle();

        if (error) {
          console.error('Error fetching business hours:', error);
          return;
        }

        if (data && data.value) {
          // Need to explicitly cast the JSON value to BusinessHours
          setBusinessHours(data.value as unknown as BusinessHours);
        }
      } catch (error) {
        console.error('Unexpected error fetching business hours:', error);
      }
    };

    fetchBusinessHours();
  }, [t]);

  // Fetch ordering settings
  useEffect(() => {
    const fetchOrderingSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('*')
          .eq('key', 'ordering_settings')
          .maybeSingle();

        if (error) {
          console.error('Error fetching ordering settings:', error);
          return;
        }

        if (data && data.value) {
          const settings = data.value as Record<string, any>;
          setOrderingSettings({
            requireTableSelection: settings.requireTableSelection !== undefined 
              ? !!settings.requireTableSelection 
              : true
          });
        }
      } catch (error) {
        console.error('Unexpected error fetching ordering settings:', error);
      }
    };

    fetchOrderingSettings();
  }, []);

  // Mutations for updating data
  const updateRestaurantInfoMutation = useMutation({
    mutationFn: async (updates: Partial<RestaurantInfo>) => {
      if (!restaurantInfo?.id) {
        throw new Error('Restaurant info ID is missing');
      }

      const { data, error } = await supabase
        .from('restaurant_info')
        .update({
          name: updates.name,
          phone: updates.phone,
          address: updates.address,
          description: updates.description
        })
        .eq('id', restaurantInfo.id)
        .select()
        .single();

      if (error) {
        console.error(t.toast.failedToUpdate, error);
        throw new Error(t.toast.failedToUpdate);
      }

      return data;
    },
    onSuccess: () => {
      toast.success(t.toast.restaurantInfoUpdated);
      queryClient.invalidateQueries({ queryKey: ['restaurantInfo'] });
    },
    onError: () => {
      toast.error(`${t.toast.failedToUpdate} ${t.settings.restaurantInfo}`);
    },
    onSettled: () => {
      setIsSavingRestaurantInfo(false);
    },
  });

  const updateBusinessHoursMutation = useMutation({
    mutationFn: async (newHours: BusinessHours) => {
      const { data, error } = await supabase
        .from('settings')
        .upsert({ 
          key: 'business_hours', 
          value: newHours as unknown as Record<string, any> 
        }, { onConflict: 'key' })
        .select()
        .single();

      if (error) {
        console.error('Error updating business hours:', error);
        throw new Error('Failed to update business hours');
      }

      return data;
    },
    onSuccess: () => {
      toast.success(t.toast.businessHoursUpdated);
      queryClient.invalidateQueries({ queryKey: ['businessHours'] });
    },
    onError: () => {
      toast.error(`${t.toast.failedToUpdate} ${t.settings.businessHours}`);
    },
    onSettled: () => {
      setIsSavingBusinessHours(false);
    },
  });

  const updateOrderingSettingsMutation = useMutation({
    mutationFn: async (newSettings: OrderingSettings) => {
      const { data, error } = await supabase
        .from('settings')
        .upsert({ 
          key: 'ordering_settings', 
          value: newSettings as unknown as Record<string, any> 
        }, { onConflict: 'key' })
        .select()
        .single();

      if (error) {
        console.error('Error updating ordering settings:', error);
        throw new Error('Failed to update ordering settings');
      }

      return data;
    },
    onSuccess: () => {
      toast.success(t.toast.settingsSaved);
      queryClient.invalidateQueries({ queryKey: ['orderingSettings'] });
    },
    onError: () => {
      toast.error(`${t.toast.failedToUpdate} ${t.settings.orderingOptions}`);
    },
    onSettled: () => {
      setIsSavingSettings(false);
    },
  });

  // Handlers for saving data
  const handleRestaurantInfoSave = async () => {
    setIsSavingRestaurantInfo(true);
    if (restaurantInfo) {
      updateRestaurantInfoMutation.mutate(restaurantInfo);
    }
  };

  const handleBusinessHoursSave = async () => {
    setIsSavingBusinessHours(true);
    updateBusinessHoursMutation.mutate(businessHours);
  };

  const handleOrderingSettingsSave = async () => {
    setIsSavingSettings(true);
    updateOrderingSettingsMutation.mutate(orderingSettings);
  };

  const handleLanguageChange = (newLanguage: string) => {
    changeLanguage(newLanguage);
    // Save to localStorage as well to ensure persistence
    localStorage.setItem('language', newLanguage);
    console.log('Language changed to:', newLanguage);
  };

  return (
    <AdminLayout>
      <div className="grid gap-6">
        {/* Restaurant Information */}
        <div className="grid gap-2">
          <h3>{t.settings.restaurantInfo}</h3>
          <p className="text-sm text-muted-foreground">{t.settings.restaurantInfoDesc}</p>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="restaurantName" className="text-right">
                {t.settings.restaurantName}
              </Label>
              <Input
                type="text"
                id="restaurantName"
                value={restaurantInfo?.name || ''}
                onChange={(e) =>
                  setRestaurantInfo({ ...restaurantInfo, name: e.target.value } as RestaurantInfo)
                }
                className="col-span-2"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="phoneNumber" className="text-right">
                {t.settings.phoneNumber}
              </Label>
              <Input
                type="tel"
                id="phoneNumber"
                value={restaurantInfo?.phone || ''}
                onChange={(e) =>
                  setRestaurantInfo({ ...restaurantInfo, phone: e.target.value } as RestaurantInfo)
                }
                className="col-span-2"
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="address" className="text-right">
                {t.settings.address}
              </Label>
              <Input
                type="text"
                id="address"
                value={restaurantInfo?.address || ''}
                onChange={(e) =>
                  setRestaurantInfo({ ...restaurantInfo, address: e.target.value } as RestaurantInfo)
                }
                className="col-span-2"
              />
            </div>
             <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                {t.settings.description}
              </Label>
              <Textarea
                id="description"
                value={restaurantInfo?.description || ''}
                onChange={(e) =>
                  setRestaurantInfo({ ...restaurantInfo, description: e.target.value } as RestaurantInfo)
                }
                className="col-span-2"
              />
            </div>
            <div>
              <Button onClick={handleRestaurantInfoSave} disabled={isSavingRestaurantInfo || isLoadingRestaurantInfo}>
                {isSavingRestaurantInfo ? t.settings.saving : t.settings.saveChanges}
              </Button>
            </div>
          </div>
        </div>

        {/* Business Hours */}
        <div className="grid gap-2">
          <h3>{t.settings.businessHours}</h3>
          <p className="text-sm text-muted-foreground">{t.settings.businessHoursDesc}</p>
          <div className="grid gap-4 py-4">
            {Object.entries(businessHours).map(([day, hours]) => (
              <div key={day} className="grid grid-cols-3 items-center gap-4">
                <Label htmlFor={`${day}Open`} className="text-right capitalize">
                  {day}
                </Label>
                <div className="col-span-2 flex gap-2">
                  <Input
                    type="time"
                    id={`${day}Open`}
                    value={hours.open}
                    onChange={(e) =>
                      setBusinessHours({
                        ...businessHours,
                        [day]: { ...hours, open: e.target.value },
                      })
                    }
                  />
                  <Input
                    type="time"
                    id={`${day}Close`}
                    value={hours.close === 'closed' ? '00:00' : hours.close}
                    onChange={(e) =>
                      setBusinessHours({
                        ...businessHours,
                        [day]: { ...hours, close: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
            ))}
            <div>
              <Button onClick={handleBusinessHoursSave} disabled={isSavingBusinessHours}>
                {isSavingBusinessHours ? t.settings.saving : t.settings.saveHours}
              </Button>
            </div>
          </div>
        </div>

        {/* Ordering Options */}
        <div className="grid gap-2">
          <h3>{t.settings.orderingOptions}</h3>
          <p className="text-sm text-muted-foreground">{t.settings.orderingOptionsDesc}</p>
          <div className="grid gap-4 py-4">
            <div className="flex items-center justify-between rounded-md border p-4">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">{t.settings.requireTableSelection}</p>
                <p className="text-sm text-muted-foreground">
                  {t.settings.requireTableSelectionDesc}
                </p>
              </div>
              <Switch
                id="requireTableSelection"
                checked={orderingSettings.requireTableSelection}
                onCheckedChange={(checked) =>
                  setOrderingSettings({ ...orderingSettings, requireTableSelection: checked })
                }
              />
            </div>
            <div>
              <Button onClick={handleOrderingSettingsSave} disabled={isSavingSettings}>
                {isSavingSettings ? t.settings.saving : t.settings.saveSettings}
              </Button>
            </div>
          </div>
        </div>

        {/* Appearance Settings */}
        <div className="grid gap-2">
          <h3>{t.settings.appearanceSettings}</h3>
          <p className="text-sm text-muted-foreground">{t.settings.appearanceSettingsDesc}</p>
          <div className="grid gap-4 py-4">
            <p>{t.settings.comingSoon}</p>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="grid gap-2">
          <h3>{t.settings.notificationSettings}</h3>
          <p className="text-sm text-muted-foreground">{t.settings.notificationSettingsDesc}</p>
          <div className="grid gap-4 py-4">
            <p>{t.settings.notificationsComingSoon}</p>
          </div>
        </div>

        {/* Language Settings */}
        <div className="grid gap-2">
          <h3>{t.settings.languageSettings}</h3>
          <p className="text-sm text-muted-foreground">{t.settings.languageSettingsDesc}</p>
          <div className="grid gap-4 py-4">
            <div className="language-selector">
              <select 
                value={language} 
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="select-language"
              >
                <option value="en">{t.settings.english}</option>
                <option value="fr">{t.settings.french}</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Settings;
