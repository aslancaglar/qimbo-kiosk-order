
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
        const { data, error } = await supabase
          .from('appearance_settings')
          .select('*')
          .order('id', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('Error fetching appearance settings:', error);
          return;
        }

        if (data) {
          setTheme({
            logo: data.logo_url,
            primaryColor: data.primary_color,
            secondaryColor: data.secondary_color,
            accentColor: data.accent_color,
            loading: false
          });
          
          // Apply CSS variables
          document.documentElement.style.setProperty('--primary-color', data.primary_color);
          document.documentElement.style.setProperty('--secondary-color', data.secondary_color);
          document.documentElement.style.setProperty('--accent-color', data.accent_color);
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
        { event: '*', schema: 'public', table: 'appearance_settings' },
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
