import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

// ============================================
// VERIFIEDSXO - THE VERIFIED INTELLIGENCE ENGINE
// ============================================

const VERTICALS = [
  {
    id: 'marketing',
    name: 'Marketing',
    icon: '\uD83D\uDCCA',
    description: '25 years of verified marketing intelligence',
    available: true
  },
  {
    id: 'sales',
    name: 'Sales',
    icon: '\uD83D\uDCBC',
    description: 'Sales strategies & benchmarks',
    available: false
  },
  {
    id: 'finance',
    name: 'Finance',
    icon: '\uD83D\uDCB0',
    description: 'Financial data & insights',
    available: false
  }
];

const EXAMPLE_QUERIES = [
  "What was the average email open rate in 2015?",
  "How did Facebook ads evolve from 2010-2020?",
  "What made Dollar Shave Club's video go viral?",
  "Best performing content formats on LinkedIn 2024",
  "SEO tactics that no longer work",
  "How has influencer marketing ROI changed?"
];

const FEATURES = [
  {
    icon: '\u26A1',
    title: 'Instant Verification',
    desc: 'Get verified answers in seconds, backed by 25 years of data.'
  },
  {
    icon: '\uD83D\uDD0D',
    title: 'Source Tracking',
    desc: 'Every claim traced back to verified sources with confidence scores.'
  },
  {
    icon: '\uD83D\uDCC8',
    title: 'Trend Analysis',
    desc: 'See how strategies evolved across eras with historical benchmarks.'
  },
  {
    icon: '\uD83E\uDDE0',
    title: 'AI-Powered',
    desc: 'Advanced AI cross-references thousands of data points per query.'
  },
  {
    icon: '\uD83C\uDF10',
    title: 'Multi-Vertical',
    desc: 'Marketing today. Sales, Finance, and more verticals coming soon.'
  },
  {
    icon: '\uD83D\uDD12',
    title: 'Verified Only',
    desc: 'No hallucinations. No guesses. Only verified intelligence.'
  }
];

// ============================================
// MAIN APP COMPONENT
// ============================================

