
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Bell, Upload, Play, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "../../../integrations/supabase/client";

type NotificationSound = {
  enabled: boolean;
  volume: number;
  customSound: boolean;
  soundUrl: string;
};

const DEFAULT_SOUND = "/notification.mp3";

export const NotificationSoundSettings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<NotificationSound>({
    enabled: true,
    volume: 80,
    customSound: false,
    soundUrl: DEFAULT_SOUND
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchNotificationSettings();
  }, []);

  const fetchNotificationSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'notification_sound_settings')
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

      if (data?.value) {
        setSettings(data.value as NotificationSound);
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

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      
      const { data: existingData, error: checkError } = await supabase
        .from('settings')
        .select('id')
        .eq('key', 'notification_sound_settings')
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
      
      if (existingData) {
        const { error } = await supabase
          .from('settings')
          .update({
            value: settings,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingData.id);
          
        saveError = error;
      } else {
        const { error } = await supabase
          .from('settings')
          .insert({
            key: 'notification_sound_settings',
            value: settings,
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
      setSaving(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      toast({
        title: "Invalid file",
        description: "Please upload an audio file",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploadingFile(true);

      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `notification-sound-${Date.now()}.${fileExt}`;
      
      // First, check if menu-images bucket exists (we'll use this as it's already being used in the app)
      // If not, we will create a file object URL instead of uploading
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error('Error checking buckets:', bucketsError);
        handleLocalFileUpload(file);
        return;
      }
      
      const menuImagesBucketExists = buckets.some(bucket => bucket.name === 'menu-images');
      
      if (!menuImagesBucketExists) {
        console.log('menu-images bucket not found, using local file instead');
        handleLocalFileUpload(file);
        return;
      }
      
      // If bucket exists, upload to Supabase storage
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('menu-images')
        .upload(`sounds/${fileName}`, file);

      if (uploadError) {
        console.error('Error uploading sound file:', uploadError);
        handleLocalFileUpload(file);
        return;
      }

      // Get the public URL of the uploaded file
      const { data } = supabase.storage.from('menu-images').getPublicUrl(`sounds/${fileName}`);
      
      if (data?.publicUrl) {
        const newSettings = { 
          ...settings, 
          customSound: true, 
          soundUrl: data.publicUrl 
        };
        
        // Update local state
        setSettings(newSettings);
        
        // Save settings to database immediately
        await saveSettingsAfterUpload(newSettings);
        
        toast({
          title: "Upload successful",
          description: "Custom notification sound uploaded and saved"
        });
      }
    } catch (error) {
      console.error('Unexpected error during upload:', error);
      handleLocalFileUpload(file);
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  // New function to save settings immediately after upload
  const saveSettingsAfterUpload = async (newSettings: NotificationSound) => {
    try {
      const { data: existingData, error: checkError } = await supabase
        .from('settings')
        .select('id')
        .eq('key', 'notification_sound_settings')
        .maybeSingle();
        
      if (checkError) {
        console.error('Error checking notification settings after upload:', checkError);
        return false;
      }
      
      if (existingData) {
        const { error } = await supabase
          .from('settings')
          .update({
            value: newSettings,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingData.id);
          
        if (error) {
          console.error('Error saving notification settings after upload:', error);
          return false;
        }
      } else {
        const { error } = await supabase
          .from('settings')
          .insert({
            key: 'notification_sound_settings',
            value: newSettings,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
        if (error) {
          console.error('Error saving notification settings after upload:', error);
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Unexpected error saving settings after upload:', error);
      return false;
    }
  };
  
  // New function to handle local file upload as a fallback
  const handleLocalFileUpload = async (file: File) => {
    try {
      // Create a local object URL for the file instead of uploading
      const localUrl = URL.createObjectURL(file);
      
      const newSettings = { 
        ...settings, 
        customSound: true, 
        soundUrl: localUrl 
      };
      
      // Update local state
      setSettings(newSettings);
      
      // Try to save settings to database with the local URL
      // Note: This is not ideal as object URLs are temporary, but it's better than nothing
      const saved = await saveSettingsAfterUpload(newSettings);
      
      if (saved) {
        toast({
          title: "Local sound added",
          description: "Using sound from your device (temporary)"
        });
      } else {
        toast({
          title: "Warning",
          description: "Sound loaded but may not persist after refresh",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error creating local file URL:', error);
      toast({
        title: "Upload failed",
        description: "Could not use the sound file",
        variant: "destructive"
      });
    }
  };

  const handlePlaySound = () => {
    if (audioRef.current) {
      audioRef.current.volume = settings.volume / 100;
      audioRef.current.play().catch(error => {
        console.error('Error playing sound:', error);
        toast({
          title: "Playback failed",
          description: "Could not play notification sound",
          variant: "destructive"
        });
      });
    }
  };

  const handleResetToDefault = async () => {
    const newSettings = {
      ...settings,
      customSound: false,
      soundUrl: DEFAULT_SOUND
    };
    
    setSettings(newSettings);
    
    // Save settings immediately after reset
    const saved = await saveSettingsAfterUpload(newSettings);
    
    if (saved) {
      toast({
        title: "Reset successful",
        description: "Using default notification sound"
      });
    } else {
      toast({
        title: "Reset successful",
        description: "Using default notification sound (save to persist)"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <Label htmlFor="notification-sound-enabled">Enable notification sounds</Label>
          </div>
          <Switch
            id="notification-sound-enabled"
            checked={settings.enabled}
            onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
          />
        </div>
        <p className="text-sm text-muted-foreground pl-6">
          Play a sound when new orders are received in the Kitchen Display System
        </p>
      </div>

      {settings.enabled && (
        <>
          <Separator />
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="volume-slider">Volume: {settings.volume}%</Label>
              <input
                id="volume-slider" 
                type="range"
                min="0"
                max="100"
                value={settings.volume}
                onChange={(e) => setSettings({ ...settings, volume: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>Notification Sound</Label>
              
              <div className="flex items-center space-x-2 mt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handlePlaySound}
                >
                  <Play className="h-4 w-4 mr-1" />
                  Test Sound
                </Button>
                
                {settings.customSound && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleResetToDefault}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Reset to Default
                  </Button>
                )}
              </div>

              <div className="relative mt-4">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  id="sound-upload"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={uploadingFile}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingFile}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploadingFile ? "Uploading..." : "Upload Custom Sound"}
                </Button>
                {settings.customSound && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Using custom notification sound
                  </p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          <Button
            onClick={handleSaveSettings}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Notification Settings"}
          </Button>
          
          {/* Hidden audio element for playing notification sound */}
          <audio
            ref={audioRef}
            src={settings.soundUrl}
            preload="auto"
            style={{ display: 'none' }}
          />
        </>
      )}
    </div>
  );
};

export default NotificationSoundSettings;
