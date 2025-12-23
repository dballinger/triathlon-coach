# Intervals.icu Workout Builder Skill

A Claude skill for creating structured triathlon workouts in intervals.icu text format.

## What It Does

Helps AI triathlon coaches create syntactically correct workouts for cycling, running, and swimming that can be directly pasted into intervals.icu's workout builder.

## Quick Start

```bash
# Build the skill
./build.sh

# For local development: Use immediately
/intervals-workout

# For deployment: Upload the zip file
# dist/intervals-workout-skill.zip
```

Then ask for workouts:
- "Create a 90 minute long run"
- "Build a VO2max cycling workout with 6x5min intervals"
- "Design a swim workout with 10x100m repeats"

## How It Works

The skill applies intelligent defaults based on sport and workout type:
- **Long runs** → % LTHR targets
- **Interval runs** → % threshold pace targets
- **Swims** → Absolute pace targets
- **Rides** → % FTP targets
- **High-intensity rides (Z4+)** → Includes 3 openers in warmup

## Project Structure

```
.
├── README.md                      # This file
├── build.sh                       # Build script
├── skill-template.md              # Skill prompt template
├── intervals-workout-syntax.md    # Complete syntax reference
├── workout-preferences.md         # Target type preferences
├── .claude/skills/intervals-workout/
│   └── skill.md                   # Compiled skill (generated)
└── dist/
    └── intervals-workout-skill.zip # Distribution package (generated)
```

## Customization

Edit `workout-preferences.md` to change default target types and workout structures. Then rebuild:

```bash
./build.sh
```

## Syntax Reference

See `intervals-workout-syntax.md` for the complete intervals.icu workout syntax documentation, verified against the intervals.icu forums.

## Features

- ✅ Verified syntax (Dec 2025)
- ✅ Supports all workout types (bike/run/swim)
- ✅ Absolute pace support (added Nov 2025)
- ✅ Smart defaults per sport
- ✅ High-intensity ride openers
- ✅ Copy/paste ready output

## Requirements

- Claude Code with skills support
- Bash (for build script)

## License

MIT
