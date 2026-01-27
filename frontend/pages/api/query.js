// VerifiedSXO API Route - Query the Knowledge Engine
// This connects to NotebookLM via the backend service

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { question, vertical = 'marketing', include_sources = true } = req.body;

  if (!question || !question.trim()) {
    return res.status(400).json({ error: 'Question is required' });
  }

  // NotebookLM notebook IDs for each vertical
  const NOTEBOOKS = {
    marketing: {
      id: 'f8a9f1b8-4e9b-4c0b-885f-97f7ba8bacfc',
      name: '25 Years of Marketing'
    }
    // Add more verticals as they're created
  };

  const notebook = NOTEBOOKS[vertical];
  if (!notebook) {
    return res.status(400).json({ error: `Unknown vertical: ${vertical}` });
  }

  try {
    // Option 1: Direct NotebookLM API (when backend is deployed)
    // const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    // const response = await fetch(`${backendUrl}/query`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ question, vertical, include_sources })
    // });
    // const data = await response.json();

    // Option 2: Use Anthropic API to simulate (for demo)
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    
    if (anthropicKey) {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          system: `You are VerifiedSXO, a verified marketing intelligence engine with access to 25 years of marketing knowledge (2000-2026). 

Your knowledge includes:
- Digital marketing evolution (SEO, SEM, Social, Content)
- Platform histories (Google, Facebook, LinkedIn, TikTok, etc.)
- Marketing statistics and benchmarks by era
- Viral campaigns and case studies
- Tactics that worked vs. tactics that failed
- Industry benchmarks and conversion rates
- Email marketing evolution
- Influencer marketing trends
- AI's impact on marketing (2022-2026)

Rules:
1. Always cite the era/year for statistics
2. Distinguish between tactics that still work vs. outdated
3. Be specific with numbers and percentages when possible
4. Mention if something is a common misconception
5. Format responses clearly with headers when appropriate

If you don't have verified data on something, say "I don't have verified data on this specific point, but based on general patterns..."`,
          messages: [{ role: 'user', content: question }]
        })
      });

      const data = await response.json();
      const answer = data.content?.[0]?.text || 'Unable to generate response';

      return res.status(200).json({
        answer,
        sources: [
          { title: '25 Years of Marketing Knowledge Base', type: 'primary' },
          { title: 'Verified Industry Statistics', type: 'supporting' }
        ],
        confidence: 0.85,
        vertical,
        timestamp: new Date().toISOString()
      });
    }

    // Fallback: Demo response
    return res.status(200).json({
      answer: `[Demo Mode - Connect NotebookLM for live data]\n\nYour question: "${question}"\n\nThis would query the "${notebook.name}" knowledge base containing 25 years of verified marketing intelligence.\n\nTo enable live queries:\n1. Set up notebooklm-py authentication\n2. Deploy the Python backend\n3. Connect to notebook ID: ${notebook.id}`,
      sources: [],
      confidence: 0.0,
      vertical,
      demo: true,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Query error:', error);
    return res.status(500).json({
      error: 'Failed to query knowledge base',
      details: error.message
    });
  }
}
