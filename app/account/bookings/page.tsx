import Link from "next/link"

import { AccountShell } from "@/components/account/account-shell"
import { Button } from "@/components/ui/button"
import { bookingBalanceCents, formatEuro, humanizeStatus, shortOrderId } from "@/lib/format"
import { requireUser } from "@/lib/supabase/auth"
import { createSupabaseServerClient } from "@/lib/supabase/server"

type BookingRow = { id: string; status: string; payment_status: string; estimated_total_cents: number; confirmed_total_cents: number | null; booking_fee_cents: number; preferred_date: string; preferred_time: string; created_at: string; order_items: Array<{ service_name: string; quantity: number }> }

export default async function BookingsPage() {
  await requireUser("/account/bookings")
  const supabase = await createSupabaseServerClient()
  const { data } = supabase ? await supabase.from("orders").select("id,status,payment_status,estimated_total_cents,confirmed_total_cents,booking_fee_cents,preferred_date,preferred_time,created_at,order_items(service_name,quantity)").order("created_at", { ascending: false }) : { data: [] }
  const bookings = (data ?? []) as BookingRow[]

  return <AccountShell title="Your bookings">{bookings.length ? <div className="grid gap-4">{bookings.map((booking) => {
    const balance = bookingBalanceCents({ status: booking.status, paymentStatus: booking.payment_status, confirmedTotalCents: booking.confirmed_total_cents, estimatedTotalCents: booking.estimated_total_cents, bookingFeeCents: booking.booking_fee_cents })
    return <Link key={booking.id} href={`/account/bookings/${booking.id}`} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-medium uppercase tracking-wide text-[#0b776a]">{shortOrderId(booking.id)}</p><h2 className="mt-1 text-lg font-semibold text-[#072d3b]">{booking.order_items.map((item) => `${item.service_name}${item.quantity > 1 ? ` × ${item.quantity}` : ""}`).join(", ")}</h2><p className="mt-2 text-sm text-slate-500">Preferred: {booking.preferred_date} · {booking.preferred_time}</p></div><span className="rounded-full bg-[#eef8f6] px-3 py-1 text-xs font-medium text-[#0b776a]">{humanizeStatus(booking.status)}</span></div><div className="mt-5 grid grid-cols-2 gap-3 border-t pt-4 text-sm"><div><p className="text-slate-400">Booking fee</p><p className="font-medium">{booking.payment_status === "paid" ? "€10 booking fee paid" : humanizeStatus(booking.payment_status)}</p></div><div><p className="text-slate-400">Balance collected separately</p><p className="font-medium">{formatEuro(balance)}</p></div></div></Link>
  })}</div> : <div className="rounded-3xl bg-white p-8 text-center"><p className="text-slate-600">You do not have any bookings yet.</p><Button asChild className="mt-5 rounded-full bg-[#072d3b]"><Link href="/">Browse services</Link></Button></div>}</AccountShell>
}
