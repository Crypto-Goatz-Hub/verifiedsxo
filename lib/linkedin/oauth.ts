/**
 * LinkedIn OAuth 2.0 — user-delegated access to a client's own LinkedIn
 * profile via "Sign In with LinkedIn using OpenID Connect" (the modern
 * scope set: openid / profile / email).
 *
 * LinkedIn Developer Portal prereq:
 *   1. https://www.linkedin.com/developers/apps → your app → "Auth" tab
 *   2. Authorized redirect URLs → add
 *      https://verifiedsxo.com/api/oauth/linkedin/callback
 *   3. Products tab → enable "Sign In with LinkedIn using OpenID Connect"
 *      (and "Share on LinkedIn" if you want w_member_social later)
 */

const AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization"
const TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken"
const USERINFO_URL = "https://api.linkedin.com/v2/userinfo"

export const LINKEDIN_SCOPES = "openid profile email"

export const LINKEDIN_REDIRECT =
  process.env.LINKEDIN_OAUTH_REDIRECT_URI ||
  "https://verifiedsxo.com/api/oauth/linkedin/callback"

export function buildLinkedInAuthUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.LINKEDIN_CLIENT_ID || "",
    redirect_uri: LINKEDIN_REDIRECT,
    scope: LINKEDIN_SCOPES,
    state,
  })
  return `${AUTH_URL}?${params.toString()}`
}

export interface LinkedInTokenResponse {
  access_token: string
  expires_in: number
  scope: string
  token_type: "Bearer"
  id_token?: string
  refresh_token?: string
  refresh_token_expires_in?: number
}

export async function exchangeLinkedInCode(code: string): Promise<LinkedInTokenResponse> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: process.env.LINKEDIN_CLIENT_ID || "",
      client_secret: process.env.LINKEDIN_CLIENT_SECRET || "",
      redirect_uri: LINKEDIN_REDIRECT,
    }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`linkedin token exchange failed: ${res.status} ${text.slice(0, 240)}`)
  }
  return (await res.json()) as LinkedInTokenResponse
}

export interface LinkedInUserinfo {
  sub: string
  name?: string
  given_name?: string
  family_name?: string
  email?: string
  email_verified?: boolean
  picture?: string
  locale?: string
}

export async function fetchLinkedInUserinfo(accessToken: string): Promise<LinkedInUserinfo> {
  const res = await fetch(USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`linkedin userinfo failed: ${res.status} ${text.slice(0, 240)}`)
  }
  return (await res.json()) as LinkedInUserinfo
}
