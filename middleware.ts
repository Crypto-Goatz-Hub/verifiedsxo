import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll() },
        setAll(all) {
          for (const { name, value, options } of all) {
            req.cookies.set(name, value)
            res = NextResponse.next({ request: req })
            res.cookies.set(name, value, options)
          }
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname, searchParams } = req.nextUrl

  // --- Referral capture -------------------------------------------------
  // Any landing with ?r=<code> sets a 30-day attribution cookie.
  const refCode = searchParams.get("r") || searchParams.get("ref")
  if (refCode && /^[a-z0-9][a-z0-9-]{1,40}$/i.test(refCode)) {
    res.cookies.set("vsxo_ref", refCode.toLowerCase(), {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: false,
      sameSite: "lax",
    })
    // Fire-and-forget click log (server-side) — non-blocking.
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/vsxo_referral_clicks`, {
        method: "POST",
        headers: {
          "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY,
          "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
          "Prefer": "return=minimal",
        },
        body: JSON.stringify({
          referral_code: refCode.toLowerCase(),
          landed_path: pathname,
          user_agent_hash: hashShort(req.headers.get("user-agent") || ""),
          ip_hash: hashShort(req.headers.get("x-forwarded-for") || ""),
        }),
      }).catch(() => {})
    }
  }

  // Gate /dashboard, /client, /admin, /account behind auth
  const needsAuth =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/client") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/account")
  if (needsAuth && !user) {
    const url = req.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("next", pathname)
    return NextResponse.redirect(url)
  }

  return res
}

/** Edge-safe short hash (non-cryptographic) for log dedup */
function hashShort(s: string): string {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0
  }
  return Math.abs(h).toString(36).slice(0, 10)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
}
