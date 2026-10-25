# PickMacApps project instructions

## SEO skill pack (SEOO v1.0.0)

The 20 skills from the SEOO pack are installed in `.grok/skills/`, `.claude/skills/`, and `.agents/skills/`. Human notes are in `docs/seoo-skill-pack/`.

When the user asks about SEO, rankings, indexing, traffic, titles, content, backlinks, internal links, or a site move:

- Start at `site-audit-orchestrator` unless the request is already one specialist task.
- Follow that skill's Step 0. If an answer is missing, use the skill's fallback and say what is inferred.
- After a real change or judgment call, update the log described in `change-and-decision-log`.
- Do not invent search volumes, backlink counts, or other figures the skills cannot produce.
