"use client"

import Image from "next/image"
import Link from "next/link"
import { type ChangeEvent, useEffect, useMemo, useState } from "react"
import { ArrowLeft, ArrowRight, Camera, CheckCircle2, Loader2, LockKeyhole, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { formatEuro } from "@/lib/format"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import type { CheckoutRequest, ServiceItem } from "@/types"

const STEPS = ["Services", "Job details", "Contact", "Photos", "Review"]
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])
const MAX_IMAGE_BYTES = 5 * 1024 * 1024

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  services: ServiceItem[]
  quantities: Record<string, number>
  updateQuantity: (serviceId: string, change: number) => void
  clearCart: () => void
  totalCents: number
}

type CustomerDetails = CheckoutRequest["customer"] & { preferredDate: string; preferredTime: string; notes: string }

const EMPTY_DETAILS: CustomerDetails = {
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "Dublin",
  county: "Dublin",
  eircode: "",
  preferredDate: "",
  preferredTime: "",
  notes: "",
}

function todayInputValue() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
}

function isWithin14Days(date: string) {
  if (!date) return false
  const start = new Date(`${todayInputValue()}T00:00:00`)
  const requested = new Date(`${date}T00:00:00`)
  const days = (requested.getTime() - start.getTime()) / 86_400_000
  return days >= 0 && days < 14
}

