import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PrintSettings from '@/components/admin/PrintSettings';

const Settings = () => {
  const [activeTab, setActiveTab] = useState("appearance");
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="printing">Receipt Printing</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>
        
        <Card>
          <CardHeader>
            <CardTitle>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Settings</CardTitle>
            <CardDescription>
              {activeTab === "appearance" && "Customize how your application looks"}
              {activeTab === "notifications" && "Configure notification preferences"}
              {activeTab === "printing" && "Set up your receipt printer"}
              {activeTab === "advanced" && "Advanced configuration options"}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <TabsContent value="appearance" className="mt-0">
              <div className="space-y-6 p-6 pt-0">
                <div className="flex flex-col gap-1">
                  <h3 className="text-lg font-medium">Theme</h3>
                  <p className="text-sm text-gray-500">
                    Customize the look and feel of the application
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-md p-4 cursor-pointer hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Light Mode</h4>
                      <div className="w-4 h-4 rounded-full border-2 border-primary flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-primary"></div>
                      </div>
                    </div>
                    <div className="h-20 bg-white border rounded-md"></div>
                  </div>
                  
                  <div className="border rounded-md p-4 cursor-pointer hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Dark Mode</h4>
                      <div className="w-4 h-4 rounded-full border-2 border-gray-300"></div>
                    </div>
                    <div className="h-20 bg-gray-900 rounded-md"></div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-1 pt-4">
                  <h3 className="text-lg font-medium">Colors</h3>
                  <p className="text-sm text-gray-500">
                    Choose the primary color for buttons and highlights
                  </p>
                </div>
                
                <div className="grid grid-cols-5 gap-2">
                  {["#0ea5e9", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"].map((color) => (
                    <div 
                      key={color}
                      className="w-full aspect-square rounded-md cursor-pointer hover:ring-2 hover:ring-offset-2"
                      style={{ backgroundColor: color }}
                    ></div>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="notifications" className="mt-0">
              <div className="space-y-6 p-6 pt-0">
                <div className="flex flex-col gap-1">
                  <h3 className="text-lg font-medium">Order Notifications</h3>
                  <p className="text-sm text-gray-500">
                    Configure how you want to be notified about new orders
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium">Sound Alerts</label>
                      <p className="text-xs text-gray-500">
                        Play a sound when a new order is received
                      </p>
                    </div>
                    <div className="h-6 w-11 rounded-full bg-gray-200 flex items-center p-1 cursor-pointer">
                      <div className="h-4 w-4 rounded-full bg-white"></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium">Browser Notifications</label>
                      <p className="text-xs text-gray-500">
                        Show browser notifications for new orders
                      </p>
                    </div>
                    <div className="h-6 w-11 rounded-full bg-primary flex items-center p-1 cursor-pointer justify-end">
                      <div className="h-4 w-4 rounded-full bg-white"></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium">Email Notifications</label>
                      <p className="text-xs text-gray-500">
                        Send email for new orders and daily summaries
                      </p>
                    </div>
                    <div className="h-6 w-11 rounded-full bg-gray-200 flex items-center p-1 cursor-pointer">
                      <div className="h-4 w-4 rounded-full bg-white"></div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-1 pt-4">
                  <h3 className="text-lg font-medium">Email Recipients</h3>
                  <p className="text-sm text-gray-500">
                    Add email addresses to receive notifications
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <input 
                    type="email" 
                    placeholder="Enter email address" 
                    className="flex-1 px-3 py-2 border rounded-md"
                  />
                  <button className="px-4 py-2 bg-primary text-white rounded-md">
                    Add
                  </button>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                    <span>manager@example.com</span>
                    <button className="text-red-500 hover:text-red-700">
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="printing" className="mt-0">
              <PrintSettings />
            </TabsContent>
            
            <TabsContent value="advanced" className="mt-0">
              <div className="space-y-6 p-6 pt-0">
                <div className="flex flex-col gap-1">
                  <h3 className="text-lg font-medium">System Settings</h3>
                  <p className="text-sm text-gray-500">
                    Advanced configuration options for the application
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium">Debug Mode</label>
                      <p className="text-xs text-gray-500">
                        Enable detailed logging for troubleshooting
                      </p>
                    </div>
                    <div className="h-6 w-11 rounded-full bg-gray-200 flex items-center p-1 cursor-pointer">
                      <div className="h-4 w-4 rounded-full bg-white"></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium">Cache Management</label>
                      <p className="text-xs text-gray-500">
                        Control how the application caches data
                      </p>
                    </div>
                    <button className="px-3 py-1 text-sm border rounded-md hover:bg-gray-50">
                      Clear Cache
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">API Endpoint</label>
                    <input 
                      type="text" 
                      value="https://api.example.com/v1" 
                      className="w-full px-3 py-2 border rounded-md"
                    />
                    <p className="text-xs text-gray-500">
                      The base URL for API requests
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Session Timeout (minutes)</label>
                    <input 
                      type="number" 
                      value="30" 
                      min="5" 
                      max="120" 
                      className="w-full px-3 py-2 border rounded-md"
                    />
                    <p className="text-xs text-gray-500">
                      Time before an inactive session is logged out
                    </p>
                  </div>
                </div>
                
                <div className="pt-4">
                  <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
                    Reset All Settings
                  </button>
                </div>
              </div>
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
};

export default Settings;
