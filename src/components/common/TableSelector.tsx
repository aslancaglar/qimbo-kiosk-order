
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Button from './Button';

interface TableSelectorProps {
  onSelectTable: (tableNumber: number) => void;
  onBack: () => void;
}

const TableSelector: React.FC<TableSelectorProps> = ({ onSelectTable, onBack }) => {
  const [tableNumber, setTableNumber] = useState<number | null>(null);
  
  // Generate table numbers (1-20)
  const tables = Array.from({ length: 20 }, (_, i) => i + 1);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="p-6 rounded-xl bg-white shadow-medium max-w-lg w-full mx-auto"
    >
      <h2 className="text-2xl font-semibold mb-6 text-center">Select Your Table</h2>
      
      <div className="grid grid-cols-4 gap-4 mb-8">
        {tables.map((number) => (
          <motion.button
            key={number}
            whileTap={{ scale: 0.95 }}
            onClick={() => setTableNumber(number)}
            className={`flex items-center justify-center p-4 rounded-md text-xl font-medium transition-all
              ${tableNumber === number
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary hover:bg-secondary/80'
              }`}
          >
            {number}
          </motion.button>
        ))}
      </div>
      
      <div className="flex gap-4">
        <Button 
          variant="outline" 
          size="full" 
          onClick={onBack}
        >
          Cancel
        </Button>
        <Button 
          size="full" 
          disabled={tableNumber === null}
          onClick={() => tableNumber !== null && onSelectTable(tableNumber)}
        >
          Confirm
        </Button>
      </div>
    </motion.div>
  );
};

export default TableSelector;
