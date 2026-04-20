import type { NavGroup } from "@/components/app-shell"
import {
  LayoutDashboard, Sparkles, Users, Settings, CreditCard, ShieldCheck,
  BookOpen, Gift, Search, Home, ExternalLink, LifeBuoy,
} from "lucide-react"

export function agencyNav(current: string, stats?: { clients?: number; claims?: number }): NavGroup[] {
  return [
    {
      label: "Agency",
      items: [
        { label: "Overview",  href: "/dashboard",         icon: LayoutDashboard, active: current === "/dashboard" },
        { label: "Claims",    href: "/dashboard/claims",  icon: Sparkles,        active: current.startsWith("/dashboard/claims"), badge: stats?.claims },
        { label: "Clients",   href: "/dashboard#clients", icon: Users,           active: false,                                     badge: stats?.clients },
        { label: "Public page", href: "#", icon: ExternalLink, disabled: true },
      ],
    },
    {
      label: "Account",
      items: [
        { label: "Settings",  href: "/dashboard/settings", icon: Settings,    active: current === "/dashboard/settings" },
        { label: "Billing",   href: "/account",            icon: CreditCard,  active: current === "/account" },
      ],
    },
    {
      label: "Help",
      items: [
        { label: "How it works",    href: "/how-it-works",    icon: BookOpen, active: false },
        { label: "Badge examples",  href: "/badge-examples",  icon: ShieldCheck, active: false },
        { label: "Contact support", href: "/contact",         icon: LifeBuoy, active: false },
      ],
    },
  ]
}

export function clientNav(current: string, stats?: { claims?: number; offers?: number }): NavGroup[] {
  return [
    {
      label: "Your account",
      items: [
        { label: "Home",         href: "/client",           icon: Home,         active: current === "/client" },
        { label: "Verify a claim", href: "/client/verify",  icon: Sparkles,     active: current === "/client/verify" },
        { label: "My claims",    href: "/client/claims",    icon: ShieldCheck,  active: current.startsWith("/client/claims"), badge: stats?.claims },
        { label: "Settings",     href: "/client/settings",  icon: Settings,     active: current === "/client/settings" },
      ],
    },
    {
      label: "Marketplace",
      items: [
        { label: "Resources",     href: "/client/resources", icon: BookOpen, active: current === "/client/resources" },
        { label: "Special offers",href: "/client/offers",    icon: Gift,     active: current === "/client/offers", badge: stats?.offers },
        { label: "Find an agency",href: "/client/directory", icon: Search,   active: current === "/client/directory" },
      ],
    },
    {
      label: "Help",
      items: [
        { label: "How it works",    href: "/how-it-works",    icon: BookOpen, active: false },
        { label: "Contact support", href: "/contact",         icon: LifeBuoy, active: false },
      ],
    },
  ]
}
