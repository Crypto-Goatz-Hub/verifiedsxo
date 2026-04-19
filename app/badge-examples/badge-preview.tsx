"use client"

import { useEffect, useRef } from "react"

/**
 * Live-renders the actual badge <script> so prospects see it exactly as
 * it behaves in the wild. Each mount injects one script + one host node
 * into a scoped container and cleans up on unmount.
 */
export function BadgePreview({
  slug,
  variant = "inline",
  theme,
  metric,
}: {
  slug: string
  variant?: "inline" | "stamp" | "banner"
  theme?: "light" | "dark"
  metric?: string
}) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const host = ref.current
    if (!host) return
    host.innerHTML = ""

    const site = window.location.origin
    const s = document.createElement("script")
    s.src = `${site}/v/${slug}?preview=${Date.now()}`
    s.async = true
    s.dataset.variant = variant
    if (theme) s.dataset.theme = theme
    if (metric) s.dataset.metric = metric
    host.appendChild(s)

    return () => {
      host.innerHTML = ""
    }
  }, [slug, variant, theme, metric])

  return <div ref={ref} />
}
