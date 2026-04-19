import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { createClient as createRestClient } from "@supabase/supabase-js"

export async function getSupabaseServer() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(all) {
          try {
            for (const { name, value, options } of all) cookieStore.set(name, value, options)
          } catch {
            // called from Server Component — ok to ignore
          }
        },
      },
    }
  )
}

// Admin / service-role client — RLS-bypassing. Use only in server routes.
export function getSupabaseAdmin() {
  return createRestClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}
