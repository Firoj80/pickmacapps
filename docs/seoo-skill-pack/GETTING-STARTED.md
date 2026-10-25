# Getting Started

Welcome — this is a bundle of 20 SEO/content skill files for your own AI agent (Claude Code, or
any other agent that can read local instruction files). They were generalized from the real,
working playbook behind countrytaxcalc.com, a simple international tax calculator tool that
grew to 88.7K search clicks in 12 months. That track record is the proof this actually
works, and it's the only site these skills have been battle-tested on so far. They're written to apply to any content-heavy site trying to rank,
not just that one.

You don't need to read the skill files yourself. They're written for your AI agent to read and
follow — this page is the human-readable version of "what did I just get and how do I use it."

---

## What you got

- `.claude/skills/` — 20 skill files. Each one is a checklist-style set of instructions for one
  SEO task: factual accuracy, content freshness, duplicate-content risk, technical SEO (meta
  tags, schema, headings), internal linking, backlinks, legal/regulatory/accessibility exposure,
  finding what to build next, matching effort to your site's actual growth stage, doing new
  content right from the start, a discipline for actually measuring whether a change worked, and
  a changelog/decisions-log system so your agent doesn't forget or re-argue past work, plus diagnostic skills for when something goes wrong or changes (why a page isn't indexed, why traffic fell, how to move or restructure a site safely, how to win more clicks, and how to monitor your site's health over time).
- `AI-AGENT-HANDOFF.md` — instructions written *to* your AI agent, not to you. You generally
  don't need to open this, but it's there if you're curious what your agent is being told.
- This file.

---

## How to use it

### Install: where the skill folders go

The skills use the open `SKILL.md` format, which these tools load natively:

| Tool | Copy the folders inside `skills/` into | Notes |
|---|---|---|
| **Claude Code** | `.claude/skills/` (this project) or `~/.claude/skills/` (all projects) | Finds them automatically. |
| **OpenAI Codex** | `.agents/skills/` or `~/.agents/skills/` | Mention a skill with `$`, or just ask. |
| **Cursor** | `.agents/skills/` or `.cursor/skills/` | Type `/` in Agent chat to pick one, or just ask. Also reads `.claude/skills/`. |
| **GitHub Copilot / VS Code** | `.github/skills/`, `.claude/skills/` or `.agents/skills/` | |
| **Gemini CLI** | `.gemini/skills/` or `.agents/skills/` | Run `/skills` to confirm they loaded. |

**One folder covers most tools:** `.agents/skills/` is read by Codex, Cursor, Gemini CLI and VS Code.
Claude Code uses `.claude/skills/`. (Checked against each tool's own documentation on
2026-09-30; tools change, so if a skill doesn't show up, check your tool's current "skills" docs.)

After copying, just ask in plain language. The agent picks the right skill from each skill's
description. `site-audit-orchestrator` is the router for general requests.

**Any other tool (a chat assistant, or an editor with no skills support):** open
`skills/site-audit-orchestrator/SKILL.md` and the specialist skill you need, paste their text into
the conversation, and tell the agent to follow them. It still works; you just lose the automatic
routing.

### What to actually ask for

You don't need to know which of the 20 skills applies — that's the router's job. Just describe
what you want in normal language:
- "Audit my whole site" → runs the full set, starting with a check on whether your site is
  still in a growth/coverage-building phase or a mature one (this changes what's actually worth
  fixing right now).
- "I'm about to publish 50 new pages, make sure I do it right" → the creation-time checklist,
  plus a duplicate-content check across the batch.
- "Why isn't this page ranking" → an internal-linking check, cross-referenced against real
  performance data if you have Search Console connected (see below).
- "Are my backlinks okay?" / "Should I disavow anything?" → the backlink-risk-and-opportunity
  skill — and it will specifically warn you against mass-disavowing links based on a single
  automated tool's score, which is a common, costly mistake.
- "Why isn't this page indexed?" → the indexing and crawl-health check (robots, sitemap, canonicals, redirects, and what each Search Console status really means).
- "My traffic dropped, why?" → a diagnosis that first checks the drop is real, then sizes it, dates it, and separates your own changes from outside causes, before anything gets edited.
- "I'm moving my site / changing my URLs" → a migration-safety plan: baseline, redirect map, pre-launch tests, launch checklist and rollback criteria.
- "Which titles should I improve?" → finds pages that rank but under-earn clicks and rewrites them truthfully, then measures on clicks.
- "Set up weekly SEO monitoring" → a small routine with alerts calibrated to your own history, so you notice real problems without reacting to noise.
- "Pick up where we left off" / "what did we decide last time" → your agent reads back its own
  changelog and decisions log (see below) instead of re-discovering or re-arguing settled work.

---

## Your agent remembers, if you let it

An AI agent has no memory between sessions except what it actually wrote down somewhere it will
read again next time. One skill in this bundle (`change-and-decision-log`) exists specifically
for this: it has your agent keep a running changelog of what changed and why, a separate log of
any real judgment calls it made (with the reasoning, not just the outcome), and a list of things
flagged to double-check later rather than guessed at. The payoff is direct — a future session
(even a brand-new chat, even a different AI tool entirely) can read those files and pick up where
things left off, instead of re-explaining your site to it from scratch or watching it re-decide
something you already settled weeks ago. You don't have to ask for this by name; your agent
should apply it on its own any time it does real work, per `AI-AGENT-HANDOFF.md`.

---

## Do you need Google Search Console / Bing Webmaster Tools connected?

**No — everything works without them.** A handful of skills (finding what content to build
next, internal linking, backlinks, duplicate-content risk) produce sharper, more precise results
if your agent has access to Google Search Console and/or Bing Webmaster Tools data. Without
that access, those same skills still run — they just fall back to checking your site's structure
directly and using general web research instead of your actual search-performance numbers, and
they'll say plainly that the result is "directionally useful but less precise" in that case.

**If you want to connect them** (optional, free, a few minutes each):
- **Google Search Console**: go to [search.google.com/search-console](https://search.google.com/search-console),
  add your site as a property, and verify ownership — the easiest methods are a DNS TXT record
  (if you can edit your domain's DNS) or uploading a small HTML verification file to your site.
- **Bing Webmaster Tools**: go to [bing.com/webmasters](https://www.bing.com/webmasters), add
  your site the same way (you can also often import directly from an already-verified Google
  Search Console property, which is faster).
- Once verified, whether your specific AI agent can *use* that connection depends on your agent's
  own setup (e.g. an MCP server connection in Claude Code) — that's a separate step from the
  verification itself, and your agent should tell you if it doesn't have that access when a
  skill would benefit from it.

If you don't want to bother with any of this: skip it. Nothing in this bundle requires it, and
you can always come back and connect it later without redoing anything.

---

## A note on where this came from

The methodology in these skills is drawn directly from running a real site (countrytaxcalc.com, an
international tax calculator tool) through a year of actual SEO work — accuracy audits,
duplicate-content cleanup, technical SEO fixes, backlink review, and more. That site is named
transparently as the source and proof of track record; this bundle generalizes what worked there
into something that applies to any content site, not just that niche.

This bundle does **not** include AI-citation/AI-search-visibility auditing (checking how a site
is represented across AI answer engines like ChatGPT or Perplexity) — that's a distinct,
separate concern from traditional search-engine SEO and isn't covered here.
