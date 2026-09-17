export type IntakeQuestionType = "text" | "textarea" | "number" | "select"

export type ServiceIntakeQuestion = {
  id: string
  label: string
  type: IntakeQuestionType
  required: boolean
  placeholder?: string
  options?: string[]
}

export type ServiceIntakeSchema = ServiceIntakeQuestion[]

export type ServiceItem = {
  id: string
  slug: string
  name: string
  description: string
  category: string
  imageUrl: string
  baseEstimateCents: number
  currency: "EUR"
  isActive: boolean
  isAddOn: boolean
  intakeSchema: ServiceIntakeSchema
}

export type CartLine = {
  serviceId: string
  quantity: number
}

export type CheckoutAnswer = {
  serviceId: string
  questionId: string
  answer: string
}

export type CheckoutRequest = {
  lines: CartLine[]
  answers: CheckoutAnswer[]
  customer: {
    fullName: string
    phone: string
    addressLine1: string
    addressLine2?: string
    city: string
    county: string
    eircode?: string
  }
  preferredDate: string
  preferredTime: string
  notes?: string
  photoPaths: string[]
  legalVersion: string
  termsAccepted: true
  earlyPerformanceRequested: boolean
  earlyPerformanceAcknowledged: boolean
  idempotencyKey: string
}

export type OrderStatus =
  | "awaiting_payment"
  | "requested"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancellation_requested"
  | "cancelled"
  | "expired"
  | "refunded"

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded"

export type OrderSummary = {
  id: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  estimatedTotalCents: number
  confirmedTotalCents: number | null
  bookingFeeCents: number
  preferredDate: string
  preferredTime: string
  confirmedStartAt: string | null
  createdAt: string
  items: Array<{ name: string; quantity: number; unitEstimateCents: number }>
}

export type ServicesMarketplaceConfig = {
  brandName: string
  tagline: string
  logo: string
  currencySign: string
  priceDecimals: number
  serviceArea: string
}
