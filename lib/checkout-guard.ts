// lib/checkout-guard.ts
// ---------------------------------------------------------------------------
// Why this exists — the 659-session autopsy, 2026-08-23.
//
// `GET /api/stripe/checkout?plan=x` mints a LIVE Stripe subscription and 30x to
// it. That makes the session a side effect of a GET, so anything that merely
// *fetches the URL* buys a session: Next's <Link> prefetch (one per plan card,
// same second, which is exactly the burst signature in the export), a crawler
// following the <a href>, a link-preview bot, an uptime monitor, or a HEAD
// probe (Next auto-implements HEAD from GET, so HEAD is not "safe" here).
//
// This route is behind auth, which makes it WORSE here, not safer: a prefetch
// from a signed-in dashboard carries the session cookie, so it mints a session
// stamped with a REAL customer email. Those are indistinguishable from genuine
// abandoned carts, and would earn the buyer a recovery email for a checkout
// they never opened.
//
// The rule: a GET must not create a billable object unless a human navigated
// to it. This decides that from the request, conservatively — when a signal is
// missing we let the request through rather than block a real buyer, and the
// worst case for a non-human is a redirect to /pricing, a real page.
// ---------------------------------------------------------------------------

const BOT_UA =
  /bot|crawler|spider|crawling|slurp|facebookexternalhit|whatsapp|telegram|discord|slackbot|preview|monitor|uptime|pingdom|headless|lighthouse|curl|wget|python-requests|axios|node-fetch|go-http|okhttp|java\/|libwww|scrapy|semrush|ahrefs|mj12|dotbot|petal|bytespider|gptbot|claudebot|perplexity|ccbot|applebot|amazonbot|dataforseo/i;

export type CheckoutGuardVerdict =
  | { human: true }
  | { human: false; reason: string };

/**
 * Decide whether this request is a human navigating to buy.
 *
 * Blocks, in order of how certain the signal is:
 *  1. prefetch — the browser says so outright (Next-Router-Prefetch / Purpose /
 *     Sec-Purpose). Never a purchase intent, by definition.
 *  2. not a navigation — Sec-Fetch-Mode is sent by every current browser; a
 *     real click on an <a>/<Link> is `navigate`. A prefetch, an XHR or a
 *     subresource is not. Absent header => unknown, fall through (do not block).
 *  3. a declared bot UA.
 */
export function guardCheckoutGet(req: Request): CheckoutGuardVerdict {
  const h = req.headers;
  const get = (k: string) => (h.get(k) || '').toLowerCase();

  if (get('next-router-prefetch') === '1') return { human: false, reason: 'next-prefetch' };
  if (get('purpose') === 'prefetch') return { human: false, reason: 'purpose-prefetch' };
  if (get('sec-purpose').includes('prefetch')) return { human: false, reason: 'sec-purpose-prefetch' };
  if (get('x-middleware-prefetch')) return { human: false, reason: 'middleware-prefetch' };
  if (get('x-purpose') === 'preview') return { human: false, reason: 'x-purpose-preview' };

  // RSC prefetch of a route handler still carries the RSC header.
  if (get('rsc') === '1') return { human: false, reason: 'rsc-fetch' };

  const mode = get('sec-fetch-mode');
  if (mode && mode !== 'navigate') return { human: false, reason: `sec-fetch-mode:${mode}` };

  const dest = get('sec-fetch-dest');
  if (dest && dest !== 'document' && dest !== 'empty') return { human: false, reason: `sec-fetch-dest:${dest}` };

  const ua = get('user-agent');
  if (!ua) return { human: false, reason: 'no-user-agent' };
  if (BOT_UA.test(ua)) return { human: false, reason: 'bot-ua' };

  return { human: true };
}
