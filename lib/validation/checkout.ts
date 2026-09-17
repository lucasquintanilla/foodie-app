import { z } from "zod"

const requiredText = (label: string, max = 500) => z.string().trim().min(1, `${label} is required.`).max(max)

export const checkoutRequestSchema = z.object({
  lines: z.array(z.object({ serviceId: z.uuid(), quantity: z.number().int().min(1).max(20) })).min(1).max(20),
  answers: z.array(z.object({ serviceId: z.uuid(), questionId: z.string().min(1).max(80), answer: z.string().trim().max(2000) })).max(100),
  customer: z.object({
    fullName: requiredText("Name", 120),
    phone: requiredText("Telephone", 40),
    addressLine1: requiredText("Address", 160),
    addressLine2: z.string().trim().max(160).optional(),
    city: requiredText("City", 80),
    county: requiredText("County", 80),
    eircode: z.string().trim().max(16).optional(),
  }),
  preferredDate: z.iso.date(),
  preferredTime: requiredText("Preferred time", 120),
  notes: z.string().trim().max(3000).optional(),
  photoPaths: z.array(z.string().regex(/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(?:jpe?g|png|webp)$/i)).max(3),
  legalVersion: z.literal("2026-09-14-pilot"),
  termsAccepted: z.literal(true),
  earlyPerformanceRequested: z.boolean(),
  earlyPerformanceAcknowledged: z.boolean(),
  idempotencyKey: z.uuid(),
})

export function isWithinCoolingOffPeriod(date: string, now = new Date()) {
  const requested = new Date(`${date}T12:00:00.000Z`)
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const days = (requested.getTime() - today.getTime()) / 86_400_000
  return days >= 0 && days < 14
}
