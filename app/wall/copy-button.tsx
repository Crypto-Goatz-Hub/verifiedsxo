"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"

export function WallCopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // silent fail — clipboard blocked in some browsers/iframes
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={copy}
      className={copied ? "border-emerald-500/50 text-emerald-600" : ""}
      aria-label="Copy claim to clipboard"
    >
      {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
    </Button>
  )
}
