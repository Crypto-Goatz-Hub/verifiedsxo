import { useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import Head from 'next/head';

const ROCKET_SITES = [
  { name: 'MCPFed', url: 'https://mcpfed.com', desc: 'AI Tool Federation' },
  { name: 'RocketAdd', url: 'https://rocketadd.com', desc: 'MCP Server Hub' },
  { name: 'RocketOpp', url: 'https://rocketopp.com', desc: 'AI Automation' },
];

export default function Home() {
  const { data: session, status } = useSession();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setResults(null);
    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query, vertical: 'marketing', include_sources: true })
      });
      const data = await res.json();
      if (!res.ok) {
        setResults({ query, verified: false, answer: data.error || 'Request failed', sources: [], confidence: 0 });
      } else {
        setResults({
          query,
          verified: data.confidence > 0.5,
          answer: data.answer,
          sources: data.sources || [],
          confidence: data.confidence,
          demo: data.demo || false,
          timestamp: data.timestamp
        });
      }
    } catch (err) {
      setResults({ query, verified: false, answer: 'Unable to reach the verification engine. Please try again.', sources: [], confidence: 0 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>VerifiedSXO - AI-Powered Fact Verification</title>
        <meta name="description" content="Verify facts instantly with AI-powered source verification." />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <header className="border-b border-white/10 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">✓</span>
              </div>
              <span className="text-xl font-bold text-white">VerifiedSXO</span>
            </div>
            
            <div>
              {status === 'loading' ? (
                <div className="text-gray-400">Loading...</div>
              ) : session ? (
                <div className="flex items-center gap-4">
                  <span className="text-gray-300 text-sm">{session.user?.name || session.user?.email}</span>
                  <button onClick={() => signOut()} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition">Sign Out</button>
                </div>
              ) : (
                <button onClick={() => signIn('linkedin')} className="px-4 py-2 bg-[#0077B5] hover:bg-[#005885] text-white rounded-lg transition flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  Sign in with LinkedIn
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-white mb-4">Verify Facts <span className="text-green-400">Instantly</span></h1>
            <p className="text-xl text-gray-300">AI-powered fact verification using NotebookLM and trusted sources</p>
          </div>

          <form onSubmit={handleSearch} className="mb-12">
            <div className="flex gap-4">
              <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Enter a claim to verify..." className="flex-1 px-6 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400" />
              <button type="submit" disabled={loading} className="px-8 py-4 bg-gradient-to-r from-green-400 to-emerald-500 text-white font-semibold rounded-xl hover:opacity-90 transition disabled:opacity-50">{loading ? 'Verifying...' : 'Verify'}</button>
            </div>
          </form>

          {results && (
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${results.verified ? 'bg-green-500' : 'bg-red-500'}`}>
                  <span className="text-2xl">{results.verified ? '✓' : '✗'}</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">{results.verified ? 'Verified' : 'Unverified'}</h3>
                  <p className="text-gray-400 text-sm">"{results.query}"</p>
                  {results.confidence > 0 && (
                    <p className="text-green-400 text-xs font-mono mt-1">{(results.confidence * 100).toFixed(0)}% confidence</p>
                  )}
                </div>
              </div>
              {results.answer && (
                <div className="mb-6">
                  <div className="text-gray-200 whitespace-pre-wrap leading-relaxed text-sm">{results.answer}</div>
                </div>
              )}
              {results.demo && (
                <div className="mb-4 px-3 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-yellow-400 text-xs">Demo Mode - Set ANTHROPIC_API_KEY for live results</p>
                </div>
              )}
              {results.sources.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-white font-medium text-sm">Sources:</h4>
                  {results.sources.map((source, i) => (
                    <div key={i} className="flex justify-between items-center bg-white/5 rounded-lg px-4 py-3">
                      <span className="text-gray-300 text-sm">{source.title || source.name}</span>
                      <span className="text-gray-500 text-xs">{source.type}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-3 gap-6 mt-12">
            {[{ stat: '88%', label: 'Use AI' }, { stat: '39%', label: 'See Impact' }, { stat: '49%', label: 'The Gap We Fill' }].map((item, i) => (
              <div key={i} className="text-center p-6 bg-white/5 rounded-xl">
                <div className="text-3xl font-bold text-green-400">{item.stat}</div>
                <div className="text-gray-400 text-sm mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        </main>

        <footer className="border-t border-white/10 mt-16">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="text-center mb-6">
              <span className="text-gray-400 text-sm">Part of the</span>
              <h3 className="text-xl font-bold text-white">🚀 Rocket+ Ecosystem</h3>
            </div>
            <div className="flex justify-center gap-8">
              {ROCKET_SITES.map((site, i) => (
                <a key={i} href={site.url} target="_blank" rel="noopener noreferrer" className="text-center group">
                  <div className="text-white font-semibold group-hover:text-green-400 transition">{site.name}</div>
                  <div className="text-gray-500 text-xs">{site.desc}</div>
                </a>
              ))}
            </div>
            <div className="text-center mt-8 text-gray-500 text-sm">
              Install MCP: <code className="bg-white/10 px-2 py-1 rounded">npx -y rocket-plus-mcp</code>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
