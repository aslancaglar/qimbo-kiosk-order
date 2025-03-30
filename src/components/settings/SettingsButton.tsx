
import React, { useState } from 'react';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PrintNodeSettings from './PrintNodeSettings';

const SettingsButton: React.FC = () => {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <Button 
        variant="ghost" 
        size="icon"
        onClick={() => setShowSettings(true)}
        className="rounded-full"
      >
        <Settings size={20} />
      </Button>
      
      <PrintNodeSettings 
        open={showSettings} 
        onOpenChange={setShowSettings} 
      />
    </>
  );
};

export default SettingsButton;
