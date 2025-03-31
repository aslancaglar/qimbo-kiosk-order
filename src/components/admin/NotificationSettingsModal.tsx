
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Bell } from 'lucide-react';
import { toast } from 'sonner';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const NotificationSettingsModal = ({ isOpen, onOpenChange }: NotificationSettingsModalProps) => {
  // Local storage keys
  const NOTIFICATION_ENABLED_KEY = 'kds_notification_enabled';
  const NOTIFICATION_SOUND_URL_KEY = 'kds_notification_sound_url';
  
  // State for settings
  const [notificationsEnabled, setNotificationsEnabled] = useLocalStorage(NOTIFICATION_ENABLED_KEY, true);
  const [soundUrl, setSoundUrl] = useLocalStorage(NOTIFICATION_SOUND_URL_KEY, 'https://assets.mixkit.co/sfx/preview/mixkit-bell-notification-933.mp3');
  const [testAudio, setTestAudio] = useState<HTMLAudioElement | null>(null);
  
  // Initialize audio on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setTestAudio(new Audio(soundUrl));
    }
    return () => {
      if (testAudio) {
        testAudio.pause();
        testAudio.src = '';
      }
    };
  }, [soundUrl]);
  
  // Handle audio test playback
  const handleTestSound = () => {
    try {
      if (testAudio) {
        testAudio.currentTime = 0;
        testAudio.play().catch(error => {
          console.error('Error playing test sound:', error);
          toast.error('Failed to play test sound. Please check the URL or your browser settings.');
        });
      }
    } catch (error) {
      console.error('Error in test sound function:', error);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </DialogTitle>
          <DialogDescription>
            Configure notification sounds for new orders
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="notifications" className="text-base">Enable Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Play a sound when new orders arrive
              </p>
            </div>
            <Switch 
              id="notifications" 
              checked={notificationsEnabled} 
              onCheckedChange={setNotificationsEnabled} 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="sound-url">Notification Sound URL</Label>
            <div className="flex gap-2">
              <Input 
                id="sound-url"
                placeholder="Enter sound URL (MP3)"
                value={soundUrl}
                onChange={(e) => setSoundUrl(e.target.value)}
                className="flex-1"
                disabled={!notificationsEnabled}
              />
              <Button 
                variant="outline" 
                onClick={handleTestSound}
                disabled={!notificationsEnabled || !soundUrl}
              >
                Test
              </Button>
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              Enter the URL to an MP3 file. You can use external services or your own hosted files.
            </p>
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={() => {
            toast.success('Notification settings saved');
            onOpenChange(false);
          }}>
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationSettingsModal;
