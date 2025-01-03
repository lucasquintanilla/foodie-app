import { ShopConfig, LanguageTranslations } from '@/types'

export const DEFAULT_CONFIG: ShopConfig = {
  SHOP_NAME: 'Foodie',
  SHOP_ICON: 'https://creativeclub.ie/foodie_icon.svg',
  SHOP_PRODUCTS_URL: 'https://creativeclub.ie/bambino/products.json',
  WHATSAPP_PHONE: '353830297520',
  CURRENCY_SIGN: '$',
  PRICE_DECIMALS: 2,
  TAX_PERCENTAGE: 10,
  COLORS: {
    primary: 'bg-black text-white',
    secondary: 'bg-gray-200 text-gray-800',
    accent: 'bg-yellow-400 text-gray-900',
    background: 'bg-gray-100',
    text: 'text-gray-900',
    headerText: 'text-white',
    headerBackground: 'bg-gray-900',
  },
  COLLECTION_OPTIONS: [
    { id: 1, address: '37 Stephen Street Lower - Dublin, D02 T862', locationURL: 'https://maps.app.goo.gl/qCPACXYW9pFXtmSi8' },
    { id: 2, address: '18 Merrion St Upper - Dublin 2, D02 X064', locationURL: 'https://maps.app.goo.gl/qCPACXYW9pFXtmSi8' },
  ],
  LANGUAGE: 'es',
  OPENING_HOURS: {
    monday: { start: '09:00', end: '22:00' },
    tuesday: { start: '00:00', end: '22:00' },
    wednesday: { start: '09:00', end: '23:00' },
    thursday: { start: '00:00', end: '22:00' },
    friday: { start: '09:00', end: '23:00' },
    saturday: { start: '10:00', end: '23:00' },
    sunday: { start: '10:00', end: '21:00' },
  },
}

export const translations: LanguageTranslations = {
  en: {
    menu: 'Menu',
    viewOrder: 'View Order',
    yourOrder: 'Your Order',
    order: 'Order',
    orderSummary: 'Order Summary:',
    total: 'Total:',
    collectionLocation: 'Collection Location',
    phoneNumber: 'Phone Number',
    notes: 'Notes (Optional)',
    notesPlaceholder: 'Add any additional notes',
    placeOrder: 'Place Order',
    configuration: 'App Configuration',
    language: 'Language',
    saveChanges: 'Save Changes',
    resetToDefault: 'Reset to Default',
    selectLanguage: 'Select Language',
    storeClosed: 'Store Closed',
    storeClosedDescription: 'Sorry, we are currently closed. Please try again during our opening hours.',
    orderPlacedSuccessfully: 'Order Placed Successfully!',
    orderSentViaWhatsApp: 'Your order has been sent via WhatsApp.',
    errorTitle: 'Error',
    selectAtLeastOneItem: 'Please select at least one item to order.',
    invalidPhoneNumber: 'Please enter a valid phone number (10-15 digits).',
    selectCollectionLocation: 'Please select a collection location.',
    addToOrder: 'Add to Order',
    orderBy: 'Order by',
    close: 'Close',
    appName: 'Shop Name',
    appIconUrl: 'App Icon URL',
    productsJsonUrl: 'Products JSON URL',
    whatsappPhoneNumber: 'WhatsApp Phone Number',
    currencySign: 'Currency Sign',
    taxPercentage: 'Tax (%)',
    colors: 'Colors',
    primary: 'Primary',
    secondary: 'Secondary',
    openingHours: 'Opening Hours',
    start: 'Start',
    end: 'End',
    allergens: 'Allergens',
    all: 'All',
    calories: 'Calories',
    preparationTime: 'Preparation Time',
    viewOnMap: 'View on Map',
    add: 'Add'
  },
  es: {
    menu: 'Menú',
    viewOrder: 'Ver Pedido',
    yourOrder: 'Tu Pedido',
    order: 'Pedido',
    orderSummary: 'Detalle del Pedido',
    total: 'Total:',
    collectionLocation: 'Sucursal de Retiro',
    phoneNumber: 'Número de Teléfono',
    notes: 'Notas (Opcional)',
    notesPlaceholder: 'Agrega una nota a tu pedido',
    placeOrder: 'Pedir via WhatsApp',
    configuration: 'Configuración',
    language: 'Idioma',
    saveChanges: 'Guardar',
    resetToDefault: 'Restablecer',
    selectLanguage: 'Seleccionar Idioma',
    storeClosed: 'Tienda Cerrada',
    storeClosedDescription: 'Lo sentimos, actualmente estamos cerrados. Por favor, inténtelo de nuevo durante nuestro horario de apertura.',
    orderPlacedSuccessfully: '¡Pedido Realizado con Éxito!',
    orderSentViaWhatsApp: 'Su pedido ha sido enviado por WhatsApp.',
    errorTitle: 'Error',
    selectAtLeastOneItem: 'Por favor, seleccione al menos un artículo para pedir.',
    invalidPhoneNumber: 'Por favor, introduzca un número de teléfono válido (10-15 dígitos).',
    selectCollectionLocation: 'Seleccione una sucursal de retiro.',
    addToOrder: 'Añadir al Pedido',
    orderBy: 'Pedido por',
    close: 'Cerrar',
    appName: 'Nombre de la Tienda',
    appIconUrl: 'Icono de la Tienda',
    productsJsonUrl: 'Enlace de Productos',
    whatsappPhoneNumber: 'WhatsApp de la Tienda',
    currencySign: 'Signo de Moneda',
    taxPercentage: 'Impuestos (%)',
    colors: 'Colores',
    primary: 'Primario',
    secondary: 'Secundario',
    openingHours: 'Horarios de Apertura',
    start: 'Inicio',
    end: 'Fin',
    allergens: 'Alérgenos',
    all: 'Todo',
    calories: 'Calorias',
    preparationTime: 'Tiempo de Preparación',
    viewOnMap: 'Ver Mapa',
    add: 'Agregar'
  }
}