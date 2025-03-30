
import { useLanguage } from '../context/LanguageContext';

export const useTranslation = () => {
  const { t, language, setLanguage } = useLanguage();
  
  return { t, language, setLanguage };
};
