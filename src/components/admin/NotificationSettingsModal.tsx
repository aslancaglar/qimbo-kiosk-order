import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { playNotificationSound, validateAudioUrl } from '@/utils/audioUtils';

interface NotificationSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsProps> = ({ isOpen, onClose }) => {
  const [enabled, setEnabled] = useState(true);
  const [soundUrl, setSoundUrl] = useState('/notification.mp3');
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  // Load settings from localStorage on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data } = await supabase
          .from('settings')
          .select('*')
          .eq('key', 'kds_notification_settings')
          .maybeSingle();

        if (data && data.value) {
          const settings = data.value as Record<string, any>;
          setEnabled(settings.enabled !== undefined ? settings.enabled : true);
          setSoundUrl(settings.soundUrl || '/notification.mp3');
        }
      } catch (error) {
        console.error('Error loading notification settings:', error);
      }
    };

    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const handleTestSound = () => {
    if (!enabled || !soundUrl) return;
    setIsTesting(true);

    console.log('Testing sound URL:', soundUrl);
    playNotificationSound(soundUrl)
      .then(() => {
        toast.success('Sound test successful!');
      })
      .catch((error) => {
        console.error('Sound test failed:', error);
        toast.error(error.message || 'Failed to play sound. Please check the URL and try again.');
      })
      .finally(() => {
        setIsTesting(false);
      });
  };

  const handleResetToDefault = () => {
    const defaultSoundUrl = '/notification.mp3';
    setSoundUrl(defaultSoundUrl);
    toast.info('Reset to default notification sound');
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      // Test the sound first if enabled and a URL is provided
      if (enabled && soundUrl) {
        try {
          await validateAudioUrl(soundUrl);
        } catch (error) {
          toast.error('Invalid sound URL. Please enter a valid audio file URL or use the default.');
          setIsLoading(false);
          return;
        }
      }

      const { data: existingData } = await supabase
        .from('settings')
        .select('id')
        .eq('key', 'kds_notification_settings')
        .maybeSingle();

      const settings = {
        enabled,
        soundUrl,
      };

      if (existingData) {
        // Update existing setting
        await supabase
          .from('settings')
          .update({ 
            value: settings,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingData.id);
      } else {
        // Insert new setting
        await supabase
          .from('settings')
          .insert({
            key: 'kds_notification_settings',
            value: settings,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      }

      toast.success('Notification settings saved successfully');
      onClose();
    } catch (error) {
      console.error('Error saving notification settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Notification Settings</DialogTitle>
          <DialogDescription>
            Configure sound notifications for new orders
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {enabled ? <Volume2 className="h-5 w-5 text-primary" /> : <VolumeX className="h-5 w-5 text-muted-foreground" />}
                <Label htmlFor="notification-toggle" className="font-medium">
                  Sound Notifications
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Play a sound when a new order is received
              </p>
            </div>
            <Switch 
              id="notification-toggle"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sound-url">Sound URL</Label>
            <div className="flex gap-2">
              <Input
                id="sound-url"
                value={soundUrl}
                onChange={(e) => setSoundUrl(e.target.value)}
                placeholder="URL to sound file (e.g., /notification.mp3)"
                disabled={!enabled}
              />
              <Button 
                variant="outline" 
                size="sm"
                type="button"
                onClick={handleTestSound}
                disabled={!enabled || !soundUrl || isTesting}
              >
                {isTesting ? "Playing..." : "Test"}
              </Button>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                Use the default sound or enter a URL to a custom sound file
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetToDefault}
                disabled={!enabled || soundUrl === '/notification.mp3'}
                className="h-8 px-2"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                Reset to Default
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button 
            variant="outline" 
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveSettings}
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
