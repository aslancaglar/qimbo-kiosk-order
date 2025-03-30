
import { useLanguage } from '@/context/LanguageContext';

export const useFormatCurrency = () => {
  const { language } = useLanguage();
  
  return (amount: number) => {
    return new Intl.NumberFormat(language === 'fr' ? 'fr-FR' : 'en-US', { 
      style: 'currency',
      currency: language === 'fr' ? 'EUR' : 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };
};

export const useFormatDate = () => {
  const { language } = useLanguage();
  
  return (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(language === 'fr' ? 'fr-FR' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(dateObj);
  };
};
