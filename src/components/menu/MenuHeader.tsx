
import React from 'react';
import { Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../common/Button';

interface MenuHeaderProps {
  title?: string;
}

const MenuHeader: React.FC<MenuHeaderProps> = ({ title = "Menu" }) => {
  const navigate = useNavigate();

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
      
      <h1 className="text-2xl font-bold">{title}</h1>
      
      <div className="w-10"></div>
    </header>
  );
};

export default MenuHeader;
