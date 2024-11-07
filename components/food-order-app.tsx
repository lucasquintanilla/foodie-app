'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Minus, Plus, ShoppingCart, ChevronDown, Trash2, Settings } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

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

// Default configuration
const DEFAULT_CONFIG = {
  APP_NAME: 'BAMBINO',
  APP_ICON: 'https://creativeclub.ie/bambino/bambino_logo.svg',
  APP_PRODUCTS_URL: 'https://creativeclub.ie/bambino/products.json',
  WHATSAPP_PHONE: '353830297520',
  CURRENCY_SIGN: '€', 
  TAX_PERCENTAGE: 10,   
  COLORS: {
    primary: 'bg-red-600 text-white',
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

export function FoodOrderApp()  {
  const [config, setConfig] = useState(DEFAULT_CONFIG)
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [tempConfig, setTempConfig] = useState(config)
  const [foodItems, setFoodItems] = useState<FoodItem[]>([])
  const [loading, setLoading] = useState(true)
  const [quantities, setQuantities] = useState({})
  //const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState({ collectionOption: '', phone: '' })
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [collectionOption, setCollectionOption] = useState('')
  const { toast } = useToast()

  const [dragPosition, setDragPosition] = useState(0)
  const dragThreshold = 100 // pixels to drag before closing
  //const dragRef = useRef(null)

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
  }, [config.APP_PRODUCTS_URL])

  const categories = ['All', ...new Set(foodItems.map(item => item.category))]

  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0]
    setDragPosition(touch.clientY)
  }, [])

  const handleTouchMove = useCallback((e, closeSheet) => {
    const touch = e.touches[0]
    const diff = touch.clientY - dragPosition
    if (diff > dragThreshold) {
      closeSheet()
    }
  }, [dragPosition, dragThreshold])

  const updateQuantity = (item, change) => {
    setQuantities(prev => {
      const newQuantities = {
        ...prev,
        [item]: Math.max(0, prev[item] + change)
      };
      
      if (Object.values(newQuantities).every(q => q === 0)) {
        setIsSheetOpen(false);
      }
      
      return newQuantities;
    });
  }

  const calculateTotal = () => {
    return foodItems.reduce((total, item) => {
      return total + (quantities[item.id] * item.price)
    }, 0)
  }

  const validatePhone = (phone) => {
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

    setIsSheetOpen(false)
    toast({
      title: "Order Placed Successfully!",
      description: "Your order has been sent via WhatsApp.",
    })
  }

  const handleInputFocus = (e) => {
    e.target.readOnly = false;
  };

  const handleInputBlur = (e) => {
    e.target.readOnly = true;
  };

  const isOrderEmpty = () => {
    return Object.values(quantities).every(quantity => quantity === 0);
  };

  const handleConfigChange = (key, value) => {
    setTempConfig(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleColorChange = (colorKey, value) => {
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

      <main className="max-w-6xl mx-auto p-4">
        <section className="mb-8">
          <h2 className={`text-2xl font-bold mb-4 ${config.COLORS.text}`}>Menu</h2>
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
                  <Button
                    key={item.id}
                    className="p-0 h-auto block w-full"
                    variant="ghost"
                    onClick={() => setSelectedItem(item)}
                    aria-label={`View details for ${item.name}`}
                  >
                    <Card className={`overflow-hidden ${config.COLORS.background}`}>
                      <img src={item.image} alt={item.name} className="w-full h-48 object-cover" />
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className={`font-semibold text-lg ${config.COLORS.text}`}>{item.name}</h3>
                        </div>
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
                ))
            )}
          </div>
        </section>
      </main>

      {!isOrderEmpty() && (
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button 
              className={`fixed bottom-4 left-4 right-4 z-50 text-lg py-6 ${config.COLORS.primary}`}
              size="lg"
            >
              <ShoppingCart className="mr-2 h-5 w-5" /> 
              View Order {config.CURRENCY_SIGN}{calculateTotal().toFixed(2)}
            </Button>
          </SheetTrigger>
          <SheetContent 
            side="bottom" 
            className={`h-[80vh] sm:h-[85vh] overflow-y-auto rounded-t-[10px] ${config.COLORS.background}`}
          >
            <div 
              className={`absolute left-1/2 -translate-x-1/2 flex justify-center items-center w-12 h-6 rounded-full ${config.COLORS.secondary} top-2 cursor-grab active:cursor-grabbing`}
              onTouchStart={handleTouchStart}
              onTouchMove={(e) => handleTouchMove(e, () => setIsSheetOpen(false))}
            >
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>
            <SheetHeader className="mt-6">
              <SheetTitle className={config.COLORS.text}>Your Order</SheetTitle>
            </SheetHeader>
            <div className="py-4">
              <h3 className={`font-semibold mb-2 ${config.COLORS.text}`}>Order Summary:</h3>
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
              
              <p className={`font-bold mt-4 text-lg ${config.COLORS.text}`}>Total: {config.CURRENCY_SIGN}{calculateTotal().toFixed(2)}</p>
            </div>
            <div className="space-y-4 mt-6">
              <div>
                <Label htmlFor="collectionOption" className={config.COLORS.text}>Collection Location*</Label>
                <select
                  id="collectionOption"
                  value={collectionOption}
                  onChange={(e) => setCollectionOption(e.target.value)}
                  className={`w-full p-2 rounded-md border ${config.COLORS.text}`}
                >
                  <option value="">Select a collection location</option>
                  {config.COLLECTION_OPTIONS.map(option => (
                    <option key={option.id} value={option.id}>
                      {option.address}
                    </option>
                  ))}
                </select>
                {errors.collectionOption && <p className="text-red-500 text-sm mt-1">{errors.collectionOption}</p>}
              </div>
              <div>
                <Label htmlFor="phone" className={config.COLORS.text}>Phone Number*</Label>
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
                <Label htmlFor="notes" className={config.COLORS.text}>Notes (Optional)</Label>
                <Input 
                  id="notes" 
                  placeholder="Add any additional notes" 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  readOnly
                  className={config.COLORS.text}
                />
              </div>
            </div>
            <Button className={`w-full mt-6 ${config.COLORS.primary}`} size="lg" onClick={handleSubmit}>Place Order</Button>
          </SheetContent>
        </Sheet>
      )}

      <Sheet open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <SheetContent 
          side="bottom" 
          className={`h-[80vh] sm:h-[85vh] overflow-y-auto rounded-t-[10px] ${config.COLORS.background}`}
        >
          <div 
            className={`absolute left-1/2 -translate-x-1/2 flex justify-center items-center w-12 h-6 rounded-full ${config.COLORS.secondary} top-2 cursor-grab active:cursor-grabbing`}
            onTouchStart={handleTouchStart}
            onTouchMove={(e) => handleTouchMove(e, () => setSelectedItem(null))}
          >
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </div>
          {selectedItem && (
            <>
              <div className="py-4">
                <img src={selectedItem.image} alt={selectedItem.name} className="w-full h-48 object-cover rounded-lg mb-4" />
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className={`text-2xl font-bold ${config.COLORS.text}`}>{selectedItem.name}</h2>
                    <p className={`text-xl font-semibold ${config.COLORS.text}`}>{config.CURRENCY_SIGN}{selectedItem.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button size="sm" variant="outline" onClick={() => updateQuantity(selectedItem.id, -1)}>
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className={`text-lg font-semibold w-8 text-center ${config.COLORS.text}`}>
                      {quantities[selectedItem.id]}
                    </span>
                    <Button size="sm" variant="outline" onClick={() => updateQuantity(selectedItem.id, 1)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className={`mb-4 ${config.COLORS.text}`}>{selectedItem.description}</p>
                <div className={`space-y-2 mb-4 ${config.COLORS.text}`}>
                  <p><strong>Calories:</strong> {selectedItem.calories}</p>
                  <p><strong>Preparation Time:</strong> {selectedItem.preparationTime}</p>
                </div>
                <div className="mb-4">
                  <strong className={config.COLORS.text}>Allergens:</strong>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedItem.allergens.map(allergen => (
                      <Badge key={allergen} variant="secondary" className={config.COLORS.accent}>{allergen}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Sheet open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <SheetContent side="right" className={`w-[400px] sm:w-[540px] ${config.COLORS.background}`}>
          <SheetHeader>
            <SheetTitle className={config.COLORS.text}>App Configuration</SheetTitle>
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
                <Label className={config.COLORS.text}>Colors</Label>
                <div className="space-y-2 mt-2">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="color-primary" className={config.COLORS.text}>Primary</Label>
                    <select
                      id="color-primary"
                      value={tempConfig.COLORS.primary.split(' ')[0].replace('bg-', '').replace('-600', '')}
                      onChange={(e) => handleColorChange('primary', `bg-${e.target.value}-600 text-white`)}
                      className="w-full p-2 rounded-md border"
                    >
                      {['red', 'blue', 'green', 'yellow', 'purple', 'pink', 'indigo', 'gray'].map((color) => (
                        <option key={color} value={color}>{color}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="color-secondary" className={config.COLORS.text}>Secondary</Label>
                    <select
                      id="color-secondary"
                      value={tempConfig.COLORS.secondary.split(' ')[0].replace('bg-', '').replace('-200', '')}
                      onChange={(e) => handleColorChange('secondary', `bg-${e.target.value}-200 text-gray-800`)}
                      className="w-full p-2 rounded-md border"
                    >
                      {['gray', 'red', 'blue', 'green', 'yellow', 'purple', 'pink', 'indigo'].map((color) => (
                        <option key={color} value={color}>{color}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-between mt-6">
              <Button onClick={resetConfig} variant="outline">Reset to Default</Button>
              <Button onClick={saveConfig} className={config.COLORS.primary}>Save Changes</Button>
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