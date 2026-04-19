"use client"

import { useState } from "react"
import { Copy, CheckCircle2 } from "lucide-react"

export function CopyEmbed({ snippet, label = "Embed code" }: { snippet: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(snippet).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</div>
        <button onClick={copy} className="text-[11px] inline-flex items-center gap-1 text-foreground/70 hover:text-foreground">
          {copied ? <><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
        </button>
      </div>
      <code className="block px-3 py-2 bg-foreground/5 border border-border rounded text-[11px] font-mono break-all leading-relaxed">
        {snippet}
      </code>
    </div>
  )
}
