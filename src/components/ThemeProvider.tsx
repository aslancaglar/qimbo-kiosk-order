
import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AppearanceSettings {
  id: number;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
}

interface ThemeContextType {
  logo: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  loading: boolean;
}

const defaultTheme: ThemeContextType = {
  logo: null,
  primaryColor: '#000000',
  secondaryColor: '#f3f4f6',
  accentColor: '#6366f1',
  loading: true
};

const ThemeContext = createContext<ThemeContextType>(defaultTheme);

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeContextType>(defaultTheme);

  useEffect(() => {
    const fetchAppearanceSettings = async () => {
      try {
        // Use type assertion to work around the type issues
        const { data, error } = await supabase
          .from('appearance_settings' as any)
          .select('*')
          .order('id', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('Error fetching appearance settings:', error);
          return;
        }

        if (data) {
          // Make sure data is not an error before trying to use it
          if (!data.error) {
            // Cast the data to our interface after checking it's not an error
            const settings = data as unknown as AppearanceSettings;
            setTheme({
              logo: settings.logo_url,
              primaryColor: settings.primary_color,
              secondaryColor: settings.secondary_color,
              accentColor: settings.accent_color,
              loading: false
            });
            
            // Apply CSS variables
            document.documentElement.style.setProperty('--primary-color', settings.primary_color);
            document.documentElement.style.setProperty('--secondary-color', settings.secondary_color);
            document.documentElement.style.setProperty('--accent-color', settings.accent_color);
          }
        }
      } catch (error) {
        console.error('Unexpected error:', error);
      } finally {
        setTheme(prev => ({ ...prev, loading: false }));
      }
    };

    fetchAppearanceSettings();
    
    // Subscribe to changes in the appearance_settings table
    const channel = supabase
      .channel('appearance-settings-changes')
      .on(
        'postgres_changes',
        // Use type assertion here too
        { event: '*', schema: 'public', table: 'appearance_settings' as any },
        () => {
          fetchAppearanceSettings();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};
