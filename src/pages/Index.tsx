
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const Index: React.FC = () => {
  const navigate = useNavigate();

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col items-center justify-center bg-background p-4"
    >
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 text-primary">Welcome to Pizza Palace</h1>
        <p className="text-xl mb-8 text-muted-foreground">
          Delicious handcrafted pizzas made with the freshest ingredients.
        </p>
        
        <div className="space-y-4 md:space-y-0 md:space-x-4 flex flex-col md:flex-row justify-center">
          <Button 
            size="lg" 
            onClick={() => navigate('/menu')}
            className="bg-primary hover:bg-primary/90"
          >
            View Menu
          </Button>
          
          <Button 
            size="lg" 
            variant="outline"
            onClick={() => navigate('/admin')}
            className="border-primary text-primary hover:bg-primary/10"
          >
            Admin Dashboard
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default Index;
