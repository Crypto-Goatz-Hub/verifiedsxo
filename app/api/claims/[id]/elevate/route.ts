/**
 * POST /api/claims/:id/elevate — run AI elevation.
 * Only the claimant or an agency member can trigger. Requires the claim
 * to already have at least one verification + one uploaded document.
 */

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server"
import { runElevation } from "@/lib/elevation"
import { pingMike } from "@/lib/notify-mike"

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: claimId } = await params

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "unauthorised" }, { status: 401 })

  const admin = getSupabaseAdmin()
  const { data: claim } = await admin
    .from("vsxo_claims")
    .select("id, client_id, agency_id, vsxo_agency_clients(user_id), status")
    .eq("id", claimId)
    .maybeSingle()
  if (!claim) return NextResponse.json({ error: "not_found" }, { status: 404 })

  // @ts-expect-error join
  const clientUserId: string | null = claim.vsxo_agency_clients?.user_id
  const isClient = clientUserId === user.id
  let isAgencyMember = false
  if (!isClient) {
    const { data: m } = await admin
      .from("vsxo_agency_members")
      .select("id")
      .eq("agency_id", claim.agency_id)
      .eq("user_id", user.id)
      .maybeSingle()
    isAgencyMember = !!m
  }
  if (!isClient && !isAgencyMember) return NextResponse.json({ error: "forbidden" }, { status: 403 })

  // Gate: must have passed at least one automated verification before elevating
  const { count: verifCount } = await admin
    .from("vsxo_verifications")
    .select("id", { count: "exact", head: true })
    .eq("claim_id", claimId)
    .eq("passed", true)

  if (!verifCount || verifCount === 0) {
    return NextResponse.json(
      { error: "needs_prior_verification", message: "Run a live-data verification before requesting elevation." },
      { status: 409 }
    )
  }

  const { count: docCount } = await admin
    .from("vsxo_claim_documents")
    .select("id", { count: "exact", head: true })
    .eq("claim_id", claimId)
  if (!docCount || docCount === 0) {
    return NextResponse.json(
      { error: "needs_documents", message: "Upload at least one evidence document before requesting elevation." },
      { status: 409 }
    )
  }

  try {
    const result = await runElevation(claimId)
    pingMike({
      event: result.elevated ? "claim.verified" : "claim.rejected",
      headline: result.elevated ? `Elevated 100%: ${claimId.slice(0, 8)}` : `Elevation declined: ${claimId.slice(0, 8)}`,
      fields: {
        "Claim ID": claimId,
        Elevated: result.elevated ? "yes" : "no",
        "Elevation score": `${result.elevation_score}%`,
        Model: result.model,
        "By user": user.email || user.id,
        Synthesis: result.synthesis.slice(0, 400),
      },
      link: `https://verifiedsxo.com/${isClient ? "client" : "dashboard"}/claims/${claimId}`,
    })
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "elevation_failed" }, { status: 500 })
  }
}
