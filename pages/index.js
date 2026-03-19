import { useState, useRef, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import Head from 'next/head';

const SAMPLE_QUERIES = [
  "What's the average email open rate in 2026 vs 2020?",
  "How has Google's algorithm changed SEO since 2000?",
  "What percentage of marketers use AI tools in 2026?",
  "Average customer acquisition cost by industry 2025",
  "Social media engagement rates by platform 2024-2026",
  "How has influencer marketing ROI changed since 2015?",
  "B2B vs B2C content marketing conversion rates",
  "What's the average ROAS for Google Ads in 2025?",
];

const MARKETING_ERAS = [
  { era: '2000–2005', name: 'The Search Era', desc: 'Google rises, SEO is born, email marketing explodes' },
  { era: '2006–2012', name: 'The Social Era', desc: 'Facebook, Twitter, YouTube reshape marketing forever' },
  { era: '2013–2019', name: 'The Content Era', desc: 'Content is king, influencers emerge, mobile-first' },
  { era: '2020–2023', name: 'The Automation Era', desc: 'Pandemic shift, martech explosion, privacy wars' },
  { era: '2024–2026', name: 'The AI Era', desc: 'AI search, generative content, SXO replaces SEO' },
];

export default function Home() {
  const { data: session, status } = useSession();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [queryHistory, setQueryHistory] = useState([]);
  const resultRef = useRef(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to query');
        return;
      }

      setResults(data);
      setQueryHistory(prev => [{ q, timestamp: new Date().toISOString() }, ...prev].slice(0, 10));
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (results && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [results]);

  const handleSampleClick = (sample) => {
    setQuery(sample);
  };

  return (
    <>
      <Head>
        <title>VerifiedSXO — Marketing Intelligence Engine | 25 Years of Verified Data</title>
        <meta name="description" content="The world's most authoritative source for marketing statistics, benchmarks, and verified data from 2000 to 2026. Powered by AI." />
        <meta name="keywords" content="marketing statistics, marketing benchmarks, SEO data, email marketing rates, digital marketing stats, verified marketing data" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-[#0a0a0f] text-white">
        {/* Header */}
        <header className="border-b border-white/10 backdrop-blur-sm sticky top-0 z-50 bg-[#0a0a0f]/80">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <span className="text-xl font-bold">VerifiedSXO</span>
                <span className="hidden sm:inline text-xs text-gray-500 ml-2">Marketing Intelligence Engine</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="hidden sm:inline text-xs text-gray-600 font-mono">25 yrs of data</span>
              {status === 'loading' ? (
                <div className="text-gray-500 text-sm">...</div>
              ) : session ? (
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 text-sm hidden sm:inline">{session.user?.name}</span>
                  <button onClick={() => signOut()} className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition">Sign Out</button>
                </div>
              ) : (
                <button onClick={() => signIn('linkedin')} className="px-4 py-2 bg-[#0077B5] hover:bg-[#005885] text-white text-sm rounded-lg transition flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  Sign in
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
          <div className="max-w-4xl mx-auto px-4 pt-16 pb-8 text-center relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Powered by Gemini AI + NotebookLM
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
              25 Years of Marketing.
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Verified.</span>
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10">
              Ask any marketing question. Get verified statistics, benchmarks, and trend data from 2000 to 2026 — backed by real sources, not hallucinations.
            </p>

            {/* Search */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-6">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask a marketing question..."
                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 text-base"
                    disabled={loading}
                  />
                  {loading && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="px-6 py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold rounded-xl hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {loading ? 'Searching...' : 'Verify'}
                </button>
              </div>
            </form>

            {/* Sample queries */}
            <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
              {SAMPLE_QUERIES.slice(0, 4).map((sample, i) => (
                <button
                  key={i}
                  onClick={() => handleSampleClick(sample)}
                  className="text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-gray-400 hover:text-white transition truncate max-w-[250px]"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="max-w-3xl mx-auto px-4 mb-8">
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
              {error}
            </div>
          </div>
        )}

        {/* Results */}
        {results && (
          <section ref={resultRef} className="max-w-3xl mx-auto px-4 mb-16">
            <div className="bg-white/[0.03] backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
              {/* Result header */}
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-emerald-400">Verified Response</span>
                    <span className="text-xs text-gray-600 ml-2">
                      via {results.provider === 'gemini' ? 'Google Gemini' : results.provider === 'grok' ? 'xAI Grok' : 'Claude'} in {results.queryTime}s
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Confidence</span>
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    {(results.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Answer */}
              <div className="px-6 py-6">
                <div className="prose prose-invert prose-emerald max-w-none text-sm leading-relaxed whitespace-pre-wrap">
                  {results.answer}
                </div>
              </div>

              {/* Sources */}
              <div className="px-6 py-3 border-t border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>Sources:</span>
                  {results.sources.map((src, i) => (
                    <span key={i} className="flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${src.type === 'primary' ? 'bg-emerald-400' : 'bg-gray-600'}`} />
                      {src.title}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Marketing Eras Timeline */}
        {!results && (
          <section className="max-w-4xl mx-auto px-4 py-16">
            <h2 className="text-center text-sm font-semibold text-gray-500 uppercase tracking-wider mb-8">
              Our Knowledge Spans 5 Marketing Eras
            </h2>
            <div className="grid sm:grid-cols-5 gap-3">
              {MARKETING_ERAS.map((era, i) => (
                <div key={i} className="bg-white/[0.03] border border-white/10 rounded-xl p-4 hover:border-emerald-500/30 transition group">
                  <div className="text-xs font-mono text-emerald-400/60 mb-2">{era.era}</div>
                  <div className="text-sm font-semibold text-white mb-1 group-hover:text-emerald-400 transition">{era.name}</div>
                  <div className="text-xs text-gray-500 leading-relaxed">{era.desc}</div>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12">
              {[
                { stat: '25+', label: 'Years of Data', sub: '2000–2026' },
                { stat: '500+', label: 'Data Sources', sub: 'Verified reports' },
                { stat: '50+', label: 'Marketing Channels', sub: 'Tracked & benchmarked' },
                { stat: '< 3s', label: 'Response Time', sub: 'AI-powered lookup' },
              ].map((item, i) => (
                <div key={i} className="text-center p-5 bg-white/[0.03] rounded-xl border border-white/5">
                  <div className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">{item.stat}</div>
                  <div className="text-sm text-white mt-1">{item.label}</div>
                  <div className="text-xs text-gray-600 mt-0.5">{item.sub}</div>
                </div>
              ))}
            </div>

            {/* What you can ask */}
            <div className="mt-16">
              <h2 className="text-center text-sm font-semibold text-gray-500 uppercase tracking-wider mb-8">
                What You Can Ask
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {SAMPLE_QUERIES.map((sample, i) => (
                  <button
                    key={i}
                    onClick={() => { setQuery(sample); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="text-left px-4 py-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-emerald-500/30 rounded-xl text-sm text-gray-400 hover:text-white transition group"
                  >
                    <span className="text-emerald-400/60 group-hover:text-emerald-400 mr-2">→</span>
                    {sample}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="border-t border-white/5 mt-8">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">Part of the</span>
                <a href="https://rocketopp.com" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-gray-400 hover:text-emerald-400 transition">
                  RocketOpp Ecosystem
                </a>
                <span className="text-gray-800">|</span>
                <a href="https://sxowebsite.com" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 hover:text-emerald-400 transition">SXO</a>
                <a href="https://0nmcp.com" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 hover:text-emerald-400 transition">0nMCP</a>
              </div>
              <div className="text-xs text-gray-700">
                &copy; {new Date().getFullYear()} VerifiedSXO by RocketOpp LLC
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
