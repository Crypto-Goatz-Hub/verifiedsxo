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
  const { pathname } = req.nextUrl

  // Gate /dashboard and /client behind auth
  const needsAuth = pathname.startsWith("/dashboard") || pathname.startsWith("/client")
  if (needsAuth && !user) {
    const url = req.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("next", pathname)
    return NextResponse.redirect(url)
  }

  return res
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
}
