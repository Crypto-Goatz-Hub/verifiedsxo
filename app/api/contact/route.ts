import { NextRequest, NextResponse } from "next/server"
import { upsertContact, sendEmailViaCrm } from "@/lib/crm"
import { pingMike } from "@/lib/notify-mike"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const name: string = (body?.name || "").trim()
  const email: string = (body?.email || "").trim().toLowerCase()
  const company: string = (body?.company || "").trim()
  const topic: string = body?.topic || "general"
  const message: string = (body?.message || "").trim()

  if (!name || !email || !message) return NextResponse.json({ error: "name, email, message required" }, { status: 400 })
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return NextResponse.json({ error: "invalid email" }, { status: 400 })
  if (message.length > 4000) return NextResponse.json({ error: "message too long" }, { status: 400 })

  const crm = await upsertContact({
    email,
    firstName: name.split(" ")[0] || name,
    lastName: name.split(" ").slice(1).join(" ") || "",
    companyName: company || undefined,
    source: `VerifiedSXO Contact · ${topic}`,
    tags: ["Contact", "verifiedsxo", `topic:${topic}`],
  })

  // Auto-reply to the submitter via CRM
  if (crm.id) {
    await sendEmailViaCrm({
      contactId: crm.id,
      to: email,
      subject: "We got your note — VerifiedSXO",
      html: `<p>Hey ${name.split(" ")[0] || "there"},</p><p>Your note landed with us directly. Mike reads everything and will reply within 24 hours (usually way sooner).</p><p>— The VerifiedSXO team</p>`,
      text: `Hey ${name.split(" ")[0] || "there"},\n\nYour note landed. Mike reads everything and will reply within 24 hours.\n\n— VerifiedSXO`,
    })
  }

  pingMike({
    event: "contact.submitted",
    headline: `Contact: ${topic} — ${name}`,
    fields: {
      Name: name,
      Email: email,
      Company: company || "—",
      Topic: topic,
      Message: message.length > 500 ? message.slice(0, 500) + "…" : message,
      "CRM contact": crm.id || "(not created)",
    },
  })

  return NextResponse.json({ ok: true, crmContactId: crm.id })
}
