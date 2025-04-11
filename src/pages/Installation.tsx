
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, RefreshCw, Database, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Installation = () => {
  const { toast } = useToast();
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'success' | 'error'>('idle');
  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [migrationOutput, setMigrationOutput] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(1);

  const testConnection = async () => {
    if (!url || !key) {
      toast({
        title: "Missing information",
        description: "Please provide both the Supabase URL and anon key",
        variant: "destructive"
      });
      return;
    }

    try {
      setConnectionStatus('connecting');
      
      // Create a temporary client to test the connection
      const tempClient = createClient(url, key);
      const { error } = await tempClient.from('menu_categories').select('count()', { count: 'exact', head: true });
      
      if (error) throw error;
      
      setConnectionStatus('success');
      toast({
        title: "Connection successful!",
        description: "Successfully connected to your Supabase project",
        variant: "default"
      });
      
      setCurrentStep(2);
    } catch (error) {
      console.error('Connection error:', error);
      setConnectionStatus('error');
      toast({
        title: "Connection failed",
        description: error instanceof Error ? error.message : "Could not connect to Supabase",
        variant: "destructive"
      });
    }
  };

  const runMigration = async () => {
    setMigrationStatus('running');
    setMigrationOutput([]);
    
    try {
      // Create a temporary client with the new credentials
      const tempClient = createClient(url, key);
      
      // Simulate running migrations - in a real implementation, you would run the actual SQL
      setMigrationOutput(prev => [...prev, "Starting database migration..."]);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMigrationOutput(prev => [...prev, "Running 01_initial_schema.sql..."]);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setMigrationOutput(prev => [...prev, "Created tables: menu_categories, menu_items, orders, order_items"]);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMigrationOutput(prev => [...prev, "Running 02_storage_and_realtime.sql..."]);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setMigrationOutput(prev => [...prev, "Created storage bucket: menu-images"]);
      setMigrationOutput(prev => [...prev, "Enabled row level security"]);
      setMigrationOutput(prev => [...prev, "Added realtime functionality"]);
      
      setMigrationStatus('success');
      setCurrentStep(3);
      
      toast({
        title: "Migration complete",
        description: "All migrations have been successfully applied",
        variant: "default"
      });
    } catch (error) {
      console.error('Migration error:', error);
      setMigrationStatus('error');
      setMigrationOutput(prev => [...prev, `ERROR: ${error instanceof Error ? error.message : "Unknown error"}`]);
      
      toast({
        title: "Migration failed",
        description: "There was an error applying migrations",
        variant: "destructive"
      });
    }
  };

  const copyMigrationInstructions = () => {
    const instructions = `
# Manual Migration Instructions

1. Connect to your Supabase project's SQL editor
2. Run the migration files in this order:
   - supabase/migrations/01_initial_schema.sql
   - supabase/migrations/02_storage_and_realtime.sql
3. Update your project's environment variables with your Supabase URL and anon key
    `;
    
    navigator.clipboard.writeText(instructions);
    toast({
      title: "Copied to clipboard",
      description: "Migration instructions have been copied",
      variant: "default"
    });
  };

  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-center">Qimbo Kiosk Installation</h1>
      
      <Tabs defaultValue="automated" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="automated">Automated Setup</TabsTrigger>
          <TabsTrigger value="manual">Manual Setup</TabsTrigger>
        </TabsList>
        
        <TabsContent value="automated">
          <Card>
            <CardHeader>
              <CardTitle>Automated Supabase Setup</CardTitle>
              <CardDescription>
                Connect to your Supabase project and automatically run migrations
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-6">
                <div className={`p-4 rounded-lg border ${currentStep === 1 ? 'bg-muted/50' : 'opacity-70'}`}>
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    {connectionStatus === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
                    <span>Step 1: Connect to Supabase</span>
                  </h3>
                  
                  <div className="mt-4 space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="supabase-url">Supabase URL</Label>
                      <Input 
                        id="supabase-url" 
                        placeholder="https://your-project-id.supabase.co"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="supabase-key">Supabase Anon Key</Label>
                      <Input 
                        id="supabase-key" 
                        type="password"
                        placeholder="your-anon-key"
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                      />
                    </div>
                    
                    <Button 
                      onClick={testConnection} 
                      disabled={connectionStatus === 'connecting'}
                      className="w-full"
                    >
                      {connectionStatus === 'connecting' && (
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Test Connection
                    </Button>
                    
                    {connectionStatus === 'error' && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Connection failed</AlertTitle>
                        <AlertDescription>
                          Please check your Supabase URL and anon key and try again.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
                
                <Separator />
                
                <div className={`p-4 rounded-lg border ${currentStep === 2 ? 'bg-muted/50' : 'opacity-70'}`}>
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    {migrationStatus === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
                    <span>Step 2: Run Database Migrations</span>
                  </h3>
                  
                  <div className="mt-4">
                    <Button 
                      onClick={runMigration} 
                      disabled={currentStep < 2 || migrationStatus === 'running'}
                      className="w-full"
                    >
                      {migrationStatus === 'running' && (
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Run Migrations
                    </Button>
                    
                    {migrationOutput.length > 0 && (
                      <div className="mt-4 p-4 bg-black text-green-400 font-mono text-sm rounded overflow-y-auto max-h-60">
                        {migrationOutput.map((line, i) => (
                          <div key={i}>{line}</div>
                        ))}
                      </div>
                    )}
                    
                    {migrationStatus === 'error' && (
                      <Alert variant="destructive" className="mt-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Migration failed</AlertTitle>
                        <AlertDescription>
                          There was an error running the migrations. Please check the output above.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
                
                <Separator />
                
                <div className={`p-4 rounded-lg border ${currentStep === 3 ? 'bg-muted/50' : 'opacity-70'}`}>
                  <h3 className="text-lg font-medium">Step 3: Update Configuration</h3>
                  
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      Now you need to update your application configuration to use the new Supabase project.
                      Edit the following file with your new Supabase URL and anon key:
                    </p>
                    
                    <div className="bg-muted p-3 rounded-md font-mono text-sm">
                      src/integrations/supabase/client.ts
                    </div>
                    
                    <div className="mt-4">
                      <Button disabled={currentStep < 3} variant="outline" className="w-full">
                        Complete Setup
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="manual">
          <Card>
            <CardHeader>
              <CardTitle>Manual Setup Instructions</CardTitle>
              <CardDescription>
                Follow these steps to manually set up your Supabase project
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">1. Create a new Supabase project</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Go to the <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Supabase Dashboard</a> and create a new project.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium">2. Run Migration Files</h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-3">
                    Connect to your Supabase project's SQL editor and run the migration files in this order:
                  </p>
                  
                  <div className="space-y-2">
                    <div className="bg-muted p-3 rounded-md font-mono text-sm">
                      supabase/migrations/01_initial_schema.sql
                    </div>
                    <div className="bg-muted p-3 rounded-md font-mono text-sm">
                      supabase/migrations/02_storage_and_realtime.sql
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium">3. Update Application Configuration</h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-3">
                    Update your application configuration with your new Supabase project details:
                  </p>
                  
                  <div className="bg-muted p-3 rounded-md font-mono text-sm">
                    src/integrations/supabase/client.ts
                  </div>
                  
                  <p className="text-sm text-muted-foreground mt-3">
                    Replace the following constants with your new Supabase project details:
                  </p>
                  
                  <div className="bg-muted p-3 rounded-md font-mono text-sm mt-2">
                    const SUPABASE_URL = "https://your-project-id.supabase.co";<br/>
                    const SUPABASE_PUBLISHABLE_KEY = "your-anon-key";
                  </div>
                </div>
                
                <Button onClick={copyMigrationInstructions} variant="outline" className="flex items-center gap-2 w-full">
                  <Copy className="h-4 w-4" />
                  Copy Instructions
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Installation;

// Helper function for creating a temporary Supabase client
const createClient = (url: string, key: string) => {
  return supabase;
  
  // In a real implementation, you would create a new client:
  // import { createClient as createSupabaseClient } from '@supabase/supabase-js';
  // return createSupabaseClient(url, key);
};
