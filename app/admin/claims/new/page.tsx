import { redirect } from "next/navigation"
import Link from "next/link"
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server"
import { isAdmin } from "@/lib/admin"
import { Header } from "@/components/header"
import { ManualClaimForm } from "./manual-claim-form"
import { ArrowLeft } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function NewAdminClaimPage() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login?next=/admin/claims/new")
  if (!(await isAdmin(user.id, user.email))) redirect("/dashboard")

  const admin = getSupabaseAdmin()
  const { data: agencies } = await admin
    .from("vsxo_agencies")
    .select("id, name, slug")
    .order("name", { ascending: true })

  const { data: clients } = await admin
    .from("vsxo_agency_clients")
    .select("id, name, email, agency_id")
    .order("created_at", { ascending: false })
    .limit(500)

  return (
    <>
      <Header />
      <main className="pt-28 pb-24 px-4 sm:px-6 lg:px-8 min-h-screen">
        <div className="max-w-3xl mx-auto">
          <Link href="/admin" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-3.5 h-3.5" /> Admin
          </Link>
          <div className="mb-6">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Admin · manual authoring</div>
            <h1 className="text-3xl font-bold tracking-tight">Add a claim manually</h1>
            <p className="text-sm text-muted-foreground mt-1">
              For cases where a client can&apos;t (or won&apos;t) connect their own analytics —
              attach verified evidence yourself and issue the badge.
            </p>
          </div>
          <ManualClaimForm
            agencies={agencies || []}
            clients={clients || []}
          />
        </div>
      </main>
    </>
  )
}
