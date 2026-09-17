"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"

export function CancelBookingButton({ orderId }: { orderId: string }) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const router = useRouter()

  async function cancel() {
    if (!window.confirm("Request cancellation of this booking?")) return
    setBusy(true)
    const response = await fetch(`/api/orders/${orderId}/cancel`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })
    const result = await response.json() as { error?: string }
    if (!response.ok) setMessage(result.error || "Cancellation could not be requested.")
    else router.refresh()
    setBusy(false)
  }

  return <div><Button variant="outline" disabled={busy} className="rounded-full border-red-200 text-red-700" onClick={() => void cancel()}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Request cancellation</Button>{message ? <p role="alert" className="mt-2 text-sm text-red-700">{message}</p> : null}</div>
}
