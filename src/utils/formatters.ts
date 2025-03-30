
import { Language } from '../context/LanguageContext';

/**
 * Format a number as currency based on the selected language
 * @param amount The amount to format
 * @param language The current language
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number, language: Language = 'en'): string => {
  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: language === 'fr' ? 'EUR' : 'USD',
    minimumFractionDigits: 2
  };
  
  const locale = language === 'fr' ? 'fr-FR' : 'en-US';
  return new Intl.NumberFormat(locale, options).format(amount);
};

/**
 * Format a date based on the selected language
 * @param date The date to format
 * @param language The current language
 * @returns Formatted date string
 */
export const formatDate = (date: Date, language: Language = 'en'): string => {
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  const locale = language === 'fr' ? 'fr-FR' : 'en-US';
  return new Intl.DateTimeFormat(locale, options).format(date);
};
