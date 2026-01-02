# Intervals.icu Workout Builder Preferences

These preferences guide how workouts are structured when using the intervals-workout skill.

## Target Type Preferences

### Long Runs
- **Target:** Percent of LTHR (e.g., `- 60m 80-85% LTHR`)
- **Rationale:** Long runs benefit from steady-state HR zones for aerobic development

### High Intensity Interval Runs
- **Target:** Percent of threshold pace (e.g., `- 5m 95-100% Pace`)
- **Rationale:** Interval work is more precise when based on pace zones

### Swims
- **Target:** Absolute pace range (e.g., `- 400mtr 1:45-1:50/100m Pace`)
- **Rationale:** Pool workouts work best with specific pace targets
- **Important:** Use `mtr` or `meters` for distances (NOT `m` which means minutes)

### Rides (General)
- **Target:** Percent of FTP (e.g., `- 20m 75-85%`)
- **Rationale:** Power-based training provides the most consistent stimulus

## Workout Structure Preferences

### Rides with Z4+ Intervals
- **Include openers:** Yes
- **Opener count:** 3
- **Opener structure:** Short high-intensity bursts in the warmup (e.g., 30s at 120%)
- **Rationale:** Openers prime the neuromuscular system for high-intensity efforts

---

## Activity Descriptions

When reviewing completed workouts from intervals.icu, the `description` field may contain freeform notes added by the athlete. This context can inform coaching analysis and recommendations.

**Possible content includes:**
- Subjective feel (fatigue, energy levels, motivation)
- External factors (sleep quality, stress, nutrition, weather)
- Technical observations (equipment issues, pacing strategy)
- Physical sensations (pain, discomfort, recovery state)

**Usage:** If a description is present, consider it as supplementary context alongside the objective metrics. If absent, proceed with metrics alone.

---

**Note:** These preferences can be modified to suit individual athlete needs or coaching philosophy. The skill will read these preferences when generating workouts.
