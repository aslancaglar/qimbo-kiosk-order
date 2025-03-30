
import React, { useEffect, useState } from 'react';
import WelcomePage from '../components/welcome/WelcomePage';
import { supabase } from '../integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';

const Index: React.FC = () => {
  const [restaurantInfo, setRestaurantInfo] = useState<{
    name: string;
    description: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchRestaurantInfo = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from('restaurant_info')
          .select('name, description')
          .order('id', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('Error fetching restaurant info:', error);
          setError(t.errors.failedToLoadRestaurantInfo);
          toast({
            title: t.common.error,
            description: t.errors.failedToLoadRestaurantInfo,
            variant: "destructive"
          });
          return;
        }

        if (data) {
          setRestaurantInfo(data);
        } else {
          // If no data found, set a default value or show an appropriate message
          setError(t.errors.noRestaurantInfoFound);
        }
      } catch (error) {
        console.error('Unexpected error:', error);
        setError(t.errors.unexpectedError);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurantInfo();
  }, [t]);

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="space-y-4 w-80">
          <Skeleton className="h-12 w-full rounded" />
          <Skeleton className="h-4 w-3/4 rounded" />
          <Skeleton className="h-32 w-full rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full w-full flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t.common.error}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return <WelcomePage restaurantInfo={restaurantInfo} />;
};

export default Index;
