
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
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchNotificationSettings();
  }, []);

  useEffect(() => {
    // Clean up any created object URLs when component unmounts
    return () => {
      if (audioUrl && audioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

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
        const soundSettings = data.value as NotificationSound;
        setSettings(soundSettings);
        
        // Create new audio URL for playing sounds
        if (soundSettings.soundUrl !== DEFAULT_SOUND) {
          setAudioUrl(soundSettings.soundUrl);
        } else {
          setAudioUrl(DEFAULT_SOUND);
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
      
      // Create a temporary object URL for immediate playback
      if (audioUrl && audioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(audioUrl);
      }
      const tempUrl = URL.createObjectURL(file);
      setAudioUrl(tempUrl);
      
      // First, check if storage is available
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
  
  // Function to save settings immediately after upload
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
  
  // Function to handle local file upload as a fallback
  const handleLocalFileUpload = async (file: File) => {
    try {
      // Instead of using blob URLs which don't persist, we'll convert to base64
      // for more persistent storage (though this is still not ideal for large files)
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        if (!event.target || typeof event.target.result !== 'string') {
          throw new Error("Failed to read file");
        }
        
        const base64String = event.target.result;
        // We can't store the full base64 in settings as it might be too large
        // Instead we'll upload it if possible
        
        const tempUrl = URL.createObjectURL(file);
        setAudioUrl(tempUrl);
        
        // Try to upload to our default location
        try {
          const response = await fetch("/notification.mp3", {
            method: "PUT",
            body: file,
            headers: {
              "Content-Type": file.type,
            },
          });
          
          if (response.ok) {
            // If successful, use the default path
            const newSettings = {
              ...settings,
              customSound: true,
              soundUrl: DEFAULT_SOUND + "?t=" + Date.now() // Force cache refresh
            };
            
            setSettings(newSettings);
            await saveSettingsAfterUpload(newSettings);
            
            toast({
              title: "Sound saved",
              description: "Custom notification sound saved successfully"
            });
            return;
          }
        } catch (uploadError) {
          console.error("Failed to upload to default location:", uploadError);
        }
        
        // Fallback to storing the URL and hoping it persists
        const newSettings = {
          ...settings,
          customSound: true,
          soundUrl: DEFAULT_SOUND // Use default as fallback, UI will use our tempUrl
        };
        
        setSettings(newSettings);
        await saveSettingsAfterUpload(newSettings);
        
        toast({
          title: "Sound loaded",
          description: "Using sound for this session"
        });
      };
      
      reader.onerror = () => {
        toast({
          title: "Error",
          description: "Failed to read sound file",
          variant: "destructive"
        });
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error handling local file:', error);
      toast({
        title: "Error",
        description: "Could not process the sound file",
        variant: "destructive"
      });
    }
  };

  const handlePlaySound = () => {
    if (audioRef.current) {
      // Use our managed audioUrl if available, otherwise fall back to settings
      const sourceToPlay = audioUrl || settings.soundUrl;
      
      // Set the source if needed
      if (audioRef.current.src !== sourceToPlay) {
        audioRef.current.src = sourceToPlay;
      }
      
      audioRef.current.volume = settings.volume / 100;
      
      // Play with error handling
      audioRef.current.play().catch(error => {
        console.error('Error playing sound:', error);
        toast({
          title: "Playback failed",
          description: "Could not play notification sound. Please check browser permissions.",
          variant: "destructive"
        });
      });
    }
  };

  const handleResetToDefault = async () => {
    // Clean up any existing blob URL
    if (audioUrl && audioUrl.startsWith('blob:')) {
      URL.revokeObjectURL(audioUrl);
    }
    
    setAudioUrl(DEFAULT_SOUND);
    
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
            src={audioUrl || settings.soundUrl}
            preload="auto"
            style={{ display: 'none' }}
          />
        </>
      )}
    </div>
  );
};

export default NotificationSoundSettings;
