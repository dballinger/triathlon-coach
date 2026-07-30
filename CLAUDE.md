# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A coaching system that turns a Claude Desktop project into a personal triathlon coach. It is **not** a runtime application — nothing in here runs as a service. The output is a configured Claude Desktop install: an MCP server speaking to intervals.icu, a packaged Skill teaching the intervals.icu workout text format, and a project-instructions file defining the coach persona. The "coach" only exists when those three pieces are combined inside a Claude Desktop project.

## Build & run

There is no test suite, no linter, and no dev server. The whole repo is built on demand and consumed by Claude Desktop.

```bash
# MCP server (TypeScript → build/index.js, chmod +x)
cd packages/mcp-server && npm install && npm run build

# Skill (concatenates template + docs + prefs into skill.md, then zips)
cd packages/skill && ./build.sh

# End-to-end install (prompts for credentials, builds both, edits Claude Desktop config)
./install.sh
```

After editing the skill, the user must remove and re-add the zip in Claude Desktop → Settings → Skills. After editing the MCP server, they must restart Claude Desktop.

## Architecture: the three layers

Coaching behaviour is split across three artefacts that together form one product. Changes to one often need matching changes in another.

1. **`project-instructions.txt`** — pasted into a Claude Desktop project's custom instructions. Defines the coach's persona, threshold terminology (LT/CP), per-sport metric preferences, session-design standards, and how to handle athlete pushback. Read this before changing coaching behaviour — much of what looks like "missing logic" in the code is actually deliberately delegated to the model via these instructions.

2. **`packages/mcp-server/`** — a single-file MCP server (`src/index.ts`) exposing eight tools to Claude Desktop: `get_athlete_settings`, `get_planned_workouts`, `get_completed_activities`, `get_activity_intervals`, `get_wellness`, `create_workout`, `update_workout`, `delete_workout`. Stdio transport, Basic auth to `https://intervals.icu/api/v1`. Verbose debug logging to `packages/mcp-server/debug.log`.

3. **`packages/skill/`** — a Claude Skill that teaches the intervals.icu workout text syntax. `build.sh` concatenates `skill-template.md` + `intervals-workout-syntax.md` + `workout-preferences.md` into a single `skill.md` and zips it. The skill is invoked from inside the project to author the `workout_syntax` argument that the MCP server's `create_workout` accepts.

## intervals.icu API quirks worth knowing

- **Athlete ID inconsistency:** read endpoints use `/athlete/{INTERVALS_ATHLETE_ID}/...`, but bulk event endpoints (`create_workout`, `update_workout`, `delete_workout`) use `/athlete/0/events/bulk*`. Don't "fix" this — `0` is intentional and means "current athlete from API key".
- **No real update endpoint:** `update_workout` is delete-then-create. The code treats a successful delete + failed create as a data-loss state and surfaces a `CRITICAL` error. Preserve that behaviour if refactoring.
- **Bulk delete returns a bare integer**, not JSON. The handlers parse number / string / object shapes defensively — keep that defensive parsing if the API surface drifts.
- **Workout body is two fields glued into one:** `description` (prose intent) and `workout_syntax` (intervals.icu text format) are concatenated with `\n\n` into the single `description` field on the event before POSTing. Read endpoints surface them re-split: prose stays in `description`, the parsed structure comes back via `workout_doc.steps`.
- **Threshold pace units:** the API returns `threshold_pace` in m/s but `pace_units` describes the athlete's preferred display format (`SECS_100M`, `MINS_KM`, `MINS_MI`). `convertThresholdPace()` reconciles these so pace zones and threshold pace are reported in matching units.

## Workout syntax constraints (consumed by the Skill)

When generating intervals.icu workout text — whether for the skill, examples, or test fixtures — these mistakes break parsing:

- `m` means minutes; **never** use it for metres. Use `mtr` or `meters`.
- Section headers and `Nx` repeat markers must start at column 0 (no leading whitespace).
- Blank lines are required between blocks, especially before `Nx` markers.
- One primary target per **workout** (Power **or** HR **or** Pace) — apply it to every step. Don't mix domains across steps in the same workout. Cadence is always secondary.
- Strides/pickups go in their own block placed **between Main and Cooldown** — never after the cooldown. Use the workout's primary target domain (e.g., high LTHR % on an HR-targeted run).
- Nested repeats are not supported — duplicate the inner block manually.

Full reference: `packages/skill/intervals-workout-syntax.md`. Per-sport target-type defaults: `packages/skill/workout-preferences.md`.

## Coaching defaults (from project-instructions.txt)

When working on coaching logic, prompts, or workout generation, these are the user's standing rules — don't override silently:

- Run easy/long → HR target; Run intervals → Power (%CP); Bike → Power (%CP); Swim → Pace.
- Lower threshold is called **LT**, upper threshold is **CP** (not LT1/LT2, not VT1/VT2).
- Metric units, English style.
- Be directive, not menu-driven. Push back on modifications that compromise session intent.
- Name sessions honestly — don't call tempo waves "over-unders".
