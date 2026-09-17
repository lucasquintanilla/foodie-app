"use client"

import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { Check, ChevronRight, MapPin, Minus, Plus, ShieldCheck, Sparkles, Wrench } from "lucide-react"
import { motion } from "framer-motion"

import { AccountButton } from "@/components/account/account-button"
import { BookingDrawer } from "@/components/booking/booking-drawer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { SERVICES_MARKETPLACE } from "@/config/services"
import { formatEuro } from "@/lib/format"
import type { CartLine, ServiceItem } from "@/types"

const ALL_SERVICES = "All services"
const CART_STORAGE_KEY = "fixora.cart.v1"

function readCart(): Record<string, number> {
  if (typeof window === "undefined") return {}
  try {
    const parsed = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? "{}") as { version?: number; lines?: CartLine[] }
    if (parsed.version !== 1 || !Array.isArray(parsed.lines)) return {}
    return Object.fromEntries(parsed.lines.filter((line) => line.quantity > 0).map((line) => [line.serviceId, line.quantity]))
  } catch {
    return {}
  }
}

export function ServicesMarketplace({ services, isPrivatePreview }: { services: ServiceItem[]; isPrivatePreview: boolean }) {
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [cartLoaded, setCartLoaded] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(ALL_SERVICES)
  const [isBookingOpen, setIsBookingOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Browser storage is an external source synchronized after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuantities(readCart())
    setCartLoaded(true)
  }, [])

  useEffect(() => {
    if (!cartLoaded) return
    const lines = Object.entries(quantities).filter(([, quantity]) => quantity > 0).map(([serviceId, quantity]) => ({ serviceId, quantity }))
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ version: 1, lines }))
  }, [cartLoaded, quantities])

  const serviceById = useMemo(() => new Map(services.map((item) => [item.id, item])), [services])
  const categories = useMemo(() => [ALL_SERVICES, ...Array.from(new Set(services.map((service) => service.category)))], [services])
  const visibleServices = useMemo(() => selectedCategory === ALL_SERVICES ? services : services.filter((service) => service.category === selectedCategory), [selectedCategory, services])
  const selectedServices = useMemo(() => services.filter((service) => (quantities[service.id] ?? 0) > 0), [quantities, services])
  const selectedCount = Object.values(quantities).reduce((total, quantity) => total + quantity, 0)
  const totalCents = selectedServices.reduce((sum, service) => sum + service.baseEstimateCents * (quantities[service.id] ?? 0), 0)

  function updateQuantity(serviceId: string, change: number) {
    const target = serviceById.get(serviceId)
    if (!target) return
    const hasBaseService = selectedServices.some((service) => !service.isAddOn && service.id !== serviceId)
    if (target.isAddOn && change > 0 && !hasBaseService) {
      toast({ title: "Add-on needs a main service", description: "Choose a cleaning or other main service first." })
      return
    }

    setQuantities((current) => {
      const next = { ...current, [serviceId]: Math.max(0, Math.min(20, (current[serviceId] ?? 0) + change)) }
      if (!target.isAddOn && next[serviceId] === 0) {
        const stillHasBase = services.some((service) => !service.isAddOn && (next[service.id] ?? 0) > 0)
        if (!stillHasBase) services.filter((service) => service.isAddOn).forEach((service) => { next[service.id] = 0 })
      }
      return next
    })
  }

  function clearCart() {
    setQuantities({})
    localStorage.removeItem(CART_STORAGE_KEY)
  }

  return (
    <div className="min-h-screen bg-[#f5f8f7] pb-28 text-[#102f38]">
      {isPrivatePreview ? <div className="bg-amber-100 px-4 py-2 text-center text-xs font-medium text-amber-950">Private pilot preview · Temporary catalogue content must be replaced or licensed before public launch.</div> : null}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#072d3b]/95 text-white backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6">
          <a href="#top" className="flex items-center gap-3" aria-label="Fixora home">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white p-1.5 shadow-lg shadow-black/15"><Image src={SERVICES_MARKETPLACE.logo} alt="" width={44} height={44} className="h-full w-full object-contain" priority /></span>
            <span><span className="block text-xl font-semibold tracking-tight">{SERVICES_MARKETPLACE.brandName}</span><span className="hidden text-xs text-white/65 sm:block">Home services, sorted.</span></span>
          </a>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-medium text-white/85 sm:flex"><ShieldCheck className="h-4 w-4 text-[#34d7c1]" /> Trusted local help</span>
            <AccountButton />
          </div>
        </div>
      </header>

      <main id="top">
        <section className="overflow-hidden bg-[#072d3b] text-white">
          <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.2fr_0.8fr] md:items-center md:py-20">
            <div className="relative z-10 max-w-2xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#34d7c1]/30 bg-[#34d7c1]/10 px-3 py-1.5 text-sm text-[#8cebdd]"><MapPin className="h-4 w-4" /> Serving {SERVICES_MARKETPLACE.serviceArea}</div>
              <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl">Home services,<span className="block text-[#34d7c1]">made simple.</span></h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-white/70 sm:text-lg">Browse estimates, choose what you need, and request a booking in minutes.</p>
              <Button className="mt-7 rounded-full bg-[#ff7167] px-6 text-white shadow-lg shadow-[#ff7167]/20 hover:bg-[#f55f55]" onClick={() => document.getElementById("services")?.scrollIntoView({ behavior: "smooth" })}>Explore services <ChevronRight className="ml-1 h-4 w-4" /></Button>
            </div>
            <div className="relative hidden min-h-72 md:block" aria-hidden="true">
              <div className="absolute inset-0 rounded-[3rem] bg-[#34d7c1]/10 blur-3xl" />
              <div className="absolute left-8 top-0 rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur"><Sparkles className="h-9 w-9 text-[#34d7c1]" /><p className="mt-4 font-medium">Cleaning</p><p className="mt-1 text-sm text-white/60">Fresh spaces, without the fuss.</p></div>
              <div className="absolute bottom-0 right-0 rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur"><Wrench className="h-9 w-9 text-[#ff8a81]" /><p className="mt-4 font-medium">Repairs & maintenance</p><p className="mt-1 text-sm text-white/60">Reliable help when you need it.</p></div>
            </div>
          </div>
        </section>

        <section id="services" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
          <h2 className="text-3xl font-semibold tracking-tight text-[#072d3b]">Services for every to-do</h2>
          <div className="-mx-4 mt-7 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0"><div className="flex w-max gap-2">
            {categories.map((category) => <Button key={category} variant="outline" onClick={() => setSelectedCategory(category)} className={selectedCategory === category ? "rounded-full border-[#072d3b] bg-[#072d3b] text-white hover:bg-[#0b4053] hover:text-white" : "rounded-full border-slate-200 bg-white text-slate-600 hover:border-[#34d7c1] hover:bg-[#eafaf7]"}>{category}</Button>)}
          </div></div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleServices.map((service, index) => {
              const quantity = quantities[service.id] ?? 0
              return <motion.div key={service.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.24) }}>
                <Card className={`group h-full overflow-hidden rounded-3xl border bg-white transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/70 ${quantity > 0 ? "border-[#20bda8] ring-2 ring-[#20bda8]/15" : "border-slate-100"}`}>
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                    <Image src={service.imageUrl} alt={service.name} fill loading={index < 4 ? "eager" : "lazy"} fetchPriority={index === 0 ? "high" : "auto"} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" className="object-cover transition duration-500 group-hover:scale-105" />
                    <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-medium text-[#0b776a] shadow-sm">{service.category}</span>
                    {service.isAddOn ? <span className="absolute bottom-3 left-3 rounded-full bg-[#072d3b] px-3 py-1 text-xs font-medium text-white">Add-on only</span> : null}
                    {quantity > 0 ? <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#20bda8] text-white shadow-sm"><Check className="h-4 w-4" /></span> : null}
                  </div>
                  <CardContent className="flex min-h-56 flex-col p-5">
                    <h3 className="text-lg font-semibold leading-snug text-[#102f38]">{service.name}</h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">{service.description}</p>
                    <div className="mt-auto flex items-end justify-between gap-3 pt-5">
                      <div><p className="text-xs text-slate-400">Starting estimate</p><p className="text-xl font-semibold text-[#072d3b]">{formatEuro(service.baseEstimateCents)}</p></div>
                      {quantity === 0 ? <Button onClick={() => updateQuantity(service.id, 1)} className="rounded-full bg-[#072d3b] px-5 text-white hover:bg-[#0b4053]">Add <Plus className="ml-1 h-4 w-4" /></Button> : <div className="flex items-center gap-2 rounded-full bg-[#eafaf7] p-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-[#087d6e] hover:bg-white" onClick={() => updateQuantity(service.id, -1)} aria-label={`Remove one ${service.name}`}><Minus className="h-4 w-4" /></Button>
                        <span className="min-w-5 text-center text-sm font-semibold text-[#087d6e]">{quantity}</span>
                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-[#087d6e] hover:bg-white" onClick={() => updateQuantity(service.id, 1)} aria-label={`Add one ${service.name}`}><Plus className="h-4 w-4" /></Button>
                      </div>}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            })}
          </div>
        </section>
      </main>

      {selectedCount > 0 ? <BookingDrawer open={isBookingOpen} onOpenChange={setIsBookingOpen} services={selectedServices} quantities={quantities} updateQuantity={updateQuantity} clearCart={clearCart} totalCents={totalCents} /> : null}
      {selectedCount > 0 && !isBookingOpen ? <Button className="fixed bottom-5 left-1/2 z-50 h-14 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-full bg-[#ff7167] px-5 text-white shadow-2xl shadow-[#072d3b]/25 hover:bg-[#f55f55]" onClick={() => setIsBookingOpen(true)}><span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-white px-2 text-xs font-semibold text-[#e84e45]">{selectedCount}</span><span className="flex-1 text-base font-medium">Review tray</span><span className="text-sm font-semibold">{formatEuro(totalCents)}</span></Button> : null}

      <footer className="border-t border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
        <p><span className="font-medium text-[#072d3b]">Fixora</span> · Home services made simple.</p>
        <nav className="mt-3 flex flex-wrap justify-center gap-4 text-xs"><a href="/legal/terms">Terms</a><a href="/legal/privacy">Privacy</a><a href="/legal/cookies">Cookies</a><a href="/legal/cancellation">Cancellation</a></nav>
      </footer>
    </div>
  )
}
