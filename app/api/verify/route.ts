import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server"
import { runVerification } from "@/lib/verification"

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const claimId: string = body?.claimId || ""
  if (!claimId) return NextResponse.json({ error: "claimId required" }, { status: 400 })

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "unauthorised" }, { status: 401 })

  const admin = getSupabaseAdmin()
  const { data: claim } = await admin
    .from("vsxo_claims")
    .select("id, client_id, vsxo_agency_clients(user_id, agency_id)")
    .eq("id", claimId)
    .maybeSingle()

  // @ts-expect-error join
  const clientUserId: string | null = claim?.vsxo_agency_clients?.user_id
  // @ts-expect-error join
  const agencyId: string | null = claim?.vsxo_agency_clients?.agency_id

  if (!claim) return NextResponse.json({ error: "claim not found" }, { status: 404 })

  // Permit if submitter is the claim's client OR an agency member
  const isClient = clientUserId === user.id
  let isAgencyMember = false
  if (!isClient && agencyId) {
    const { data: m } = await admin
      .from("vsxo_agency_members")
      .select("id")
      .eq("agency_id", agencyId)
      .eq("user_id", user.id)
      .maybeSingle()
    isAgencyMember = !!m
  }
  if (!isClient && !isAgencyMember) return NextResponse.json({ error: "forbidden" }, { status: 403 })

  try {
    const result = await runVerification(claimId)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "verification failed" }, { status: 500 })
  }
}
