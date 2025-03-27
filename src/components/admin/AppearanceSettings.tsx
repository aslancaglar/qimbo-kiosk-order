
import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "../../integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload } from 'lucide-react';

interface AppearanceSettings {
  id: number;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
}

const AppearanceSettings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(false);

  const [settings, setSettings] = useState<AppearanceSettings>({
    id: 1,
    logo_url: null,
    primary_color: '#000000',
    secondary_color: '#f3f4f6',
    accent_color: '#6366f1'
  });

  useEffect(() => {
    fetchAppearanceSettings();
  }, []);

  const fetchAppearanceSettings = async () => {
    try {
      setLoading(true);
      // Use a type assertion to work around the type issues
      const { data, error } = await supabase
        .from('appearance_settings' as any)
        .select('*')
        .order('id', { ascending: true })
        .limit(1)
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

      if (data) {
        // First check if data is not an error
        if (!('error' in data)) {
          // Cast the data safely through unknown first
          const typedData = data as unknown as AppearanceSettings;
          setSettings(typedData);
          
          if (typedData.logo_url) {
            setLogoPreview(typedData.logo_url);
          }
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

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [id.replace('color-', '')]: value
    }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === 'string') {
          setLogoPreview(event.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile) return settings.logo_url;
    
    setUploadProgress(true);
    try {
      // Create a unique file path
      const fileExt = logoFile.name.split('.').pop();
      const filePath = `logos/logo-${Date.now()}.${fileExt}`;
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('restaurant_assets')
        .upload(filePath, logoFile, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) {
        console.error('Error uploading logo:', error);
        toast({
          title: "Error",
          description: "Failed to upload logo",
          variant: "destructive"
        });
        return null;
      }
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('restaurant_assets')
        .getPublicUrl(filePath);
      
      return publicUrl;
    } catch (error) {
      console.error('Unexpected error during upload:', error);
      return null;
    } finally {
      setUploadProgress(false);
    }
  };

  const saveAppearanceSettings = async () => {
    try {
      setLoading(true);
      
      // Upload logo if there's a new one
      const logoUrl = await uploadLogo();
      
      // Update database with all settings
      // Use type assertion to work around the type issues
      const { error } = await supabase
        .from('appearance_settings' as any)
        .update({
          logo_url: logoUrl !== null ? logoUrl : settings.logo_url,
          primary_color: settings.primary_color,
          secondary_color: settings.secondary_color,
          accent_color: settings.accent_color,
          updated_at: new Date().toISOString()
        })
        .eq('id', settings.id);

      if (error) {
        console.error('Error updating appearance settings:', error);
        toast({
          title: "Error",
          description: "Failed to update appearance settings",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "Appearance settings updated successfully"
      });
      
      // Reset file upload state
      setLogoFile(null);
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance Settings</CardTitle>
        <CardDescription>
          Customize how your restaurant's ordering system looks.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Logo Upload Section */}
        <div className="space-y-4">
          <Label>Restaurant Logo</Label>
          <div className="flex items-center gap-6">
            <div className="border rounded-lg w-32 h-32 flex items-center justify-center bg-gray-50 overflow-hidden">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo preview" className="max-w-full max-h-full object-contain" />
              ) : (
                <span className="text-gray-400">No logo</span>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <Input 
                id="logo-upload" 
                type="file" 
                accept="image/*"
                onChange={handleLogoChange}
                className="cursor-pointer"
              />
              <p className="text-xs text-gray-500">
                Recommended size: 512x512px. Max size: 2MB.
              </p>
            </div>
          </div>
        </div>
        
        <div className="border-t pt-4 mt-6">
          <Label className="mb-4 block">Color Scheme</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Primary Color */}
            <div className="space-y-2">
              <Label htmlFor="color-primary_color" className="text-sm">Primary Color</Label>
              <div className="flex items-center gap-3">
                <div 
                  className="w-8 h-8 rounded-full border"
                  style={{ backgroundColor: settings.primary_color }}
                />
                <Input 
                  id="color-primary_color" 
                  type="text" 
                  value={settings.primary_color} 
                  onChange={handleColorChange}
                  className="font-mono"
                />
              </div>
            </div>
            
            {/* Secondary Color */}
            <div className="space-y-2">
              <Label htmlFor="color-secondary_color" className="text-sm">Secondary Color</Label>
              <div className="flex items-center gap-3">
                <div 
                  className="w-8 h-8 rounded-full border"
                  style={{ backgroundColor: settings.secondary_color }}
                />
                <Input 
                  id="color-secondary_color" 
                  type="text" 
                  value={settings.secondary_color} 
                  onChange={handleColorChange}
                  className="font-mono"
                />
              </div>
            </div>
            
            {/* Accent Color */}
            <div className="space-y-2">
              <Label htmlFor="color-accent_color" className="text-sm">Accent Color</Label>
              <div className="flex items-center gap-3">
                <div 
                  className="w-8 h-8 rounded-full border"
                  style={{ backgroundColor: settings.accent_color }}
                />
                <Input 
                  id="color-accent_color" 
                  type="text" 
                  value={settings.accent_color} 
                  onChange={handleColorChange}
                  className="font-mono"
                />
              </div>
            </div>
          </div>
          
          <p className="text-sm text-gray-500 mt-4">
            Use color hex codes (e.g., #FF0000 for red) to set your restaurant's color scheme.
          </p>
        </div>
        
        <Button 
          className="mt-6" 
          onClick={saveAppearanceSettings} 
          disabled={loading || uploadProgress}
        >
          {(loading || uploadProgress) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading || uploadProgress ? 'Saving...' : 'Save Appearance'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default AppearanceSettings;
