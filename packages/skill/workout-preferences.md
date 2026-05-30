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

### Single Primary Target per Workout
- **Rule:** Every step in a single workout MUST use the same primary target domain (Power, HR, or Pace). Pick the domain from the per-sport defaults above and apply it consistently across warmup, main set, recoveries, strides, and cooldown.
- **Do not:** Mix HR targets for warmup/cooldown with Power targets for intervals (or any other cross-domain combination) within the same workout.
- **Rationale:** intervals.icu requires a single primary target metric per workout for coherent device targets, summary metrics, and zone analysis. If a session calls for a different metric, author it as its own workout.

### Rides with Z4+ Intervals
- **Include openers:** Yes
- **Opener count:** 3
- **Opener structure:** Short high-intensity bursts in the warmup (e.g., 30s at 120%)
- **Rationale:** Openers prime the neuromuscular system for high-intensity efforts

### Runs with Strides
- **Placement:** Strides go in their own dedicated block placed **between the Main set and the Cooldown**. Never place strides after the cooldown — the cooldown must always be the final block of the run.
- **Typical structure:** A repeat block (e.g., `Strides 6x`) of one fast step (20–30s) and one easy recovery step (45–60s).
- **Target domain:** Strides use the workout's primary target domain. On HR-targeted easy/long runs, encode strides as a high LTHR range (e.g., `- 30s 95-105% LTHR` / `- 60s 60-65% LTHR`). HR will lag on 20–30s reps, so the on-watch target is loose — that is acceptable.
- **Do not:** Use `maxeffort` or pace targets for strides on an HR-targeted run. Do not switch metric domains for the strides block.

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
