
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, Loader2 } from 'lucide-react';
import { testPrintLatestOrder } from '@/utils/printUtils';
import { toast } from '@/components/ui/use-toast';

interface TestPrintButtonProps {
  disabled?: boolean;
}

const TestPrintButton = ({ disabled = false }: TestPrintButtonProps) => {
  const [loading, setLoading] = useState(false);
  
  const handleTestPrint = async () => {
    try {
      setLoading(true);
      console.log('Testing print with latest order...');
      
      const result = await testPrintLatestOrder();
      
      if (result.success) {
        toast({
          title: "Print Test Successful",
          description: result.message,
        });
        console.log('Print test successful:', result.message);
      } else {
        toast({
          title: "Print Test Failed",
          description: result.message,
          variant: "destructive",
        });
        console.error('Print test failed:', result.message);
      }
    } catch (error) {
      console.error('Error in test print:', error);
      toast({
        title: "Error",
        description: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleTestPrint} 
      disabled={disabled || loading}
      variant="outline"
      className="w-full md:w-auto bg-blue-50 hover:bg-blue-100 border-blue-200"
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Printer className="mr-2 h-4 w-4" />
      )}
      Test Print Latest Order
    </Button>
  );
};

export default TestPrintButton;
