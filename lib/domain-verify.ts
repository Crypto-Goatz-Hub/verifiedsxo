/**
 * Agency domain verification.
 *
 * Rule: an agency is considered "domain verified" when the owner's auth
 * email is on the same registrable domain as the agency's published website.
 *
 *   website: https://rocketopp.com/  →  domain: rocketopp.com
 *   email:   mike@rocketopp.com       →  domain: rocketopp.com
 *   match  →  domain_verified = true
 *
 * Subdomain emails count (e.g. mike@billing.rocketopp.com → rocketopp.com),
 * generic providers never do (gmail.com, yahoo.com, outlook.com, etc.).
 */

import { getSupabaseAdmin } from "@/lib/supabase/server"

const GENERIC_EMAIL_DOMAINS = new Set([
  "gmail.com", "googlemail.com",
  "yahoo.com", "yahoo.co.uk", "ymail.com", "rocketmail.com",
  "outlook.com", "hotmail.com", "live.com", "msn.com",
  "icloud.com", "me.com", "mac.com",
  "aol.com", "protonmail.com", "proton.me",
  "mail.com", "gmx.com", "zoho.com",
  "fastmail.com", "pm.me", "tutanota.com",
])

export function normalizeDomain(input: string | null | undefined): string | null {
  if (!input) return null
  let s = String(input).trim().toLowerCase()
  if (!s) return null
  // Strip scheme + path/query
  s = s.replace(/^[a-z]+:\/\//, "")
  s = s.split("/")[0].split("?")[0]
  // Strip www.
  s = s.replace(/^www\./, "")
  // Strip port
  s = s.split(":")[0]
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(s)) return null
  return s
}

export function emailToDomain(email: string | null | undefined): string | null {
  if (!email) return null
  const at = String(email).trim().toLowerCase().split("@")
  if (at.length !== 2) return null
  return normalizeDomain(at[1])
}

/**
 * Returns the "registrable" part of a domain (naive — splits on dots and
 * keeps last 2 for .com/.net style, last 3 for .co.uk / .com.au style).
 *
 * This is good-enough for matching owner-email domain to agency-site domain.
 */
export function registrableDomain(domain: string): string {
  const parts = domain.split(".")
  if (parts.length <= 2) return domain
  const tld2 = parts.slice(-2).join(".")
  const tld3 = parts.slice(-3).join(".")
  // If the second-to-last part is one of the common "SLD" tlds, keep 3
  const secondLevelTLDs = new Set(["co.uk", "com.au", "co.nz", "com.br", "co.jp", "co.in"])
  if (secondLevelTLDs.has(tld2)) return tld3
  return tld2
}

export interface DomainCheck {
  verified: boolean
  reason: "match" | "email_domain_generic" | "email_domain_mismatch" | "no_website" | "invalid_website"
  websiteDomain: string | null
  emailDomain: string | null
  verifiedEmail: string | null
}

/**
 * Run the check against a supplied website + owner email.
 * Does not write to the DB — callers decide whether to persist.
 */
export function checkDomainMatch(website: string | null | undefined, ownerEmail: string | null | undefined): DomainCheck {
  const websiteDomain = normalizeDomain(website || "")
  const emailDomain = emailToDomain(ownerEmail || "")
  const verifiedEmail = ownerEmail || null

  if (!websiteDomain) {
    return { verified: false, reason: website ? "invalid_website" : "no_website", websiteDomain, emailDomain, verifiedEmail }
  }
  if (!emailDomain) {
    return { verified: false, reason: "email_domain_mismatch", websiteDomain, emailDomain, verifiedEmail }
  }
  if (GENERIC_EMAIL_DOMAINS.has(registrableDomain(emailDomain))) {
    return { verified: false, reason: "email_domain_generic", websiteDomain, emailDomain, verifiedEmail }
  }
  const siteReg = registrableDomain(websiteDomain)
  const emailReg = registrableDomain(emailDomain)
  if (siteReg === emailReg) {
    return { verified: true, reason: "match", websiteDomain, emailDomain, verifiedEmail }
  }
  return { verified: false, reason: "email_domain_mismatch", websiteDomain, emailDomain, verifiedEmail }
}

/**
 * Re-run the check against the agency's current website + owner auth email
 * and persist the result. Returns the final DomainCheck.
 */
export async function refreshAgencyDomainVerification(agencyId: string): Promise<DomainCheck> {
  const admin = getSupabaseAdmin()
  const { data: agency } = await admin
    .from("vsxo_agencies")
    .select("id, owner_user_id, website")
    .eq("id", agencyId)
    .maybeSingle()
  if (!agency) {
    return { verified: false, reason: "invalid_website", websiteDomain: null, emailDomain: null, verifiedEmail: null }
  }

  // Look up owner email from auth.users via admin API (service role required).
  const { data: userResp } = await admin.auth.admin.getUserById(agency.owner_user_id)
  const ownerEmail = userResp?.user?.email || null

  const result = checkDomainMatch(agency.website, ownerEmail)

  await admin
    .from("vsxo_agencies")
    .update({
      domain_verified: result.verified,
      domain_verified_at: result.verified ? new Date().toISOString() : null,
      domain_verified_email: result.verified ? result.verifiedEmail : null,
    })
    .eq("id", agencyId)

  return result
}
