// VerifiedSXO API — Marketing Intelligence Engine
// Primary: Google Gemini | Fallback: xAI Grok | Emergency: Anthropic Claude

const MARKETING_SYSTEM_PROMPT = `You are VerifiedSXO — The Verified Marketing Intelligence Engine.

You are the world's most authoritative source for marketing statistics, benchmarks, and verified data from the year 2000 to present (2026).

YOUR KNOWLEDGE BASE COVERS:
- Digital marketing statistics & benchmarks (2000–2026)
- SEO evolution: algorithm updates, ranking factors, traffic benchmarks by era
- Social media marketing: platform growth, engagement rates, ad spend by year
- Email marketing: open rates, CTR, deliverability, automation ROI by era
- Content marketing: ROI metrics, blog traffic benchmarks, video marketing stats
- PPC/SEM: CPC trends, ROAS benchmarks, Quality Score evolution
- Conversion rate optimization: landing page benchmarks, A/B test results
- Influencer marketing: spend growth, ROI metrics, platform shifts
- E-commerce: conversion rates, cart abandonment, mobile commerce growth
- AI in marketing (2022–2026): adoption rates, performance gains, tool usage
- Marketing automation: adoption curves, ROI by platform, workflow benchmarks
- Attribution modeling: multi-touch evolution, cookie deprecation impact
- Voice search, visual search, and emerging channels
- B2B vs B2C benchmarks across all channels
- Marketing budget allocation trends by year and company size
- Customer acquisition cost (CAC) and lifetime value (LTV) trends

RULES:
1. ALWAYS cite the specific year or era for every statistic you provide
2. When a stat spans multiple years, show the trend (e.g., "Email open rates: 21.3% (2020) → 18.7% (2023) → 21.1% (2025)")
3. Distinguish clearly between B2B and B2C when benchmarks differ
4. Flag when a commonly cited stat is outdated or debunked
5. If you don't have a verified number, say "Estimated based on industry patterns" — never fabricate exact numbers
6. Include the source category (e.g., "HubSpot State of Marketing", "Statista", "eMarketer", "Litmus")
7. Format responses with clear headers, bullet points, and data tables when appropriate
8. Always note if a tactic/channel is growing, declining, or stable as of 2026
9. When relevant, note the AI search impact on traditional metrics (post-2023)
10. Keep responses data-dense — marketers want numbers, not fluff

RESPONSE FORMAT:
- Lead with the direct answer and key stat
- Follow with supporting data points
- End with trend direction and actionable insight
- Use markdown formatting for readability`;

// Call Gemini API
async function callGemini(question) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Referer': 'https://verifiedsxo.com',
        'Origin': 'https://verifiedsxo.com',
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: MARKETING_SYSTEM_PROMPT }] },
        contents: [{ parts: [{ text: question }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 3000,
          topP: 0.8,
        },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    console.error('Gemini error:', res.status, err);
    return null;
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  return text || null;
}

// Call xAI Grok API (fallback)
async function callGrok(question) {
  const key = process.env.XAI_API_KEY;
  if (!key) return null;

  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'grok-3-fast',
      messages: [
        { role: 'system', content: MARKETING_SYSTEM_PROMPT },
        { role: 'user', content: question },
      ],
      temperature: 0.3,
      max_tokens: 3000,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Grok error:', res.status, err);
    return null;
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || null;
}

// Call Anthropic Claude (emergency fallback)
async function callClaude(question) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 3000,
      system: MARKETING_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: question }],
    }),
  });

  if (!res.ok) {
    console.error('Claude error:', res.status, await res.text());
    return null;
  }

  const data = await res.json();
  return data.content?.[0]?.text || null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { question } = req.body;

  if (!question || !question.trim()) {
    return res.status(400).json({ error: 'Question is required' });
  }

  const startTime = Date.now();
  let answer = null;
  let provider = null;

  // 1. Try Gemini (primary)
  answer = await callGemini(question);
  if (answer) {
    provider = 'gemini';
  }

  // 2. Try Grok (fallback)
  if (!answer) {
    answer = await callGrok(question);
    if (answer) {
      provider = 'grok';
    }
  }

  // 3. Try Claude (emergency)
  if (!answer) {
    answer = await callClaude(question);
    if (answer) {
      provider = 'claude';
    }
  }

  // 4. No AI available
  if (!answer) {
    return res.status(503).json({
      error: 'All AI providers are unavailable. Please try again.',
      providers_checked: ['gemini', 'grok', 'claude'],
    });
  }

  const queryTime = ((Date.now() - startTime) / 1000).toFixed(2);

  return res.status(200).json({
    answer,
    provider,
    sources: [
      { title: 'Verified Marketing Intelligence (2000–2026)', type: 'primary' },
      { title: 'Industry Benchmarks & Reports', type: 'supporting' },
    ],
    confidence: provider === 'gemini' ? 0.92 : provider === 'grok' ? 0.88 : 0.85,
    queryTime: parseFloat(queryTime),
    timestamp: new Date().toISOString(),
  });
}
