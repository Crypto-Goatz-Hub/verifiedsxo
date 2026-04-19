/**
 * Evidence document upload + listing for a claim.
 *
 * POST /api/claims/:id/documents   (multipart: file, description?)  → upload
 * GET  /api/claims/:id/documents                                     → list + signed URLs (1h)
 */

import { NextRequest, NextResponse } from "next/server"
import { randomBytes } from "node:crypto"
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server"
import { pingMike } from "@/lib/notify-mike"

export const runtime = "nodejs"
export const maxDuration = 30

const ALLOWED_MIME = [
  "application/pdf",
  "image/png", "image/jpeg", "image/webp", "image/gif",
  "text/csv", "text/plain",
  "application/json",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]
const MAX_BYTES = 15 * 1024 * 1024

function sanitize(name: string): string {
  return name.replace(/[^\w.\-]+/g, "_").slice(0, 120)
}

interface ClaimAuth {
  claim: { id: string; client_id: string; agency_id: string; status: string }
  role: "client" | "agency_member"
  userId: string
}

async function authClaim(req: NextRequest, claimId: string): Promise<{ ok: true; ctx: ClaimAuth } | { ok: false; status: number; error: string }> {
  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, status: 401, error: "unauthorised" }

  const admin = getSupabaseAdmin()
  const { data: claim } = await admin
    .from("vsxo_claims")
    .select("id, client_id, agency_id, status")
    .eq("id", claimId)
    .maybeSingle()
  if (!claim) return { ok: false, status: 404, error: "claim_not_found" }

  const { data: clientRow } = await admin
    .from("vsxo_agency_clients")
    .select("user_id")
    .eq("id", claim.client_id)
    .maybeSingle()
  const isClient = clientRow?.user_id === user.id

  let isAgencyMember = false
  if (!isClient) {
    const { data: m } = await admin
      .from("vsxo_agency_members")
      .select("id")
      .eq("agency_id", claim.agency_id)
      .eq("user_id", user.id)
      .maybeSingle()
    isAgencyMember = !!m
    if (!isAgencyMember) {
      const { data: owned } = await admin
        .from("vsxo_agencies")
        .select("id")
        .eq("id", claim.agency_id)
        .eq("owner_user_id", user.id)
        .maybeSingle()
      isAgencyMember = !!owned
    }
  }
  if (!isClient && !isAgencyMember) return { ok: false, status: 403, error: "forbidden" }

  return {
    ok: true,
    ctx: { claim, role: isClient ? "client" : "agency_member", userId: user.id },
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: claimId } = await params
  const auth = await authClaim(req, claimId)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { claim, userId } = auth.ctx

  let form: FormData
  try { form = await req.formData() }
  catch { return NextResponse.json({ error: "expected multipart/form-data" }, { status: 400 }) }

  const file = form.get("file")
  const description = (form.get("description") as string | null)?.slice(0, 500) || null
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "file required" }, { status: 400 })
  }
  if (file.size <= 0 || file.size > MAX_BYTES) {
    return NextResponse.json({ error: `file must be between 1 byte and ${MAX_BYTES / (1024 * 1024)}MB` }, { status: 400 })
  }
  if (file.type && !ALLOWED_MIME.includes(file.type)) {
    return NextResponse.json({ error: `mime type not allowed: ${file.type}` }, { status: 400 })
  }

  const admin = getSupabaseAdmin()
  const ext = sanitize(file.name).includes(".") ? sanitize(file.name).split(".").pop() : ""
  const randName = `${randomBytes(10).toString("base64url")}${ext ? "." + ext : ""}`
  const path = `claims/${claim.id}/${randName}`

  const bytes = new Uint8Array(await file.arrayBuffer())
  const { error: upErr } = await admin.storage
    .from("vsxo-evidence")
    .upload(path, bytes, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    })
  if (upErr) return NextResponse.json({ error: `upload_failed: ${upErr.message}` }, { status: 500 })

  const { data: doc, error: insErr } = await admin
    .from("vsxo_claim_documents")
    .insert({
      claim_id: claim.id,
      client_id: claim.client_id,
      uploader_user_id: userId,
      storage_path: path,
      file_name: sanitize(file.name) || randName,
      mime_type: file.type || null,
      size_bytes: file.size,
      description,
    })
    .select("id, file_name, mime_type, size_bytes, description, created_at")
    .single()

  if (insErr) {
    await admin.storage.from("vsxo-evidence").remove([path])
    return NextResponse.json({ error: `meta_insert_failed: ${insErr.message}` }, { status: 500 })
  }

  // If the claim is waiting on docs, move it to pending_review. Leaves
  // verified / elevated / scored states untouched so AI elevation is opt-in.
  if (claim.status === "needs_docs") {
    await admin
      .from("vsxo_claims")
      .update({ status: "pending_review" })
      .eq("id", claim.id)
  }

  pingMike({
    event: "claim.scored",
    headline: `Evidence uploaded for claim ${claim.id.slice(0, 8)}`,
    fields: {
      "Claim ID": claim.id,
      "Client ID": claim.client_id,
      "Agency ID": claim.agency_id,
      File: `${doc.file_name} (${Math.round((doc.size_bytes || 0) / 1024)}KB)`,
      Uploader: auth.ctx.role,
    },
    link: auth.ctx.role === "client"
      ? `https://verifiedsxo.com/client/claims/${claim.id}`
      : `https://verifiedsxo.com/dashboard/claims/${claim.id}`,
  })

  return NextResponse.json({ doc })
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: claimId } = await params
  const auth = await authClaim(req, claimId)
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const admin = getSupabaseAdmin()
  const { data: docs } = await admin
    .from("vsxo_claim_documents")
    .select("id, file_name, mime_type, size_bytes, description, storage_path, created_at")
    .eq("claim_id", claimId)
    .order("created_at", { ascending: false })

  const out = await Promise.all(
    (docs || []).map(async (d) => {
      const { data: signed } = await admin.storage
        .from("vsxo-evidence")
        .createSignedUrl(d.storage_path, 60 * 60) // 1 hour
      return {
        id: d.id,
        file_name: d.file_name,
        mime_type: d.mime_type,
        size_bytes: d.size_bytes,
        description: d.description,
        created_at: d.created_at,
        url: signed?.signedUrl || null,
      }
    })
  )

  return NextResponse.json({ docs: out })
}
