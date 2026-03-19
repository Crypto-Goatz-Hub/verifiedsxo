import { useState, useRef, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import Head from 'next/head';
import {
  ShieldCheck, Search, AlertTriangle, CheckCircle, Info, Send,
  FileText, Activity, ChevronRight, Loader2, Copy,
  ThumbsUp, ThumbsDown, X, Zap, TrendingUp, BarChart3, Mail,
  Globe, Brain, Users
} from 'lucide-react';

const SAMPLE_CLAIMS = [
  "Email marketing has an ROI of $36 for every $1 spent",
  "SEO is dead — social media is the only way to get traffic now",
  "Short-form video has 41% higher ROI than long-form content",
  "80% of B2B leads come from LinkedIn",
  "Facebook organic reach is still around 16% for business pages",
  "AI will replace 50% of marketing jobs by 2025",
  "Blog posts over 2000 words rank better on Google",
  "TikTok has surpassed Google as a search engine for Gen Z",
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
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');

      setResult({ ...data, claimText: q });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copySeal = async (claimText, score) => {
    const label = score >= 70 ? 'VERIFIED' : score >= 40 ? 'PARTIALLY VERIFIED' : 'UNVERIFIED';
    const text = `🛡️ VerifiedSXO Fact Check\nClaim: "${claimText.substring(0, 120)}"\nProbability: ${score}% — ${label}\nVerify at: https://verifiedsxo.com`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
  };

  const scoreColor = (s) => s >= 70 ? 'text-emerald-400' : s >= 40 ? 'text-amber-400' : 'text-red-400';
  const scoreRing = (s) => s >= 70 ? 'border-emerald-500 shadow-emerald-500/20' : s >= 40 ? 'border-amber-500 shadow-amber-500/20' : 'border-red-500 shadow-red-500/20';
  const scoreBadgeBg = (s) => s >= 70 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : s >= 40 ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-red-500/10 border-red-500/30 text-red-400';
  const scoreLabel = (s) => s >= 70 ? 'VERIFIED' : s >= 40 ? 'PARTIALLY VERIFIED' : 'UNVERIFIED';

  return (
    <>
      <Head>
        <title>VerifiedSXO — Marketing Intelligence Engine | 25 Years of Verified Data</title>
        <meta name="description" content="Verify marketing claims instantly with AI-powered fact-checking against 25 years of verified data from 2000 to 2026." />
        <meta name="keywords" content="marketing statistics, marketing benchmarks, fact check marketing, verified marketing data, SEO stats, email marketing rates" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-[#0a0a0f] text-white">
        {/* Header */}
        <header className="border-b border-white/10 backdrop-blur-sm sticky top-0 z-40 bg-[#0a0a0f]/80">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <ShieldCheck size={20} className="text-white" />
              </div>
              <div>
                <span className="text-xl font-bold">VerifiedSXO</span>
                <span className="hidden sm:inline text-xs text-gray-500 ml-2">Marketing Intelligence Engine</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {status !== 'loading' && !session ? (
                <button onClick={() => signIn('linkedin')} className="px-4 py-2 bg-[#0077B5] hover:bg-[#005885] text-white text-sm rounded-lg transition flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  Sign in
                </button>
              ) : session ? (
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 text-sm hidden sm:inline">{session.user?.name}</span>
                  <button onClick={() => signOut()} className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition">Sign Out</button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
          <div className="max-w-4xl mx-auto px-4 pt-20 pb-12 text-center relative">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Powered by Gemini AI + NotebookLM
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight tracking-tight">
              25 Years of Marketing.
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Verified.</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12">
              Paste any marketing claim. Get it fact-checked against verified statistics from 2000 to 2026 — powered by AI, not hallucinations.
            </p>

            {/* Big Search Box */}
            <form onSubmit={handleSearch} className="max-w-3xl mx-auto mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-2xl blur-xl" />
                <div className="relative bg-white/[0.05] border border-white/10 rounded-2xl p-2 backdrop-blur-sm">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Paste a marketing claim to fact-check..."
                      className="flex-1 px-6 py-5 bg-transparent text-white text-lg placeholder-gray-500 focus:outline-none"
                      disabled={loading}
                    />
                    <button
                      type="submit"
                      disabled={loading || !query.trim()}
                      className="px-8 py-5 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold text-lg rounded-xl hover:opacity-90 transition disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                    >
                      {loading ? (
                        <>
                          <Loader2 size={20} className="animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={20} />
                          Verify
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>

            {/* Error */}
            {error && (
              <div className="max-w-3xl mx-auto mb-6">
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
                  {error}
                </div>
              </div>
            )}

            {/* Sample Claims */}
            <div className="flex flex-wrap justify-center gap-2 max-w-3xl mx-auto">
              {SAMPLE_CLAIMS.slice(0, 4).map((claim, i) => (
                <button
                  key={i}
                  onClick={() => setQuery(claim)}
                  className="text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-gray-500 hover:text-white transition truncate max-w-[280px]"
                >
                  {claim}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Marketing Eras */}
        <section className="max-w-5xl mx-auto px-4 py-20">
          <h2 className="text-center text-sm font-semibold text-gray-500 uppercase tracking-wider mb-10">
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
        </section>

        {/* Stats */}
        <section className="max-w-5xl mx-auto px-4 pb-20">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: <BarChart3 size={20} />, stat: '25+', label: 'Years of Data', sub: '2000–2026' },
              { icon: <Globe size={20} />, stat: '500+', label: 'Data Sources', sub: 'Verified reports' },
              { icon: <TrendingUp size={20} />, stat: '50+', label: 'Channels Tracked', sub: 'SEO to AI search' },
              { icon: <Brain size={20} />, stat: '< 4s', label: 'Fact Check Speed', sub: 'Gemini AI powered' },
            ].map((item, i) => (
              <div key={i} className="text-center p-6 bg-white/[0.03] rounded-xl border border-white/5 hover:border-emerald-500/20 transition">
                <div className="text-emerald-400/40 mx-auto mb-3 flex justify-center">{item.icon}</div>
                <div className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">{item.stat}</div>
                <div className="text-sm text-white mt-1">{item.label}</div>
                <div className="text-xs text-gray-600 mt-0.5">{item.sub}</div>
              </div>
            ))}
          </div>
        </section>

        {/* More Sample Claims */}
        <section className="max-w-4xl mx-auto px-4 pb-20">
          <h2 className="text-center text-sm font-semibold text-gray-500 uppercase tracking-wider mb-8">
            Try These Marketing Claims
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {SAMPLE_CLAIMS.map((claim, i) => (
              <button
                key={i}
                onClick={() => { setQuery(claim); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="text-left px-4 py-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-emerald-500/30 rounded-xl text-sm text-gray-400 hover:text-white transition group"
              >
                <span className="text-emerald-400/60 group-hover:text-emerald-400 mr-2">→</span>
                {claim}
              </button>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/5">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">Part of the</span>
                <a href="https://rocketopp.com" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-gray-400 hover:text-emerald-400 transition">RocketOpp Ecosystem</a>
                <span className="text-gray-800">|</span>
                <a href="https://sxowebsite.com" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 hover:text-emerald-400 transition">SXO</a>
                <a href="https://0nmcp.com" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 hover:text-emerald-400 transition">0nMCP</a>
              </div>
              <div className="text-xs text-gray-700">&copy; {new Date().getFullYear()} VerifiedSXO by RocketOpp LLC</div>
            </div>
          </div>
        </footer>

        {/* ============================================ */}
        {/* RESULT MODAL */}
        {/* ============================================ */}
        {result && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 sm:p-6" onClick={() => setResult(null)}>
            <div className="bg-[#12121a] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>

              {/* Modal Header — Score */}
              <div className="p-8 text-center border-b border-white/10 relative">
                <button onClick={() => setResult(null)} className="absolute top-4 right-4 p-1.5 hover:bg-white/10 rounded-lg transition">
                  <X size={18} className="text-gray-500" />
                </button>

                {/* Score Ring */}
                <div className={`w-28 h-28 mx-auto rounded-full border-4 flex flex-col items-center justify-center shadow-lg ${scoreRing(result.analysis?.fact_probability)}`}>
                  <span className={`text-4xl font-black ${scoreColor(result.analysis?.fact_probability)}`}>
                    {result.analysis?.fact_probability}%
                  </span>
                </div>
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border mt-4 ${scoreBadgeBg(result.analysis?.fact_probability)}`}>
                  <ShieldCheck size={12} />
                  {scoreLabel(result.analysis?.fact_probability)}
                </div>
                <p className="text-sm text-gray-400 italic mt-3 max-w-md mx-auto">&quot;{result.claimText}&quot;</p>
                <p className="text-[10px] text-gray-600 mt-2">
                  Analyzed by {result.provider === 'gemini' ? 'Google Gemini' : 'xAI Grok'} in {result.queryTime}s
                </p>
              </div>

              {/* Modal Body — Analysis */}
              <div className="p-6 overflow-y-auto flex-1 space-y-5">
                {/* Chat Response */}
                <div>
                  <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{result.chat_response}</p>
                </div>

                {/* Analysis Grid */}
                {result.analysis && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/[0.03] border border-white/10 p-3 rounded-lg">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Activity size={12} className="text-blue-400" />
                          <span className="text-[10px] font-bold text-gray-500 uppercase">Sentiment</span>
                        </div>
                        <p className="text-xs text-gray-300">{result.analysis.sentiment_profile}</p>
                      </div>
                      <div className="bg-white/[0.03] border border-white/10 p-3 rounded-lg">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Info size={12} className="text-purple-400" />
                          <span className="text-[10px] font-bold text-gray-500 uppercase">Subjectivity</span>
                        </div>
                        <p className="text-xs text-gray-300">{result.analysis.subjective_summary}</p>
                      </div>
                    </div>

                    {result.analysis.hyperbole_flag && (
                      <div className="flex items-center gap-2 text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-lg text-xs font-medium">
                        <AlertTriangle size={14} />
                        Hyperbolic language detected in this claim
                      </div>
                    )}

                    {/* Source Verification */}
                    <div className="bg-white/[0.03] border border-white/10 p-4 rounded-xl">
                      <p className="text-[10px] font-bold text-gray-500 uppercase mb-2 flex items-center gap-1.5">
                        <Search size={10} /> Source Verification
                      </p>
                      <p className="text-xs text-gray-400 leading-relaxed">{result.analysis.source_verification}</p>

                      {result.analysis.verifiable_claims?.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-white/5">
                          <p className="text-[10px] font-bold text-gray-500 uppercase mb-1.5">Extracted Claims</p>
                          <ul className="space-y-1">
                            {result.analysis.verifiable_claims.map((c, i) => (
                              <li key={i} className="flex items-start gap-1.5 text-xs text-gray-400">
                                <ChevronRight size={12} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                                {c}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Modal Footer — CTAs */}
              <div className="p-5 border-t border-white/10 bg-[#0f0f18] flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    copySeal(result.claimText, result.analysis?.fact_probability);
                    const btn = document.getElementById('copy-btn');
                    if (btn) { btn.textContent = 'Copied!'; setTimeout(() => { btn.textContent = 'Copy Fact Seal'; }, 2000); }
                  }}
                  className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 px-4 py-3 rounded-xl text-sm font-medium transition"
                >
                  <Copy size={16} />
                  <span id="copy-btn">Copy Fact Seal</span>
                </button>
                <button
                  onClick={() => signIn('linkedin')}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:opacity-90 px-4 py-3 rounded-xl text-sm font-bold transition"
                >
                  <Users size={16} />
                  Sign Up Now — It&apos;s Free
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-[#12121a] border border-white/10 rounded-2xl p-10 text-center max-w-sm">
              <div className="w-16 h-16 mx-auto rounded-full border-4 border-emerald-500/30 border-t-emerald-400 animate-spin mb-6" />
              <h3 className="text-lg font-bold mb-2">Analyzing Claim</h3>
              <p className="text-sm text-gray-400">Cross-referencing against 25 years of verified marketing data...</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
