export function formatEuro(cents: number) {
  return new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" }).format(cents / 100)
}

export function humanizeStatus(status: string) {
  return status.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase())
}

export function shortOrderId(id: string) {
  return `FX-${id.slice(0, 8).toUpperCase()}`
}

export function bookingBalanceCents({ status, paymentStatus, confirmedTotalCents, estimatedTotalCents, bookingFeeCents }: { status: string; paymentStatus: string; confirmedTotalCents: number | null; estimatedTotalCents: number; bookingFeeCents: number }) {
  if (["cancelled", "expired", "refunded"].includes(status)) return 0
  const paidCredit = paymentStatus === "paid" ? bookingFeeCents : 0
  return Math.max((confirmedTotalCents ?? estimatedTotalCents) - paidCredit, 0)
}
