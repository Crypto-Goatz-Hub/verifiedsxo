# 🚀 VerifiedSXO - Setup & Deployment Guide

## The Verified Intelligence Engine
*25 years of marketing knowledge. Verified sources. One question away.*

---

## 🏗️ Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                      VERIFIEDSXO                              │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐    │
│  │   SOURCES   │     │  NOTEBOOKLM │     │    API      │    │
│  │  RSS/Manual │ ──▶ │  Knowledge  │ ──▶ │   Layer     │    │
│  └─────────────┘     │    Engine   │     └──────┬──────┘    │
│                      └─────────────┘            │            │
│                                                 │            │
│         ┌───────────────────────────────────────┘            │
│         │                                                    │
│         ▼                                                    │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐    │
│  │   MOBILE    │     │   CHROME    │     │   PUBLIC    │    │
│  │    PWA      │     │  EXTENSION  │     │    API      │    │
│  └─────────────┘     └─────────────┘     └─────────────┘    │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 📋 Prerequisites

1. **NotebookLM** - Your "25 Years of Marketing" notebook
   - Notebook ID: `f8a9f1b8-4e9b-4c0b-885f-97f7ba8bacfc`

2. **Vercel Account** - For hosting the frontend

3. **Anthropic API Key** - For fallback/enhanced responses

4. **Domain** - verifiedsxo.com (you own this!)

---

## 🔧 Phase 1: NotebookLM Connection

### Step 1: Install notebooklm-py

```bash
pip install notebooklm
```

### Step 2: Authenticate (one-time)

```bash
notebooklm login
```

This opens a browser for Google OAuth. Once complete, credentials are stored locally.

### Step 3: Test the connection

```bash
notebooklm use f8a9f1b8-4e9b-4c0b-885f-97f7ba8bacfc
notebooklm ask "What was the most effective marketing tactic in 2015?"
```

---

## 🚀 Phase 2: Deploy Frontend to Vercel

### Option A: Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to frontend
cd verifiedsxo-app

# Deploy
vercel

# Set environment variable
vercel env add ANTHROPIC_API_KEY
```

### Option B: Git Deploy

1. Push `verifiedsxo-app` folder to GitHub
2. Connect repo to Vercel
3. Add environment variable: `ANTHROPIC_API_KEY`
4. Deploy

### Option C: Drag & Drop

1. Go to vercel.com/new
2. Drag the `verifiedsxo-app` folder
3. Configure environment variables
4. Deploy

---

## 🔌 Phase 3: Connect Custom Domain

1. In Vercel Dashboard → Project → Settings → Domains
2. Add `verifiedsxo.com`
3. Update DNS records:
   - Type: `A` → `76.76.21.21`
   - Type: `CNAME` → `cname.vercel-dns.com`

---

## 🧠 Phase 4: Full NotebookLM Integration

Once basic deployment works, upgrade to live NotebookLM queries:

### Backend Service (Python)

Deploy the `backend/main.py` FastAPI service:

```bash
# On a server with notebooklm authenticated
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Update Frontend API Route

Edit `pages/api/query.js`:

```javascript
// Change this line:
const backendUrl = process.env.BACKEND_URL || 'https://your-backend.com';

// Uncomment the fetch to backend:
const response = await fetch(`${backendUrl}/query`, { ... });
```

---

## 📊 Phase 5: Auto-Ingestion (GHL + Rocket Plus MCP)

### RSS Feed Sources to Add

| Source | Feed URL | Category |
|--------|----------|----------|
| HubSpot Blog | `https://blog.hubspot.com/marketing/rss.xml` | Tactics |
| Search Engine Journal | `https://www.searchenginejournal.com/feed/` | SEO |
| Social Media Today | `https://www.socialmediatoday.com/rss.xml` | Social |
| MarketingProfs | `https://www.marketingprofs.com/rss/all` | Strategy |
| Content Marketing Institute | `https://contentmarketinginstitute.com/feed/` | Content |

### GHL Workflow

1. **Trigger**: Scheduled (daily)
2. **Action**: Fetch RSS feeds
3. **Filter**: New articles only
4. **Action**: Extract key stats/facts
5. **Action**: Add to NotebookLM via API

### Rocket Plus MCP Integration

Use your existing MCP infrastructure to:
- Monitor RSS feeds
- Extract verified statistics
- Auto-add sources to NotebookLM
- Track source freshness

---

## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `ANTHROPIC_API_KEY` | Claude API for fallback | Optional |
| `BACKEND_URL` | URL of Python backend | For full integration |
| `NOTEBOOKLM_NOTEBOOK_ID` | Marketing notebook ID | For full integration |

---

## 📱 PWA Installation

The app is PWA-ready. Users can:

1. Visit verifiedsxo.com on mobile
2. Tap "Add to Home Screen"
3. Use like a native app

---

## 🎯 Roadmap

### Week 1
- [x] Frontend PWA built
- [ ] Deploy to Vercel
- [ ] Connect verifiedsxo.com domain
- [ ] Basic Claude API fallback working

### Week 2
- [ ] NotebookLM Python backend deployed
- [ ] Live queries to marketing notebook
- [ ] History persistence (localStorage)

### Week 3
- [ ] GHL auto-ingestion workflows
- [ ] RocketLink Chrome extension integration
- [ ] Additional verticals (Sales, Finance)

### Month 2
- [ ] Public API launch
- [ ] Monetization tiers
- [ ] White-label option

---

## 🆘 Troubleshooting

### "notebooklm login" fails
- Ensure you're using a Google account with NotebookLM access
- Check browser popup blockers

### Vercel deploy fails
- Verify `package.json` dependencies
- Check build logs for missing modules

### Queries return empty
- Verify NotebookLM notebook has sources loaded
- Check backend connectivity

---

## 📞 Support

Built by RocketOpp
- MCPFED: https://mcpfed.com
- Rocket+: Your internal MCP hub

---

*The Verified Intelligence Engine - Because ChatGPT hallucinates and Google gives you 10 blue links.*
