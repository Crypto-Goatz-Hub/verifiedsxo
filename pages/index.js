import { useState, useRef, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import Head from 'next/head';
import {
  ShieldCheck, Search, AlertTriangle, CheckCircle, Info, Send,
  FileText, Database, Activity, ChevronRight, Loader2, Copy,
  ThumbsUp, ThumbsDown, Globe, X, ExternalLink, Lightbulb, Zap
} from 'lucide-react';
import { SOURCE_DOCUMENT } from '../lib/source-document';

const SAMPLE_CLAIMS = [
  "Email marketing has an ROI of $36 for every $1 spent",
  "SEO is dead — social media is the only way to get traffic now",
  "Short-form video has 41% higher ROI than long-form content",
  "AI will replace 50% of marketing jobs by 2025",
  "Facebook organic reach is still around 16% for business pages",
  "80% of B2B leads come from LinkedIn",
  "Blog posts over 2000 words rank better on Google",
  "TikTok has surpassed Google as a search engine for Gen Z",
];

export default function Home() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState('knowledge');
  const [verifiedClaims, setVerifiedClaims] = useState([]);
  const [selectedFact, setSelectedFact] = useState(null);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Welcome to the VerifiedSXO Workspace. I am the Truth Analyzer — paste any marketing claim and I'll analyze it against 25 years of verified data, assign a Fact Probability score, and generate a Verified Seal you can share."
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const currentInput = input;
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: currentInput }]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: currentInput }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Request failed');
      }

      const data = await res.json();

      const newClaim = {
        id: Date.now().toString(),
        original_text: currentInput,
        ai_score: data.analysis?.fact_probability || 50,
        community_score: data.analysis?.fact_probability || 50,
        upvotes: 0,
        downvotes: 0,
        analysis: data.analysis,
        provider: data.provider,
        timestamp: data.timestamp,
      };

      setVerifiedClaims(prev => [newClaim, ...prev]);

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.chat_response,
        analysis: data.analysis,
        provider: data.provider,
        queryTime: data.queryTime,
        claimText: currentInput,
        claimId: newClaim.id,
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Analysis error: ${error.message}. The AI providers may be temporarily unavailable — please try again.`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVote = (claimId, isUpvote) => {
    setVerifiedClaims(prev => prev.map(c => {
      if (c.id !== claimId) return c;
      const newUp = isUpvote ? c.upvotes + 1 : c.upvotes;
      const newDown = !isUpvote ? c.downvotes + 1 : c.downvotes;
      const total = newUp + newDown;
      return {
        ...c,
        upvotes: newUp,
        downvotes: newDown,
        community_score: total > 0 ? Math.round((newUp / total) * 100) : c.ai_score,
      };
    }));
  };

  const copySeal = async (claimText, score, claimId) => {
    const color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';
    const label = score >= 70 ? 'VERIFIED' : score >= 40 ? 'PARTIALLY VERIFIED' : 'UNVERIFIED';
    const link = `https://verifiedsxo.com/fact/${claimId || 'demo'}`;

    const text = `🛡️ VerifiedSXO Fact Check\nClaim: "${claimText.substring(0, 120)}"\nProbability: ${score}% — ${label}\nFull Analysis: ${link}`;

    try {
      await navigator.clipboard.writeText(text);
      alert('Fact Seal copied to clipboard!');
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      alert('Copied!');
    }
  };

  const scoreColor = (s) => s >= 70 ? 'text-emerald-500' : s >= 40 ? 'text-amber-500' : 'text-red-500';
  const scoreBg = (s) => s >= 70 ? 'bg-emerald-500/10 border-emerald-500/30' : s >= 40 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-red-500/10 border-red-500/30';
  const scoreRing = (s) => s >= 70 ? 'border-emerald-500' : s >= 40 ? 'border-amber-500' : 'border-red-500';

  return (
    <>
      <Head>
        <title>VerifiedSXO — Truth Analyzer | Marketing Fact Verification</title>
        <meta name="description" content="Verify marketing claims instantly with AI-powered fact-checking against 25 years of verified data. Generate shareable Fact Seals." />
      </Head>

      <div className="flex h-screen bg-[#0a0a0f] text-white overflow-hidden">

        {/* LEFT PANEL */}
        <div className="w-[380px] border-r border-white/10 flex flex-col flex-shrink-0">
          {/* Panel Header */}
          <div className="p-4 border-b border-white/10 bg-[#0f0f18]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-green-600 rounded-lg flex items-center justify-center">
                  <ShieldCheck size={16} className="text-white" />
                </div>
                <span className="font-bold text-sm">VerifiedSXO</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-gray-500">Live</span>
              </div>
            </div>
            <div className="flex bg-white/5 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('knowledge')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${activeTab === 'knowledge' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <FileText size={12} /> Knowledge Base
              </button>
              <button
                onClick={() => setActiveTab('database')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${activeTab === 'database' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <Database size={12} /> Verified Claims ({verifiedClaims.length})
              </button>
            </div>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'knowledge' ? (
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3 text-gray-500 text-xs">
                  <FileText size={12} />
                  <span className="font-medium">Marketing_Stats_2000-2026.md</span>
                </div>
                <div className="text-xs text-gray-400 leading-relaxed whitespace-pre-wrap font-mono">
                  {SOURCE_DOCUMENT}
                </div>
              </div>
            ) : (
              <div className="p-3 space-y-3">
                {verifiedClaims.length === 0 ? (
                  <div className="text-center py-12 text-gray-600">
                    <Database size={28} className="mx-auto mb-3 opacity-40" />
                    <p className="text-sm">No claims analyzed yet.</p>
                    <p className="text-xs mt-1">Paste a marketing claim to get started.</p>
                  </div>
                ) : (
                  verifiedClaims.map(claim => (
                    <div
                      key={claim.id}
                      className="bg-white/[0.03] border border-white/10 rounded-xl p-3 hover:border-emerald-500/30 transition cursor-pointer"
                      onClick={() => setSelectedFact(claim)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className={`px-2 py-0.5 rounded text-xs font-bold border ${scoreBg(claim.community_score)} ${scoreColor(claim.community_score)}`}>
                          {claim.community_score}% Verified
                        </div>
                        <div className="flex gap-2 text-gray-500 text-xs">
                          <button onClick={(e) => { e.stopPropagation(); handleVote(claim.id, true); }} className="hover:text-emerald-400 flex items-center gap-0.5">
                            <ThumbsUp size={12} /> {claim.upvotes}
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleVote(claim.id, false); }} className="hover:text-red-400 flex items-center gap-0.5">
                            <ThumbsDown size={12} /> {claim.downvotes}
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-2 italic">&quot;{claim.original_text}&quot;</p>
                      <div className="flex items-center text-xs text-emerald-400/60 mt-2 font-medium">
                        <Search size={10} className="mr-1" /> View Report
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Auth */}
          <div className="p-3 border-t border-white/10 bg-[#0f0f18]">
            {status !== 'loading' && !session ? (
              <button onClick={() => signIn('linkedin')} className="w-full px-3 py-2 bg-[#0077B5] hover:bg-[#005885] text-white text-xs rounded-lg transition flex items-center justify-center gap-2">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                Sign in with LinkedIn
              </button>
            ) : session ? (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 truncate">{session.user?.name || session.user?.email}</span>
                <button onClick={() => signOut()} className="text-gray-600 hover:text-white transition">Sign Out</button>
              </div>
            ) : null}
          </div>
        </div>

        {/* RIGHT PANEL: Truth Analyzer */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat Header */}
          <div className="px-6 py-4 border-b border-white/10 bg-[#0f0f18] flex items-center justify-between">
            <div>
              <h1 className="font-bold text-base">Truth Analyzer Workspace</h1>
              <p className="text-xs text-gray-500">Analyze marketing claims & generate Verified Fact Seals</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Zap size={12} className="text-emerald-400" />
              <span>Gemini + Grok</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {messages.map(msg => (
              <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                {msg.role === 'user' ? (
                  <div className="bg-white/10 px-4 py-3 rounded-2xl rounded-tr-sm max-w-[80%]">
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                ) : (
                  <div className="max-w-[90%] space-y-3 w-full">
                    <div className="bg-white/[0.03] border border-white/10 px-4 py-3 rounded-2xl rounded-tl-sm flex gap-3">
                      <div className="w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <ShieldCheck size={14} className="text-emerald-400" />
                      </div>
                      <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap flex-1 min-w-0">{msg.content}</div>
                    </div>

                    {/* Fact Seal Card */}
                    {msg.analysis && (
                      <div className="ml-10 bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
                        <div className="p-5 flex items-center gap-5 border-b border-white/5">
                          <div className={`w-20 h-20 rounded-full border-4 flex flex-col items-center justify-center bg-white/5 flex-shrink-0 ${scoreRing(msg.analysis.fact_probability)}`}>
                            <span className={`text-2xl font-black ${scoreColor(msg.analysis.fact_probability)}`}>{msg.analysis.fact_probability}%</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Verified Fact Seal</p>
                            <p className="text-xs text-gray-400 italic truncate mb-3">&quot;{msg.claimText}&quot;</p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => copySeal(msg.claimText, msg.analysis.fact_probability, msg.claimId)}
                                className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-lg text-xs font-medium transition"
                              >
                                <Copy size={12} /> Copy Seal
                              </button>
                              <button
                                onClick={() => {
                                  const c = verifiedClaims.find(vc => vc.id === msg.claimId);
                                  if (c) setSelectedFact(c);
                                }}
                                className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg text-xs font-medium transition"
                              >
                                <ExternalLink size={12} /> Full Report
                              </button>
                            </div>
                          </div>
                        </div>
                        {/* Condensed analysis */}
                        <div className="p-4 grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-gray-600 font-medium block mb-0.5">Sentiment</span>
                            <span className="text-gray-400">{msg.analysis.sentiment_profile}</span>
                          </div>
                          <div>
                            <span className="text-gray-600 font-medium block mb-0.5">Subjectivity</span>
                            <span className="text-gray-400">{msg.analysis.subjective_summary}</span>
                          </div>
                          {msg.analysis.hyperbole_flag && (
                            <div className="col-span-2">
                              <span className="inline-flex items-center gap-1 text-amber-400 bg-amber-500/10 px-2 py-1 rounded text-[10px] font-medium">
                                <AlertTriangle size={10} /> Hyperbolic Language Detected
                              </span>
                            </div>
                          )}
                          <div className="col-span-2 bg-white/[0.02] p-3 rounded-lg border border-white/5">
                            <span className="text-gray-600 font-medium block mb-1">Source Verification</span>
                            <span className="text-gray-400 leading-relaxed">{msg.analysis.source_verification}</span>
                          </div>
                        </div>
                        {msg.provider && (
                          <div className="px-4 py-2 border-t border-white/5 text-[10px] text-gray-600">
                            Analyzed by {msg.provider === 'gemini' ? 'Google Gemini' : 'xAI Grok'} in {msg.queryTime}s
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-gray-500 ml-10">
                <Loader2 size={14} className="animate-spin" />
                <span className="text-xs">Analyzing claim against knowledge base...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Sample Claims */}
          {messages.length <= 1 && (
            <div className="px-6 pb-3">
              <p className="text-xs text-gray-600 mb-2">Try a sample claim:</p>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_CLAIMS.slice(0, 4).map((claim, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(claim)}
                    className="text-[11px] px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-gray-500 hover:text-white transition truncate max-w-[280px]"
                  >
                    {claim}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-white/10 bg-[#0f0f18]">
            <div className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Paste a marketing claim to fact-check..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/30 transition resize-none text-sm placeholder-gray-600"
                rows={2}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="absolute right-3 bottom-3 p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg disabled:bg-gray-700 disabled:cursor-not-allowed transition"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* FACT DETAIL MODAL */}
        {selectedFact && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-6">
            <div className="bg-[#12121a] border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
              {/* Modal Header */}
              <div className={`p-6 border-b border-white/10 flex justify-between items-start ${scoreBg(selectedFact.community_score)}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-full border-4 flex items-center justify-center bg-[#0a0a0f] ${scoreRing(selectedFact.community_score)}`}>
                    <span className={`text-xl font-black ${scoreColor(selectedFact.community_score)}`}>{selectedFact.community_score}%</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Fact Report</h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                      AI Score: {selectedFact.ai_score}% | Community: {selectedFact.community_score}%
                    </p>
                  </div>
                </div>
                <button onClick={() => setSelectedFact(null)} className="p-1.5 hover:bg-white/10 rounded-lg transition">
                  <X size={18} className="text-gray-400" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Claim Under Review</p>
                  <p className="text-sm text-gray-300 italic border-l-2 border-gray-700 pl-3">&quot;{selectedFact.original_text}&quot;</p>
                </div>

                <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium mb-0.5">Is this factually accurate?</p>
                    <p className="text-xs text-gray-500">Your votes adjust the community score.</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleVote(selectedFact.id, true)} className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-emerald-500/20 transition">
                      <ThumbsUp size={14} /> Verify ({selectedFact.upvotes})
                    </button>
                    <button onClick={() => handleVote(selectedFact.id, false)} className="flex items-center gap-1.5 bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-500/20 transition">
                      <ThumbsDown size={14} /> Debunk ({selectedFact.downvotes})
                    </button>
                  </div>
                </div>

                {selectedFact.analysis && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/[0.03] border border-white/10 p-3 rounded-lg">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Activity size={12} className="text-blue-400" />
                          <span className="text-xs font-medium text-gray-400">Tone</span>
                        </div>
                        <p className="text-xs text-gray-300">{selectedFact.analysis.sentiment_profile}</p>
                        {selectedFact.analysis.hyperbole_flag && (
                          <span className="mt-2 inline-flex items-center gap-1 text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded text-[10px]">
                            <AlertTriangle size={10} /> Hyperbolic
                          </span>
                        )}
                      </div>
                      <div className="bg-white/[0.03] border border-white/10 p-3 rounded-lg">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Info size={12} className="text-purple-400" />
                          <span className="text-xs font-medium text-gray-400">Subjectivity</span>
                        </div>
                        <p className="text-xs text-gray-300 italic">{selectedFact.analysis.subjective_summary}</p>
                      </div>
                    </div>

                    <div className="bg-white/[0.03] border border-white/10 p-4 rounded-xl">
                      <p className="text-xs font-medium text-gray-400 mb-2 flex items-center gap-1.5">
                        <Search size={12} /> Source Verification
                      </p>
                      <p className="text-xs text-gray-300 leading-relaxed">{selectedFact.analysis.source_verification}</p>
                      {selectedFact.analysis.verifiable_claims?.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-white/5">
                          <p className="text-[10px] font-bold text-gray-500 uppercase mb-1.5">Extracted Claims</p>
                          <ul className="space-y-1">
                            {selectedFact.analysis.verifiable_claims.map((c, i) => (
                              <li key={i} className="flex items-start gap-1.5 text-xs text-gray-400">
                                <ChevronRight size={12} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                                {c}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
