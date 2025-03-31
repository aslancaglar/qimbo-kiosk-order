
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Bell, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { testAudioPlayback } from '@/utils/audioUtils';

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
  const [soundUrl, setSoundUrl] = useLocalStorage(
    NOTIFICATION_SOUND_URL_KEY, 
    'https://assets.mixkit.co/sfx/preview/mixkit-bell-notification-933.mp3'
  );
  
  const [isTestingSound, setIsTestingSound] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);

  // Handle audio test playback with improved error handling
  const handleTestSound = async () => {
    if (!soundUrl) {
      toast.error('Please enter a sound URL first');
      return;
    }
    
    setIsTestingSound(true);
    setTestError(null);
    
    try {
      await testAudioPlayback(soundUrl);
      toast.success('Sound test successful!');
    } catch (error: any) {
      console.error('Error playing test sound:', error);
      setTestError(error.message || 'Failed to play test sound');
      toast.error('Failed to play test sound. Please check the URL or your browser settings.');
    } finally {
      setIsTestingSound(false);
    }
  };

  // Handle saving settings
  const handleSaveSettings = () => {
    toast.success('Notification settings saved');
    onOpenChange(false);
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
                onChange={(e) => {
                  setSoundUrl(e.target.value);
                  setTestError(null);
                }}
                className="flex-1"
                disabled={!notificationsEnabled}
              />
              <Button 
                variant="outline" 
                onClick={handleTestSound}
                disabled={!notificationsEnabled || !soundUrl || isTestingSound}
              >
                {isTestingSound ? 
                  <span className="flex items-center gap-1">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                    Testing
                  </span> : 'Test'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              Enter the URL to an MP3 file. You can use external services or your own hosted files.
            </p>
            
            {testError && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md flex items-start gap-2 text-sm text-red-700">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Sound test failed</p>
                  <p className="text-red-600">{testError}</p>
                  <p className="text-xs mt-1">
                    This may be due to browser restrictions on autoplay, CORS issues with external URLs, 
                    or the file format. Try using an MP3 file from the same domain or a public CDN.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleSaveSettings}>
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationSettingsModal;
