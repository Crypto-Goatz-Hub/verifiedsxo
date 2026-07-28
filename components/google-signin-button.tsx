"use client"

import { useState } from "react"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"

function GoogleG() {
  return (
    <svg viewBox="0 0 48 48" className="h-4 w-4 shrink-0" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}

/** Unified ecosystem CTA: "Continue with 0n · powered by Google" (0n identity via the
 * shared pwu Google provider). White button so it reads on any background. */
export function GoogleSignInButton({ next = "/dashboard" }: { next?: string }) {
  const [loading, setLoading] = useState(false)

  async function go() {
    setLoading(true)
    try {
      const supabase = getSupabaseBrowser()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
          queryParams: { prompt: "select_account" },
        },
      })
      if (error) setLoading(false)
    } catch {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={go}
        disabled={loading}
        className="flex w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-xl border border-[#d3dae3] bg-white px-4 py-3 shadow-sm transition-colors hover:bg-[#f4f6f9] disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-[#5b6b62]" />
        ) : (
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-[#ff6b35] text-[10px] font-black leading-none text-white">0n</span>
        )}
        <span className="text-sm font-bold text-[#1a2c27]">Continue with 0n</span>
        <span className="text-[#c2ccc7]" aria-hidden="true">·</span>
        <span className="text-xs font-medium text-[#5b6b62]">powered by</span>
        <GoogleG />
      </button>
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">or with email</span>
        <div className="h-px flex-1 bg-border" />
      </div>
    </div>
  )
}
