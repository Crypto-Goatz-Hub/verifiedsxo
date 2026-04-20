/**
 * Fire-and-forget "notify Mike" pipe for every form + signup + claim on
 * verifiedsxo.com. Uses the same CRM /conversations/messages endpoint the
 * invite flow uses, with `emailTo = mike@rocketopp.com`.
 *
 * Never throws. Never blocks the caller. All errors land in console only.
 */

import { upsertContact, sendEmailViaCrm } from "@/lib/crm"

const MIKE_EMAIL = process.env.MIKE_EMAIL || "mike@rocketopp.com"

interface NotifyArgs {
  event:
    | "agency.signup"
    | "client.invited"
    | "client.invite_accepted"
    | "claim.scored"
    | "claim.verified"
    | "claim.rejected"
    | "claim.researched"
    | "contact.submitted"
    | "public.score"
  subject?: string
  headline: string
  /** Label → value pairs rendered as a readable table in the email body */
  fields?: Record<string, string | number | boolean | null | undefined>
  /** URL on verifiedsxo.com for Mike to click into this record */
  link?: string
}

/** Lazily cached Mike contact id on the VerifiedSXO sub-location */
let mikeContactIdCache: string | null = null

async function getMikeContactId(): Promise<string | null> {
  if (mikeContactIdCache) return mikeContactIdCache
  const res = await upsertContact({
    email: MIKE_EMAIL,
    firstName: "Mike",
    lastName: "Mento",
    source: "VerifiedSXO internal",
    tags: ["team", "owner"],
  })
  if (res.id) mikeContactIdCache = res.id
  return mikeContactIdCache
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string)
}

function renderBody(args: NotifyArgs): { subject: string; html: string; text: string } {
  const subject = args.subject || `[VSXO · ${args.event}] ${args.headline.slice(0, 80)}`
  const rows = Object.entries(args.fields || {})
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) =>
      `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;color:#666;font-weight:600;width:35%;">${escapeHtml(k)}</td><td style="padding:6px 12px;border-bottom:1px solid #eee;">${escapeHtml(String(v))}</td></tr>`
    )
    .join("")

  const linkHtml = args.link
    ? `<div style="margin-top:22px;"><a href="${args.link}" style="display:inline-block;background:linear-gradient(135deg,#8b5cf6,#06b6d4);color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:10px 22px;border-radius:6px;">View in VerifiedSXO →</a></div>`
    : ""

  const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#fafafa;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif;color:#111;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fafafa;"><tr><td align="center" style="padding:28px 12px;">
<table width="620" cellpadding="0" cellspacing="0" border="0" style="max-width:620px;width:100%;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.04);">
  <tr><td style="background:linear-gradient(135deg,#8b5cf6 0%,#06b6d4 100%);padding:22px 28px;color:#fff;">
    <div style="font-size:11px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;opacity:0.9;">VerifiedSXO · ${escapeHtml(args.event)}</div>
    <div style="font-size:19px;font-weight:700;margin-top:4px;">${escapeHtml(args.headline)}</div>
  </td></tr>
  <tr><td style="padding:20px 28px;">
    ${rows ? `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;font-size:14px;">${rows}</table>` : '<p style="color:#666;font-size:14px;">No additional details.</p>'}
    ${linkHtml}
  </td></tr>
  <tr><td style="padding:16px 28px;background:#fafafa;border-top:1px solid #eee;color:#999;font-size:11px;text-align:center;">
    Internal — VerifiedSXO lead feed
  </td></tr>
</table>
</td></tr></table></body></html>`

  const text = [
    `[VSXO · ${args.event}] ${args.headline}`,
    "",
    ...Object.entries(args.fields || {}).map(([k, v]) => `  ${k}: ${v ?? ""}`),
    args.link ? `\n${args.link}` : "",
  ].join("\n")

  return { subject, html, text }
}

export async function notifyMike(args: NotifyArgs): Promise<void> {
  try {
    const contactId = await getMikeContactId()
    if (!contactId) return
    const { subject, html, text } = renderBody(args)
    await sendEmailViaCrm({ contactId, to: MIKE_EMAIL, subject, html, text })
  } catch (err) {
    console.error("[notifyMike] failed:", err)
  }
}

/** Wraps notifyMike in a fire-and-forget style for use in request paths. */
export function pingMike(args: NotifyArgs): void {
  notifyMike(args).catch(() => {})
}
