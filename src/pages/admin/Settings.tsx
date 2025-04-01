import React, { useEffect, useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "../../integrations/supabase/client";
import { Json } from "../../integrations/supabase/types";
import AdminLayout from '../../components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Save, Settings2, RefreshCw, Upload, Bell, Volume2, Image, Images, Printer } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { clearAppCache } from "../../utils/serviceWorker";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { uploadFile } from '@/utils/fileUpload';
import { 
  testPrintNodeConnection, 
  fetchPrintNodePrinters, 
  sendTestPrint 
} from '@/utils/printNode';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface OrderingSettings {
  requireTableSelection: boolean;
}

interface NotificationSettings {
  soundEnabled: boolean;
  soundUrl?: string;
  soundName?: string;
  volume: number;
}

interface AppearanceSettings {
  logo?: string;
  slideshowImages: string[];
}

interface PrintSettings {
  enabled: boolean;
  apiKey: string;
  printerId: string;
  printerName?: string;
}

interface PrinterOption {
  id: string | number;
  name: string;
  description?: string;
  state?: string;
}

const Settings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [testingSound, setTestingSound] = useState(false);
  const [uploadingSound, setUploadingSound] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [fetchingPrinters, setFetchingPrinters] = useState(false);
  const [testingPrinter, setTestingPrinter] = useState(false);
  const [availablePrinters, setAvailablePrinters] = useState<PrinterOption[]>([]);

  const [restaurantInfo, setRestaurantInfo] = useState({
    id: 1,
    name: '',
    phone: '',
    address: '',
    description: ''
  });

  const [businessHours, setBusinessHours] = useState([
    { id: 0, day_of_week: 'Monday', open_time: '09:00', close_time: '21:00' },
    { id: 0, day_of_week: 'Tuesday', open_time: '09:00', close_time: '21:00' },
    { id: 0, day_of_week: 'Wednesday', open_time: '09:00', close_time: '21:00' },
    { id: 0, day_of_week: 'Thursday', open_time: '09:00', close_time: '21:00' },
    { id: 0, day_of_week: 'Friday', open_time: '09:00', close_time: '21:00' },
    { id: 0, day_of_week: 'Saturday', open_time: '09:00', close_time: '21:00' },
    { id: 0, day_of_week: 'Sunday', open_time: '09:00', close_time: '21:00' }
  ]);

  const [orderingSettings, setOrderingSettings] = useState<OrderingSettings>({
    requireTableSelection: true
  });
  
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    soundEnabled: true,
    soundUrl: '/notification.mp3',
    soundName: 'Default notification',
    volume: 1.0
  });

  const [appearanceSettings, setAppearanceSettings] = useState<AppearanceSettings>({
    logo: '',
    slideshowImages: [
      "/lovable-uploads/6837434a-e5ba-495a-b295-9638c9b5c27f.png",
      "https://images.unsplash.com/photo-1546793665-c74683f339c1?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1482938289607-e9573fc25ebb?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
    ]
  });

  const [printSettings, setPrintSettings] = useState<PrintSettings>({
    enabled: false,
    apiKey: '',
    printerId: '',
    printerName: ''
  });

  useEffect(() => {
    fetchRestaurantInfo();
    fetchBusinessHours();
    fetchOrderingSettings();
    fetchNotificationSettings();
    fetchAppearanceSettings();
    fetchPrintSettings();
  }, []);

  // ... rest of the code remains unchanged until the Select component

  {availablePrinters.length > 0 ? (
    <Select
      value={printSettings.printerId.toString()}
      onValueChange={handlePrinterSelect}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a printer">
          {printSettings.printerName || printSettings.printerId}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {availablePrinters.map((printer) => (
          <SelectItem key={printer.id} value={printer.id.toString()}>
            {printer.name} {printer.state ? `(${printer.state})` : ''}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  ) : printSettings.printerId && printSettings.printerName ? (
    <div className="flex flex-col gap-2">
      <div className="p-3 border rounded-md bg-muted flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Printer className="h-4 w-4 text-muted-foreground" />
          <span>{printSettings.printerName || printSettings.printerId}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleFetchPrinters}
          disabled={!printSettings.apiKey || fetchingPrinters}
        >
          {fetchingPrinters ? 'Loading...' : 'Refresh List'}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Printer is selected but printer list hasn't been refreshed. Click Refresh List to see all available printers.
      </p>
    </div>
  ) : (
    <div className="p-4 border rounded-md bg-muted/50 text-center">
      <p className="text-sm text-muted-foreground">
        {fetchingPrinters 
          ? 'Searching for printers...'
          : 'No printers found. Click "Refresh Printers" to fetch available printers.'}
      </p>
    </div>
  )}

  // ... rest of the code remains unchanged

  return (
    <AdminLayout>
      <div className="space-y-6">
        <Tabs defaultValue="general">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="ordering">Ordering</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="printing">Printing</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Restaurant Information</CardTitle>
                <CardDescription>
                  Update your restaurant's basic information.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="restaurant-name">Restaurant Name</Label>
                    <Input 
                      id="restaurant-name" 
                      value={restaurantInfo.name} 
                      onChange={handleInfoChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="restaurant-phone">Phone Number</Label>
                    <Input 
                      id="restaurant-phone" 
                      value={restaurantInfo.phone} 
                      onChange={handleInfoChange}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="restaurant-address">Address</Label>
                  <Input 
                    id="restaurant-address" 
                    value={restaurantInfo.address} 
                    onChange={handleInfoChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="restaurant-description">Description</Label>
                  <Textarea 
                    id="restaurant-description" 
                    value={restaurantInfo.description || ''} 
                    onChange={handleInfoChange}
                    rows={3}
                  />
                </div>
                
                <Button 
                  className="mt-4" 
                  onClick={saveRestaurantInfo} 
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Business Hours</CardTitle>
                <CardDescription>
                  Set your restaurant's opening hours.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {businessHours.map((day, i) => (
                    <div key={i} className="flex items-center justify-between pb-2 border-b">
                      <span className="font-medium">{day.day_of_week}</span>
                      <div className="flex gap-2 items-center">
                        <Input
                          type="time"
                          value={day.open_time}
                          onChange={(e) => handleHoursChange(day.day_of_week, 'open_time', e.target.value)}
                          className="w-24"
                        />
                        <span>to</span>
                        <Input
                          type="time"
                          value={day.close_time}
                          onChange={(e) => handleHoursChange(day.day_of_week, 'close_time', e.target.value)}
                          className="w-24"
                        />
                      </div>
                    </div>
                  ))}
                  <Button 
                    className="mt-4"
                    onClick={saveBusinessHours}
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Hours'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="ordering" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings2 className="h-5 w-5" />
                  Ordering Options
                </CardTitle>
                <CardDescription>
                  Configure ordering options and customer experience settings.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="require-table-selection"
                    checked={orderingSettings.requireTableSelection}
                    onCheckedChange={(checked) => handleOrderingSettingChange('requireTableSelection', checked)}
                  />
                  <Label htmlFor="require-table-selection">
                    Require table selection for dine-in orders
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground pl-7">
                  When disabled, customers can place dine-in orders without selecting a table number.
                </p>
                
                <Button 
                  onClick={saveOrderingSettings}
                  disabled={loading}
                  className="mt-4"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : 'Save Settings'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="appearance" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Images className="h-5 w-5" />
                  Index Page Appearance
                </CardTitle>
                <CardDescription>
                  Customize the landing page logo and slideshow images.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Restaurant Logo</h3>
                  
                  <div className="space-y-2">
                    <Label>Current Logo</Label>
                    <div className="flex items-center gap-4">
                      {appearanceSettings.logo ? (
                        <div className="w-16 h-16 rounded-full border overflow-hidden bg-white flex items-center justify-center">
                          <img 
                            src={appearanceSettings.logo} 
                            alt="Restaurant Logo" 
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-white/80 flex items-center justify-center">
                          <span className="text-primary font-bold text-xs text-center">DUMMY<br/>LOGO</span>
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <Input
                          id="logo-file"
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          disabled={uploadingLogo}
                          className="flex-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Recommended size: 128x128px, transparent background (PNG)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-medium">Slideshow Images</h3>
                  <p className="text-sm text-muted-foreground">
                    These images will appear in the slideshow on the landing page. Recommended ratio: 16:9, landscape orientation.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {appearanceSettings.slideshowImages.map((image, index) => (
                      <div key={index} className="relative rounded-md overflow-hidden border group">
                        <img 
                          src={image} 
                          alt={`Slideshow Image ${index + 1}`}
                          className="w-full h-48 object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button 
                            variant="destructive"
                            size="sm"
                            onClick={() => removeSlideImage(index)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    <div className="border border-dashed rounded-md flex flex-col items-center justify-center h-48 p-4">
                      <Image className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-center text-muted-foreground mb-3">
                        Upload a new image for the slideshow
                      </p>
                      <Input
                        id="slideshow-file"
                        type="file"
                        accept="image/*"
                        onChange={handleSlideImageUpload}
                        disabled={uploadingImage}
                        className="max-w-[200px]"
                      />
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={saveAppearanceSettings}
                  disabled={loading}
                  className="mt-6"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : 'Save Appearance Settings'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Settings
                </CardTitle>
                <CardDescription>
                  Configure how notifications are handled throughout the system.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Sound Notifications</h3>
                  
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="sound-enabled"
                      checked={notificationSettings.soundEnabled}
                      onCheckedChange={(checked) => handleNotificationSettingChange('soundEnabled', checked)}
                    />
                    <Label htmlFor="sound-enabled">
                      Enable notification sounds
                    </Label>
                  </div>
                  
                  {notificationSettings.soundEnabled && (
                    <div className="pl-7 space-y-4">
                      <div className="space-y-2">
                        <Label>Current notification sound</Label>
                        <div className="flex items-center gap-2 p-3 rounded-md bg-muted text-sm">
                          <Volume2 className="h-5 w-5 text-muted-foreground" />
                          <span className="flex-1 truncate">
                            {notificationSettings.soundName || 'Default notification'}
                          </span>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={playTestSound}
                            disabled={testingSound}
                          >
                            {testingSound ? 'Playing...' : 'Test Sound'}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="notification-volume">Volume</Label>
                        <div className="flex items-center gap-4">
                          <input
                            id="notification-volume"
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={notificationSettings.volume}
                            onChange={(e) => handleNotificationSettingChange('volume', parseFloat(e.target.value))}
                            className="w-full"
                          />
                          <span className="text-sm">
                            {Math.round(notificationSettings.volume * 100)}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="pt-2">
                        <Label htmlFor="sound-file" className="block mb-2">Upload custom notification sound</Label>
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            <Input
                              id="sound-file"
                              type="file"
                              accept="audio/*"
                              onChange={handleSoundUpload}
                              disabled={uploadingSound}
                              className="flex-1"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Accepted formats: MP3, WAV, OGG (max 2MB)
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <Button 
                  onClick={saveNotificationSettings}
                  disabled={loading}
                  className="mt-4"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : 'Save Notification Settings'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="printing" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Printer className="h-5 w-5" />
                  Thermal Printer Configuration
                </CardTitle>
                <CardDescription>
                  Configure your PrintNode thermal printer integration for order receipts.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="enable-thermal-printing"
                      checked={printSettings.enabled}
                      onCheckedChange={(checked) => handlePrintSettingChange('enabled', checked)}
                    />
                    <Label htmlFor="enable-thermal-printing">
                      Enable thermal receipt printing
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground pl-7">
                    When enabled, order receipts will be sent to your thermal printer via PrintNode.
                    When disabled, receipts will use browser printing.
                  </p>
                </div>
                
                {printSettings.enabled && (
                  <div className="space-y-6 border-t pt-6">
                    <h3 className="text-lg font-medium">PrintNode API Configuration</h3>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="printnode-api-key">PrintNode API Key</Label>
                        <div className="flex gap-2">
                          <Input
                            id="printnode-api-key"
                            type="password"
                            value={printSettings.apiKey}
                            onChange={(e) => handlePrintSettingChange('apiKey', e.target.value)}
                            className="flex-1"
                            placeholder="Enter your PrintNode API key"
                          />
                          <Button
                            variant="outline"
                            onClick={handleTestConnection}
                            disabled={!printSettings.apiKey || testingConnection}
                          >
                            {testingConnection ? 'Testing...' : 'Test Connection'}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          You can find your API key in your PrintNode account dashboard.
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-end">
                          <Label>Printer Selection</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleFetchPrinters}
                            disabled={!printSettings.apiKey || fetchingPrinters}
                          >
                            {fetchingPrinters ? 'Loading...' : 'Refresh Printers'}
                          </Button>
                        </div>
                        
                        {availablePrinters.length > 0 ? (
                          <Select
                            value={printSettings.printerId.toString()}
                            onValueChange={handlePrinterSelect}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a printer">
                                {printSettings.printerName || printSettings.printerId}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {availablePrinters.map((printer) => (
                                <SelectItem key={printer.id} value={printer.id.toString()}>
                                  {printer.name} {printer.state ? `(${printer.state})` : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : printSettings.printerId && printSettings.printerName ? (
                          <div className="flex flex-col gap-2">
                            <div className="p-3 border rounded-md bg-muted flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Printer className="h-4 w-4 text-muted-foreground" />
                                <span>{printSettings.printerName || printSettings.printerId}</span>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleFetchPrinters}
                                disabled={!printSettings.apiKey || fetchingPrinters}
                              >
                                {fetchingPrinters ? 'Loading...' : 'Refresh List'}
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Printer is selected but printer list hasn't been refreshed. Click Refresh List to see all available printers.
                            </p>
                          </div>
                        ) : (
                          <div className="p-4 border rounded-md bg-muted/50 text-center">
                            <p className="text-sm text-muted-foreground">
                              {fetchingPrinters 
                                ? 'Searching for printers...'
                                : 'No printers found. Click "Refresh Printers" to fetch available printers.'}
                            </p>
                          </div>
                        )}
                        
                        {printSettings.printerId && (
                          <div className="mt-4">
                            <Button
                              variant="outline"
                              onClick={handleTestPrint}
                              disabled={!printSettings.apiKey || !printSettings.printerId || testingPrinter}
                              className="w-full"
                            >
                              <Printer className="mr-2 h-4 w-4" />
                              {testingPrinter ? 'Sending...' : 'Send Test Receipt'}
                            </Button>
                            <p className="text-xs text-muted-foreground mt-1 text-center">
                              This will print a test receipt to verify your printer is working correctly.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Alert className="mt-6">
                      <AlertDescription>
                        <p>Make sure your thermal printer (ITPP047) is:</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                          <li>Connected and turned on</li>
                          <li>Properly configured in PrintNode</li>
                          <li>Has sufficient paper</li>
                        </ul>
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
                
                <Button 
                  onClick={savePrintSettings}
                  disabled={loading}
                  className="mt-4"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : 'Save Print Settings'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="system" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  System Maintenance
                </CardTitle>
                <CardDescription>
                  Manage cache and system maintenance options.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <Alert>
                    <AlertDescription>
                      Clearing the application cache will remove stored data and reload the latest content.
                      This can help fix issues with outdated content or unexpected behavior.
                    </AlertDescription>
                  </Alert>
                  
                  <Button 
                    onClick={handleClearCache}
                    disabled={clearingCache}
                    className="mt-4"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${clearingCache ? 'animate-spin' : ''}`} />
                    {clearingCache ? 'Clearing Cache...' : 'Clear Application Cache'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default Settings;
