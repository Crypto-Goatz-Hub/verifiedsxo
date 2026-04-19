/**
 * Per-user Google OAuth — the end-customer grants access to their own
 * GSC / GA4 / Ads data. Separate from the service-account flow used for
 * rocketopp.com's OWN data.
 */

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
const TOKEN_URL = "https://oauth2.googleapis.com/token"

export const GSC_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly"
export const GSC_REDIRECT =
  process.env.GOOGLE_OAUTH_REDIRECT_URI_GSC ||
  "https://verifiedsxo.com/api/oauth/gsc/callback"

export function buildAuthUrl(opts: {
  scope: string
  state: string
  redirectUri?: string
  loginHint?: string
}): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    redirect_uri: opts.redirectUri || GSC_REDIRECT,
    response_type: "code",
    scope: opts.scope,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state: opts.state,
    ...(opts.loginHint ? { login_hint: opts.loginHint } : {}),
  })
  return `${AUTH_URL}?${params.toString()}`
}

export interface TokenResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
  scope: string
  token_type: "Bearer"
}

export async function exchangeCode(code: string, redirectUri?: string): Promise<TokenResponse> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      redirect_uri: redirectUri || GSC_REDIRECT,
      grant_type: "authorization_code",
    }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`google token exchange failed: ${res.status} ${text.slice(0, 200)}`)
  }
  return (await res.json()) as TokenResponse
}

export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`google token refresh failed: ${res.status} ${text.slice(0, 200)}`)
  }
  return (await res.json()) as TokenResponse
}
