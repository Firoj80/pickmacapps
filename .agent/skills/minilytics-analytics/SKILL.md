---
name: minilytics-analytics
description: Fetch and analyze website traffic, user behavior, conversion funnels, UTM campaigns, and revenue attribution from Minilytics. Use whenever the user asks about website traffic, visitor stats, marketing performance, drop-offs, or revenue.
---

# Minilytics Analytics & Traffic Analysis Skill

Use this skill to fetch live or historical website metrics from Minilytics, analyze visitor behavior, and provide actionable growth recommendations.

## Quick CLI Execution

Run the built-in analytics script:

```bash
# Full comprehensive report for the primary site (last 7 days by default)
node scripts/agent-analytics.mjs report

# Report for a specific site and period (today, yesterday, 24h, 7d, 30d, 90d, 12m, all)
node scripts/agent-analytics.mjs report <siteId> 30d

# List all tracked sites
node scripts/agent-analytics.mjs sites

# Real-time active visitors right now
node scripts/agent-analytics.mjs realtime <siteId>

# Specific breakdown by dimension (source, channel, country, device, browser, page, campaign)
node scripts/agent-analytics.mjs breakdown <siteId> 7d source

# List paying customers & attribution journeys
node scripts/agent-analytics.mjs customers <siteId> 30d
```

Environment Variables (optional):
- `MINILYTICS_URL`: Defaults to `https://minilytics.firojstats.workers.dev` (or `http://localhost:8787` for local development).
- `ADMIN_PASSWORD`: Your dashboard login password.

---

## How to Analyze the Data

When presenting findings to the user, structure your response as follows:

1. **Executive Summary:** Total visitors, pageviews, net revenue, conversion rate, and % change compared to the previous period.
2. **Revenue Attribution & Acquisition:**
   - Which specific channels (Search, Social, AI, Referral, Direct) and sources (X, Google, ChatGPT, Reddit) brought paying customers.
   - Which marketing campaigns (`utm_campaign`) generated the highest return.
3. **User Engagement & Drop-off:**
   - Bounce rate and average session duration.
   - High-traffic pages vs high-converting pages (e.g. blog posts driving visitors vs pricing page drop-offs).
   - Device distribution (Desktop vs Mobile) and any conversion gaps between platforms.
4. **Actionable Recommendations:** 2–3 concrete steps the user can take to improve conversion rates or double down on winning channels.
