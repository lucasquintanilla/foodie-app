'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Minus, Plus, ShoppingCart, Trash2, Settings } from 'lucide-react'
import { useToast } from "@/components/ui/use-toast"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerFooter } from "@/components/ui/drawer"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from 'lucide-react'

type FoodItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  category: string;
  calories: number;
  preparationTime: string;
  allergens: string[];
};

type Config = {
  APP_NAME: string;
  APP_ICON: string;
  APP_PRODUCTS_URL: string;
  WHATSAPP_PHONE: string;
  CURRENCY_SIGN: string;
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
  COLLECTION_OPTIONS: Array<{ id: number; address: string }>;
  LANGUAGE: string;
  OPENING_HOURS: {
    [key: string]: { start: string; end: string };
  };
};

type TranslationKey = 'menu' | 'viewOrder' | 'yourOrder' | 'orderSummary' | 'total' | 'collectionLocation' | 'phoneNumber' | 'notes' | 'placeOrder' | 'configuration' | 'language' | 'saveChanges' | 'resetToDefault' | 'selectLanguage';

type Translations = {
  [key in TranslationKey]: string;
};

type LanguageTranslations = {
  [key: string]: Translations;
};

const DEFAULT_CONFIG: Config = {
  APP_NAME: 'FOODIE',
  APP_ICON: 'https://creativeclub.ie/bambino/bambino_logo.svg',
  APP_PRODUCTS_URL: 'https://creativeclub.ie/bambino/products.json',
  WHATSAPP_PHONE: '353830297520',
  CURRENCY_SIGN: '$',
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
    { id: 1, address: '37 Stephen Street Lower - Dublin, D02 T862' },
    { id: 2, address: '18 Merrion St Upper - Dublin 2, D02 X064' },
  ],
  LANGUAGE: 'es',
  OPENING_HOURS: {
    monday: { start: '09:00', end: '22:00' },
    tuesday: { start: '09:00', end: '22:00' },
    wednesday: { start: '00:00', end: '00:00' },
    thursday: { start: '09:00', end: '22:00' },
    friday: { start: '09:00', end: '23:00' },
    saturday: { start: '10:00', end: '23:00' },
    sunday: { start: '10:00', end: '21:00' },
  },
}

const translations: LanguageTranslations = {
  en: {
    menu: 'Menu',
    viewOrder: 'View Order',
    yourOrder: 'Your Order',
    orderSummary: 'Order Summary:',
    total: 'Total:',
    collectionLocation: 'Collection Location*',
    phoneNumber: 'Phone Number*',
    notes: 'Notes (Optional)',
    placeOrder: 'Place Order',
    configuration: 'App Configuration',
    language: 'Language',
    saveChanges: 'Save Changes',
    resetToDefault: 'Reset to Default',
    selectLanguage: 'Select Language',
  },
  es: {
    menu: 'Menú',
    viewOrder: 'Ver Pedido',
    yourOrder: 'Tu Pedido',
    orderSummary: 'Resumen del Pedido:',
    total: 'Total:',
    collectionLocation: 'Sucursal de Retiro*',
    phoneNumber: 'Número de Teléfono*',
    notes: 'Notas (Opcional)',
    placeOrder: 'Realizar Pedido',
    configuration: 'Configuración de la Aplicación',
    language: 'Idioma',
    saveChanges: 'Guardar',
    resetToDefault: 'Restablecer',
    selectLanguage: 'Seleccionar Idioma',
  },
}

