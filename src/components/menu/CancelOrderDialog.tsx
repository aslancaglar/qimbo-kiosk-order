
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLanguage } from '@/context/LanguageContext';

interface CancelOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const CancelOrderDialog: React.FC<CancelOrderDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const { t } = useLanguage();

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t.cart.cancelOrder}</AlertDialogTitle>
          <AlertDialogDescription>
            {t.cart.empty === "Your cart is empty" ? 
              "Are you sure you want to cancel your order? This will remove all items from your cart." :
              "Êtes-vous sûr de vouloir annuler votre commande? Cela supprimera tous les articles de votre panier."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-red-600 hover:bg-red-700">
            {t.common.confirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CancelOrderDialog;
