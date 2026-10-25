# SEOO skill pack

20 SEO and content skills for your own AI agent, from the workflows and accuracy rules used to
grow countrytaxcalc.com. Each skill says what it is for and where it stops.

**Start with `GETTING-STARTED.md`** (for you), then give `AI-AGENT-HANDOFF.md` to your agent.

## Install

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

## What's inside

- `skills/` — the 20 skills, one folder each (`SKILL.md` inside)
- `GETTING-STARTED.md` — plain-language quickstart
- `AI-AGENT-HANDOFF.md` — instructions written for your agent
- `LICENSE` — MIT: use, change and share freely, keep the copyright line
- `CHANGELOG.md` — what changed in each version

More at https://www.seoo.tools
