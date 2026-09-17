import Link from "next/link"

import { LoginForm } from "@/components/account/login-form"

type Mode = "sign-in" | "sign-up" | "recovery" | "update"

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams
  const requestedMode = typeof params.mode === "string" ? params.mode : "sign-in"
  const mode: Mode = ["sign-in", "sign-up", "recovery", "update"].includes(requestedMode) ? requestedMode as Mode : "sign-in"
  const requestedNext = typeof params.next === "string" ? params.next : "/account"
  const nextPath = requestedNext.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : "/account"
  const error = params.error ? "The sign-in link could not be completed. Please try again." : undefined

  return <main className="flex min-h-screen flex-col items-center justify-center bg-[#f5f8f7] px-4 py-10"><Link href="/" className="mb-7 text-xl font-semibold text-[#072d3b]">← Fixora</Link><LoginForm initialMode={mode} nextPath={nextPath} initialError={error} /></main>
}