export function BookingDrawer({ open, onOpenChange, services, quantities, updateQuantity, clearCart, totalCents }: Props) {
  const [step, setStep] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [details, setDetails] = useState<CustomerDetails>(EMPTY_DETAILS)
  const [photos, setPhotos] = useState<File[]>([])
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [earlyPerformance, setEarlyPerformance] = useState(false)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const requiresEarlyConsent = isWithin14Days(details.preferredDate)
  const questionGroups = useMemo(() => services.map((service) => ({ service, questions: service.intakeSchema })), [services])

  useEffect(() => {
    if (!open) return
    const supabase = createSupabaseBrowserClient()
    if (!supabase) {
      // Configuration is an external runtime source checked after hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAuthChecked(true)
      return
    }
    void supabase.auth.getUser().then(async ({ data }) => {
      setUserId(data.user?.id ?? null)
      if (data.user) {
        const { data: profile } = await supabase.from("profiles").select("full_name,phone,address_line_1,address_line_2,city,county,eircode").eq("id", data.user.id).maybeSingle()
        if (profile) {
          setDetails((current) => ({
            ...current,
            fullName: profile.full_name ?? current.fullName,
            phone: profile.phone ?? current.phone,
            addressLine1: profile.address_line_1 ?? current.addressLine1,
            addressLine2: profile.address_line_2 ?? current.addressLine2,
            city: profile.city ?? current.city,
            county: profile.county ?? current.county,
            eircode: profile.eircode ?? current.eircode,
          }))
        }
      }
      setAuthChecked(true)
    })
  }, [open])

  function setDetail<K extends keyof CustomerDetails>(key: K, value: CustomerDetails[K]) {
    setDetails((current) => ({ ...current, [key]: value }))
    setError("")
  }

  function validateStep() {
    if (step === 0 && (!services.length || services.every((service) => service.isAddOn))) return "Choose at least one main service."
    if (step === 1) {
      const missing = questionGroups.some(({ service, questions }) => questions.some((question) => question.required && !answers[`${service.id}:${question.id}`]?.trim()))
      if (missing) return "Please answer each required service question."
    }
    if (step === 2) {
      if (!details.fullName.trim() || !details.phone.trim() || !details.addressLine1.trim() || !details.city.trim() || !details.county.trim() || !details.preferredDate || !details.preferredTime.trim()) return "Complete all required contact and scheduling details."
      if (details.preferredDate < todayInputValue()) return "Choose today or a future date."
    }
    if (step === 4 && !termsAccepted) return "Accept the terms and cancellation policy to continue."
    if (step === 4 && requiresEarlyConsent && !earlyPerformance) return "Confirm the early-performance request for a date within 14 days."
    return ""
  }

  function nextStep() {
    const message = validateStep()
    if (message) return setError(message)
    setError("")
    setStep((current) => Math.min(STEPS.length - 1, current + 1))
  }

  function selectPhotos(event: ChangeEvent<HTMLInputElement>) {
    const next = Array.from(event.target.files ?? [])
    event.target.value = ""
    if (photos.length + next.length > 3) return setError("Upload no more than three photos.")
    if (next.some((file) => !ALLOWED_IMAGE_TYPES.has(file.type))) return setError("Photos must be JPEG, PNG or WebP files.")
    if (next.some((file) => file.size > MAX_IMAGE_BYTES)) return setError("Each photo must be 5 MB or smaller.")
    setPhotos((current) => [...current, ...next])
    setError("")
  }

  async function submitCheckout() {
    const validationMessage = validateStep()
    if (validationMessage) return setError(validationMessage)
    const supabase = createSupabaseBrowserClient()
    if (!supabase || !userId) return setError("Sign in before paying the booking fee.")
    setSubmitting(true)
    setError("")

    const uploadedPaths: string[] = []
    try {
      for (const file of photos) {
        const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg"
        const path = `${userId}/${crypto.randomUUID()}.${extension}`
        const { error: uploadError } = await supabase.storage.from("job-photos").upload(path, file, { contentType: file.type, upsert: false })
        if (uploadError) throw new Error(uploadError.message)
        uploadedPaths.push(path)
      }

      const payload: CheckoutRequest = {
        lines: services.map((service) => ({ serviceId: service.id, quantity: quantities[service.id] })),
        answers: questionGroups.flatMap(({ service, questions }) => questions.map((question) => ({ serviceId: service.id, questionId: question.id, answer: answers[`${service.id}:${question.id}`] ?? "" })).filter((answer) => answer.answer.trim())),
        customer: {
          fullName: details.fullName,
          phone: details.phone,
          addressLine1: details.addressLine1,
          addressLine2: details.addressLine2 || undefined,
          city: details.city,
          county: details.county,
          eircode: details.eircode || undefined,
        },
        preferredDate: details.preferredDate,
        preferredTime: details.preferredTime,
        notes: details.notes || undefined,
        photoPaths: uploadedPaths,
        legalVersion: "2026-09-14-pilot",
        termsAccepted: true,
        earlyPerformanceRequested: requiresEarlyConsent && earlyPerformance,
        earlyPerformanceAcknowledged: requiresEarlyConsent && earlyPerformance,
        idempotencyKey: crypto.randomUUID(),
      }

      const response = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      const result = await response.json() as { url?: string; error?: string }
      if (!response.ok || !result.url) throw new Error(result.error || "Checkout could not be started.")
      clearCart()
      window.location.assign(result.url)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Checkout could not be started.")
      setSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex h-full w-full flex-col overflow-hidden p-0 sm:max-w-xl">
        <SheetHeader className="border-b px-5 py-5 pr-12 text-left">
          <div className="mb-2 flex gap-1" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
            {STEPS.map((label, index) => <span key={label} className={`h-1.5 flex-1 rounded-full ${index <= step ? "bg-[#20bda8]" : "bg-slate-200"}`} />)}
          </div>
          <SheetTitle className="text-2xl text-[#072d3b]">{STEPS[step]}</SheetTitle>
          <SheetDescription>Step {step + 1} of {STEPS.length}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {!authChecked ? <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div> : !userId ? (
            <div className="space-y-5">
              <div className="space-y-3">{services.map((service) => <div key={service.id} className="flex items-center gap-3 rounded-2xl bg-[#f5f8f7] p-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl"><Image src={service.imageUrl} alt="" fill sizes="56px" className="object-cover" /></div>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{service.name}</p><p className="text-xs text-slate-500">{quantities[service.id]} × {formatEuro(service.baseEstimateCents)}</p></div>
                <Button variant="ghost" size="icon" className="rounded-full text-slate-400 hover:text-red-500" onClick={() => updateQuantity(service.id, -quantities[service.id])} aria-label={`Remove ${service.name}`}><Trash2 className="h-4 w-4" /></Button>
              </div>)}</div>
              <div className="flex items-center justify-between border-y py-4"><span>Starting estimate</span><strong className="text-xl">{formatEuro(totalCents)}</strong></div>
              <div className="rounded-3xl bg-[#eef8f6] p-6 text-center">
                <LockKeyhole className="mx-auto h-9 w-9 text-[#0b776a]" /><h3 className="mt-4 text-lg font-semibold">Sign in to continue</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">Your tray stays saved on this device. An account is required before entering private job details or paying.</p>
                <Button asChild className="mt-5 rounded-full bg-[#072d3b]"><Link href="/login?next=%2F">Sign in or create account</Link></Button>
              </div>
            </div>
          ) : (
            <>
              {step === 0 ? <div className="space-y-3">{services.map((service) => <div key={service.id} className="flex items-center gap-3 rounded-2xl bg-[#f5f8f7] p-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl"><Image src={service.imageUrl} alt="" fill sizes="56px" className="object-cover" /></div>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{service.name}</p><p className="text-xs text-slate-500">{quantities[service.id]} × {formatEuro(service.baseEstimateCents)}</p></div>
                <Button variant="ghost" size="icon" className="rounded-full text-slate-400 hover:text-red-500" onClick={() => updateQuantity(service.id, -quantities[service.id])} aria-label={`Remove ${service.name}`}><Trash2 className="h-4 w-4" /></Button>
              </div>)}<div className="flex items-center justify-between border-y py-4"><span>Starting estimate</span><strong className="text-xl">{formatEuro(totalCents)}</strong></div><p className="text-sm leading-6 text-slate-500">The estimate is not the final price. Lucas will confirm the scope, price and appointment before work starts.</p></div> : null}

              {step === 1 ? <div className="space-y-7">{questionGroups.map(({ service, questions }) => <fieldset key={service.id} className="space-y-4"><legend className="text-base font-semibold text-[#072d3b]">{service.name}</legend>{questions.map((question) => {
                const key = `${service.id}:${question.id}`
                return <div key={question.id} className="space-y-2"><Label htmlFor={key}>{question.label}{question.required ? " *" : ""}</Label>{question.type === "select" ? <Select value={answers[key] ?? ""} onValueChange={(value) => setAnswers((current) => ({ ...current, [key]: value }))}><SelectTrigger id={key} className="h-11 rounded-xl"><SelectValue placeholder="Choose an option" /></SelectTrigger><SelectContent>{question.options?.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent></Select> : question.type === "textarea" ? <Textarea id={key} value={answers[key] ?? ""} onChange={(event) => setAnswers((current) => ({ ...current, [key]: event.target.value }))} placeholder={question.placeholder} className="min-h-24 rounded-xl" /> : <Input id={key} type={question.type} min={question.type === "number" ? 1 : undefined} value={answers[key] ?? ""} onChange={(event) => setAnswers((current) => ({ ...current, [key]: event.target.value }))} placeholder={question.placeholder} className="h-11 rounded-xl" />}</div>
              })}</fieldset>)}</div> : null}

              {step === 2 ? <div className="grid gap-4 sm:grid-cols-2">{([
                ["fullName", "Full name", "text", true], ["phone", "Telephone", "tel", true], ["addressLine1", "Address line 1", "text", true], ["addressLine2", "Address line 2", "text", false], ["city", "City", "text", true], ["county", "County", "text", true], ["eircode", "Eircode", "text", false],
              ] as const).map(([key, label, type, required]) => <div key={key} className={key.startsWith("address") ? "space-y-2 sm:col-span-2" : "space-y-2"}><Label htmlFor={key}>{label}{required ? " *" : ""}</Label><Input id={key} type={type} value={details[key]} onChange={(event) => setDetail(key, event.target.value)} className="h-11 rounded-xl" /></div>)}
                <div className="space-y-2"><Label htmlFor="preferredDate">Preferred date *</Label><Input id="preferredDate" type="date" min={todayInputValue()} value={details.preferredDate} onChange={(event) => setDetail("preferredDate", event.target.value)} className="h-11 rounded-xl" /></div>
                <div className="space-y-2"><Label htmlFor="preferredTime">Preferred time *</Label><Input id="preferredTime" value={details.preferredTime} onChange={(event) => setDetail("preferredTime", event.target.value)} placeholder="For example, weekday morning" className="h-11 rounded-xl" /></div>
                <div className="space-y-2 sm:col-span-2"><Label htmlFor="notes">Additional notes</Label><Textarea id="notes" value={details.notes} onChange={(event) => setDetail("notes", event.target.value)} className="min-h-24 rounded-xl" /></div>
              </div> : null}

              {step === 3 ? <div><div className="rounded-3xl border-2 border-dashed border-slate-200 p-8 text-center"><Camera className="mx-auto h-9 w-9 text-[#0b776a]" /><p className="mt-3 font-medium">Add up to three private photos</p><p className="mt-1 text-sm text-slate-500">JPEG, PNG or WebP · 5 MB maximum each</p><Label htmlFor="job-photos" className="mt-5 inline-flex cursor-pointer rounded-full bg-[#072d3b] px-5 py-2.5 text-sm font-medium text-white">Choose photos</Label><Input id="job-photos" type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={selectPhotos} /></div><ul className="mt-4 space-y-2">{photos.map((photo, index) => <li key={`${photo.name}-${photo.lastModified}`} className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-sm"><span className="truncate">{photo.name}</span><Button variant="ghost" size="sm" onClick={() => setPhotos((current) => current.filter((_, photoIndex) => photoIndex !== index))}>Remove</Button></li>)}</ul><p className="mt-4 text-xs leading-5 text-slate-500">Photos are visible only to you and authorised Fixora staff. They are scheduled for deletion 90 days after the job is completed.</p></div> : null}

              {step === 4 ? <div className="space-y-5"><div className="rounded-3xl bg-[#072d3b] p-6 text-white"><p className="text-sm text-white/65">Starting estimate</p><p className="mt-1 text-3xl font-semibold">{formatEuro(totalCents)}</p><div className="my-5 border-t border-white/15" /><div className="flex justify-between"><span>Booking fee due now</span><strong>€10.00</strong></div><p className="mt-3 text-sm leading-6 text-white/70">The €10 fee is credited against the final agreed service price. The remaining balance is collected separately.</p></div>
                <div className="rounded-2xl border p-4 text-sm leading-6 text-slate-600"><p><strong>Seller:</strong> Lucas Handyman (pilot trader details pending client verification).</p><p><strong>Preferred time:</strong> {details.preferredDate} · {details.preferredTime}</p><p><strong>Final price:</strong> confirmed before work starts.</p></div>
                <label className="flex items-start gap-3 rounded-2xl border p-4 text-sm leading-6"><input type="checkbox" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} className="mt-1 h-4 w-4" /><span>I agree to the <Link href="/legal/terms" target="_blank" className="underline">Terms</Link> and <Link href="/legal/cancellation" target="_blank" className="underline">cancellation policy</Link>, and understand that clicking “Pay €10 booking fee” creates an obligation to pay €10.</span></label>
                {requiresEarlyConsent ? <label className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6"><input type="checkbox" checked={earlyPerformance} onChange={(event) => setEarlyPerformance(event.target.checked)} className="mt-1 h-4 w-4" /><span>I expressly request that the service may begin during the 14-day cooling-off period and understand that cancellation rights can change once the service is fully performed.</span></label> : null}
                <div className="flex gap-3 rounded-2xl bg-[#eef8f6] p-4 text-sm text-[#0b665b]"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /><p>Payment is handled securely by Stripe. Your booking becomes “requested” only after Stripe confirms payment.</p></div>
              </div> : null}
            </>
          )}
          {error ? <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
        </div>

        {userId ? <div className="border-t bg-white px-5 py-4"><div className="flex items-center justify-between gap-3">
          <Button variant="ghost" className="rounded-full" disabled={step === 0 || submitting} onClick={() => { setError(""); setStep((current) => current - 1) }}><ArrowLeft className="mr-1 h-4 w-4" /> Back</Button>
          {step < STEPS.length - 1 ? <Button className="rounded-full bg-[#072d3b] px-6" onClick={nextStep}>Continue <ArrowRight className="ml-1 h-4 w-4" /></Button> : <Button className="rounded-full bg-[#ff7167] px-6 text-white hover:bg-[#f55f55]" disabled={submitting} onClick={() => void submitCheckout()}>{submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Pay €10 booking fee</Button>}
        </div></div> : null}
      </SheetContent>
    </Sheet>
  )
}
