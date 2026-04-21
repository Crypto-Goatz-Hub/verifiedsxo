"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Copy, Check, Share2 } from "lucide-react"

interface Props {
  url: string
  text: string
  compact?: boolean
}

/**
 * One-click share: Twitter/X, LinkedIn, copy. Pre-fills post copy with the
 * claim text + URL so verified badges spread organically.
 */
export function ShareButtons({ url, text, compact }: Props) {
  const [copied, setCopied] = useState(false)
  const twitterHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
  const linkedinHref = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
  const fbHref = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch { /* ignore */ }
  }

  const size = compact ? "sm" : "default"

  return (
    <div className="flex items-center flex-wrap gap-2 justify-center">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
        <Share2 className="w-3.5 h-3.5" /> Share
      </span>
      <Button asChild variant="outline" size={size}>
        <a href={twitterHref} target="_blank" rel="noopener">X / Twitter</a>
      </Button>
      <Button asChild variant="outline" size={size}>
        <a href={linkedinHref} target="_blank" rel="noopener">LinkedIn</a>
      </Button>
      <Button asChild variant="outline" size={size}>
        <a href={fbHref} target="_blank" rel="noopener">Facebook</a>
      </Button>
      <Button variant="outline" size={size} onClick={copy} className={copied ? "border-emerald-500/50 text-emerald-600" : ""}>
        {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy link</>}
      </Button>
    </div>
  )
}