export function FoodOrderApp() {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG)
  const [tempConfig, setTempConfig] = useState<Config>(config)
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [foodItems, setFoodItems] = useState<FoodItem[]>([])
  const [loading, setLoading] = useState(true)
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<{ collectionOption: string; phone: string }>({ collectionOption: '', phone: '' })
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [isOrderDrawerOpen, setIsOrderDrawerOpen] = useState(false)
  const [collectionOption, setCollectionOption] = useState<string | undefined>(undefined)
  const [isStoreOpen, setIsStoreOpen] = useState(true)
  const { toast } = useToast()

  const t = (key: TranslationKey): string => translations[config.LANGUAGE][key] || key

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        await new Promise(resolve => setTimeout(resolve, 1000));

        const response = await fetch(config.APP_PRODUCTS_URL)
        const data: FoodItem[] = await response.json()
        setFoodItems(data)
        setQuantities(data.reduce<Record<string, number>>((acc, item) => ({ ...acc, [item.id]: 0 }), {}))
      } catch (error) {
        console.error('Error fetching products:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
    checkStoreOpen()

    const interval = setInterval(checkStoreOpen, 60000)

    return () => clearInterval(interval)
  }, [config.APP_PRODUCTS_URL, config.OPENING_HOURS])

  const checkStoreOpen = () => {
    const now = new Date();
    const currentDay = now.toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
    const currentHour = now.getHours();

    const todayHours = config.OPENING_HOURS[currentDay];
    if (!todayHours) {
      setIsStoreOpen(false);
      return;
    }

    const [startHour] = todayHours.start.split(':').map(Number);
    const [endHour] = todayHours.end.split(':').map(Number);

    setIsStoreOpen(currentHour >= startHour && currentHour < endHour);
  }

  const categories = ['All', ...Array.from(new Set(foodItems.map(item => item.category)))]

  const updateQuantity = (item: string, change: number) => {
    setQuantities(prev => {
      const newQuantities = {
        ...prev,
        [item]: Math.max(0, (prev[item] || 0) + change)
      };

      if (Object.values(newQuantities).every(q => q === 0)) {
        setIsOrderDrawerOpen(false);
      }

      return newQuantities;
    });
  }

  const calculateTotal = () => {
    return foodItems.reduce((total, item) => {
      return total + (quantities[item.id] * item.price)
    }, 0)
  }

  const validatePhone = (phone: string): boolean => {
    const phonePattern = /^\d{10,15}$/
    return phonePattern.test(phone)
  }

  const validateInputs = () => {
    let isValid = true
    const newErrors = { collectionOption: '', phone: '' }

    if (!collectionOption) {
      newErrors.collectionOption = 'Please select a collection location.'
      isValid = false
    }

    if (!phone.trim() || !validatePhone(phone)) {
      newErrors.phone = 'Please enter a valid phone number (10-15 digits).'
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = () => {
    if (!isStoreOpen) {
      toast({
        title: "Store Closed",
        description: "Sorry, we are currently closed. Please try again during our opening hours.",
        variant: "destructive",
      })
      return
    }

    if (validateInputs() && calculateTotal() > 0) {
      submitOrder()
    } else if (calculateTotal() === 0) {
      toast({
        title: "Error",
        description: "Please select at least one item to order.",
        variant: "destructive",
      })
    }
  }

  const formatOrderMessage = () => {
    const orderNumber = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    const orderDate = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    const orderedItems = foodItems.filter(item => quantities[item.id] > 0)
    const subtotal = calculateTotal()
    const tax = subtotal * (config.TAX_PERCENTAGE / 100)
    const total = subtotal + tax

    let message = `**DEMO Order #${orderNumber}**\n\n`
    message += `${orderDate}\n\n`
    message += `**Order Summary:**\n`
    orderedItems.forEach(item => {
      const quantity = quantities[item.id]
      const itemTotal = quantity * item.price
      message += `• ${item.name} x${quantity} - ${config.CURRENCY_SIGN}${itemTotal.toFixed(2)}\n`
    })
    message += `\nSubtotal: ${config.CURRENCY_SIGN}${subtotal.toFixed(2)}\n`
    message += `Tax (${config.TAX_PERCENTAGE}%): ${config.CURRENCY_SIGN}${tax.toFixed(2)}\n`
    message += `**Total: ${config.CURRENCY_SIGN}${total.toFixed(2)}**\n\n`
    const selectedLocation = config.COLLECTION_OPTIONS.find(option => option.id.toString() === collectionOption)
    message += `Collection Address:\n${selectedLocation ? selectedLocation.address : 'Not selected'}\n\n`
    message += `Phone Number:\n${phone}`
    if (notes) {
      message += `\n\nNotes: ${notes}`
    }

    return message
  }

  const submitOrder = () => {
    const orderMessage = formatOrderMessage()
    const whatsAppLink = `https://wa.me/${config.WHATSAPP_PHONE}?text=${encodeURIComponent(orderMessage)}`
    window.open(whatsAppLink, '_blank')

    setIsOrderDrawerOpen(false)
    toast({
      title: "Order Placed Successfully!",
      description: "Your order has been sent via WhatsApp.",
    })
  }

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.readOnly = false;
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.readOnly = true;
  };

  const isOrderEmpty = () => {
    return Object.values(quantities).every(quantity => quantity === 0);
  }

  const handleConfigChange = (key: keyof Config, value: string | number | object) => {
    setTempConfig(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleColorChange = (colorKey: keyof Config['COLORS'], value: string) => {
    setTempConfig(prev => ({
      ...prev,
      COLORS: {
        ...prev.COLORS,
        [colorKey]: value
      }
    }))
  }

  const saveConfig = () => {
    setConfig(tempConfig)
    setIsConfigOpen(false)
    toast({
      title: "Configuration Saved",
      description: "Your changes have been applied.",
    })
  }

  const resetConfig = () => {
    setTempConfig(DEFAULT_CONFIG)
    toast({
      title: "Configuration Reset",
      description: "Default settings have been restored.",
    })
  }

  return (
    <div className={`min-h-screen ${config.COLORS.background} pb-20`}>
      <header className={`sticky top-0 ${config.COLORS.primary} ${config.COLORS.headerText} py-4 shadow-md z-10`}>
        <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">{config.APP_NAME}</h1>
          <img
            src={config.APP_ICON}
            alt={`${config.APP_NAME} Logo`}
            className="h-8 w-auto filter invert"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsConfigOpen(true)}
            className="text-white"
          >
            <Settings className="h-6 w-6" />
          </Button>
        </div>
      </header>

      {!isStoreOpen && (
        <Alert variant="destructive" className="rounded-none">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="font-bold">Store Closed</AlertTitle>
          <AlertDescription>
            Sorry, we are currently closed. 
            {/* Today's opening hours are {config.OPENING_HOURS[new Date().toLocaleString('en-US', { weekday: 'long' }).toLowerCase()].start} - {config.OPENING_HOURS[new Date().toLocaleString('en-US', { weekday: 'long' }).toLowerCase()].end}. */}
          </AlertDescription>
        </Alert>
      )}
      <main className="max-w-6xl mx-auto p-4">
        <section className="mb-8">
          <h2 className={`text-2xl font-bold mb-4 ${config.COLORS.text}`}>{t('menu')}</h2>
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex space-x-2 py-2 no-scrollbar">
              {categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category)}
                  className={`flex-shrink-0 ${selectedCategory === category ? config.COLORS.primary : config.COLORS.secondary}`}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
            {loading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <SkeletonFoodItem key={index} />
              ))
            ) : (
              foodItems
                .filter(item => selectedCategory === 'All' || item.category === selectedCategory)
                .map((item) => (
                  <Drawer key={item.id}>
                    <DrawerTrigger asChild>
                      <Button
                        className="p-0 h-auto block w-full"
                        variant="ghost"
                        aria-label={`View details for ${item.name}`}
                      >
                        <Card className={`overflow-hidden ${config.COLORS.background}`}>
                          <img src={item.image} alt={item.name} className="w-full h-48 object-cover" />
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className={`font-semibold text-lg ${config.COLORS.text}`}>{item.name}</h3>
                            </div>
                            <p className={`text-sm mb-2 text-muted-foreground line-clamp-2 overflow-hidden text-left`}>{item.description}</p>
                            <div className="flex items-center justify-between">
                              <p className={`text-xl font-bold ${config.COLORS.text}`}>{config.CURRENCY_SIGN}{item.price.toFixed(2)}</p>
                              <div className="flex items-center space-x-2">
                                <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, -1); }}>
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className={`text-lg font-semibold w-8 text-center ${config.COLORS.text}`}>
                                  {quantities[item.id]}
                                </span>
                                <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, 1); }}>
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Button>
                    </DrawerTrigger>
                    <DrawerContent>
                      <div className="mx-auto w-full max-w-sm">
                        <DrawerHeader>
                          <DrawerTitle>{item.name}</DrawerTitle>
                          <DrawerDescription>{item.description}</DrawerDescription>
                        </DrawerHeader>
                        <div className="p-4 pb-0">
                          <div className="flex items-center justify-between">
                            <p className={`text-xl font-semibold ${config.COLORS.text}`}>{config.CURRENCY_SIGN}{item.price.toFixed(2)}</p>
                            <div className="flex items-center space-x-2">
                              <Button size="sm" variant="outline" onClick={() => updateQuantity(item.id, -1)}>
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className={`text-lg font-semibold w-8 text-center ${config.COLORS.text}`}>
                                {quantities[item.id]}
                              </span>
                              <Button size="sm" variant="outline" onClick={() => updateQuantity(item.id, 1)}>
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className={`space-y-2 mt-4 ${config.COLORS.text}`}>
                            <p><strong>Calories:</strong> {item.calories}</p>
                            <p><strong>Preparation Time:</strong> {item.preparationTime}</p>
                          </div>
                          <div className="mt-4">
                            <strong className={config.COLORS.text}>Allergens:</strong>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {item.allergens.map(allergen => (
                                <Badge key={allergen} variant="secondary" className={config.COLORS.accent}>{allergen}</Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        <DrawerFooter>
                          <Button onClick={() => updateQuantity(item.id, 1)}>Add to Order</Button>
                          <DrawerClose asChild>
                            <Button variant="outline">Close</Button>
                          </DrawerClose>
                        </DrawerFooter>
                      </div>
                    </DrawerContent>
                  </Drawer>
                ))
            )}
          </div>
        </section>
      </main>

      {!isOrderEmpty() && (
        <Drawer open={isOrderDrawerOpen} onOpenChange={setIsOrderDrawerOpen}>
          <DrawerTrigger asChild>
            <Button
              className={`fixed bottom-4 left-4 right-4 z-50 text-lg py-6 ${config.COLORS.primary}`}
              size="lg"
              onClick={() => setIsOrderDrawerOpen(true)}
              disabled={!isStoreOpen}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              {t('viewOrder')} {config.CURRENCY_SIGN}{calculateTotal().toFixed(2)}
            </Button>
          </DrawerTrigger>
          <DrawerContent>
          <div className="mx-auto w-full max-w-sm">
            <DrawerHeader>
              <DrawerTitle>{t('yourOrder')}</DrawerTitle>
              <DrawerDescription>{t('orderSummary')}</DrawerDescription>
            </DrawerHeader>
            <div className="p-4 pb-0">
              {foodItems.map((item) => (
                quantities[item.id] > 0 && (
                  <div key={item.id} className="flex justify-between items-center mb-2">
                    <span className={config.COLORS.text}>{item.name}: {quantities[item.id]} x {config.CURRENCY_SIGN}{item.price.toFixed(2)}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateQuantity(item.id, -quantities[item.id])}
                      aria-label={`Remove ${item.name} from order`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )
              ))}

              <p className={`font-bold mt-4 text-lg ${config.COLORS.text}`}>{t('total')} {config.CURRENCY_SIGN}{calculateTotal().toFixed(2)}</p>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <Label htmlFor="collectionOption" className={config.COLORS.text}>{t('collectionLocation')}</Label>
                <Select
                  value={collectionOption || ""}
                  onValueChange={(value) => setCollectionOption(value)}
                >
                  <SelectTrigger className={`w-full ${config.COLORS.text}`}>
                    <SelectValue placeholder="Select a collection location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="placeholder">Select a collection location</SelectItem>
                    {config.COLLECTION_OPTIONS.map(option => (
                      <SelectItem key={option.id} value={option.id.toString()}>
                        {option.address}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.collectionOption && <p className="text-red-500 text-sm mt-1">{errors.collectionOption}</p>}
              </div>
              <div>
                <Label htmlFor="phone" className={config.COLORS.text}>{t('phoneNumber')}</Label>
                <Input
                  id="phone"
                  placeholder="Ex: 0830297520"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  readOnly
                  aria-invalid={errors.phone ? "true" : "false"}
                  className={config.COLORS.text}
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>
              <div>
                <Label htmlFor="notes" className={config.COLORS.text}>{t('notes')}</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={config.COLORS.text}
                />
              </div>
            </div>
            <DrawerFooter>
              <Button onClick={handleSubmit} className={config.COLORS.primary} disabled={!isStoreOpen}>{t('placeOrder')}</Button>
              <DrawerClose asChild>
                <Button variant="outline">Close</Button>
              </DrawerClose>
            </DrawerFooter>
            </div>
          </DrawerContent>
        </Drawer>
      )}

      <Sheet open={isConfigOpen} onOpenChange={setIsConfigOpen}>
      <SheetContent 
          side="right" 
          className={`w-full sm:w-[400px] md:w-[540px] ${config.COLORS.background}`}
        >
          <SheetHeader>
            <SheetTitle className={config.COLORS.text}>{t('configuration')}</SheetTitle>
          </SheetHeader>
          <div className="mt-4 h-[calc(100vh-8rem)] overflow-y-auto pr-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="appName" className={config.COLORS.text}>App Name</Label>
                <Input
                  id="appName"
                  value={tempConfig.APP_NAME}
                  onChange={(e) => handleConfigChange('APP_NAME', e.target.value)}
                  className={config.COLORS.text}
                />
              </div>
              <div>
                <Label htmlFor="appIcon" className={config.COLORS.text}>App Icon URL</Label>
                <Input
                  id="appIcon"
                  value={tempConfig.APP_ICON}
                  onChange={(e) => handleConfigChange('APP_ICON', e.target.value)}
                  className={config.COLORS.text}
                />
              </div>
              <div>
                <Label htmlFor="productsUrl" className={config.COLORS.text}>Products JSON URL</Label>
                <Input
                  id="productsUrl"
                  value={tempConfig.APP_PRODUCTS_URL}
                  onChange={(e) => handleConfigChange('APP_PRODUCTS_URL', e.target.value)}
                  className={config.COLORS.text}
                />
              </div>
              <div>
                <Label htmlFor="whatsappPhone" className={config.COLORS.text}>WhatsApp Phone Number</Label>
                <Input
                  id="whatsappPhone"
                  value={tempConfig.WHATSAPP_PHONE}
                  onChange={(e) => handleConfigChange('WHATSAPP_PHONE', e.target.value)}
                  className={config.COLORS.text}
                />
              </div>
              <div>
                <Label htmlFor="currencySign" className={config.COLORS.text}>Currency Sign</Label>
                <Input
                  id="currencySign"
                  value={tempConfig.CURRENCY_SIGN}
                  onChange={(e) => handleConfigChange('CURRENCY_SIGN', e.target.value)}
                  className={config.COLORS.text}
                />
              </div>
              <div>
                <Label htmlFor="taxPercentage" className={config.COLORS.text}>Tax Percentage</Label>
                <Input
                  id="taxPercentage"
                  type="number"
                  value={tempConfig.TAX_PERCENTAGE}
                  onChange={(e) => handleConfigChange('TAX_PERCENTAGE', parseFloat(e.target.value))}
                  className={config.COLORS.text}
                />
              </div>
              <div>
                <Label htmlFor="language" className={config.COLORS.text}>{t('language')}</Label>
                <Select
                  value={tempConfig.LANGUAGE}
                  onValueChange={(value) => handleConfigChange('LANGUAGE', value)}
                >
                  <SelectTrigger className={`w-full ${config.COLORS.text} bg-background`}>
                    <SelectValue placeholder={t('selectLanguage')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className={config.COLORS.text}>Colors</Label>
                <div className="space-y-2 mt-2">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="color-primary" className={config.COLORS.text}>Primary</Label>
                    <Select
                      value={tempConfig.COLORS.primary.split(' ')[0].replace('bg-', '').split('-')[0]}
                      onValueChange={(value) => handleColorChange('primary', `bg-${value}-600 text-white`)}
                    >
                      <SelectTrigger className={`w-full ${config.COLORS.text} bg-background`}>
                        <SelectValue placeholder="Select primary color" />
                      </SelectTrigger>
                      <SelectContent>
                        {['red', 'blue', 'green', 'yellow', 'purple', 'pink', 'indigo', 'gray'].map((color) => (
                          <SelectItem key={color} value={color}>{color}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="color-secondary" className={config.COLORS.text}>Secondary</Label>
                    <Select
                      value={tempConfig.COLORS.secondary.split(' ')[0].replace('bg-', '').split('-')[0]}
                      onValueChange={(value) => handleColorChange('secondary', `bg-${value}-200 text-gray-800`)}
                    >
                      <SelectTrigger className={`w-full ${config.COLORS.text} bg-background`}>
                        <SelectValue placeholder="Select secondary color" />
                      </SelectTrigger>
                      <SelectContent>
                        {['gray', 'red', 'blue', 'green', 'yellow', 'purple', 'pink', 'indigo'].map((color) => (
                          <SelectItem key={color} value={color}>{color}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="openingHours" className={config.COLORS.text}>Opening Hours</Label>
                {Object.entries(tempConfig.OPENING_HOURS).map(([day, hours]) => (
                  <div key={day} className="flex items-center space-x-2 mt-2">
                    <Label className={`w-24 ${config.COLORS.text}`}>{day.charAt(0).toUpperCase() + day.slice(1)}</Label>
                    <Select
                      value={hours.start}
                      onValueChange={(value) => handleConfigChange('OPENING_HOURS', {
                        ...tempConfig.OPENING_HOURS,
                        [day]: { ...hours, start: value }
                      })}
                    >
                      <SelectTrigger className={`w-28 ${config.COLORS.text}`}>
                        <SelectValue placeholder="Start" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                          <SelectItem key={hour} value={`${hour.toString().padStart(2, '0')}:00`}>
                            {`${hour.toString().padStart(2, '0')}:00`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className={config.COLORS.text}>-</span>
                    <Select
                      value={hours.end}
                      onValueChange={(value) => handleConfigChange('OPENING_HOURS', {
                        ...tempConfig.OPENING_HOURS,
                        [day]: { ...hours, end: value }
                      })}
                    >
                      <SelectTrigger className={`w-28 ${config.COLORS.text}`}>
                        <SelectValue placeholder="End" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                          <SelectItem key={hour} value={`${hour.toString().padStart(2, '0')}:00`}>
                            {`${hour.toString().padStart(2, '0')}:00`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-between mt-6">
              <Button onClick={resetConfig} variant="outline">{t('resetToDefault')}</Button>
              <Button onClick={saveConfig} className={config.COLORS.primary}>{t('saveChanges')}</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <footer className={`text-center py-6 text-sm ${config.COLORS.text}`}>
        <a
          href="https://creativeclub.ie/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
          onClick={(e) => {
            e.preventDefault();
            window.open('https://creativeclub.ie/', '_blank', 'noopener,noreferrer');
          }}
        >
          Made by Creative Club ❤
        </a>
      </footer>
    </div>
  )
}

function SkeletonFoodItem() {
  return (
    <div className="overflow-hidden bg-muted rounded-lg shadow-sm">
      <Skeleton className="h-[200px] w-full bg-gray-200" />
      <div className="p-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-[200px] bg-gray-200" />
        </div>
        <div className="flex justify-between items-center mt-4">
          <Skeleton className="h-6 w-[80px] bg-gray-200" />
          <div className="flex items-center space-x-2">
            <Skeleton className="h-8 w-8 rounded-full bg-gray-200" />
            <Skeleton className="h-8 w-8 rounded-full bg-gray-200" />
            <Skeleton className="h-8 w-8 rounded-full bg-gray-200" />
          </div>
        </div>
      </div>
    </div>
  );
}