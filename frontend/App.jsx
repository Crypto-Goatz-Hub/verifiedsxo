import React, { useState, useRef, useEffect } from 'react';

// ============================================
// VERIFIEDSXO - THE VERIFIED INTELLIGENCE ENGINE
// ============================================

const VERTICALS = [
  {
    id: 'marketing',
    name: 'Marketing',
    icon: '📊',
    description: '25 years of verified marketing intelligence',
    color: '#ff6b35',
    available: true
  },
  {
    id: 'sales',
    name: 'Sales',
    icon: '💼',
    description: 'Sales strategies & benchmarks',
    color: '#3b82f6',
    available: false
  },
  {
    id: 'finance',
    name: 'Finance',
    icon: '💰',
    description: 'Financial data & insights',
    color: '#10b981',
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

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle query submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    setIsLoading(true);
    setResponse(null);

    const queryText = query.trim();
    setQuery('');

    try {
      // API call to backend
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

  // Quick query from examples
  const handleExampleClick = (example) => {
    setQuery(example);
    inputRef.current?.focus();
  };

  return (
    <div style={styles.container}>
      {/* Background gradient */}
      <div style={styles.bgGradient} />
      
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>⚡</span>
          <span style={styles.logoText}>VerifiedSXO</span>
        </div>
        <div style={styles.headerRight}>
          <button 
            style={styles.historyBtn}
            onClick={() => setShowHistory(!showHistory)}
          >
            📜 History ({history.length})
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        {/* Hero Section - show when no response */}
        {!response && !isLoading && (
          <div style={styles.hero}>
            <h1 style={styles.heroTitle}>
              The Verified Intelligence Engine
            </h1>
            <p style={styles.heroSubtitle}>
              25 years of marketing knowledge. Verified sources. One question away.
            </p>
          </div>
        )}

        {/* Vertical Selector */}
        <div style={styles.verticalSelector}>
          {VERTICALS.map(v => (
            <button
              key={v.id}
              style={{
                ...styles.verticalBtn,
                ...(activeVertical === v.id ? styles.verticalBtnActive : {}),
                ...(v.available ? {} : styles.verticalBtnDisabled)
              }}
              onClick={() => v.available && setActiveVertical(v.id)}
              disabled={!v.available}
            >
              <span style={styles.verticalIcon}>{v.icon}</span>
              <span>{v.name}</span>
              {!v.available && <span style={styles.comingSoon}>Soon</span>}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSubmit} style={styles.searchForm}>
          <div style={styles.searchContainer}>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything about marketing..."
              style={styles.searchInput}
              disabled={isLoading}
            />
            <button
              type="submit"
              style={{
                ...styles.searchBtn,
                ...(isLoading ? styles.searchBtnLoading : {})
              }}
              disabled={isLoading || !query.trim()}
            >
              {isLoading ? (
                <span style={styles.spinner}>⟳</span>
              ) : (
                '→'
              )}
            </button>
          </div>
        </form>

        {/* Example Queries - show when no response */}
        {!response && !isLoading && (
          <div style={styles.examples}>
            <p style={styles.examplesLabel}>Try asking:</p>
            <div style={styles.exampleGrid}>
              {EXAMPLE_QUERIES.map((example, i) => (
                <button
                  key={i}
                  style={styles.exampleBtn}
                  onClick={() => handleExampleClick(example)}
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div style={styles.loadingContainer}>
            <div style={styles.loadingSpinner} />
            <p style={styles.loadingText}>Searching verified sources...</p>
          </div>
        )}

        {/* Response */}
        {response && !isLoading && (
          <div style={styles.responseContainer}>
            <div style={styles.queryDisplay}>
              <span style={styles.queryLabel}>Q:</span>
              <span style={styles.queryText}>{response.query}</span>
            </div>
            
            <div style={styles.answerCard}>
              <div style={styles.answerHeader}>
                <span style={styles.verifiedBadge}>
                  ✓ Verified
                </span>
                <span style={styles.confidenceScore}>
                  {Math.round((response.confidence || 0.85) * 100)}% confidence
                </span>
              </div>
              
              <div style={styles.answerText}>
                {response.answer}
              </div>

              {response.sources && response.sources.length > 0 && (
                <div style={styles.sourcesSection}>
                  <p style={styles.sourcesLabel}>Sources:</p>
                  <div style={styles.sourcesList}>
                    {response.sources.map((source, i) => (
                      <div key={i} style={styles.sourceItem}>
                        <span style={styles.sourceNumber}>[{i + 1}]</span>
                        <span style={styles.sourceText}>{source.title || source}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              style={styles.newQueryBtn}
              onClick={() => {
                setResponse(null);
                inputRef.current?.focus();
              }}
            >
              Ask Another Question
            </button>
          </div>
        )}
      </main>

      {/* History Sidebar */}
      {showHistory && (
        <div style={styles.historySidebar}>
          <div style={styles.historyHeader}>
            <h3 style={styles.historyTitle}>Query History</h3>
            <button 
              style={styles.closeBtn}
              onClick={() => setShowHistory(false)}
            >
              ×
            </button>
          </div>
          <div style={styles.historyList}>
            {history.length === 0 ? (
              <p style={styles.noHistory}>No queries yet</p>
            ) : (
              history.map((item, i) => (
                <div 
                  key={i} 
                  style={styles.historyItem}
                  onClick={() => {
                    setResponse(item);
                    setShowHistory(false);
                  }}
                >
                  <p style={styles.historyQuery}>{item.query}</p>
                  <p style={styles.historyMeta}>
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={styles.footer}>
        <p>Powered by 25 years of verified marketing intelligence</p>
        <p style={styles.footerSub}>© 2026 RocketOpp • VerifiedSXO.com</p>
      </footer>
    </div>
  );
}

// ============================================
// STYLES - Premium RocketOpp Design System
// ============================================

const styles = {
  container: {
    minHeight: '100vh',
    background: '#0a0a12',
    color: '#ffffff',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif",
    position: 'relative',
    overflow: 'hidden'
  },
  bgGradient: {
    position: 'absolute',
    top: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '150%',
    height: '600px',
    background: 'radial-gradient(ellipse at center top, rgba(255,107,53,0.15) 0%, transparent 60%)',
    pointerEvents: 'none'
  },
  
  // Header
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    position: 'relative',
    zIndex: 10
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  logoIcon: {
    fontSize: '28px',
    filter: 'drop-shadow(0 0 12px rgba(255,107,53,0.6))'
  },
  logoText: {
    fontSize: '20px',
    fontWeight: 700,
    background: 'linear-gradient(135deg, #ff6b35, #ff8c42)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },
  headerRight: {
    display: 'flex',
    gap: '12px'
  },
  historyBtn: {
    padding: '8px 16px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: 'rgba(255,255,255,0.7)',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },

  // Main
  main: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '40px 24px',
    position: 'relative',
    zIndex: 10
  },

  // Hero
  hero: {
    textAlign: 'center',
    marginBottom: '40px'
  },
  heroTitle: {
    fontSize: '42px',
    fontWeight: 800,
    lineHeight: 1.1,
    marginBottom: '16px',
    background: 'linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.8) 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },
  heroSubtitle: {
    fontSize: '18px',
    color: 'rgba(255,255,255,0.6)',
    maxWidth: '500px',
    margin: '0 auto'
  },

  // Vertical Selector
  verticalSelector: {
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: '24px',
    flexWrap: 'wrap'
  },
  verticalBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '100px',
    color: 'rgba(255,255,255,0.5)',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  verticalBtnActive: {
    background: 'linear-gradient(135deg, rgba(255,107,53,0.2), rgba(255,140,66,0.1))',
    borderColor: 'rgba(255,107,53,0.4)',
    color: '#ffffff'
  },
  verticalBtnDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed'
  },
  verticalIcon: {
    fontSize: '16px'
  },
  comingSoon: {
    fontSize: '10px',
    padding: '2px 6px',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '4px',
    marginLeft: '4px'
  },

  // Search
  searchForm: {
    marginBottom: '32px'
  },
  searchContainer: {
    display: 'flex',
    gap: '12px',
    background: '#111118',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '16px',
    padding: '8px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
    transition: 'all 0.2s'
  },
  searchInput: {
    flex: 1,
    padding: '16px 20px',
    background: 'transparent',
    border: 'none',
    color: '#ffffff',
    fontSize: '18px',
    outline: 'none'
  },
  searchBtn: {
    padding: '16px 24px',
    background: 'linear-gradient(135deg, #ff6b35, #ff8c42)',
    border: 'none',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '20px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 4px 16px rgba(255,107,53,0.3)'
  },
  searchBtnLoading: {
    opacity: 0.7,
    cursor: 'wait'
  },
  spinner: {
    display: 'inline-block',
    animation: 'spin 1s linear infinite'
  },

  // Examples
  examples: {
    textAlign: 'center'
  },
  examplesLabel: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.4)',
    marginBottom: '16px'
  },
  exampleGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '8px'
  },
  exampleBtn: {
    padding: '10px 16px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '100px',
    color: 'rgba(255,255,255,0.6)',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },

  // Loading
  loadingContainer: {
    textAlign: 'center',
    padding: '60px 0'
  },
  loadingSpinner: {
    width: '48px',
    height: '48px',
    border: '3px solid rgba(255,255,255,0.1)',
    borderTopColor: '#ff6b35',
    borderRadius: '50%',
    margin: '0 auto 20px',
    animation: 'spin 0.8s linear infinite'
  },
  loadingText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: '16px'
  },

  // Response
  responseContainer: {
    animation: 'fadeIn 0.3s ease'
  },
  queryDisplay: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '20px',
    padding: '16px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '12px'
  },
  queryLabel: {
    color: '#ff6b35',
    fontWeight: 700,
    fontSize: '16px'
  },
  queryText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: '16px',
    lineHeight: 1.5
  },
  answerCard: {
    background: '#16161f',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '20px',
    position: 'relative',
    overflow: 'hidden'
  },
  answerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  verifiedBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    background: 'rgba(16,185,129,0.15)',
    color: '#10b981',
    borderRadius: '100px',
    fontSize: '13px',
    fontWeight: 600
  },
  confidenceScore: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.4)'
  },
  answerText: {
    fontSize: '17px',
    lineHeight: 1.7,
    color: 'rgba(255,255,255,0.9)'
  },
  sourcesSection: {
    marginTop: '20px',
    paddingTop: '20px',
    borderTop: '1px solid rgba(255,255,255,0.08)'
  },
  sourcesLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '12px'
  },
  sourcesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  sourceItem: {
    display: 'flex',
    gap: '8px',
    fontSize: '14px',
    color: 'rgba(255,255,255,0.6)'
  },
  sourceNumber: {
    color: '#ff6b35',
    fontWeight: 600
  },
  sourceText: {},
  newQueryBtn: {
    width: '100%',
    padding: '16px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    color: 'rgba(255,255,255,0.7)',
    fontSize: '15px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s'
  },

  // History Sidebar
  historySidebar: {
    position: 'fixed',
    top: 0,
    right: 0,
    width: '320px',
    height: '100vh',
    background: '#111118',
    borderLeft: '1px solid rgba(255,255,255,0.08)',
    zIndex: 100,
    display: 'flex',
    flexDirection: 'column',
    animation: 'slideIn 0.2s ease'
  },
  historyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '1px solid rgba(255,255,255,0.08)'
  },
  historyTitle: {
    fontSize: '16px',
    fontWeight: 600,
    margin: 0
  },
  closeBtn: {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,255,255,0.05)',
    border: 'none',
    borderRadius: '8px',
    color: 'rgba(255,255,255,0.6)',
    fontSize: '20px',
    cursor: 'pointer'
  },
  historyList: {
    flex: 1,
    overflow: 'auto',
    padding: '12px'
  },
  noHistory: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.3)',
    padding: '40px 0'
  },
  historyItem: {
    padding: '12px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '8px',
    marginBottom: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  historyQuery: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: '4px',
    lineHeight: 1.4
  },
  historyMeta: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.3)'
  },

  // Footer
  footer: {
    textAlign: 'center',
    padding: '24px',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    color: 'rgba(255,255,255,0.3)',
    fontSize: '13px'
  },
  footerSub: {
    marginTop: '4px',
    fontSize: '12px',
    color: 'rgba(255,255,255,0.2)'
  }
};

// Add keyframes via style tag
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes slideIn {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }
    input::placeholder {
      color: rgba(255,255,255,0.3);
    }
  `;
  document.head.appendChild(styleSheet);
}
