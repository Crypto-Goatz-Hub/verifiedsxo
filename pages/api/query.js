// VerifiedSXO — Truth Analyzer API
// Primary: Google Gemini | Fallback: xAI Grok

import { SOURCE_DOCUMENT } from '../../lib/source-document';

const SYSTEM_PROMPT = `You are the "Truth Analyzer" — a NotebookLM-style research assistant for VerifiedSXO.com.
You have been provided with a SOURCE DOCUMENT detailing verified marketing statistics from 2000-2026.

Your primary objective is to evaluate incoming text (marketing claims, queries), isolate emotional sentiment, extract strictly verifiable claims, and cross-reference them with the provided SOURCE DOCUMENT.
You must remain completely objective, neutral, and highly analytical. Rigidly separate how a statement feels from what it empirically claims.

SOURCE DOCUMENT:
${SOURCE_DOCUMENT}

Output your response STRICTLY as a JSON object matching this schema:
{
  "chat_response": "String. A conversational, objective, data-rich answer to the user's query. Include specific numbers and years. Use markdown formatting.",
  "analysis": {
    "sentiment_profile": "String. E.g., 'Highly sensational', 'Neutral and informative', 'Marketing hype with some substance'",
    "hyperbole_flag": boolean,
    "subjective_summary": "String. Brief summary of opinions/feelings expressed in the claim.",
    "verifiable_claims": ["Exact Objective Claim 1", "Exact Objective Claim 2"],
    "source_verification": "String. Explain if the SOURCE DOCUMENT supports, refutes, or lacks information regarding the extracted verifiable claims. Be specific about which stats match or conflict.",
    "fact_probability": Number (0 to 100. 0=completely false/debunked, 100=completely verified. Base this on the SOURCE DOCUMENT and your general knowledge.)
  }
}

RULES:
1. Always cite the year for every statistic
2. If a claim uses outdated stats, flag it explicitly
3. If the SOURCE DOCUMENT directly supports a claim, reference the exact stat
4. If no data exists, say so honestly — never fabricate
5. Keep chat_response under 500 words but data-dense`;

async function callGemini(question) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Referer': 'https://verifiedsxo.com',
          'Origin': 'https://verifiedsxo.com',
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ parts: [{ text: question }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
            maxOutputTokens: 3000,
          },
        }),
      }
    );

    if (!res.ok) {
      console.error('Gemini error:', res.status, await res.text());
      return null;
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    return JSON.parse(text);
  } catch (err) {
    console.error('Gemini parse error:', err);
    return null;
  }
}

async function callGrok(question) {
  const key = process.env.XAI_API_KEY;
  if (!key) return null;

  try {
    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-3-fast',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: question },
        ],
        temperature: 0.2,
        max_tokens: 3000,
      }),
    });

    if (!res.ok) {
      console.error('Grok error:', res.status, await res.text());
      return null;
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) return null;

    return JSON.parse(text);
  } catch (err) {
    console.error('Grok parse error:', err);
    return null;
  }
}

// ── Free daily search limit for anonymous users ──────────────

import { getSupabaseAdmin } from '../../lib/supabase';

async function checkDailyLimit(clientIp) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { allowed: true }; // No DB = no limit

  const today = new Date().toISOString().split('T')[0];

  // Check how many searches this IP has done today
  const { count } = await supabase
    .from('verified_searches')
    .select('*', { count: 'exact', head: true })
    .eq('client_ip', clientIp)
    .gte('created_at', `${today}T00:00:00Z`);

  return { allowed: (count || 0) < 1, count: count || 0 };
}

async function logSearch(clientIp, question, provider) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  await supabase.from('verified_searches').insert({
    client_ip: clientIp,
    question: question.substring(0, 500),
    provider,
  }).then(() => {}).catch(() => {});
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { question, userId } = req.body;
  if (!question?.trim()) {
    return res.status(400).json({ error: 'Question is required' });
  }

  // Rate limiting by tier:
  // Anonymous: 1/day | Logged in (free): 10/day | Pro ($8/mo): 100/day
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.headers['x-real-ip']
    || req.socket?.remoteAddress
    || 'unknown';

  const isPro = req.body.plan === 'pro';
  const dailyLimit = userId ? (isPro ? 100 : 10) : 1;
  const limitKey = userId || clientIp;

  const { allowed, count } = await checkDailyLimit(limitKey);
  // Override the check with the correct limit
  if ((count || 0) >= dailyLimit) {
    const tierMsg = !userId
      ? 'Sign up free for 10 daily searches, or go Pro ($8/mo) for 100!'
      : isPro
      ? 'You\'ve hit your Pro daily limit (100 searches). Resets at midnight.'
      : 'Upgrade to Pro ($8/mo) for 100 daily searches!';

    return res.status(429).json({
      error: 'daily_limit',
      message: tierMsg,
      searchesUsed: count,
      limit: dailyLimit,
      tier: userId ? (isPro ? 'pro' : 'free') : 'anonymous',
    });
  }

  const startTime = Date.now();
  let result = null;
  let provider = null;

  // 1. Try Gemini
  result = await callGemini(question);
  if (result) provider = 'gemini';

  // 2. Try Grok
  if (!result) {
    console.log('Attempting Grok...', !!process.env.XAI_API_KEY);
    result = await callGrok(question);
    if (result) provider = 'grok';
  }

  if (!result) {
    return res.status(503).json({
      error: 'AI providers are unavailable. Please try again.',
      debug: {
        gemini_key_set: !!process.env.GEMINI_API_KEY,
        xai_key_set: !!process.env.XAI_API_KEY,
      },
    });
  }

  const queryTime = ((Date.now() - startTime) / 1000).toFixed(2);

  // Log the search (non-blocking)
  logSearch(clientIp, question, provider);

  return res.status(200).json({
    ...result,
    provider,
    queryTime: parseFloat(queryTime),
    timestamp: new Date().toISOString(),
  });
}
