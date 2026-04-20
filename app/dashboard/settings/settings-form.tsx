"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle2, AlertTriangle, Loader2 } from "lucide-react"

interface Props {
  agencyId: string
  initial: { name: string; tagline: string; description: string; public_profile_enabled: boolean }
  canPublish: boolean
  publicSlug: string
}

export function SettingsForm({ agencyId, initial, canPublish, publicSlug }: Props) {
  const router = useRouter()
  const [name, setName] = useState(initial.name)
  const [tagline, setTagline] = useState(initial.tagline)
  const [description, setDescription] = useState(initial.description)
  const [publicEnabled, setPublicEnabled] = useState(initial.public_profile_enabled)
  const [loading, setLoading] = useState(false)
  const [ok, setOk] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function save() {
    setLoading(true); setErr(null); setOk(false)
    try {
      const r = await fetch("/api/agency/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agencyId,
          name: name.trim(),
          tagline: tagline.trim(),
          description: description.trim(),
          public_profile_enabled: canPublish ? publicEnabled : false,
        }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || "failed")
      setOk(true)
      router.refresh()
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-xl border border-border bg-card p-6 md:p-8">
      <div className="space-y-5">
        <Field label="Agency name" hint="Shown on your public profile, badges, and certificates.">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:border-foreground/30 outline-none text-sm"
            placeholder="e.g. Northwind Growth"
            maxLength={80}
          />
        </Field>

        <Field label="Tagline" hint="One-liner. 160 characters max.">
          <input
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:border-foreground/30 outline-none text-sm"
            placeholder='e.g. "Verified growth marketing for B2B SaaS."'
            maxLength={160}
          />
          <div className="text-[11px] text-muted-foreground mt-1">{tagline.length}/160</div>
        </Field>

        <Field label="Description" hint="A paragraph about what your agency does best.">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:border-foreground/30 outline-none text-sm resize-y"
            placeholder="We verify marketing claims for B2B SaaS teams using first-party analytics."
            maxLength={2000}
          />
          <div className="text-[11px] text-muted-foreground mt-1">{description.length}/2000</div>
        </Field>

        <div className={`rounded-lg border p-4 ${canPublish ? "border-border bg-background" : "border-violet-500/30 bg-gradient-to-r from-violet-500/5 to-cyan-500/5"}`}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-[240px]">
              <div className="text-sm font-medium mb-0.5">Public profile page</div>
              <p className="text-xs text-muted-foreground">
                {canPublish
                  ? <>Live at <span className="font-mono">verifiedsxo.com/u/{publicSlug}</span></>
                  : "Requires the $8/mo membership. Unlocks public page + LinkedIn badge + embed snippets."}
              </p>
            </div>
            {canPublish ? (
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={publicEnabled}
                  onChange={(e) => setPublicEnabled(e.target.checked)}
                  className="h-4 w-4"
                />
                Show profile publicly
              </label>
            ) : (
              <Link href="/api/stripe/checkout?plan=membership">
                <Button size="sm" className="bg-gradient-to-r from-violet-500 to-cyan-500 text-white hover:opacity-90">
                  Activate
                </Button>
              </Link>
            )}
          </div>
        </div>

        {err && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-sm text-rose-600">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{err}</span>
          </div>
        )}
        {ok && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-sm text-emerald-600">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            <span>Saved.</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
          <Button onClick={save} disabled={loading || name.trim().length < 2} className="bg-foreground text-background hover:bg-foreground/90">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : "Save changes"}
          </Button>
        </div>
      </div>
    </section>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      {hint && <p className="text-xs text-muted-foreground mb-2">{hint}</p>}
      {children}
    </div>
  )
}
