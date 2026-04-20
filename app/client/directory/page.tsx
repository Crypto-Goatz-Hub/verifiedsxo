import { redirect } from "next/navigation"
import Link from "next/link"
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server"
import { AppShell } from "@/components/app-shell"
import { clientNav } from "@/lib/nav"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ShieldCheck, Search, ArrowRight } from "lucide-react"

export const dynamic = "force-dynamic"

interface Props { searchParams: Promise<{ q?: string }> }

export default async function ClientDirectoryPage({ searchParams }: Props) {
  const sp = await searchParams
  const q = (sp?.q || "").trim()

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login?next=/client/directory")

  const admin = getSupabaseAdmin()
  const { data: clientRow } = await admin
    .from("vsxo_agency_clients")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle()
  if (!clientRow) redirect("/dashboard")

  let agenciesQ = admin
    .from("vsxo_agencies")
    .select("id, name, slug, tagline, description")
    .eq("public_profile_enabled", true)
    .eq("membership_status", "active")
    .order("name", { ascending: true })
    .limit(60)

  if (q) {
    agenciesQ = agenciesQ.or(`name.ilike.%${q}%,tagline.ilike.%${q}%,description.ilike.%${q}%`)
  }

  const { data: agencies } = await agenciesQ

  // Enrich with verified claim counts
  const ids = (agencies || []).map((a) => a.id)
  let countMap = new Map<string, number>()
  if (ids.length > 0) {
    const { data: counts } = await admin
      .from("vsxo_claims")
      .select("agency_id, id")
      .in("agency_id", ids)
      .eq("status", "verified")
    if (counts) {
      for (const row of counts) {
        countMap.set(row.agency_id, (countMap.get(row.agency_id) || 0) + 1)
      }
    }
  }

  return (
    <AppShell
      subtitle="Verified agencies only"
      title="Find an agency"
      groups={clientNav("/client/directory")}
    >
      <p className="text-sm text-muted-foreground -mt-4 mb-6">
        Only agencies with active public profiles appear here — each one has
        verified claims on record you can open end-to-end.
      </p>

      <form action="/client/directory" method="GET" className="relative mb-6">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
        <Input
          name="q"
          defaultValue={q}
          placeholder='Search by name, specialty, or outcome (e.g. "SEO", "SaaS", "cold email")'
          className="h-12 pl-10 text-sm bg-card"
        />
      </form>

      {agencies && agencies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {agencies.map((a) => {
            const verifiedCount = countMap.get(a.id) || 0
            return (
              <article key={a.id} className="rounded-xl border border-border bg-card p-5 hover:border-foreground/30 transition-colors">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold">{a.name}</h3>
                    {a.tagline && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{a.tagline}</p>}
                  </div>
                  {verifiedCount > 0 && (
                    <Badge variant="success" className="uppercase tracking-wider">
                      <ShieldCheck /> {verifiedCount} verified
                    </Badge>
                  )}
                </div>
                {a.description && <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 mb-3">{a.description}</p>}
                <Link
                  href={`/u/${a.slug}`}
                  className="inline-flex items-center gap-1 text-xs font-medium underline underline-offset-2 hover:text-foreground text-foreground/80"
                >
                  View profile <ArrowRight className="w-3 h-3" />
                </Link>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <Search className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <div className="text-sm font-medium mb-1">
            {q ? `No public agencies matching "${q}" yet` : "No public agencies yet"}
          </div>
          <p className="text-xs text-muted-foreground">
            Agencies appear here once they activate the $8/mo membership and publish their profile.
          </p>
        </div>
      )}
    </AppShell>
  )
}