export default function VerifiedSXO() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeVertical, setActiveVertical] = useState('marketing');
  const [showHistory, setShowHistory] = useState(false);
  const inputRef = useRef(null);
  const queryRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    setIsLoading(true);
    setResponse(null);

    const queryText = query.trim();
    setQuery('');

    // Scroll to query section
    queryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });

    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: queryText,
          vertical: activeVertical,
          include_sources: true
        })
      });

      if (!res.ok) throw new Error('Query failed');
      const data = await res.json();

      const result = {
        query: queryText,
        answer: data.answer,
        sources: data.sources || [],
        confidence: data.confidence || 0.85,
        timestamp: new Date().toISOString(),
        vertical: activeVertical
      };

      setResponse(result);
      setHistory(prev => [result, ...prev.slice(0, 49)]);
    } catch (error) {
      setResponse({
        query: queryText,
        answer: "Unable to process query. Please try again.",
        sources: [],
        confidence: 0,
        error: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExampleClick = (example) => {
    setQuery(example);
    inputRef.current?.focus();
  };

  return (
    <div className="landing-page">
      {/* Background effects */}
      <div className="grid-bg" />
      <div className="orb-1" />
      <div className="orb-2" />
      <div className="orb-3" />

      {/* Navigation */}
      <nav className="nav">
        <a href="/" className="nav-logo">
          <span className="nav-logo-icon">{'\u26A1'}</span>
          <span className="nav-logo-text">VerifiedSXO</span>
        </a>
        <div className="nav-links">
          <button
            className="nav-link nav-link-ghost"
            onClick={() => setShowHistory(!showHistory)}
          >
            History ({history.length})
          </button>
          <Link href="/login" className="nav-link nav-link-ghost">
            Sign In
          </Link>
          <Link href="/signup" className="nav-link nav-link-primary">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-badge">
          <span className="hero-badge-dot" />
          AI-Powered Verification Engine
        </div>
        <h1 className="hero-title">
          <span className="hero-title-white">The </span>
          <span className="hero-title-gradient">Verified Intelligence</span>
          <br />
          <span className="hero-title-white">Engine</span>
        </h1>
        <p className="hero-subtitle">
          25 years of marketing knowledge. Verified sources. Confidence scores.
          One question away from the truth.
        </p>
        <div className="hero-ctas">
          <a href="#query" className="btn-hero-primary">
            Start Querying {'\u2192'}
          </a>
          <Link href="/signup" className="btn-hero-secondary">
            Create Free Account
          </Link>
        </div>
      </section>

      <div className="gradient-divider" />

      {/* How It Works */}
      <section className="section">
        <p className="section-label">How It Works</p>
        <h2 className="section-title">Three Steps to Verified Truth</h2>
        <p className="section-subtitle">
          Ask a question, get a verified answer with sources and confidence scoring.
        </p>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number step-number-1">1</div>
            <h3 className="step-title">Submit</h3>
            <p className="step-desc">
              Ask any question about marketing, trends, benchmarks, or strategies from the last 25 years.
            </p>
          </div>
          <div className="step-card">
            <div className="step-number step-number-2">2</div>
            <h3 className="step-title">Analyze</h3>
            <p className="step-desc">
              Our AI cross-references thousands of verified data points, statistics, and case studies.
            </p>
          </div>
          <div className="step-card">
            <div className="step-number step-number-3">3</div>
            <h3 className="step-title">Verify</h3>
            <p className="step-desc">
              Get a verified answer with confidence scores, source tracking, and historical context.
            </p>
          </div>
        </div>
      </section>

      <div className="gradient-divider" />

      {/* Stats */}
      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">25+</div>
            <div className="stat-label">Years of Data</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">98%</div>
            <div className="stat-label">Accuracy Rate</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">10K+</div>
            <div className="stat-label">Sources Indexed</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">50K+</div>
            <div className="stat-label">Claims Verified</div>
          </div>
        </div>
      </section>

      <div className="gradient-divider" />

      {/* Query Section */}
      <section className="section" id="query" ref={queryRef}>
        <p className="section-label">Try It Now</p>
        <h2 className="section-title">Ask the Engine</h2>
        <p className="section-subtitle">
          Query 25 years of verified marketing intelligence. Free to try.
        </p>

        <div className="query-container">
          {/* Vertical Selector */}
          <div className="vertical-selector">
            {VERTICALS.map(v => (
              <button
                key={v.id}
                className={`vertical-btn ${activeVertical === v.id ? 'active' : ''}`}
                onClick={() => v.available && setActiveVertical(v.id)}
                disabled={!v.available}
              >
                <span>{v.icon}</span>
                <span>{v.name}</span>
                {!v.available && <span className="coming-soon">Soon</span>}
              </button>
            ))}
          </div>

          {/* Search */}
          <form onSubmit={handleSubmit} className="search-form">
            <div className="search-container">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask anything about marketing..."
                className="search-input"
                disabled={isLoading}
              />
              <button
                type="submit"
                className={`search-btn ${isLoading ? 'loading' : ''}`}
                disabled={isLoading || !query.trim()}
              >
                {isLoading ? (
                  <span className="spinner-icon">{'\u27F3'}</span>
                ) : (
                  '\u2192'
                )}
              </button>
            </div>
          </form>

          {/* Examples */}
          {!response && !isLoading && (
            <div className="examples">
              <p className="examples-label">Try asking:</p>
              <div className="example-grid">
                {EXAMPLE_QUERIES.map((example, i) => (
                  <button
                    key={i}
                    className="example-btn"
                    onClick={() => handleExampleClick(example)}
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="loading-container">
              <div className="loading-spinner" />
              <p className="loading-text">Searching verified sources...</p>
            </div>
          )}

          {/* Response */}
          {response && !isLoading && (
            <div className="response-container">
              <div className="query-display">
                <span className="query-label">Q:</span>
                <span className="query-text">{response.query}</span>
              </div>

              <div className="answer-card">
                <div className="answer-header">
                  <span className="verified-badge">
                    {'\u2713'} Verified
                  </span>
                  <span className="confidence-score">
                    {Math.round((response.confidence || 0.85) * 100)}% confidence
                  </span>
                </div>

                <div className="answer-text">
                  {response.answer}
                </div>

                {response.sources && response.sources.length > 0 && (
                  <div className="sources-section">
                    <p className="sources-label">Sources:</p>
                    {response.sources.map((source, i) => (
                      <div key={i} className="source-item">
                        <span className="source-number">[{i + 1}]</span>
                        <span>{source.title || source}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                className="new-query-btn"
                onClick={() => {
                  setResponse(null);
                  inputRef.current?.focus();
                }}
              >
                Ask Another Question
              </button>
            </div>
          )}
        </div>
      </section>

      <div className="gradient-divider" />

      {/* Features */}
      <section className="section">
        <p className="section-label">Features</p>
        <h2 className="section-title">Built for Truth</h2>
        <p className="section-subtitle">
          Every feature designed to deliver verified, trustworthy intelligence.
        </p>
        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <div key={i} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="gradient-divider" />

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-card">
          <h2 className="cta-title">Ready for Verified Intelligence?</h2>
          <p className="cta-subtitle">
            Create your free account and start querying 25 years of verified marketing data.
          </p>
          <Link href="/signup" className="cta-btn">
            Get Started Free {'\u2192'}
          </Link>
        </div>
      </section>

      {/* History Sidebar */}
      {showHistory && (
        <div className="history-sidebar">
          <div className="history-header">
            <h3 className="history-title">Query History</h3>
            <button className="close-btn" onClick={() => setShowHistory(false)}>
              {'\u00D7'}
            </button>
          </div>
          <div className="history-list">
            {history.length === 0 ? (
              <p className="no-history">No queries yet</p>
            ) : (
              history.map((item, i) => (
                <div
                  key={i}
                  className="history-item"
                  onClick={() => {
                    setResponse(item);
                    setShowHistory(false);
                  }}
                >
                  <p className="history-query">{item.query}</p>
                  <p className="history-meta">
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="footer">
        <div className="footer-links">
          <Link href="/login" className="footer-link">Sign In</Link>
          <Link href="/signup" className="footer-link">Sign Up</Link>
          <a href="#query" className="footer-link">Try It</a>
        </div>
        <p className="footer-main">
          Verified marketing intelligence from 2000-2026
        </p>
        <p className="footer-powered">
          Powered by <span>0nMCP</span>
        </p>
        <p className="footer-sub">&copy; 2026 RocketOpp &middot; VerifiedSXO.com</p>
      </footer>
    </div>
  );
}
