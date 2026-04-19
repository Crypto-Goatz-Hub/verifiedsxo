import { redirect } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { AnimatedGridBackground } from "@/components/animated-grid-background"
import { Button } from "@/components/ui/button"
import { getSupabaseAdmin } from "@/lib/supabase/server"
import { AcceptInviteForm } from "./accept-form"

interface Props {
  params: Promise<{ token: string }>
}

export const dynamic = "force-dynamic"

export default async function InviteAcceptPage({ params }: Props) {
  const { token } = await params
  const admin = getSupabaseAdmin()
  const { data: client } = await admin
    .from("vsxo_agency_clients")
    .select("id, name, email, company, status, invite_accepted_at, vsxo_agencies(name, slug)")
    .eq("invite_token", token)
    .maybeSingle()

  if (!client) {
    return (
      <>
        <AnimatedGridBackground />
        <Header />
        <main className="relative z-10 pt-32 pb-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto text-center">
            <h1 className="text-3xl font-bold mb-3">Invite not found</h1>
            <p className="text-muted-foreground mb-6">
              This invite link has expired or was revoked. Ask your agency to resend it.
            </p>
            <Link href="/"><Button>Back home</Button></Link>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  // @ts-expect-error join
  const agencyName = client.vsxo_agencies?.name || "Your agency"

  if (client.status === "active" && client.invite_accepted_at) {
    redirect("/login?next=/client")
  }

  return (
    <>
      <AnimatedGridBackground />
      <Header />
      <main className="relative z-10 pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-10">
            <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
              You&apos;ve been invited
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
              <span className="bg-gradient-to-r from-violet-500 to-cyan-500 bg-clip-text text-transparent">
                {agencyName}
              </span>{" "}
              wants you on VerifiedSXO
            </h1>
            <p className="text-muted-foreground">
              Create your account below. In the next screen you&apos;ll paste a claim and connect your
              analytics to prove it.
            </p>
          </div>

          <AcceptInviteForm token={token} defaultEmail={client.email} defaultName={client.name} />
        </div>
      </main>
      <Footer />
    </>
  )
}
