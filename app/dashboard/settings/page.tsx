import { redirect } from "next/navigation"
import Link from "next/link"
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server"
import { AppShell } from "@/components/app-shell"
import { agencyNav } from "@/lib/nav"
import { Button } from "@/components/ui/button"
import { SettingsForm } from "./settings-form"

export const dynamic = "force-dynamic"

export default async function AgencySettingsPage() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login?next=/dashboard/settings")

  const admin = getSupabaseAdmin()
  const { data: agency } = await admin
    .from("vsxo_agencies")
    .select("id, name, slug, plan, tagline, description, website, domain_verified, domain_verified_at, domain_verified_email, public_profile_enabled, membership_status, created_at, owner_user_id")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()
  if (!agency) redirect("/signup")

  return (
    <AppShell
      subtitle={agency.name}
      title="Agency settings"
      groups={agencyNav("/dashboard/settings")}
      topRight={
        <div className="flex items-center gap-2">
          <Link href="/account"><Button variant="outline" size="sm">Billing</Button></Link>
        </div>
      }
    >
      <p className="text-sm text-muted-foreground -mt-4 mb-6">
        Control how your agency shows up across VerifiedSXO.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
        <SettingsForm
          agencyId={agency.id}
          initial={{
            name: agency.name,
            tagline: agency.tagline || "",
            description: agency.description || "",
            website: agency.website || "",
            public_profile_enabled: !!agency.public_profile_enabled,
          }}
          canPublish={agency.membership_status === "active"}
          publicSlug={agency.slug}
          domain={{
            verified: !!agency.domain_verified,
            verifiedAt: agency.domain_verified_at,
            verifiedEmail: agency.domain_verified_email,
          }}
        />

        <aside className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Plan</div>
            <div className="text-sm font-mono">{agency.plan}</div>
            <Link href="/pricing" className="text-xs underline underline-offset-2 text-muted-foreground hover:text-foreground">
              Compare plans
            </Link>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Public profile</div>
            <div className={`text-sm font-medium ${agency.membership_status === "active" ? "text-emerald-500" : "text-muted-foreground"}`}>
              {agency.membership_status === "active" ? "Active" : "Inactive"}
            </div>
            {agency.membership_status !== "active" ? (
              <Link href="/api/stripe/checkout?plan=membership" className="text-xs underline underline-offset-2 text-violet-500 hover:text-cyan-500">
                Activate — $8/mo
              </Link>
            ) : (
              <Link href={`/u/${agency.slug}`} className="text-xs underline underline-offset-2 text-muted-foreground hover:text-foreground">
                verifiedsxo.com/u/{agency.slug}
              </Link>
            )}
          </div>
          <div className="rounded-xl border border-border bg-card p-5 text-xs text-muted-foreground">
            <div className="font-medium text-foreground mb-1">Your slug</div>
            <div className="font-mono">{agency.slug}</div>
            <p className="mt-2">Contact support to rename your slug — old links stay redirected.</p>
          </div>
        </aside>
      </div>
    </AppShell>
  )
}
