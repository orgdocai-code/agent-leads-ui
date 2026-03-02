# AgentLeads UI Build Plan

## Overview
Build a job board UI for AgentLeads with skill-based matching, starting with free tier.

## Phases

---

## Phase 1: Setup & Backup (COMPLETED ✅)
- [x] Backup existing AgentLeads repo → `agent-leads-backup/`
- [x] Clone to local for development → `agent-leads-dev/`
- [x] Add API key system with 10 req/day limit ✅
- [x] Add skill extraction to jobs ✅
- [x] Test locally ✅
- [x] Deploy to staging (GitHub) ✅

## Phase 2: UI Development (IN PROGRESS)
- [ ] Create Next.js project
- [ ] Build job listing page
- [ ] Add skill filters (sidebar)
- [ ] Add search functionality
- [ ] Add "Save Jobs" (localStorage)
- [ ] Deploy to Vercel (free tier)

## Phase 2: UI Development
- [ ] Build Next.js job board UI
- [ ] Add skill filters
- [ ] Add search functionality
- [ ] Add "Save Jobs" (localStorage)
- [ ] Deploy to Vercel (free tier)

## Phase 3: User Features
- [ ] Email subscription (free digest)
- [ ] User profiles with skills
- [ ] AI matching (basic)

## Phase 4: Monetization
- [ ] Add Stripe/payment integration
- [ ] Pro tier ($9/mo): Unlimited + AI matching
- [ ] Paid apply ($2-5/apply)

## Phase 5: Launch
- [ ] Post on Hacker News
- [ ] Post on Reddit (r/LocalLLaMA, r/RemoteJobs)
- [ ] Twitter/X announcement
- [ ] Set up analytics

---

## Technical Details

### API Key System
- Header: `x-api-key`
- Free tier: 10 requests/day
- Track usage by key in database
- Reset daily at midnight UTC

### Skill Extraction
Extract from job title/description:
- Languages: Python, JavaScript, TypeScript, Go, Rust, etc.
- Frameworks: React, Vue, Next.js, LangChain, etc.
- Cloud: AWS, GCP, Azure, Vercel
- Databases: PostgreSQL, MongoDB, Redis
- AI: OpenAI, Claude, Llama, GPT, etc.

### Skills Database
```javascript
const SKILLS = [
  // Languages
  'python', 'javascript', 'typescript', 'go', 'rust', 'java', 'c++',
  // Frontend
  'react', 'vue', 'angular', 'next.js', 'tailwind', 'css', 'html',
  // Backend
  'node.js', 'express', 'fastapi', 'django', 'flask',
  // AI/ML
  'openai', 'claude', 'langchain', 'llamaindex', 'tensorflow', 'pytorch',
  // Cloud
  'aws', 'gcp', 'azure', 'vercel', 'railway', 'docker', 'kubernetes',
  // Databases
  'postgresql', 'mysql', 'mongodb', 'redis', 'supabase',
  // Tools
  'git', 'github', 'gitlab', 'vscode', 'cursor'
]
```

### Free Tier Limits
- 10 requests per API key per day
- No way to bypass (server-side only)
- Hard limit, no exceptions

---

## Cost Tracking

| Item | Free Tier | Cost |
|------|-----------|------|
| Railway | $5-10/mo | Currently running |
| Vercel | Unlimited | $0 |
| Domain | ~$12/yr | TBD |
| Total | | $5-10/mo |
