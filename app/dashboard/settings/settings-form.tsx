"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
    <section className="rounded-xl border bg-card p-6 md:p-8">
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="agency-name">Agency name</Label>
          <p className="text-xs text-muted-foreground">Shown on your public profile, badges, and certificates.</p>
          <Input
            id="agency-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Northwind Growth"
            maxLength={80}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="agency-tagline">Tagline</Label>
          <p className="text-xs text-muted-foreground">One-liner. 160 characters max.</p>
          <Input
            id="agency-tagline"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder='e.g. "Verified growth marketing for B2B SaaS."'
            maxLength={160}
          />
          <div className="text-[11px] text-muted-foreground tabular-nums">{tagline.length}/160</div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="agency-description">Description</Label>
          <p className="text-xs text-muted-foreground">A paragraph about what your agency does best.</p>
          <Textarea
            id="agency-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="We verify marketing claims for B2B SaaS teams using first-party analytics."
            maxLength={2000}
          />
          <div className="text-[11px] text-muted-foreground tabular-nums">{description.length}/2000</div>
        </div>

        <Separator />

        <div className={`rounded-lg border p-4 ${canPublish ? "" : "border-violet-500/30 bg-gradient-to-r from-violet-500/5 to-cyan-500/5"}`}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-[240px]">
              <Label htmlFor="public-toggle" className="text-sm font-medium">Public profile page</Label>
              <p className="text-xs text-muted-foreground mt-1">
                {canPublish
                  ? <>Live at <span className="font-mono">verifiedsxo.com/u/{publicSlug}</span></>
                  : "Requires the $8/mo membership. Unlocks public page + LinkedIn badge + embed snippets."}
              </p>
            </div>
            {canPublish ? (
              <Switch
                id="public-toggle"
                checked={publicEnabled}
                onCheckedChange={setPublicEnabled}
              />
            ) : (
              <Button asChild size="sm" className="bg-gradient-to-r from-violet-500 to-cyan-500 text-white hover:opacity-90">
                <Link href="/api/stripe/checkout?plan=membership">Activate</Link>
              </Button>
            )}
          </div>
        </div>

        {err && (
          <Alert variant="destructive">
            <AlertTriangle />
            <AlertDescription>{err}</AlertDescription>
          </Alert>
        )}
        {ok && (
          <Alert variant="success">
            <CheckCircle2 />
            <AlertDescription>Saved.</AlertDescription>
          </Alert>
        )}

        <Separator />

        <div className="flex items-center justify-end">
          <Button onClick={save} disabled={loading || name.trim().length < 2}>
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : "Save changes"}
          </Button>
        </div>
      </div>
    </section>
  )
}
