import Link from "next/link"
import type { ReactNode } from "react"

export function AccountShell({ title, children, admin = false }: { title: string; children: ReactNode; admin?: boolean }) {
  return <div className="min-h-screen bg-[#f5f8f7]"><header className="bg-[#072d3b] text-white"><div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5"><Link href="/" className="text-xl font-semibold">Fixora</Link><nav className="flex items-center gap-4 text-sm"><Link href="/account">Profile</Link><Link href="/account/bookings">Bookings</Link>{admin ? <Link href="/admin">Admin</Link> : null}<form action="/auth/signout" method="post"><button className="rounded-full bg-white/10 px-4 py-2">Sign out</button></form></nav></div></header><main className="mx-auto max-w-5xl px-4 py-10"><h1 className="text-3xl font-semibold tracking-tight text-[#072d3b]">{title}</h1><div className="mt-7">{children}</div></main></div>
}
