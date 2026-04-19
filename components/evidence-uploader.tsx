"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Upload, FileText, Image as ImageIcon, Loader2, Trash2, ExternalLink, AlertTriangle, CheckCircle2 } from "lucide-react"

interface Doc {
  id: string
  file_name: string
  mime_type: string | null
  size_bytes: number | null
  description: string | null
  created_at: string
  url: string | null
}

export function EvidenceUploader({ claimId, editable }: { claimId: string; editable: boolean }) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [description, setDescription] = useState("")
  const [err, setErr] = useState<string | null>(null)
  const [recentlyAdded, setRecentlyAdded] = useState<string | null>(null)

  async function load() {
    setLoading(true); setErr(null)
    try {
      const r = await fetch(`/api/claims/${claimId}/documents`)
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || "failed")
      setDocs(j.docs || [])
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "load error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [claimId])

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setErr(null); setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      if (description.trim()) fd.append("description", description.trim())
      const r = await fetch(`/api/claims/${claimId}/documents`, { method: "POST", body: fd })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || "upload_failed")
      setDescription("")
      setRecentlyAdded(j.doc.id)
      setTimeout(() => setRecentlyAdded(null), 4000)
      await load()
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "upload error")
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this document?")) return
    try {
      const r = await fetch(`/api/claims/${claimId}/documents/${id}`, { method: "DELETE" })
      if (!r.ok) throw new Error("delete_failed")
      await load()
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "delete error")
    }
  }

  function iconFor(mime?: string | null) {
    if (!mime) return FileText
    if (mime.startsWith("image/")) return ImageIcon
    return FileText
  }

  function sizeLabel(bytes?: number | null) {
    if (!bytes) return ""
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Evidence documents</h2>
          <p className="text-xs text-muted-foreground mt-1">
            PDF, image, spreadsheet, or text — up to 15 MB each. Private and signed.
          </p>
        </div>
      </div>

      {editable && (
        <div className="rounded-lg border border-dashed border-border bg-background p-4 mb-5">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.csv,.txt,.json,.xls,.xlsx,.doc,.docx"
              onChange={onPick}
              disabled={uploading}
              className="text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-foreground file:text-background file:font-medium hover:file:bg-foreground/90 file:cursor-pointer"
            />
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description (optional)"
              disabled={uploading}
              className="flex-1 w-full sm:w-auto px-3 py-2 rounded-md border border-border bg-background focus:border-foreground/30 outline-none text-sm"
            />
            {uploading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
          </div>
        </div>
      )}

      {err && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-sm text-rose-500 mb-4">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{err}</span>
        </div>
      )}

      {loading ? (
        <div className="text-xs text-muted-foreground flex items-center gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading…</div>
      ) : docs.length === 0 ? (
        <div className="text-center text-sm text-muted-foreground py-8 border border-dashed border-border rounded-lg">
          No evidence uploaded yet.
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border overflow-hidden">
          {docs.map((d) => {
            const Icon = iconFor(d.mime_type)
            const fresh = recentlyAdded === d.id
            return (
              <li key={d.id} className={`flex items-center gap-3 p-3 ${fresh ? "bg-emerald-500/5" : "bg-background"}`}>
                <Icon className="w-5 h-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate flex items-center gap-2">
                    {d.file_name}
                    {fresh && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                  </div>
                  <div className="text-xs text-muted-foreground flex gap-2 flex-wrap">
                    <span>{sizeLabel(d.size_bytes)}</span>
                    <span>·</span>
                    <span>{new Date(d.created_at).toLocaleString()}</span>
                    {d.description && (<><span>·</span><span className="italic truncate">{d.description}</span></>)}
                  </div>
                </div>
                {d.url && (
                  <a href={d.url} target="_blank" rel="noopener" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                    <ExternalLink className="w-3.5 h-3.5" /> View
                  </a>
                )}
                {editable && (
                  <Button variant="outline" size="sm" onClick={() => onDelete(d.id)} className="gap-1.5 text-rose-500 border-rose-500/30 hover:bg-rose-500/10">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {!editable && docs.length === 0 && null}
    </section>
  )
}
