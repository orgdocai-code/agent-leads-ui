# AgentLeads - Build & Status

## Current Status (2026-03-03)

### ✅ Working
- API running on Railway: https://agent-leads-production.up.railway.app
- UI running on Vercel: https://agent-leads-ui.vercel.app
- Jobs endpoint: Returns 351 jobs with skills
- Skills endpoint: Returns 15 skills (ai, github, python, etc.)
- CORS enabled for frontend
- Email signup form (localStorage only - needs backend)
- Skills filtering works
- Rate limiting works (10 req/key/day, 20 req/IP/day)

### Issues
- Email signups stored in browser localStorage only (no backend) - need to check with user
- No email sending (needs Resend API)
- Skills extraction limited (only 15 skills detected from 351 jobs)

---

## Completed Phases

### Phase 1: Setup & Backup ✅
- [x] Backup existing AgentLeads repo
- [x] Add API key system with rate limiting
- [x] Add skill extraction
- [x] Deploy to Railway

### Phase 2: UI Development ✅
- [x] Create Next.js project
- [x] Build job listing page
- [x] Add skill filters
- [x] Add search functionality
- [x] Add "Save Jobs" (localStorage)
- [x] Add email signup form
- [x] Deploy to Vercel

---

## Phase 3: User Features (PENDING)
- [ ] Create email subscription API endpoint
- [ ] Store emails in database (not localStorage)
- [ ] Resend integration for email alerts
- [ ] User profiles with saved skills
- [ ] AI job matching (upload resume → get matched)

## Phase 4: Monetization (PENDING)
- [ ] Stripe integration for payments
- [ ] Pro tier ($9/mo): Unlimited + AI matching
- [ ] Paid apply ($2-5/apply)

## Phase 5: Launch (PENDING)
- [ ] Post on Hacker News
- [ ] Post on Reddit
- [ ] Twitter/X announcement
- [ ] Set up analytics

---

## Next Steps

1. **You tomorrow:** Sign up for Resend, get API key
2. **After that:** I'll add email subscription backend + cron for weekly digests
3. **Then:** Launch on social media

---

## Cost

| Item | Free Tier | Cost |
|------|-----------|------|
5-10/mo| Railway | $ | Currently running |
| Vercel | Unlimited | $0 |
| Resend | 3,000/mo free | $0 (when added) |
| Total | | $5-10/mo |
