
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.d6513285f59e4c41b88f535982ad8dcd',
  appName: 'foodie-kiosk-experience-10',
  webDir: 'dist',
  server: {
    url: 'https://d6513285-f59e-4c41-b88f-535982ad8dcd.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  android: {
    backgroundColor: "#FFFFFF",
    overrideUserAgent: "Android Tablet"
  }
};

export default config;
