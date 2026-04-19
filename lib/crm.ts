/**
 * VerifiedSXO CRM helper.
 * Resolves the right token for a location (prefers location-scoped PIT
 * over agency PIT), and exposes contact-upsert + /conversations/messages
 * helpers so api routes don't repeat auth plumbing.
 */

export const CRM_API = "https://services.leadconnectorhq.com"
export const CRM_VERSION = "2021-07-28"

export function getPit(): string {
  return (
    process.env.CRM_VERIFIEDSXO_PIT ||
    process.env.CRM_LOCATION_PIT ||
    process.env.CRM_AGENCY_PIT ||
    ""
  )
}

export function getLocationId(): string {
  return process.env.CRM_LOCATION_ID || "gx5PredYFq7v30Kq0xTT"
}

export function getFromEmail(): string {
  return process.env.CRM_FROM_EMAIL || "noreply@verifiedsxo.com"
}

function headers() {
  return {
    Authorization: `Bearer ${getPit()}`,
    "Content-Type": "application/json",
    Version: CRM_VERSION,
  }
}

export async function upsertContact(opts: {
  email: string
  firstName?: string
  lastName?: string
  companyName?: string
  source?: string
  tags?: string[]
}): Promise<{ id: string | null; error?: string; status?: number }> {
  const pit = getPit()
  if (!pit) return { id: null, error: "no-pit" }
  try {
    const res = await fetch(`${CRM_API}/contacts/upsert`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        locationId: getLocationId(),
        email: opts.email,
        firstName: opts.firstName,
        lastName: opts.lastName,
        companyName: opts.companyName,
        source: opts.source || "VerifiedSXO",
        tags: opts.tags,
      }),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => "")
      return { id: null, error: text.slice(0, 200), status: res.status }
    }
    const data = await res.json()
    return { id: data?.contact?.id || data?.id || null }
  } catch (err) {
    return { id: null, error: err instanceof Error ? err.message : "unknown" }
  }
}

export async function sendEmailViaCrm(opts: {
  contactId: string
  to: string
  subject: string
  html: string
  text?: string
}): Promise<{ ok: boolean; error?: string; status?: number; messageId?: string }> {
  const pit = getPit()
  if (!pit) return { ok: false, error: "no-pit" }
  try {
    const res = await fetch(`${CRM_API}/conversations/messages`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        type: "Email",
        contactId: opts.contactId,
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
        emailTo: opts.to,
        emailFrom: getFromEmail(),
      }),
    })
    const text = await res.text().catch(() => "")
    if (!res.ok) return { ok: false, error: text.slice(0, 300), status: res.status }
    let data: { messageId?: string } = {}
    try { data = JSON.parse(text) } catch {}
    return { ok: true, messageId: data.messageId }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "unknown" }
  }
}
