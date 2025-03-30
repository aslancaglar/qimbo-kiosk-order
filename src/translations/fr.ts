
export const fr = {
  // Common
  common: {
    save: "Enregistrer",
    cancel: "Annuler",
    confirm: "Confirmer",
    delete: "Supprimer",
    edit: "Modifier",
    close: "Fermer",
    back: "Retour",
    next: "Suivant",
    loading: "Chargement...",
    error: "Erreur",
    success: "Succès",
  },
  
  // Welcome Page
  welcome: {
    title: "Bienvenue à",
    dineIn: "Sur place",
    takeout: "À emporter",
    tableNumberTitle: "Numéro de table",
    tableNumberPlaceholder: "Entrez le numéro de table",
    continueToMenu: "Continuer vers le menu",
  },

  // Menu Page
  menu: {
    title: "Menu",
    categories: {
      all: "Tous",
    },
    addToCart: "Ajouter au panier",
    viewCart: "Voir le panier",
    emptyCart: "Votre panier est vide",
    cancelOrder: "Annuler la commande",
    proceedToCheckout: "Passer à la caisse",
    customize: "Personnaliser votre",
    required: "Obligatoire",
    optional: "Optionnel",
    select: "Sélectionner",
    item: "élément",
    items: "éléments",
  },
  
  // Cart
  cart: {
    title: "Votre commande",
    empty: "Votre panier est vide",
    total: "Total",
    tax: "Taxe",
    cancelOrder: "Annuler la commande",
    confirmOrder: "Confirmer la commande",
    continueOrdering: "Continuer la commande",
    itemRemoved: "Article retiré du panier",
    confirmCancelTitle: "Annuler la commande ?",
    confirmCancelMessage: "Êtes-vous sûr de vouloir annuler votre commande ? Tous les articles de votre panier seront perdus.",
  },
  
  // Order
  order: {
    confirmation: "Confirmation de commande",
    thankYou: "Merci pour votre commande !",
    orderNumber: "Numéro de commande",
    estimatedTime: "Temps de préparation estimé",
    minutes: "minutes",
    tableNumber: "Table",
    orderType: "Type de commande",
    dineIn: "Sur place",
    takeout: "À emporter",
    backToMenu: "Retour au menu",
  },
  
  // Admin - General
  admin: {
    dashboard: "Tableau de bord",
    orders: "Commandes",
    menuItems: "Articles du menu",
    categories: "Catégories",
    toppings: "Garnitures",
    settings: "Paramètres",
    kitchenDisplay: "Affichage cuisine",
    exitAdmin: "Quitter l'admin",
    adminPanel: "Panneau d'administration",
  },
  
  // Admin - Settings
  settings: {
    general: "Général",
    ordering: "Commande",
    appearance: "Apparence",
    notifications: "Notifications",
    language: "Langue",
    
    // Restaurant Info
    restaurantInfo: "Informations du restaurant",
    restaurantInfoDesc: "Mettez à jour les informations de base de votre restaurant.",
    restaurantName: "Nom du restaurant",
    phoneNumber: "Numéro de téléphone",
    address: "Adresse",
    description: "Description",
    saveChanges: "Enregistrer les modifications",
    
    // Business Hours
    businessHours: "Heures d'ouverture",
    businessHoursDesc: "Définissez les heures d'ouverture de votre restaurant.",
    saveHours: "Enregistrer les heures",
    to: "à",
    
    // Ordering Options
    orderingOptions: "Options de commande",
    orderingOptionsDesc: "Configurez les options de commande et les paramètres d'expérience client.",
    requireTableSelection: "Exiger la sélection d'une table pour les commandes sur place",
    requireTableSelectionDesc: "Lorsque cette option est désactivée, les clients peuvent passer des commandes sur place sans sélectionner de numéro de table.",
    saveSettings: "Enregistrer les paramètres",
    
    // Appearance Settings
    appearanceSettings: "Paramètres d'apparence",
    appearanceSettingsDesc: "Personnalisez l'apparence du système de commande de votre restaurant.",
    comingSoon: "Paramètres d'apparence à venir.",
    
    // Notification Settings
    notificationSettings: "Paramètres de notification",
    notificationSettingsDesc: "Configurez la façon dont vous recevez les notifications de commande.",
    notificationsComingSoon: "Paramètres de notification à venir.",
    
    // Language Settings
    languageSettings: "Paramètres de langue",
    languageSettingsDesc: "Changez la langue d'affichage du système de commande de votre restaurant.",
    selectLanguage: "Sélectionner la langue",
    english: "Anglais",
    french: "Français",
  },

  // Errors
  errors: {
    failedToLoad: "Échec du chargement",
    unexpectedError: "Une erreur inattendue est survenue",
    requiredField: "Ce champ est obligatoire",
    maximumReached: "Vous ne pouvez sélectionner que",
    itemsFrom: "éléments de",
    required: "Obligatoire",
  },
  
  // Toast Messages
  toast: {
    errorTitle: "Erreur",
    successTitle: "Succès",
    failedToLoadRestaurantInfo: "Échec du chargement des informations du restaurant",
    restaurantInfoUpdated: "Informations du restaurant mises à jour avec succès",
    failedToUpdateRestaurantInfo: "Échec de la mise à jour des informations du restaurant",
    businessHoursUpdated: "Heures d'ouverture mises à jour avec succès",
    failedToUpdateBusinessHours: "Échec de la mise à jour des heures d'ouverture pour",
    orderingSettingsSaved: "Paramètres de commande enregistrés avec succès",
    failedToSaveOrderingSettings: "Échec de l'enregistrement des paramètres de commande",
    languageChanged: "Langue changée avec succès",
  },
};

export default fr;
