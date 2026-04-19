/**
 * DELETE /api/claims/:id/documents/:docId
 * Removes a single evidence document (storage object + DB row).
 */

import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  const { id: claimId, docId } = await params

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "unauthorised" }, { status: 401 })

  const admin = getSupabaseAdmin()
  const { data: doc } = await admin
    .from("vsxo_claim_documents")
    .select("id, claim_id, storage_path, client_id, uploader_user_id, vsxo_agency_clients(user_id, agency_id)")
    .eq("id", docId)
    .eq("claim_id", claimId)
    .maybeSingle()
  if (!doc) return NextResponse.json({ error: "not_found" }, { status: 404 })

  // @ts-expect-error join
  const clientUserId: string | null = doc.vsxo_agency_clients?.user_id
  // @ts-expect-error join
  const agencyId: string | null = doc.vsxo_agency_clients?.agency_id

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

  await admin.storage.from("vsxo-evidence").remove([doc.storage_path])
  await admin.from("vsxo_claim_documents").delete().eq("id", doc.id)

  return NextResponse.json({ ok: true })
}
