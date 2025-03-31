
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Bell, AlertTriangle, Upload, ExternalLink, Volume2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { testAudioPlayback } from '@/utils/audioUtils';
import { uploadImage } from '@/integrations/supabase/client';

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
  const [isUploading, setIsUploading] = useState(false);

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

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      toast.error('Please select an audio file (MP3, WAV, etc.)');
      return;
    }

    // Maximum file size (3MB)
    const maxSize = 3 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('Audio file is too large. Maximum size is 3MB.');
      return;
    }

    setIsUploading(true);
    setTestError(null);

    try {
      // Upload the audio file to Supabase storage
      const uploadedUrl = await uploadImage(file, 'audio-files');
      
      if (uploadedUrl) {
        setSoundUrl(uploadedUrl);
        toast.success('Audio file uploaded successfully!');
      } else {
        throw new Error('Failed to upload audio file');
      }
    } catch (error) {
      console.error('Error uploading audio file:', error);
      toast.error('Failed to upload audio file. Please try again.');
    } finally {
      setIsUploading(false);
      // Clear the input field so the same file can be uploaded again if needed
      event.target.value = '';
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
                  </span> : <Volume2 className="h-4 w-4 mr-1" />}
              </Button>
            </div>
            
            <div className="mt-4">
              <Label className="mb-2 block">Upload Sound File</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  disabled={!notificationsEnabled || isUploading}
                  onClick={() => document.getElementById('sound-file-upload')?.click()}
                >
                  {isUploading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                      Uploading...
                    </span>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload MP3 File
                    </>
                  )}
                </Button>
                <input
                  type="file"
                  id="sound-file-upload"
                  accept="audio/*"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={!notificationsEnabled || isUploading}
                />
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handleTestSound}
                  disabled={!notificationsEnabled || !soundUrl || isTestingSound || isUploading}
                  title="Test Sound"
                >
                  <Volume2 className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Upload an MP3 file (max 3MB) to use as notification sound
              </p>
            </div>
            
            {soundUrl && (
              <div className="mt-2 text-sm flex items-center gap-1 text-muted-foreground">
                <span>Current sound:</span>
                <a 
                  href={soundUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary flex items-center hover:underline truncate max-w-[200px]"
                >
                  {soundUrl.split('/').pop() || soundUrl}
                  <ExternalLink className="h-3 w-3 ml-1 inline-flex" />
                </a>
              </div>
            )}
            
            {testError && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md flex items-start gap-2 text-sm text-red-700">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Sound test failed</p>
                  <p className="text-red-600">{testError}</p>
                  <p className="text-xs mt-1">
                    This may be due to browser restrictions on autoplay, CORS issues with external URLs, 
                    or the file format. Try uploading an MP3 file instead of using an external URL.
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
