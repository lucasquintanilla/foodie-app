import { describe, expect, it } from "vitest"

import { formatEuro } from "../lib/format"
import { checkoutRequestSchema, isWithinCoolingOffPeriod } from "../lib/validation/checkout"

const validRequest = {
  lines: [{ serviceId: "8324eea8-225b-4263-82ef-0042f5559de4", quantity: 1 }],
  answers: [{ serviceId: "8324eea8-225b-4263-82ef-0042f5559de4", questionId: "rooms", answer: "3" }],
  customer: { fullName: "Test Customer", phone: "083 000 0000", addressLine1: "1 Test Street", city: "Dublin", county: "Dublin" },
  preferredDate: "2026-10-01",
  preferredTime: "Morning",
  photoPaths: [],
  legalVersion: "2026-09-14-pilot",
  termsAccepted: true,
  earlyPerformanceRequested: false,
  earlyPerformanceAcknowledged: false,
  idempotencyKey: "f8f29fe6-dfea-45c4-8852-62c2b350a6bb",
}

describe("checkout validation", () => {
  it("accepts a complete request", () => expect(checkoutRequestSchema.safeParse(validRequest).success).toBe(true))
  it("rejects an empty tray", () => expect(checkoutRequestSchema.safeParse({ ...validRequest, lines: [] }).success).toBe(false))
  it("rejects more than three photos", () => expect(checkoutRequestSchema.safeParse({ ...validRequest, photoPaths: Array.from({ length: 4 }, (_, i) => `c64db617-6eca-41b7-8a12-1fe888684cc1/00000000-0000-4000-8000-00000000000${i}.jpg`) }).success).toBe(false))
  it("calculates the cooling-off window by calendar day", () => expect(isWithinCoolingOffPeriod("2026-09-20", new Date("2026-09-14T18:00:00Z"))).toBe(true))
  it("formats integer cents as euro", () => expect(formatEuro(1000)).toBe("€10.00"))
})
