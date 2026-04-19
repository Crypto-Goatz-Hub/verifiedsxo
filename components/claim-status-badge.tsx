import { STATUS_META, type ClaimStatus } from "@/lib/claims"

export function ClaimStatusBadge({ status, size = "sm" }: { status: ClaimStatus; size?: "xs" | "sm" | "md" }) {
  const meta = STATUS_META[status] || STATUS_META.scored
  const sizeCls =
    size === "xs" ? "text-[10px] px-2 py-0.5" :
    size === "md" ? "text-sm px-3 py-1" :
    "text-xs px-2.5 py-1"
  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${meta.cls} ${sizeCls}`} title={meta.hint}>
      {meta.label}
    </span>
  )
}
