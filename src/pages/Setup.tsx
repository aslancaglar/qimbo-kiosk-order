
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from 'lucide-react';

const Setup: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);
  const [formData, setFormData] = useState({
    restaurantName: '',
    restaurantDescription: '',
    ownerEmail: '',
    ownerPassword: '',
    confirmPassword: '',
    currency: '€',
    taxRate: '10'
  });

  // Check if setup has already been completed
  useEffect(() => {
    const checkSetup = async () => {
      try {
        // Check if restaurant_info table has any data
        const { data, error } = await supabase
          .from('restaurant_info')
          .select('id')
          .limit(1);
        
        if (error) {
          console.error('Error checking setup status:', error);
          // If there's an error (like table doesn't exist), we assume setup is needed
          setCheckingSetup(false);
          return;
        }
        
        // If we have data, setup has been completed
        if (data && data.length > 0) {
          setInitialized(true);
          // Redirect to home after a short delay
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 1500);
        }
        
        setCheckingSetup(false);
      } catch (error) {
        console.error('Unexpected error:', error);
        setCheckingSetup(false);
      }
    };
    
    const restaurantId = localStorage.getItem('restaurantId');
    if (restaurantId) {
      setInitialized(true);
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 1500);
    } else {
      checkSetup();
    }
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateStep = () => {
    if (step === 1) {
      if (!formData.restaurantName.trim()) {
        toast({
          title: "Erreur",
          description: "Le nom du restaurant est requis",
          variant: "destructive"
        });
        return false;
      }
      return true;
    }
    
    if (step === 2) {
      if (!formData.ownerEmail.trim() || !formData.ownerPassword.trim()) {
        toast({
          title: "Erreur",
          description: "L'email et le mot de passe sont requis",
          variant: "destructive"
        });
        return false;
      }
      
      if (formData.ownerPassword !== formData.confirmPassword) {
        toast({
          title: "Erreur",
          description: "Les mots de passe ne correspondent pas",
          variant: "destructive"
        });
        return false;
      }
      
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.ownerEmail)) {
        toast({
          title: "Erreur",
          description: "Veuillez entrer une adresse email valide",
          variant: "destructive"
        });
        return false;
      }
      
      return true;
    }
    
    return true;
  };

  const nextStep = () => {
    if (validateStep()) {
      setStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep()) return;
    
    setLoading(true);
    
    try {
      // Generate a unique restaurant ID
      const restaurantId = `rest_${Date.now()}`;
      
      // Step 1: Initialize the database with the restaurant info
      const { error: restaurantError } = await supabase
        .from('restaurant_info')
        .insert([
          {
            name: formData.restaurantName,
            description: formData.restaurantDescription,
            restaurant_id: restaurantId,
            email: formData.ownerEmail,
            currency: formData.currency,
            tax_rate: parseFloat(formData.taxRate) / 100,
          }
        ]);
      
      if (restaurantError) {
        console.error('Error creating restaurant:', restaurantError);
        throw new Error(restaurantError.message);
      }
      
      // Store restaurant ID in local storage
      localStorage.setItem('restaurantId', restaurantId);
      
      // Step 2: Create initial settings
      const appearanceSettings = {
        logo: '',
        primaryColor: '#3b82f6',
        slideshowImages: []
      };
      
      const orderingSettings = {
        requireTableSelection: true,
        allowTakeaway: true,
        serviceCharge: 0
      };
      
      // Insert settings
      await supabase.from('settings').insert([
        { key: 'appearance_settings', value: appearanceSettings, restaurant_id: restaurantId },
        { key: 'ordering_settings', value: orderingSettings, restaurant_id: restaurantId }
      ]);
      
      // Success!
      toast({
        title: "Installation Réussie",
        description: "Votre kiosque de commande est prêt à l'emploi!",
      });
      
      // Redirect to home page
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 2000);
      
    } catch (error: any) {
      console.error('Setup error:', error);
      toast({
        title: "Erreur d'installation",
        description: error.message || "Une erreur est survenue durant l'installation",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingSetup) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-600">Vérification de l'installation...</p>
        </div>
      </div>
    );
  }

  if (initialized) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 13L9 17L19 7" stroke="rgb(22 163 74)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">Installation Déjà Complétée</h1>
          <p className="text-gray-600 mb-6">Votre kiosque est déjà configuré.</p>
          <Button onClick={() => navigate('/')}>Aller à l'accueil</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-lg shadow-lg w-full max-w-md p-6"
      >
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Installation Qimbo Kiosk</h1>
          <p className="text-gray-600">Configurez votre kiosque de commande</p>
        </div>
        
        <div className="mb-6">
          <div className="flex justify-between items-center">
            {[1, 2, 3].map(i => (
              <div 
                key={i} 
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step === i 
                    ? 'bg-primary text-white' 
                    : step > i 
                      ? 'bg-green-100 text-green-600 border border-green-600' 
                      : 'bg-gray-100 text-gray-400'
                }`}
              >
                {step > i ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  i
                )}
              </div>
            ))}
          </div>
          <div className="w-full bg-gray-200 h-1 mt-4">
            <div 
              className="bg-primary h-1 transition-all" 
              style={{ width: `${((step - 1) / 2) * 100}%` }}
            />
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="restaurantName">Nom du Restaurant *</Label>
                <Input
                  id="restaurantName"
                  name="restaurantName"
                  value={formData.restaurantName}
                  onChange={handleChange}
                  placeholder="Le Bistrot de Paris"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="restaurantDescription">Description</Label>
                <Textarea
                  id="restaurantDescription"
                  name="restaurantDescription"
                  value={formData.restaurantDescription}
                  onChange={handleChange}
                  placeholder="Spécialités françaises servies dans une ambiance chaleureuse..."
                  rows={3}
                />
              </div>
            </div>
          )}
          
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="ownerEmail">Email Admin *</Label>
                <Input
                  id="ownerEmail"
                  name="ownerEmail"
                  type="email"
                  value={formData.ownerEmail}
                  onChange={handleChange}
                  placeholder="admin@restaurant.com"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="ownerPassword">Mot de Passe *</Label>
                <Input
                  id="ownerPassword"
                  name="ownerPassword"
                  type="password"
                  value={formData.ownerPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="confirmPassword">Confirmer le Mot de Passe *</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
          )}
          
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="currency">Devise</Label>
                <Input
                  id="currency"
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  placeholder="€"
                />
              </div>
              
              <div>
                <Label htmlFor="taxRate">Taux de TVA (%)</Label>
                <Input
                  id="taxRate"
                  name="taxRate"
                  type="number"
                  value={formData.taxRate}
                  onChange={handleChange}
                  placeholder="10"
                  min="0"
                  max="30"
                />
              </div>
              
              <div className="text-sm text-gray-500 mt-4 border-l-4 border-blue-400 pl-3 py-2 bg-blue-50">
                <p>Ces paramètres pourront être modifiés plus tard dans l'interface d'administration.</p>
              </div>
            </div>
          )}
          
          <div className="flex justify-between mt-8">
            {step > 1 ? (
              <Button 
                type="button" 
                variant="outline" 
                onClick={prevStep}
              >
                Précédent
              </Button>
            ) : (
              <div></div>
            )}
            
            {step < 3 ? (
              <Button 
                type="button" 
                onClick={nextStep}
              >
                Suivant
              </Button>
            ) : (
              <Button 
                type="submit" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Installation...
                  </>
                ) : (
                  'Terminer l\'installation'
                )}
              </Button>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Setup;
