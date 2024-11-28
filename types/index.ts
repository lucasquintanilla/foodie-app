export type ProductItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  category: string;
  calories: number;
  preparationTime: string;
  allergens: string[];
  displayOption: 'base' | 'compact' | 'noImage';
};

export type ShopConfig = {
  SHOP_NAME: string;
  SHOP_ICON: string;
  SHOP_PRODUCTS_URL: string;
  WHATSAPP_PHONE: string;
  CURRENCY_SIGN: string;
  PRICE_DECIMALS: number;
  TAX_PERCENTAGE: number;
  COLORS: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    headerText: string;
    headerBackground: string;
  };
  COLLECTION_OPTIONS: Array<{ id: number; address: string; locationURL: string }>;
  LANGUAGE: string;
  OPENING_HOURS: {
    [key: string]: { start: string; end: string };
  };
};

export type TranslationKey = 'menu' | 'viewOrder' | 'yourOrder' | 'order' | 'orderSummary' | 'total' | 'collectionLocation' | 'phoneNumber' | 'notes' | 'notesPlaceholder' | 'placeOrder' | 'configuration' | 'language' | 'saveChanges' | 'resetToDefault' | 'selectLanguage' | 'storeClosed' | 'storeClosedDescription' | 'orderPlacedSuccessfully' | 'orderSentViaWhatsApp' | 'errorTitle' | 'selectAtLeastOneItem' | 'invalidPhoneNumber' | 'selectCollectionLocation' | 'addToOrder' | 'orderBy' | 'close' | 'appName' | 'appIconUrl' | 'productsJsonUrl' | 'whatsappPhoneNumber' | 'currencySign' | 'taxPercentage' | 'colors' | 'primary' | 'secondary' | 'openingHours' | 'start' | 'end' | 'allergens' | 'all' | 'calories' | 'preparationTime' | 'viewOnMap' | 'add';

export type Translations = {
  [key in TranslationKey]: string;
};

export type LanguageTranslations = {
  [key: string]: Translations;
};