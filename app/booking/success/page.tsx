import Link from "next/link"
import { CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function BookingSuccessPage() {
  return <main className="flex min-h-screen items-center justify-center bg-[#f5f8f7] px-4"><div className="max-w-lg rounded-3xl bg-white p-8 text-center shadow-xl shadow-slate-200/50"><CheckCircle2 className="mx-auto h-12 w-12 text-[#20bda8]" /><h1 className="mt-5 text-3xl font-semibold text-[#072d3b]">Payment received</h1><p className="mt-3 leading-7 text-slate-600">Stripe is confirming your €10 booking fee. Your booking will appear as requested once the secure payment notification arrives.</p><Button asChild className="mt-7 rounded-full bg-[#072d3b]"><Link href="/account/bookings">View my bookings</Link></Button><p className="mt-5 text-xs text-slate-400">The browser redirect is not treated as proof of payment; the Stripe webhook is.</p></div></main>
}
