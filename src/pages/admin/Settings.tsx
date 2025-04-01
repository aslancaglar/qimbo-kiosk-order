import React from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import PrinterSettings from '@/components/admin/PrinterSettings';
import { Separator } from '@/components/ui/separator';
import { Printer, Settings as SettingsIcon } from 'lucide-react';

const Settings: React.FC = () => {
  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center">
          <SettingsIcon className="h-6 w-6 mr-2" />
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>
        
        <Separator className="my-4" />
        
        <div className="grid grid-cols-1 gap-6">
          <section>
            <h2 className="text-lg font-semibold flex items-center mb-4">
              <Printer className="h-5 w-5 mr-2" />
              Receipt Printing
            </h2>
            <PrinterSettings />
          </section>
          
          {/* Other settings sections can be added here */}
        </div>
      </div>
    </AdminLayout>
  );
};

export default Settings;
