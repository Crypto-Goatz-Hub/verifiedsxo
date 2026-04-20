import { redirect } from "next/navigation"
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server"
import { AppShell } from "@/components/app-shell"
import { clientNav } from "@/lib/nav"
import { BookOpen, FileText, Video, ExternalLink } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

const RESOURCES = [
  {
    title: "What makes a claim verifiable?",
    summary: "The four types of proof VerifiedSXO accepts — and the ones we reject.",
    href: "/how-it-works",
    icon: BookOpen,
    tag: "Guide",
  },
  {
    title: "Connect Google Search Console",
    summary: "Two-minute walkthrough for proving ranking + traffic claims.",
    href: "/client/verify",
    icon: FileText,
    tag: "Setup",
  },
  {
    title: "Anatomy of the Seal of Truth badge",
    summary: "How the embeddable badge works, why verifiers can&rsquo;t be forged.",
    href: "/badge-examples",
    icon: Video,
    tag: "Deep dive",
  },
  {
    title: "Why third-party verification matters",
    summary: "The case every marketer keeps quiet about: nobody trusts screenshots.",
    href: "/#verify",
    icon: FileText,
    tag: "Essay",
  },
]

export default async function ClientResourcesPage() {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login?next=/client/resources")

  const admin = getSupabaseAdmin()
  const { data: clientRow } = await admin
    .from("vsxo_agency_clients")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle()
  if (!clientRow) redirect("/dashboard")

  return (
    <AppShell
      subtitle="Client · free forever"
      title="Resources"
      groups={clientNav("/client/resources")}
    >
      <p className="text-sm text-muted-foreground -mt-4 mb-6">
        Guides, templates, and explainers pulled from the best claims on the platform.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {RESOURCES.map((r) => {
          const Icon = r.icon
          return (
            <Link
              key={r.title}
              href={r.href}
              className="group rounded-xl border border-border bg-card p-5 hover:border-foreground/30 transition-colors"
            >
              <div className="flex items-start gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500/10 to-cyan-500/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-violet-500" />
                </div>
                <div className="flex-1">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">{r.tag}</div>
                  <div className="font-semibold text-sm leading-snug">{r.title}</div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground ml-12">{r.summary}</p>
              <div className="mt-3 ml-12 text-[11px] text-foreground/80 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                Open <ExternalLink className="w-3 h-3" />
              </div>
            </Link>
          )
        })}
      </div>

      <section className="mt-8 rounded-xl border border-border bg-card p-6">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Coming soon</div>
        <div className="text-sm font-medium mb-1">A playbook library from verified claims</div>
        <p className="text-xs text-muted-foreground max-w-2xl">
          Every high-scoring claim is anonymized and turned into a &ldquo;proof pattern&rdquo; you can copy.
          We&rsquo;re building this from the live platform data — stay tuned.
        </p>
      </section>
    </AppShell>
  )
}
