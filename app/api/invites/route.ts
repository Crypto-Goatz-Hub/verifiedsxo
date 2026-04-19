import { NextRequest, NextResponse } from "next/server"
import { randomBytes } from "node:crypto"
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server"

export const runtime = "nodejs"

const CRM_API = "https://services.leadconnectorhq.com"
const CRM_VERSION = "2021-07-28"
const FROM_EMAIL = process.env.CRM_FROM_EMAIL || "noreply@verifiedsxo.com"

function newInviteToken(): string {
  return randomBytes(24).toString("base64url")
}

async function upsertCrmClient(email: string, name: string, company: string | undefined, agencyId: string, agencyName: string) {
  const pit = process.env.CRM_AGENCY_PIT || ""
  const locationId = process.env.CRM_LOCATION_ID || ""
  if (!pit || !locationId) return null
  try {
    const res = await fetch(`${CRM_API}/contacts/upsert`, {
      method: "POST",
      headers: { Authorization: `Bearer ${pit}`, "Content-Type": "application/json", Version: CRM_VERSION },
      body: JSON.stringify({
        locationId,
        email,
        firstName: name.split(" ")[0] || name,
        lastName: name.split(" ").slice(1).join(" ") || "",
        companyName: company,
        source: `VerifiedSXO Invite · ${agencyName}`,
        tags: ["Client", "verifiedsxo", `agency:${agencyId}`],
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data?.contact?.id || data?.id || null
  } catch {
    return null
  }
}

function renderEmail(inviteUrl: string, agencyName: string, firstName: string): { subject: string; html: string; text: string } {
  const subject = `${agencyName} invited you to verify your marketing stats`
  const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#fafafa;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif;color:#111;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fafafa;"><tr><td align="center" style="padding:32px 12px;">
  <table width="640" cellpadding="0" cellspacing="0" border="0" style="max-width:640px;width:100%;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.04);">
    <tr><td style="background:linear-gradient(135deg,#8b5cf6 0%,#06b6d4 100%);padding:32px;color:#fff;">
      <div style="font-size:12px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;opacity:0.9;">VerifiedSXO</div>
      <div style="font-size:24px;font-weight:700;margin-top:6px;">You're invited to verify your stats</div>
    </td></tr>
    <tr><td style="padding:28px 32px;font-size:16px;line-height:1.65;color:#333;">
      <p>Hey ${firstName || "there"},</p>
      <p><strong>${agencyName}</strong> uses <strong>VerifiedSXO</strong> to help clients prove their marketing claims with real data — and turn those verifications into credibility badges they can embed on their own site.</p>
      <p>Accept the invite and you'll be able to:</p>
      <ul style="padding-left:18px;margin:14px 0;">
        <li>Score any stat claim in under 60 seconds</li>
        <li>Connect Google Search Console / Analytics / Stripe to prove the number</li>
        <li>Earn a public verification badge + hosted case-study page</li>
      </ul>
    </td></tr>
    <tr><td align="center" style="padding:8px 32px 28px;">
      <a href="${inviteUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;font-weight:600;font-size:15px;padding:13px 32px;border-radius:8px;">Accept invite →</a>
      <div style="font-size:12px;color:#999;margin-top:16px;">Or paste this link: <a href="${inviteUrl}" style="color:#06b6d4;word-break:break-all;">${inviteUrl}</a></div>
    </td></tr>
    <tr><td style="padding:20px 32px;background:#fafafa;border-top:1px solid #eee;color:#999;font-size:12px;text-align:center;">
      Powered by <a href="https://verifiedsxo.com" style="color:#999;">VerifiedSXO</a> — the proof layer for marketing claims.
    </td></tr>
  </table>
</td></tr></table>
</body></html>`
  const text = `${agencyName} invited you to VerifiedSXO.\n\nVerify your stats, connect your analytics, earn a public proof badge.\n\nAccept: ${inviteUrl}\n\n— VerifiedSXO`
  return { subject, html, text }
}

async function emailInvite(contactId: string, to: string, subject: string, html: string, text: string): Promise<boolean> {
  const pit = process.env.CRM_AGENCY_PIT || ""
  if (!pit || !contactId) return false
  try {
    const res = await fetch(`${CRM_API}/conversations/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${pit}`, "Content-Type": "application/json", Version: CRM_VERSION },
      body: JSON.stringify({
        type: "Email",
        contactId,
        subject,
        html,
        text,
        emailTo: to,
        emailFrom: FROM_EMAIL,
      }),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const agencyId: string = body?.agencyId || ""
  const name: string = (body?.name || "").trim()
  const email: string = (body?.email || "").trim().toLowerCase()
  const company: string | undefined = body?.company || undefined

  if (!agencyId || !name || !email) return NextResponse.json({ error: "agencyId, name, email required" }, { status: 400 })
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return NextResponse.json({ error: "invalid email" }, { status: 400 })

  const supabase = await getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "unauthorised" }, { status: 401 })

  const admin = getSupabaseAdmin()

  // Verify user has access to this agency
  const { data: membership } = await admin
    .from("vsxo_agency_members")
    .select("role")
    .eq("agency_id", agencyId)
    .eq("user_id", user.id)
    .maybeSingle()
  const { data: owned } = await admin
    .from("vsxo_agencies")
    .select("id, name")
    .eq("id", agencyId)
    .eq("owner_user_id", user.id)
    .maybeSingle()
  if (!membership && !owned) return NextResponse.json({ error: "forbidden" }, { status: 403 })

  const { data: agency } = await admin.from("vsxo_agencies").select("name").eq("id", agencyId).single()
  const agencyName = agency?.name || "An agency"

  const token = newInviteToken()

  // Upsert the client row (handles re-inviting the same email)
  const { data: clientRow, error: upsertErr } = await admin
    .from("vsxo_agency_clients")
    .upsert(
      {
        agency_id: agencyId,
        name,
        email,
        company,
        status: "invited",
        invite_token: token,
        invite_sent_at: new Date().toISOString(),
      },
      { onConflict: "agency_id,email" }
    )
    .select("id")
    .single()

  if (upsertErr) return NextResponse.json({ error: upsertErr.message }, { status: 500 })

  // CRM contact + email — best-effort, don't fail the API
  const crmContactId = await upsertCrmClient(email, name, company, agencyId, agencyName)
  if (crmContactId) {
    await admin.from("vsxo_agency_clients").update({ crm_contact_id: crmContactId }).eq("id", clientRow.id)
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://verifiedsxo.com"
  const inviteUrl = `${baseUrl}/invite/${token}`
  const { subject, html, text } = renderEmail(inviteUrl, agencyName, name.split(" ")[0] || name)
  const emailed = crmContactId ? await emailInvite(crmContactId, email, subject, html, text) : false

  return NextResponse.json({
    clientId: clientRow.id,
    inviteUrl,
    emailSent: emailed,
    crmContactId,
  })
}
