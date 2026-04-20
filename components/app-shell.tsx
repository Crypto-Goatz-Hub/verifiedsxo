/**
 * Authenticated app shell — sticky sidebar + main content.
 *
 * Used by /dashboard/*, /client/*, /account, /admin. The sidebar nav is
 * passed in by the calling page so each role (agency / client / admin)
 * gets the right links without a big switch statement here.
 */

import Link from "next/link"
import { Header } from "@/components/header"
import type { LucideIcon } from "lucide-react"

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  active?: boolean
  badge?: string | number
  disabled?: boolean
}

export interface NavGroup {
  label?: string
  items: NavItem[]
}

interface Props {
  title: string
  subtitle?: string
  topRight?: React.ReactNode
  groups: NavGroup[]
  children: React.ReactNode
  footerBlurb?: React.ReactNode
}

export function AppShell({ title, subtitle, topRight, groups, children, footerBlurb }: Props) {
  return (
    <>
      <Header />
      <div className="pt-20 min-h-screen">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
            {/* Sidebar */}
            <aside className="lg:sticky lg:top-24 lg:self-start lg:h-[calc(100vh-7rem)] lg:overflow-y-auto">
              <nav className="space-y-5">
                {groups.map((g, gi) => (
                  <div key={`${g.label || "nav"}-${gi}`}>
                    {g.label && (
                      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground px-3 mb-2">
                        {g.label}
                      </div>
                    )}
                    <ul className="space-y-0.5">
                      {g.items.map((item) => {
                        const Icon = item.icon
                        const cls = item.active
                          ? "bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border-l-2 border-violet-500 text-foreground font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-foreground/3 border-l-2 border-transparent"
                        const inner = (
                          <span className={`group flex items-center gap-2.5 pl-3 pr-3 py-2 rounded-r-md text-sm transition-colors ${cls}`}>
                            <Icon className="w-4 h-4 shrink-0" />
                            <span className="flex-1 truncate">{item.label}</span>
                            {item.badge !== undefined && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-foreground/10 font-mono tabular-nums">
                                {item.badge}
                              </span>
                            )}
                          </span>
                        )
                        return (
                          <li key={item.href}>
                            {item.disabled ? (
                              <span className="block opacity-40 cursor-not-allowed select-none">{inner}</span>
                            ) : (
                              <Link href={item.href}>{inner}</Link>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                ))}

                {footerBlurb && (
                  <div className="px-3 pt-5 border-t border-border/60 mt-6 text-[11px] text-muted-foreground">
                    {footerBlurb}
                  </div>
                )}
              </nav>
            </aside>

            {/* Main content */}
            <main>
              <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
                <div>
                  {subtitle && (
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                      {subtitle}
                    </div>
                  )}
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
                </div>
                {topRight}
              </div>
              {children}
            </main>
          </div>
        </div>
      </div>
    </>
  )
}
