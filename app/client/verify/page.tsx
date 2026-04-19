import { redirect } from "next/navigation"
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { VerifyForm } from "./verify-form"

export const dynamic = "force-dynamic"

export default async function VerifyPage() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login?next=/client/verify")

  const admin = getSupabaseAdmin()
  const { data: client } = await admin
    .from("vsxo_agency_clients")
    .select("id, name")
    .eq("user_id", user.id)
    .maybeSingle()
  if (!client) redirect("/dashboard")

  const { data: conn } = await admin
    .from("vsxo_data_connections")
    .select("id, status, account_label")
    .eq("client_id", client.id)
    .eq("provider", "gsc")
    .eq("status", "connected")
    .maybeSingle()

  if (!conn) redirect("/client?gsc=required")

  return (
    <>
      <Header />
      <main className="pt-28 pb-24 px-4 sm:px-6 lg:px-8 min-h-screen">
        <div className="max-w-2xl mx-auto">
          <div className="text-sm text-muted-foreground uppercase tracking-wider mb-2">
            Verify a claim · {client.name}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">Prove it with data</h1>
          <p className="text-muted-foreground mb-8">
            Connected via Search Console · <span className="font-mono">{conn.account_label}</span>
          </p>
          <VerifyForm />
        </div>
      </main>
    </>
  )
}
