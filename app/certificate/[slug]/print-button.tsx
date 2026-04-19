"use client"

import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"

export function PrintButton() {
  return (
    <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()}>
      <Printer className="w-3.5 h-3.5" /> Print / save as PDF
    </Button>
  )
}
