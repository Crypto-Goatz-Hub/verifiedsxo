/**
 * Post-verification CRM bridge.
 *
 * When a claim is verified (or elevated), we tag the client's CRM contact
 * with "verified-claim" / "elevated-claim" and add a custom field pointing
 * to the certificate URL. That way Mike's CRM can trigger courses or
 * memberships automations downstream without us needing the courses API.
 *
 * Tags applied (per event):
 *   - verified-claim
 *   - elevated-claim (only on 100% elevation)
 *   - cert:{slug}
 *   - agency:{agencySlug}
 */

import { upsertContact } from "@/lib/crm"
import { getSupabaseAdmin } from "@/lib/supabase/server"

interface Input {
  claimId: string
  elevated: boolean
}

const CRM_API = "https://services.leadconnectorhq.com"
const CRM_VERSION = "2021-07-28"
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://verifiedsxo.com"

function getPit(): string {
  return (
    process.env.CRM_VERIFIEDSXO_PIT ||
    process.env.CRM_LOCATION_PIT ||
    process.env.CRM_AGENCY_PIT ||
    ""
  )
}

export async function issueCertificateAndTag({ claimId, elevated }: Input): Promise<void> {
  const admin = getSupabaseAdmin()

  const { data } = await admin
    .from("vsxo_claims")
    .select(`
      id, claim_text,
      client:vsxo_agency_clients(id, name, email, company, crm_contact_id, website,
        agency:vsxo_agencies(slug, name)
      ),
      badge:vsxo_badges(slug, last_verified_at)
    `)
    .eq("id", claimId)
    .maybeSingle()

  if (!data) return
  // @ts-expect-error join
  const client = data.client
  // @ts-expect-error join
  const agency = client?.agency
  // @ts-expect-error join
  const badge = Array.isArray(data.badge) ? data.badge[0] : data.badge

  if (!client || !badge?.slug) return

  const tags = [
    "verified-claim",
    `cert:${badge.slug}`,
    agency?.slug ? `agency:${agency.slug}` : null,
    elevated ? "elevated-claim" : null,
  ].filter(Boolean) as string[]

  const certUrl = `${SITE}/certificate/${badge.slug}`
  const proofUrl = `${SITE}/verified/${badge.slug}`

  let contactId = client.crm_contact_id as string | null
  if (!contactId) {
    const res = await upsertContact({
      email: client.email,
      firstName: client.name?.split(" ")[0],
      lastName: client.name?.split(" ").slice(1).join(" "),
      companyName: client.company || undefined,
      source: `VerifiedSXO ${elevated ? "Elevation" : "Verification"}`,
      tags,
    })
    contactId = res.id
    if (contactId) {
      await admin.from("vsxo_agency_clients").update({ crm_contact_id: contactId }).eq("id", client.id)
    }
  } else {
    // Add tags to existing contact (non-destructive)
    const pit = getPit()
    if (pit) {
      try {
        await fetch(`${CRM_API}/contacts/${contactId}/tags`, {
          method: "POST",
          headers: { Authorization: `Bearer ${pit}`, "Content-Type": "application/json", Version: CRM_VERSION },
          body: JSON.stringify({ tags }),
        })
      } catch {}
    }
  }

  // Update contact-level custom fields via /contacts/:id — uses customField array
  // Field keys don't have to exist ahead of time; CRM creates them as "text" first time.
  const pit = getPit()
  if (contactId && pit) {
    try {
      await fetch(`${CRM_API}/contacts/${contactId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${pit}`, "Content-Type": "application/json", Version: CRM_VERSION },
        body: JSON.stringify({
          customFields: [
            { key: "vsxo_certificate_url", field_value: certUrl },
            { key: "vsxo_proof_url", field_value: proofUrl },
            { key: "vsxo_claim_text", field_value: data.claim_text },
            { key: "vsxo_elevated", field_value: elevated ? "true" : "false" },
            { key: "vsxo_verified_at", field_value: badge.last_verified_at },
          ],
        }),
      })
    } catch {}
  }
}
