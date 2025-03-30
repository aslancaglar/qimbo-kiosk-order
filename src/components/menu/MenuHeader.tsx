
import React from 'react';
import { Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../common/Button';
import { useLanguage } from '@/context/LanguageContext';

interface MenuHeaderProps {
  title?: string;
}

const MenuHeader: React.FC<MenuHeaderProps> = ({ title }) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <header className="flex justify-between items-center p-4 bg-red-600 text-white">
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => navigate('/')}
        className="rounded-full text-white hover:bg-red-700"
      >
        <Home size={24} />
      </Button>
      
      <h1 className="text-2xl font-bold">{title || t.menu.title}</h1>
      
      <div className="w-10"></div>
    </header>
  );
};

export default MenuHeader;
