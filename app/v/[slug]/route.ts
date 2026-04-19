/**
 * GET /v/[slug] — returns a JavaScript snippet that, when embedded via
 * <script src="...">, injects a tamper-resistant "Verified by VerifiedSXO"
 * badge onto the host page and increments the embed counter.
 */

import { NextRequest } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/server"

export const runtime = "nodejs"

function escapeJs(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n").replace(/</g, "\\u003c")
}

function jsResponse(body: string, cacheSeconds = 300): Response {
  return new Response(body, {
    status: 200,
    headers: {
      "content-type": "application/javascript; charset=utf-8",
      "cache-control": `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds}, stale-while-revalidate=86400`,
      "access-control-allow-origin": "*",
    },
  })
}

function notFoundJs(slug: string) {
  return jsResponse(`/* VerifiedSXO: no badge found for slug "${slug}" */`, 60)
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) return notFoundJs(slug)

  const admin = getSupabaseAdmin()
  const { data: badge } = await admin
    .from("vsxo_badges")
    .select("id, slug, claim_id, verification_id, last_verified_at, embed_count, public_visible")
    .eq("slug", slug)
    .eq("public_visible", true)
    .maybeSingle()

  if (!badge) return notFoundJs(slug)

  const [claimRes, verificationRes] = await Promise.all([
    admin.from("vsxo_claims").select("claim_text, claim_type").eq("id", badge.claim_id).single(),
    admin.from("vsxo_verifications").select("evidence, passed, confidence, verified_at").eq("id", badge.verification_id).single(),
  ])
  const claim = claimRes.data
  const verification = verificationRes.data
  if (!claim || !verification) return notFoundJs(slug)

  // Increment embed counter (fire-and-forget, never fails the request)
  admin.from("vsxo_badges").update({ embed_count: (badge.embed_count || 0) + 1 }).eq("id", badge.id).then(() => {})

  const evidence = (verification.evidence as Record<string, unknown>) || {}
  const pageUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://verifiedsxo.com"}/verified/${badge.slug}`
  const verifiedDate = new Date(verification.verified_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })

  // Short snippet for the badge tooltip
  const metric: string = String(evidence.summary || "Claim verified against real data.").slice(0, 120)

  const script = `
(function(){
  if (window.__vsxoBadge_${badge.slug.replace(/[^a-z0-9]/g, '')}) return;
  window.__vsxoBadge_${badge.slug.replace(/[^a-z0-9]/g, '')} = true;

  var currentScript = document.currentScript;
  if (!currentScript) {
    var scripts = document.getElementsByTagName('script');
    currentScript = scripts[scripts.length - 1];
  }

  var host = document.createElement('div');
  host.setAttribute('data-vsxo-slug', "${badge.slug}");
  host.style.cssText = 'display:inline-block;vertical-align:middle;';
  var shadow = host.attachShadow ? host.attachShadow({mode:'closed'}) : host;

  var wrap = document.createElement('a');
  wrap.href = "${pageUrl}";
  wrap.target = '_blank';
  wrap.rel = 'noopener';
  wrap.style.cssText = 'display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border:1px solid rgba(0,0,0,0.08);border-radius:8px;background:#fff;color:#111;font:500 12px/1.2 -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;text-decoration:none;box-shadow:0 1px 2px rgba(0,0,0,0.04);transition:transform 0.15s ease, box-shadow 0.15s ease;cursor:pointer;';
  wrap.onmouseover = function(){ wrap.style.transform='translateY(-1px)'; wrap.style.boxShadow='0 3px 8px rgba(0,0,0,0.08)'; };
  wrap.onmouseout = function(){ wrap.style.transform=''; wrap.style.boxShadow='0 1px 2px rgba(0,0,0,0.04)'; };

  var icon = document.createElement('span');
  icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg>';
  icon.style.cssText = 'color:#8b5cf6;display:inline-flex;';

  var label = document.createElement('span');
  label.innerHTML = '<strong style="font-weight:700;background:linear-gradient(90deg,#8b5cf6,#06b6d4);-webkit-background-clip:text;background-clip:text;color:transparent;">Verified</strong>&nbsp;by VerifiedSXO';

  var meta = document.createElement('span');
  meta.textContent = ' · ${verifiedDate}';
  meta.style.cssText = 'color:#888;font-weight:400;';

  wrap.appendChild(icon);
  wrap.appendChild(label);
  wrap.appendChild(meta);
  wrap.title = "${escapeJs(metric)} Click to see full methodology.";

  shadow.appendChild(wrap);
  currentScript.parentNode.insertBefore(host, currentScript);
})();
`.trim()

  return jsResponse(script)
}
