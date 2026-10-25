# AI Agent Hand-off — Read This First

You (an AI coding/chat agent — Claude Code, another Claude Code plugin host, or any other agent
that can read local files and follow instructions) have just been pointed at a folder containing
this skill pack. This file is written **to you**, not to the human who bought it. It tells you
what you're holding and how to use it correctly from the first message.

If you are Claude Code specifically: everything below still applies, and the skills are already
in the standard `.claude/skills/<name>/SKILL.md` format Claude Code auto-discovers — no extra
setup step needed on your end beyond what `GETTING-STARTED.md` tells the human to do.

---

## 1. What this bundle is

20 skill files (`.claude/skills/*/SKILL.md`), each a self-contained set of instructions for one
specific SEO/content task: auditing accuracy, freshness, duplicate-content risk, technical SEO,
internal linking, backlinks, legal/regulatory/accessibility exposure, content-gap discovery,
growth-stage-appropriate strategy, creation-time standards, measurement discipline, a
cross-session change/decision log, indexing and crawl health, traffic-drop diagnosis, site-migration safety, click-through optimization, ongoing SEO health monitoring, and one router (`site-audit-orchestrator`) that ties the
rest together.

They are **purely functional** — checklists, decision rules, and output shapes. There is no
narrative, no case-study prose, no "here's what happened to us" story content inside any skill
file. If a human asks you to explain where this came from, that's a `GETTING-STARTED.md`
question, not something to invent an answer to from inside a skill file.

---

## 2. How to use them

1. **Start at `site-audit-orchestrator`** for any general request ("audit my site," "help me
   grow this," "is this page okay to publish") — it establishes growth-stage context first, then
   routes to the specific skill(s) that actually apply. Its routing table names every other
   skill in the pack; don't guess which one applies when that table already answers it.
2. **Go directly to a named specialist skill** if the request is already specific (e.g. a
   question purely about internal linking → `internal-linking-audit` directly, no need to route
   through the orchestrator first).
3. **Run more than one skill when a request genuinely spans several areas.** The orchestrator's
   Step 1 gives an explicit example of this (publishing a large batch of new pages touches
   `content-creation-standards`, `duplicate-intent-audit`, and `seo-growth-stage-strategy` at
   once) — don't force a multi-part request into a single skill just because that's simpler.
4. **Apply `change-and-decision-log` after doing real work, not just when asked for it by name.**
   If a session results in an actual change, or a real judgment call with no obviously-correct
   answer, log it per that skill's discipline before considering the task done. This is what
   lets a future session — yours or a different agent's — pick this project back up without
   re-discovering context or re-arguing something already settled. Treat your own documentation
   as the only memory you'll have of this work; nothing else about this session persists.

---

## 3. The one rule that overrides your default instinct: ask, but never block

Every skill's "Step 0" asks clarifying questions. Your default instinct as an agent might be to
either (a) refuse to proceed without answers, or (b) skip Step 0 and just start working. Do
neither. The correct behavior, and the reason every skill was built this way:

- **Ask the Step 0 questions** when there's a real chance of getting useful answers — they
  measurably improve the output's precision.
- **If the user doesn't answer, can't answer, or you're running non-interactively:** every skill
  has an explicit fallback written into its Step 0 (look for the "**If [X] isn't available/
  answered:**" sentence — it's in all 20 files). Follow that fallback and produce the audit
  anyway, using what's directly observable (the live pages, the site's own structure, general
  knowledge of the niche). Never respond with only a request for more information and no
  substantive output.
- **State plainly what's inferred versus confirmed** in your output when you had to fall back.
  That distinction is the actual deliverable quality bar here — not silence, and not false
  confidence either.

This applies to tool access too (see §4 below), not just conversational answers.

---

## 4. Optional tooling: Google Search Console, Bing Webmaster Tools, backlink/keyword tools

Several skills (`content-opportunity-discovery`, `internal-linking-audit`,
`duplicate-intent-audit`, `backlink-profile-audit`) get meaningfully better with access to
Google Search Console, Bing Webmaster Tools, or a backlink/keyword-data tool (via MCP, an API
key, or however your host exposes them to you). **None of them require it.** Each of those
skills' Step 0 says explicitly what to do if that access isn't there — usually: fall back to
structural/on-page analysis and general web search, and say the output is directionally useful
but less precise without it.

If you have the ability to check whether such a connection is configured in your current
environment, check once at the start of a session and mention the result briefly rather than
re-asking on every individual skill invocation. If you don't have that ability, don't stall on
it — proceed with the skill's fallback and let the human decide whether setting up the
connection is worth it (see `GETTING-STARTED.md`, which has the setup pointer for the human).

---

## 5. What you should never do with this pack

- Never fabricate figures, sources, or specific numbers (search volumes, backlink counts,
  penalty dollar amounts) that a skill's fallback path can't actually produce. Say the figure is
  unavailable rather than inventing a plausible-looking one — several skills (e.g.
  `legal-regulatory-compliance`) explicitly warn against this for figures that shift over time.
- Never treat one automated tool's single score (a "toxic score," a "quality score") as a final
  verdict on its own — `backlink-profile-audit` and `page-quality-audit` both call this out
  specifically.
- Never silently skip a section of a multi-skill audit and present it as complete — say what
  wasn't checked and why, per `site-audit-orchestrator` Step 3.
- Never edit or "improve" a skill file's own instructions mid-task to make a specific request
  easier — if a skill genuinely doesn't fit a request, say so and explain why, rather than
  reinterpreting the skill's rules on the fly.
