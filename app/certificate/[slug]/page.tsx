import { notFound } from "next/navigation"
import Link from "next/link"
import { getSupabaseAdmin } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { AnimatedGridBackground } from "@/components/animated-grid-background"
import { DetectorShapes } from "@/components/detector-shapes"
import { PrintButton } from "./print-button"
import { ShieldCheck, ArrowLeft } from "lucide-react"

export const dynamic = "force-dynamic"

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  return {
    title: `Certificate ${slug} | VerifiedSXO`,
    description: "Official VerifiedSXO certificate of independently verified marketing claim.",
  }
}

function certificateNumber(slug: string): string {
  return `VSXO-${slug.toUpperCase().slice(0, 6)}-${slug.toUpperCase().slice(-4)}`
}

export default async function CertificatePage({ params }: Props) {
  const { slug } = await params
  const admin = getSupabaseAdmin()

  const { data: badge } = await admin
    .from("vsxo_badges")
    .select(`
      id, slug, claim_id, client_id, verification_id, last_verified_at, public_visible,
      claim:vsxo_claims(claim_text, claim_type, status, elevated_at),
      verification:vsxo_verifications(confidence, provider, passed),
      client:vsxo_agency_clients(
        name, company, website,
        agency:vsxo_agencies(id, name, slug, membership_status, public_profile_enabled)
      )
    `)
    .eq("slug", slug)
    .eq("public_visible", true)
    .maybeSingle()

  if (!badge) notFound()
  // @ts-expect-error join shapes
  const claim = badge.claim
  // @ts-expect-error join
  const verification = badge.verification
  // @ts-expect-error join
  const client = badge.client
  // @ts-expect-error join
  const agency = client?.agency

  if (!claim || !verification || !client) notFound()

  const elevated = claim.status === "elevated"
  const certNum = certificateNumber(slug)
  const verifiedDateLong = new Date(badge.last_verified_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
  const issuedAt = claim.elevated_at || badge.last_verified_at

  return (
    <>
      <AnimatedGridBackground />
      <main className="relative z-10 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
        <DetectorShapes seed={909} count={5} intensity={0.28} blur={120} palette={[{ from: "#10b981", to: "#06b6d4" }]} />

        <div className="relative z-10 max-w-4xl mx-auto">
          {/* Navigation — hidden on print */}
          <div className="flex items-center justify-between mb-6 print:hidden">
            <Link href={`/verified/${slug}`} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to proof page
            </Link>
            <PrintButton />
          </div>

          {/* Certificate card */}
          <div className="relative rounded-3xl border-4 border-double border-foreground/80 bg-card/95 backdrop-blur-xl p-8 md:p-14 shadow-2xl print:shadow-none print:border-2">
            <div className="absolute inset-0 rounded-3xl pointer-events-none ring-1 ring-foreground/10 m-2" />

            {/* Seal */}
            <div className="absolute top-5 right-5 w-28 h-28 md:w-32 md:h-32 pointer-events-none opacity-90">
              <svg viewBox="0 0 120 120" className="w-full h-full">
                <defs>
                  <radialGradient id="sealGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </radialGradient>
                </defs>
                <circle cx="60" cy="60" r="56" fill="none" stroke="url(#sealGrad)" strokeWidth="1.5" />
                <circle cx="60" cy="60" r="48" fill="none" stroke="url(#sealGrad)" strokeWidth="0.8" strokeDasharray="2 3" />
                <circle cx="60" cy="60" r="38" fill="url(#sealGrad)" opacity="0.15" />
                <g transform="translate(60 60)">
                  <path d="M 0 -18 L 14 -3 L 4 0 L 18 16 L -4 0 L -14 -3 Z" fill="url(#sealGrad)" opacity="0.9" />
                </g>
                <text x="60" y="102" fontSize="7" fontFamily="monospace" fill="currentColor" textAnchor="middle" fillOpacity="0.7">VERIFIEDSXO · AUTHENTIC</text>
              </svg>
            </div>

            <div className="text-center mb-10">
              <div className="text-[10px] md:text-xs uppercase tracking-[0.4em] text-muted-foreground font-medium mb-3">
                Certificate of Verification
              </div>
              <div className="flex items-center justify-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <div className="text-sm font-semibold tracking-wider">VERIFIEDSXO</div>
              </div>
            </div>

            <p className="text-center text-xs md:text-sm text-muted-foreground mb-3 italic">
              This is to certify that the following marketing claim has been
              {elevated ? (
                <> <strong className="text-emerald-600 not-italic">independently elevated to 100% verified</strong> status</>
              ) : (
                <> <strong className="text-emerald-600 not-italic">independently verified against live data</strong></>
              )}
            </p>

            <div className="text-center mb-10">
              <h1 className="text-2xl md:text-4xl font-bold text-balance leading-snug px-2 md:px-10">
                &ldquo;{claim.claim_text}&rdquo;
              </h1>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-5 text-sm max-w-2xl mx-auto">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Claimed by</div>
                <div className="font-semibold">{client.company || client.name}</div>
                {client.website && <div className="text-xs text-muted-foreground">{client.website}</div>}
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Verified by agency</div>
                <div className="font-semibold">{agency?.name || "VerifiedSXO"}</div>
                {agency?.slug && <div className="text-xs text-muted-foreground">verifiedsxo.com/u/{agency.slug}</div>}
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Claim type</div>
                <div className="font-semibold capitalize">{claim.claim_type}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Data source</div>
                <div className="font-semibold">{(verification.provider || "").toUpperCase()}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Confidence</div>
                <div className="font-semibold">{verification.confidence}%</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Status</div>
                <div className="font-semibold">{elevated ? "Elevated 100%" : "Verified"}</div>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-foreground/10 flex items-end justify-between flex-wrap gap-6">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Issued</div>
                <div className="text-sm font-semibold">{verifiedDateLong}</div>
                <div className="text-[10px] text-muted-foreground">
                  Verification ID {certNum}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs italic text-muted-foreground mb-1">Authenticity</div>
                <div className="text-[10px] font-mono">verifiedsxo.com/verified/{slug}</div>
                <div className="text-[10px] font-mono text-muted-foreground">{certNum}</div>
              </div>
            </div>
          </div>

          {/* CTA — hidden on print */}
          <div className="text-center mt-8 print:hidden">
            <p className="text-sm text-muted-foreground mb-3">
              Verify this certificate at <Link href={`/verified/${slug}`} className="underline">verifiedsxo.com/verified/{slug}</Link>
            </p>
            <Link href={`/verified/${slug}`}>
              <Button className="bg-foreground text-background hover:bg-foreground/90">View full methodology</Button>
            </Link>
          </div>
        </div>
      </main>

      <style>{`@media print { body { background: white !important; } }`}</style>
    </>
  )
}
