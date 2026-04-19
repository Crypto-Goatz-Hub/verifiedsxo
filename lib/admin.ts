/**
 * Admin permission helpers. Resolves either by auth.users.id or by email
 * (so admins seeded before they sign up still get access once they do).
 */

import { getSupabaseAdmin } from "@/lib/supabase/server"

export async function isAdmin(userId: string | null | undefined, email: string | null | undefined): Promise<boolean> {
  if (!userId && !email) return false
  const admin = getSupabaseAdmin()
  const { data } = await admin
    .from("vsxo_admins")
    .select("role")
    .or(`user_id.eq.${userId || "00000000-0000-0000-0000-000000000000"},email.eq.${(email || "").toLowerCase()}`)
    .limit(1)
    .maybeSingle()
  return !!data
}
