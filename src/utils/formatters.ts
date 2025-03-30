
/**
 * Format a number as currency based on the specified language
 * @param value The numeric value to format
 * @param language The language code ('en' or 'fr')
 * @returns Formatted currency string
 */
export const formatCurrency = (value: number, language = 'en'): string => {
  return new Intl.NumberFormat(language === 'fr' ? 'fr-FR' : 'en-US', {
    style: 'currency',
    currency: language === 'fr' ? 'EUR' : 'USD',
  }).format(value);
};

/**
 * Format a date as a string based on the specified language
 * @param date The date to format
 * @param language The language code ('en' or 'fr')
 * @returns Formatted date string
 */
export const formatDate = (date: Date, language = 'en'): string => {
  return new Intl.DateTimeFormat(language === 'fr' ? 'fr-FR' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

/**
 * Format a time as a string based on the specified language
 * @param date The date/time to format
 * @param language The language code ('en' or 'fr')
 * @returns Formatted time string
 */
export const formatTime = (date: Date, language = 'en'): string => {
  return new Intl.DateTimeFormat(language === 'fr' ? 'fr-FR' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};
