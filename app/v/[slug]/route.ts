/**
 * GET /v/[slug] → injectable badge script.
 *
 * Three variants (pick via data-variant on the <script>):
 *   data-variant="inline"  (default) — compact pill ~ 220×34
 *   data-variant="stamp"             — circular seal ~ 120×120
 *   data-variant="banner"            — wide strip ~ 320×84
 *
 * Additional data-attrs:
 *   data-theme="dark" | "light"   override brightness
 *   data-metric="#1 Google"       short metric text (inline/banner only)
 *
 * Each badge renders into a closed shadow root, loads no fonts, no images,
 * and is click-through to /verified/[slug]. Elevated claims use an emerald
 * tier treatment.
 */

import { NextRequest } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/server"

export const runtime = "nodejs"

function jsResponse(body: string, status = 200, cacheSeconds = 300): Response {
  return new Response(body, {
    status,
    headers: {
      "content-type": "application/javascript; charset=utf-8",
      "cache-control": `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds}, stale-while-revalidate=86400`,
      "access-control-allow-origin": "*",
    },
  })
}

function notFoundJs(slug: string) {
  return jsResponse(`/* VerifiedSXO: no badge for "${slug}" */`, 404, 60)
}

function esc(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/</g, "\\u003c").replace(/\n/g, "\\n")
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) return notFoundJs(slug)

  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://verifiedsxo.com"
  let badgeSlug = slug
  type ClaimBundle = { claim_text: string; claim_type: string; status: string; plausibility_score: number | null; self_claim: boolean; created_at?: string }
  type VerificationBundle = { evidence: unknown; passed: boolean; confidence: number; verified_at: string }
  let claim: ClaimBundle | null = null
  let verification: VerificationBundle | null = null
  let isSelfClaim = false

  if (slug === "example") {
    claim = {
      claim_text: "We ranked #1 on Google for our primary keyword within 90 days.",
      claim_type: "ranking",
      status: "verified",
      plausibility_score: 95,
      self_claim: false,
    }
    verification = {
      evidence: { summary: "Google Search Console: position 1 for primary keyword, 90-day sample." },
      passed: true,
      confidence: 95,
      verified_at: new Date().toISOString(),
    }
  } else {
    const admin = getSupabaseAdmin()
    const { data: badge } = await admin
      .from("vsxo_badges")
      .select("id, slug, claim_id, verification_id, last_verified_at, embed_count, public_visible, self_claim")
      .eq("slug", slug)
      .eq("public_visible", true)
      .maybeSingle()
    if (!badge) return notFoundJs(slug)
    isSelfClaim = Boolean(badge.self_claim)

    const claimRes = await admin
      .from("vsxo_claims")
      .select("claim_text, claim_type, status, plausibility_score, self_claim, created_at")
      .eq("id", badge.claim_id)
      .single()
    claim = claimRes.data as unknown as ClaimBundle
    if (!claim) return notFoundJs(slug)
    isSelfClaim = isSelfClaim || Boolean(claim.self_claim)

    if (isSelfClaim || !badge.verification_id) {
      verification = {
        evidence: { summary: claim.claim_text },
        passed: false,
        confidence: claim.plausibility_score ?? 0,
        verified_at: claim.created_at || new Date().toISOString(),
      }
    } else {
      const verRes = await admin
        .from("vsxo_verifications")
        .select("evidence, passed, confidence, verified_at")
        .eq("id", badge.verification_id)
        .single()
      verification = verRes.data as unknown as VerificationBundle
      if (!verification) return notFoundJs(slug)
    }

    // Fire and forget: bump embed count
    admin.from("vsxo_badges").update({ embed_count: (badge.embed_count || 0) + 1 }).eq("id", badge.id).then(() => {})
    badgeSlug = badge.slug
  }

  const evidence = (verification.evidence as Record<string, unknown>) || {}
  const page = `${site}/verified/${badgeSlug}`
  const verifiedLabel = new Date(verification.verified_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
  const elevated = claim.status === "elevated"
  const claimSnippet = String(evidence.summary || claim.claim_text).slice(0, 140)

  // JS payload
  const js = `(function(){
  var DATA = ${JSON.stringify({
    slug: badgeSlug,
    page,
    verifiedLabel,
    elevated,
    selfClaim: isSelfClaim,
    score: claim.plausibility_score ?? null,
    claimText: claim.claim_text.slice(0, 160),
    snippet: claimSnippet,
    confidence: verification.confidence,
  })};

  var key = "__vsxo_" + DATA.slug.replace(/[^a-z0-9]/g,'');
  if (window[key]) return;
  window[key] = 1;

  var currentScript = document.currentScript || (function(){
    var all = document.getElementsByTagName('script');
    return all[all.length - 1];
  })();

  var ds = currentScript && currentScript.dataset ? currentScript.dataset : {};
  var variant = (ds.variant || 'inline').toLowerCase();
  if (['inline','stamp','banner'].indexOf(variant) === -1) variant = 'inline';
  var theme = (ds.theme || '').toLowerCase();
  var metric = (ds.metric || '').slice(0, 40);

  var ACCENT_FROM = DATA.selfClaim ? '#f59e0b' : DATA.elevated ? '#10b981' : '#8b5cf6';
  var ACCENT_TO   = DATA.selfClaim ? '#f97316' : '#06b6d4';
  var TEXT_DARK   = '#0a0a0a';
  var TEXT_LIGHT  = '#ffffff';
  var surface     = theme === 'dark' ? '#0a0a0a' : '#ffffff';
  var onSurface   = theme === 'dark' ? TEXT_LIGHT : TEXT_DARK;
  var hairline    = theme === 'dark' ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)';
  var shadow      = theme === 'dark' ? '0 2px 12px rgba(0,0,0,0.6)' : '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.06)';

  var host = document.createElement('span');
  host.setAttribute('data-vsxo-slug', DATA.slug);
  host.setAttribute('data-vsxo-variant', variant);
  host.style.cssText = 'display:inline-block;vertical-align:middle;line-height:0;';

  var shadowRoot = host.attachShadow ? host.attachShadow({mode:'closed'}) : host;

  var anchor = document.createElement('a');
  anchor.href = DATA.page;
  anchor.target = '_blank';
  anchor.rel = 'noopener';
  anchor.setAttribute('aria-label', 'Independently verified by VerifiedSXO' + (DATA.elevated ? ' (elevated 100%)' : '') + '. Click for proof.');
  anchor.title = DATA.snippet + "\\n\\nVerified by VerifiedSXO · click to see methodology.";

  var css = document.createElement('style');
  css.textContent =
    '*{box-sizing:border-box;}' +
    ':host{all:initial;display:inline-block;line-height:normal;}' +
    'a{text-decoration:none;color:inherit;display:inline-block;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;}' +
    '.seal-ring{animation:vsxo-rot 28s linear infinite;transform-origin:50% 50%;}' +
    '@keyframes vsxo-rot{to{transform:rotate(360deg);}}' +
    '.pulse{animation:vsxo-pulse 2.8s ease-in-out infinite;transform-origin:50% 50%;}' +
    '@keyframes vsxo-pulse{0%,100%{opacity:0.45;}50%{opacity:1;}}' +
    '.shimmer{background-size:200% 100%;animation:vsxo-shimmer 8s linear infinite;}' +
    '@keyframes vsxo-shimmer{0%{background-position:0% 50%;}100%{background-position:-200% 50%;}}';

  shadowRoot.appendChild(css);

  function renderInline() {
    var wrap = document.createElement('span');
    wrap.style.cssText = [
      'display:inline-flex','align-items:center','gap:8px',
      'padding:5px 11px 5px 5px','border-radius:999px',
      'border:1px solid '+hairline,'background:'+surface,'color:'+onSurface,
      'box-shadow:'+shadow,
      'font-weight:500','font-size:12px','letter-spacing:0.01em',
      'transition:transform 0.18s ease, box-shadow 0.18s ease',
    ].join(';');
    wrap.onmouseover = function(){ wrap.style.transform='translateY(-1px)'; wrap.style.boxShadow='0 4px 14px rgba(139,92,246,0.2), '+shadow; };
    wrap.onmouseout  = function(){ wrap.style.transform=''; wrap.style.boxShadow=shadow; };

    var mark = document.createElement('span');
    mark.style.cssText = [
      'display:inline-flex','align-items:center','justify-content:center',
      'width:22px','height:22px','border-radius:999px',
      'background:linear-gradient(135deg,'+ACCENT_FROM+','+ACCENT_TO+')',
      'color:#fff','flex-shrink:0',
    ].join(';');
    mark.innerHTML = shieldSvg(14);
    wrap.appendChild(mark);

    var primaryText = DATA.selfClaim ? 'Unverified' : 'Verified';
    var label = document.createElement('span');
    label.innerHTML =
      '<strong style="font-weight:700;background:linear-gradient(90deg,'+ACCENT_FROM+','+ACCENT_TO+');-webkit-background-clip:text;background-clip:text;color:transparent;letter-spacing:0.005em;">'+primaryText+'</strong>' +
      '<span style="opacity:0.6;margin:0 6px;">·</span>' +
      '<span>VerifiedSXO</span>' +
      (DATA.selfClaim ? '<span style="opacity:0.55;margin-left:6px;font-size:11px;">Self-attested</span>' :
        (metric ? '<span style="opacity:0.6;margin:0 6px;">·</span><strong style="font-weight:600;">'+escHtml(metric)+'</strong>' : '') +
        '<span style="opacity:0.55;margin-left:6px;font-size:11px;">'+DATA.verifiedLabel+'</span>');
    wrap.appendChild(label);
    return wrap;
  }

  function renderBanner() {
    var wrap = document.createElement('span');
    wrap.style.cssText = [
      'display:inline-flex','align-items:stretch','min-width:280px','max-width:400px',
      'border-radius:12px','overflow:hidden','background:'+surface,'color:'+onSurface,
      'border:1px solid '+hairline,'box-shadow:'+shadow,
      'font-size:12px','line-height:1.35',
      'transition:transform 0.18s ease, box-shadow 0.18s ease',
    ].join(';');
    wrap.onmouseover = function(){ wrap.style.transform='translateY(-1px)'; };
    wrap.onmouseout  = function(){ wrap.style.transform=''; };

    var left = document.createElement('span');
    left.style.cssText = [
      'background:linear-gradient(135deg,'+ACCENT_FROM+','+ACCENT_TO+')',
      'color:#fff','padding:12px 14px','display:flex','align-items:center','justify-content:center',
      'min-width:58px',
    ].join(';');
    left.innerHTML = shieldSvg(28);
    wrap.appendChild(left);

    var body = document.createElement('span');
    body.style.cssText = 'display:flex;flex-direction:column;justify-content:center;padding:10px 14px;flex:1;gap:2px;';
    var topline = DATA.selfClaim
      ? 'Self-attested · Unverified'
      : DATA.elevated ? 'Elevated 100%' : 'Independently verified';
    var bottomline = DATA.selfClaim
      ? 'Plausibility ' + (DATA.score != null ? DATA.score + '% · ' : '') + 'click for methodology'
      : 'Verified ' + DATA.verifiedLabel + ' · click for proof';
    body.innerHTML =
      '<span style="font-weight:700;letter-spacing:0.04em;text-transform:uppercase;font-size:10px;opacity:0.7;">' + topline + '</span>' +
      '<span style="font-weight:700;font-size:14px;">' +
        '<span style="background:linear-gradient(90deg,'+ACCENT_FROM+','+ACCENT_TO+');-webkit-background-clip:text;background-clip:text;color:transparent;">VerifiedSXO</span>' +
        (metric ? ' · <span>'+escHtml(metric)+'</span>' : '') +
      '</span>' +
      '<span style="opacity:0.55;font-size:11px;">'+bottomline+'</span>';
    wrap.appendChild(body);
    return wrap;
  }

  function renderStamp() {
    var wrap = document.createElement('span');
    wrap.style.cssText = 'display:inline-block;width:120px;height:120px;position:relative;';

    var svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','0 0 120 120');
    svg.setAttribute('width','120');
    svg.setAttribute('height','120');
    svg.setAttribute('aria-hidden','true');
    svg.style.cssText = 'display:block;';

    var defs =
      '<defs>' +
        '<linearGradient id="vsxoG-'+DATA.slug+'" x1="0" y1="0" x2="1" y2="1">' +
          '<stop offset="0%" stop-color="'+ACCENT_FROM+'"/>' +
          '<stop offset="100%" stop-color="'+ACCENT_TO+'"/>' +
        '</linearGradient>' +
        '<filter id="vsxoGlow-'+DATA.slug+'">' +
          '<feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>' +
        '</filter>' +
      '</defs>';

    // Outer ring + rotating text
    var outer =
      '<circle cx="60" cy="60" r="56" fill="'+surface+'" stroke="url(#vsxoG-'+DATA.slug+')" stroke-width="1.5"/>' +
      '<circle cx="60" cy="60" r="52" fill="none" stroke="url(#vsxoG-'+DATA.slug+')" stroke-width="0.6" stroke-dasharray="2 3" class="seal-ring"/>';
    var ringText =
      '<defs><path id="ringPath-'+DATA.slug+'" d="M 60 12 A 48 48 0 1 1 60 108 A 48 48 0 1 1 60 12"/></defs>' +
      '<text fill="'+onSurface+'" fill-opacity="0.8" font-size="8.5" font-family="-apple-system, BlinkMacSystemFont, \\'Segoe UI\\', Helvetica, Arial, sans-serif" font-weight="700" letter-spacing="3">' +
      '<textPath href="#ringPath-'+DATA.slug+'" startOffset="0">' +
        (DATA.selfClaim ? 'UNVERIFIED · SELF ATTESTED · VERIFIEDSXO · ' : 'VERIFIED · BY VERIFIEDSXO · AUTHENTIC · ') +
      '</textPath></text>';

    var pulse =
      '<circle cx="60" cy="60" r="40" fill="none" stroke="url(#vsxoG-'+DATA.slug+')" stroke-opacity="0.6" stroke-width="1" class="pulse"/>';
    var core =
      '<circle cx="60" cy="60" r="30" fill="url(#vsxoG-'+DATA.slug+')" filter="url(#vsxoGlow-'+DATA.slug+')"/>' +
      '<g transform="translate(60 60)" fill="#ffffff">' +
        '<path d="M 0 -16 L 14 -11 L 14 0 C 14 8 8 14 0 18 C -8 14 -14 8 -14 0 L -14 -11 Z" opacity="0.9"/>' +
        '<path d="M -6 0 L -2 4 L 6 -4" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>' +
      '</g>';
    var labels =
      '<text x="60" y="110" fill="'+onSurface+'" fill-opacity="0.6" font-size="7" font-family="-apple-system, BlinkMacSystemFont, \\'Segoe UI\\', Helvetica, Arial, sans-serif" font-weight="600" text-anchor="middle" letter-spacing="1.5">' +
        (DATA.selfClaim ? ('PLAUSIBILITY · ' + (DATA.score != null ? DATA.score + '%' : 'SCORED'))
          : DATA.elevated ? 'ELEVATED · 100%' : DATA.verifiedLabel.toUpperCase()) +
      '</text>';

    svg.innerHTML = defs + outer + pulse + core + ringText + labels;
    wrap.appendChild(svg);
    return wrap;
  }

  function shieldSvg(size) {
    var s = size || 14;
    return '<svg viewBox="0 0 24 24" width="'+s+'" height="'+s+'" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>' +
      '<path d="m9 12 2 2 4-4"/>' +
    '</svg>';
  }

  function escHtml(s){
    return String(s).replace(/[&<>"']/g, function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]; });
  }

  var rendered = variant === 'stamp' ? renderStamp() : variant === 'banner' ? renderBanner() : renderInline();
  anchor.appendChild(rendered);
  shadowRoot.appendChild(anchor);

  if (currentScript && currentScript.parentNode) {
    currentScript.parentNode.insertBefore(host, currentScript);
  } else {
    (document.body || document.documentElement).appendChild(host);
  }
})();`

  return jsResponse(js)
}

// Tiny escape helper for any log lines (not used in js body now but kept
// so future edits don't reintroduce XSS accidentally)
export { esc as _escOnlyForTesting }
