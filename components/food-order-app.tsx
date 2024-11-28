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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerFooter } from "@/components/ui/drawer"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from 'lucide-react'
import { Separator } from "@/components/ui/separator"
import { TranslationKey, ProductItem, ShopConfig } from "@/types"
import { translations, DEFAULT_CONFIG } from '@/config/constants'
// import { SkeletonProductItem } from "@/components/SkeletonProductItem"
// import { Footer } from "@/components/Footer"
import { Skeleton } from "@/components/ui/skeleton"

export function ShopApp() {

  const t = (key: TranslationKey): string => translations[config.LANGUAGE][key] || key

  const [config, setConfig] = useState<ShopConfig>(DEFAULT_CONFIG)
  const [tempConfig, setTempConfig] = useState<ShopConfig>(config)
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [productItems, setProductItems] = useState<ProductItem[]>([])
  const [loading, setLoading] = useState(true)
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<{ collectionOption: string; phone: string }>({ collectionOption: '', phone: '' })
  const [selectedCategory, setSelectedCategory] = useState(t('all'))
  const [isOrderDrawerOpen, setIsOrderDrawerOpen] = useState(false)
  const [collectionOption, setCollectionOption] = useState<string | undefined>(undefined)
  const [isStoreOpen, setIsStoreOpen] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchShopData = async () => {
      setLoading(true);

      try {
        const shopName = getShopNameFromURL();

        if (!shopName) {
          await loadDefaultConfig();
        } else {
          await loadShopConfig(shopName);
        }
      } catch (error) {
        handleError(error);
      } finally {
        setLoading(false);
      }
    };

    const getShopNameFromURL = (): string | null => {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('shop');
    };

    const loadDefaultConfig = async () => {
      setConfig(DEFAULT_CONFIG);

      try {
        const response = await fetch(DEFAULT_CONFIG.SHOP_PRODUCTS_URL);
        const data: ProductItem[] = await response.json();

        setProductItems(data);
        initializeQuantities(data);
      } catch (error) {
        console.error("Error loading default shop data:", error);
        throw error;
      }
    };

    const loadShopConfig = async (shopName: string) => {
      try {
        // Fetch configuration
        const configResponse = await fetch(`https://creativeclub.ie/${shopName}/configuration.json`);
        const configData: ShopConfig = await configResponse.json();

        setConfig(configData);
        setTempConfig(configData);

        // Fetch products
        const productsResponse = await fetch(configData.SHOP_PRODUCTS_URL);
        const productsData: ProductItem[] = await productsResponse.json();

        setProductItems(productsData);
        initializeQuantities(productsData);
      } catch (error) {
        console.error(`Error loading shop config for "${shopName}":`, error);
        throw error;
      }
    };

    const initializeQuantities = (data: ProductItem[]) => {
      setQuantities(data.reduce<Record<string, number>>((acc, item) => ({
        ...acc,
        [item.id]: 0,
      }), {}));
    };

    const handleError = (error: unknown) => {
      console.error('Error fetching shop data:', error);
      toast({
        title: "Error",
        description: "Failed to load shop data. Please try again later.",
        variant: "destructive",
      });
    };

    const setupStoreCheck = () => {
      checkStoreOpen();

      const interval = setInterval(checkStoreOpen, 60000);
      return () => clearInterval(interval);
    };

    fetchShopData();
    const cleanupStoreCheck = setupStoreCheck();

    return cleanupStoreCheck;
  }, []);


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

  const categories = [t('all'), ...Array.from(new Set(productItems.map(item => item.category)))]

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
    return productItems.reduce((total, item) => {
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
      newErrors.collectionOption = t('selectCollectionLocation')
      isValid = false
    }

    if (!phone.trim() || !validatePhone(phone)) {
      newErrors.phone = t('invalidPhoneNumber')
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = () => {
    if (!isStoreOpen) {
      toast({
        title: t('storeClosed'),
        description: t('storeClosedDescription'),
        variant: "destructive",
      })
      return
    }

    if (validateInputs() && calculateTotal() > 0) {
      submitOrder()
    } else if (calculateTotal() === 0) {
      toast({
        title: t('errorTitle'),
        description: t('selectAtLeastOneItem'),
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
    const orderedItems = productItems.filter(item => quantities[item.id] > 0)
    const subtotal = calculateTotal()
    const tax = subtotal * (config.TAX_PERCENTAGE / 100)
    const total = subtotal + tax

    let message = `**${t('order')} #${orderNumber}**\n`
    message += `${orderDate}\n\n`
    message += `**${t('orderBy')}** ${phone}\n\n`
    message += `**${t('orderSummary')}**\n`
    orderedItems.forEach(item => {
      const quantity = quantities[item.id]
      const itemTotal = quantity * item.price
      message += `• ${item.name} x${quantity} - ${config.CURRENCY_SIGN}${itemTotal.toFixed(config.PRICE_DECIMALS)}\n`
    })
    message += `\nSubtotal: ${config.CURRENCY_SIGN}${subtotal.toFixed(config.PRICE_DECIMALS)}\n`
    message += `Tax (${config.TAX_PERCENTAGE}%): ${config.CURRENCY_SIGN}${tax.toFixed(config.PRICE_DECIMALS)}\n`
    message += `**${t('total')} ${config.CURRENCY_SIGN}${total.toFixed(config.PRICE_DECIMALS)}**\n\n`
    const selectedLocation = config.COLLECTION_OPTIONS.find(option => option.id.toString() === collectionOption)
    message += `**${t('collectionLocation')}**\n${selectedLocation ? selectedLocation.address : 'Not selected'}\n\n`
    message += `**${t('phoneNumber')}**\n${phone}`
    if (notes) {
      message += `\n\n**${t('notes')}**\n${notes}`
    }

    return message
  }

  const submitOrder = () => {
    const orderMessage = formatOrderMessage()
    const formattedMessage = encodeURIComponent(orderMessage).replaceAll("**", "%2a")
    const whatsAppLink = `https://wa.me/${config.WHATSAPP_PHONE}?text=${formattedMessage}`
    window.open(whatsAppLink, '_blank')

    setIsOrderDrawerOpen(false)
    toast({
      title: t('orderPlacedSuccessfully'),
      description: t('orderSentViaWhatsApp'),
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

  const handleConfigChange = (key: keyof ShopConfig, value: string | number | object) => {
    setTempConfig(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleColorChange = (colorKey: keyof ShopConfig['COLORS'], value: string) => {
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
      title: t('configuration'),
      description: t('saveChanges'),
    })
  }

  const resetConfig = () => {
    setTempConfig(DEFAULT_CONFIG)
    toast({
      title: t('configuration'),
      description: t('resetToDefault'),
    })
  }

  const renderProductCard = (item: ProductItem) => {
    switch (item.displayOption) {
      case 'compact':
        return (
          <Card className={`overflow-hidden ${config.COLORS.background} flex h-24`}>
            <div className="w-24 h-24 flex-shrink-0">
              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
            </div>
            <CardContent className="p-3 flex-grow flex flex-col justify-between">
              <div>
                <h3 className={`font-semibold text-sm line-clamp-1 overflow-hidden ${config.COLORS.text}`}>{item.name}</h3>
                <p className={`text-xs mb-1 text-muted-foreground line-clamp-1 overflow-hidden text-left`}>{item.description}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className={`text-sm font-bold ${config.COLORS.text}`}>{config.CURRENCY_SIGN} {item.price.toFixed(config.PRICE_DECIMALS)}</p>
                <div className="flex items-center space-x-1">
                  <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, -1); }} className="h-6 w-6 p-0">
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className={`text-sm font-semibold w-4 text-center ${config.COLORS.text}`}>
                    {quantities[item.id]}
                  </span>
                  <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, 1); }} className="h-6 w-6 p-0">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      case 'noImage':
        return (
          <Card className={`overflow-hidden ${config.COLORS.background}`}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className={`font-semibold text-lg line-clamp-1 overflow-hidden ${config.COLORS.text}`}>{item.name}</h3>
              </div>
              <p className={`text-sm mb-2 text-muted-foreground line-clamp-1 overflow-hidden text-left`}>{item.description}</p>
              <div className="flex items-center justify-between">
                <p className={`text-xl font-bold ${config.COLORS.text}`}>{config.CURRENCY_SIGN} {item.price.toFixed(config.PRICE_DECIMALS)}</p>
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, -1); }}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className={`text-lg font-semibold w-4 text-center ${config.COLORS.text}`}>
                    {quantities[item.id]}
                  </span>
                  <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, 1); }}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      default:
        return (
          <Card className={`overflow-hidden ${config.COLORS.background}`}>
            <img src={item.image} alt={item.name} className="w-full h-48 object-cover" />
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className={`font-semibold text-lg line-clamp-1 overflow-hidden ${config.COLORS.text}`}>{item.name}</h3>
              </div>
              <p className={`text-sm mb-2 text-muted-foreground line-clamp-1 overflow-hidden text-left`}>{item.description}</p>
              <div className="flex items-center justify-between">
                <p className={`text-xl font-bold ${config.COLORS.text}`}>{config.CURRENCY_SIGN} {item.price.toFixed(config.PRICE_DECIMALS)}</p>
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, -1); }}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className={`text-lg font-semibold w-4 text-center ${config.COLORS.text}`}>
                    {quantities[item.id]}
                  </span>
                  <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, 1); }}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className={`min-h-screen ${config.COLORS.background} pb-20`}>
      <header className={`sticky top-0 ${config.COLORS.primary} ${config.COLORS.headerText} py-4 shadow-md z-10`}>
        <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">{config.SHOP_NAME}</h1>
          <img
            src={config.SHOP_ICON}
            alt={`${config.SHOP_NAME} Logo`}
            className="h-10 w-auto"
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
          <AlertTitle className="font-bold">{t('storeClosed')}</AlertTitle>
          <AlertDescription>
            {t('storeClosedDescription')}
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
              productItems
                .filter(item => selectedCategory === t('all') || item.category === selectedCategory)
                .map((item) => (
                  <Drawer key={item.id}>
                    <DrawerTrigger asChild>
                      <div className="cursor-pointer">
                        {renderProductCard(item)}
                      </div>
                    </DrawerTrigger>
                    <DrawerContent>
                      <div className="mx-auto w-full max-w-sm">
                        <DrawerHeader>
                          <img src={item.image} alt={item.name} className="w-full h-48 object-cover rounded-lg mb-4" />
                          <DrawerTitle>{item.name}</DrawerTitle>
                          <DrawerDescription>{item.description}</DrawerDescription>
                        </DrawerHeader>
                        <div className="p-4 pb-0">
                          <div className="flex items-center justify-between">
                            <p className={`text-xl font-semibold ${config.COLORS.text}`}>{config.CURRENCY_SIGN} {item.price.toFixed(config.PRICE_DECIMALS)}</p>
                            <div className="flex items-center space-x-2">
                              <Button size="sm" variant="outline" onClick={() => updateQuantity(item.id, -1)}>
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className={`text-lg font-semibold w-4 text-center ${config.COLORS.text}`}>
                                {quantities[item.id]}
                              </span>
                              <Button size="sm" variant="outline" onClick={() => updateQuantity(item.id, 1)}>
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <Separator className="my-4" />
                          <div className={`space-y-2 mt-4 ${config.COLORS.text}`}>
                            <p><strong>{t('calories')}:</strong> {item.calories} cal</p>
                            <p><strong>{t('preparationTime')}:</strong> {item.preparationTime}</p>
                          </div>
                          <Separator className="my-4" />
                          <div className="mt-4">
                            <strong className={config.COLORS.text}>{t('allergens')}:</strong>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {item.allergens.map(allergen => (
                                <Badge key={allergen} variant="secondary" className={config.COLORS.accent}>{allergen}</Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        <DrawerFooter>
                          {/* <DrawerClose asChild>
                            <Button onClick={() => updateQuantity(item.id, 1)}>{t('addToOrder')}</Button>
                          </DrawerClose> */}
                          <DrawerClose asChild>
                            <Button variant="outline">{t('close')}</Button>
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
              className={`fixed bottom-4 left-4 right-4 z-50 ${config.COLORS.primary} w-[calc(100%-2rem)] max-w-sm mx-auto p-0 h-auto`}
              size="lg"
              onClick={() => setIsOrderDrawerOpen(true)}
              disabled={!isStoreOpen}
            >
              <div className="flex items-center justify-between w-full px-4 py-3">
                <div className="bg-white text-primary rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                  {Object.values(quantities).reduce((a, b) => a + b, 0)}
                </div>
                <div className="flex items-center justify-center flex-grow">
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  <span className="text-base font-semibold text-sm">{t('viewOrder')}</span>
                </div>
                <span className="text-xs">
                  {config.CURRENCY_SIGN} {calculateTotal().toFixed(config.PRICE_DECIMALS)}
                </span>
              </div>
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <div className="mx-auto w-full max-w-sm">
              <DrawerHeader>
                <DrawerTitle>{t('yourOrder')}</DrawerTitle>
                <DrawerDescription>{t('orderSummary')}</DrawerDescription>
              </DrawerHeader>
              <Separator />
              <div className="p-4 pb-0">
                {productItems.map((item) => (
                  quantities[item.id] > 0 && (
                    <div key={item.id} className="flex justify-between items-center mb-2">
                      <span className={config.COLORS.text}>{item.name}: {quantities[item.id]} x {config.CURRENCY_SIGN} {item.price.toFixed(config.PRICE_DECIMALS)}</span>
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
                <p className={`font-bold mt-4 text-lg ${config.COLORS.text}`}>{t('total')} {config.CURRENCY_SIGN} {calculateTotal().toFixed(config.PRICE_DECIMALS)}</p>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <Label htmlFor="collectionOption" className={config.COLORS.text}>{t('collectionLocation')}*</Label>
                  <Select
                    value={collectionOption || ""}
                    onValueChange={(value) => setCollectionOption(value)}
                  >
                    <SelectTrigger className={`w-full ${config.COLORS.text}`}>
                      <SelectValue placeholder={t('selectCollectionLocation')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="placeholder">{t('selectCollectionLocation')}</SelectItem>
                      {config.COLLECTION_OPTIONS.map(option => (
                        <SelectItem key={option.id} value={option.id.toString()}>
                          {option.address}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {collectionOption && config.COLLECTION_OPTIONS.find(option => option.id.toString() === collectionOption)?.locationURL && (
                    <a
                      href={config.COLLECTION_OPTIONS.find(option => option.id.toString() === collectionOption)?.locationURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline mt-2 block text-sm"
                    >
                      {t('viewOnMap')}
                    </a>
                  )}
                  {errors.collectionOption && <p className="text-red-500 text-sm mt-1">{errors.collectionOption}</p>}
                </div>
                <div>
                  <Label htmlFor="phone" className={config.COLORS.text}>{t('phoneNumber')}*</Label>
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
                    placeholder={t('notesPlaceholder')}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className={config.COLORS.text}
                  />
                </div>
              </div>
              <DrawerFooter>
                <Button onClick={handleSubmit} className={config.COLORS.primary} disabled={!isStoreOpen}>{t('placeOrder')}</Button>
                <DrawerClose asChild>
                  <Button variant="outline">{t('close')}</Button>
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
                <Label htmlFor="appName" className={config.COLORS.text}>{t('appName')}</Label>
                <Input
                  id="appName"
                  value={tempConfig.SHOP_NAME}
                  onChange={(e) => handleConfigChange('SHOP_NAME', e.target.value)}
                  className={config.COLORS.text}
                />
              </div>
              <div>
                <Label htmlFor="appIcon" className={config.COLORS.text}>{t('appIconUrl')}</Label>
                <Input
                  id="appIcon"
                  value={tempConfig.SHOP_ICON}
                  onChange={(e) => handleConfigChange('SHOP_ICON', e.target.value)}
                  className={config.COLORS.text}
                />
              </div>
              <div>
                <Label htmlFor="productsUrl" className={config.COLORS.text}>{t('productsJsonUrl')}</Label>
                <Input
                  id="productsUrl"
                  value={tempConfig.SHOP_PRODUCTS_URL}
                  onChange={(e) => handleConfigChange('SHOP_PRODUCTS_URL', e.target.value)}
                  className={config.COLORS.text}
                />
              </div>
              <div>
                <Label htmlFor="whatsappPhone" className={config.COLORS.text}>{t('whatsappPhoneNumber')}</Label>
                <Input
                  id="whatsappPhone"
                  value={tempConfig.WHATSAPP_PHONE}
                  onChange={(e) => handleConfigChange('WHATSAPP_PHONE', e.target.value)}
                  className={config.COLORS.text}
                />
              </div>
              <div>
                <Label htmlFor="currencySign" className={config.COLORS.text}>{t('currencySign')}</Label>
                <Input
                  id="currencySign"
                  value={tempConfig.CURRENCY_SIGN}
                  onChange={(e) => handleConfigChange('CURRENCY_SIGN', e.target.value)}
                  className={config.COLORS.text}
                />
              </div>
              <div>
                <Label htmlFor="priceDecimals" className={config.COLORS.text}>Price Decimals</Label>
                <Input
                  id="priceDecimals"
                  type="number"
                  value={tempConfig.PRICE_DECIMALS}
                  onChange={(e) => handleConfigChange('PRICE_DECIMALS', parseFloat(e.target.value))}
                  className={config.COLORS.text}
                />
              </div>
              <div>
                <Label htmlFor="taxPercentage" className={config.COLORS.text}>{t('taxPercentage')}</Label>
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
                <Label htmlFor="collectionOptions" className={config.COLORS.text}>Collection Options</Label>
                {tempConfig.COLLECTION_OPTIONS.map((option, index) => (
                  <div key={index} className="flex flex-col space-y-2 mt-2">
                    <Input
                      value={option.address}
                      onChange={(e) => {
                        const newOptions = [...tempConfig.COLLECTION_OPTIONS];
                        newOptions[index].address = e.target.value;
                        handleConfigChange('COLLECTION_OPTIONS', newOptions);
                      }}
                      placeholder={`Address`}
                      className={config.COLORS.text}
                    />
                    <Input
                      value={option.locationURL || ''}
                      onChange={(e) => {
                        const newOptions = [...tempConfig.COLLECTION_OPTIONS];
                        newOptions[index].locationURL = e.target.value;
                        handleConfigChange('COLLECTION_OPTIONS', newOptions);
                      }}
                      placeholder={`Location URL ${index + 1}`}
                      className={config.COLORS.text}
                    />
                  </div>
                ))}
                <Button
                  onClick={() => {
                    const newOptions = [...tempConfig.COLLECTION_OPTIONS, { id: tempConfig.COLLECTION_OPTIONS.length + 1, address: '', locationURL: '' }];
                    handleConfigChange('COLLECTION_OPTIONS', newOptions);
                  }}
                  className="mt-2"
                >
                  {t('add')}
                </Button>
              </div>
              <div>
                <Label className={config.COLORS.text}>{t('colors')}</Label>
                <div className="space-y-2 mt-2">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="color-primary" className={config.COLORS.text}>{t('primary')}</Label>
                    <Select
                      value={tempConfig.COLORS.primary.split(' ')[0].replace('bg-', '').split('-')[0]}
                      onValueChange={(value) => handleColorChange('primary', `bg-${value}-600 text-white`)}
                    >
                      <SelectTrigger className={`w-full ${config.COLORS.text} bg-background`}>
                        <SelectValue placeholder={t('primary')} />
                      </SelectTrigger>
                      <SelectContent>
                        {['red', 'blue', 'green', 'yellow', 'purple', 'pink', 'indigo', 'gray'].map((color) => (
                          <SelectItem key={color} value={color}>{color}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="color-secondary" className={config.COLORS.text}>{t('secondary')}</Label>
                    <Select
                      value={tempConfig.COLORS.secondary.split(' ')[0].replace('bg-', '').split('-')[0]}
                      onValueChange={(value) => handleColorChange('secondary', `bg-${value}-200 text-gray-800`)}
                    >
                      <SelectTrigger className={`w-full ${config.COLORS.text} bg-background`}>
                        <SelectValue placeholder={t('secondary')} />
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
                <Label htmlFor="openingHours" className={config.COLORS.text}>{t('openingHours')}</Label>
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
                        <SelectValue placeholder={t('start')} />
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
                        <SelectValue placeholder={t('end')} />
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