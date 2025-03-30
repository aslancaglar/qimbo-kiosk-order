
export const en = {
  // Common
  common: {
    save: "Save",
    cancel: "Cancel",
    confirm: "Confirm",
    delete: "Delete",
    edit: "Edit",
    close: "Close",
    back: "Back",
    next: "Next",
    loading: "Loading...",
    error: "Error",
    success: "Success",
  },
  
  // Welcome Page
  welcome: {
    title: "Welcome to",
    dineIn: "Dine In",
    takeout: "Takeout",
    tableNumberTitle: "Table Number",
    tableNumberPlaceholder: "Enter table number",
    continueToMenu: "Continue to Menu",
  },

  // Menu Page
  menu: {
    title: "Menu",
    categories: {
      all: "All",
    },
    addToCart: "Add to Cart",
    viewCart: "View Cart",
    emptyCart: "Your cart is empty",
    cancelOrder: "Cancel Order",
    proceedToCheckout: "Proceed to Checkout",
    customize: "Customize Your",
    required: "Required",
    optional: "Optional",
    select: "Select",
    item: "item",
    items: "items",
  },
  
  // Cart
  cart: {
    title: "Your Order",
    empty: "Your cart is empty",
    total: "Total",
    tax: "Tax",
    cancelOrder: "Cancel Order",
    confirmOrder: "Confirm Order",
    continueOrdering: "Continue Ordering",
    itemRemoved: "Item removed from cart",
    confirmCancelTitle: "Cancel Order?",
    confirmCancelMessage: "Are you sure you want to cancel your order? All items in your cart will be lost.",
  },
  
  // Order
  order: {
    confirmation: "Order Confirmation",
    thankYou: "Thank you for your order!",
    orderNumber: "Order Number",
    estimatedTime: "Estimated preparation time",
    minutes: "minutes",
    tableNumber: "Table",
    orderType: "Order Type",
    dineIn: "Dine In",
    takeout: "Takeout",
    backToMenu: "Back to Menu",
  },
  
  // Admin - General
  admin: {
    dashboard: "Dashboard",
    orders: "Orders",
    menuItems: "Menu Items",
    categories: "Categories",
    toppings: "Toppings",
    settings: "Settings",
    kitchenDisplay: "Kitchen Display",
    exitAdmin: "Exit Admin",
    adminPanel: "Admin Panel",
  },
  
  // Admin - Settings
  settings: {
    general: "General",
    ordering: "Ordering",
    appearance: "Appearance",
    notifications: "Notifications",
    language: "Language",
    
    // Restaurant Info
    restaurantInfo: "Restaurant Information",
    restaurantInfoDesc: "Update your restaurant's basic information.",
    restaurantName: "Restaurant Name",
    phoneNumber: "Phone Number",
    address: "Address",
    description: "Description",
    saveChanges: "Save Changes",
    
    // Business Hours
    businessHours: "Business Hours",
    businessHoursDesc: "Set your restaurant's opening hours.",
    saveHours: "Save Hours",
    to: "to",
    
    // Ordering Options
    orderingOptions: "Ordering Options",
    orderingOptionsDesc: "Configure ordering options and customer experience settings.",
    requireTableSelection: "Require table selection for dine-in orders",
    requireTableSelectionDesc: "When disabled, customers can place dine-in orders without selecting a table number.",
    saveSettings: "Save Settings",
    
    // Appearance Settings
    appearanceSettings: "Appearance Settings",
    appearanceSettingsDesc: "Customize how your restaurant's ordering system looks.",
    comingSoon: "Appearance settings coming soon.",
    
    // Notification Settings
    notificationSettings: "Notification Settings",
    notificationSettingsDesc: "Configure how you receive order notifications.",
    notificationsComingSoon: "Notification settings coming soon.",
    
    // Language Settings
    languageSettings: "Language Settings",
    languageSettingsDesc: "Change the display language of your restaurant's ordering system.",
    selectLanguage: "Select Language",
    english: "English",
    french: "French",
  },

  // Errors
  errors: {
    failedToLoad: "Failed to load",
    unexpectedError: "An unexpected error occurred",
    requiredField: "This field is required",
    maximumReached: "You can only select up to",
    itemsFrom: "items from",
    required: "Required",
  },
  
  // Toast Messages
  toast: {
    errorTitle: "Error",
    successTitle: "Success",
    failedToLoadRestaurantInfo: "Failed to load restaurant information",
    restaurantInfoUpdated: "Restaurant information updated successfully",
    failedToUpdateRestaurantInfo: "Failed to update restaurant information",
    businessHoursUpdated: "Business hours updated successfully",
    failedToUpdateBusinessHours: "Failed to update business hours for",
    orderingSettingsSaved: "Ordering settings saved successfully",
    failedToSaveOrderingSettings: "Failed to save ordering settings",
    languageChanged: "Language changed successfully",
  },
};

export default en;
