# Intervals.icu Workout Builder — Complete Syntax Reference

> Last updated: Dec 2025 • Based on forum verification • Works for Bike/Run/Swim. This is a practical reference for writing workouts directly in the **text syntax** used by Intervals.icu's Workout Builder. It focuses on what you can type, how it's parsed, and how it exports to devices/apps.
>
> **Note:** This document reflects features as of December 2025, including absolute pace support added in November 2025. Intervals.icu is actively developed, so syntax may expand over time.

---

## 1) Core concepts

**Sections (headers):** Any line **without** a leading dash `-` becomes a visual header (e.g., *Warmup*, *Main set*, *Cooldown*). Headers don’t change device behaviour; they’re just labels.

**Steps:** Any line starting with a dash `-` defines a step. A step typically includes:
- Optional **prompt text** (free text before the first time/distance/target)
- A **duration** *or* **distance**
- A **primary target** (Power, HR, or Pace) — cadence is optional/secondary
- Optional **range** or **ramp**
- Optional **options** (e.g., `press lap`, `intensity=…`, `hr=1s`, `power=3s`)

**Repeats (loops):** Put `Nx` (e.g., `3x`, `10x`) on its own line **above** a block of steps to repeat that block N times.

---

## 2) Durations & distances

**Durations:**
- Seconds: `30s`
- Minutes: `5m`, `1m30`, `1m45`
- Hours: `1h`, `1h30m`
- Use `s`, `m`, `h`. Do **not** use `min`.

**Distances:**
- Running/ride distances: `1km`, `2 km`, `0.8mi`, `400mtr`, `50meters`, `200yds`, `200 yards`
- Supported units: `km`, `mile|miles`, `mtr|meters`, `yrd|yards|y`
- For **swim**, set pool length once with a header-like line (anywhere):
  - `pool length: 25m` (common), `pool length: 33.3m`, etc.

**Distance steps end conditions:**
- By default, a distance step ends when distance target is reached.
- If combined with **press lap** (see §6), it ends on distance **or** lap press, whichever occurs first.

---

## 3) Targets & units (primary intensity)

Each step must choose **one** primary intensity domain (Power, Heart Rate, or Pace). You can mix domains across steps (e.g., power-based intervals with HR-based recoveries), but each **single step** has one primary domain.

### Power targets
- Absolute watts: `200w`, `275 W`
- % of FTP: `85%`, `120%`
- Ranges: `200-240w`, `80-90%`
- Ramps: `5m ramp 60-80%`, `2m ramp 180-260w`

### Heart rate targets
- % of **max HR**: `70% HR`, `80-85% HR`
- % of **LTHR** (threshold HR): `90% LTHR`, `95-100% LTHR`

### Pace targets (Run/Swim)
- % of **threshold pace**: `75% Pace`, `85-90% Pace`
- **Absolute pace** (added Nov 2025): `7:15-7:00 Pace`, `6:30/km Pace`
  - Supported units: `/km`, `/mi`, `/100m`, `/250m`, `/400m`, `/500m`, `/100y`
  - Example: `- 10m 7:15-7:00/km Pace`
  - Note: Absolute pace workouts are athlete-specific and not portable between athletes

### Zones (shorthand)
- Use zone codes instead of % if you prefer:
  - Power: `Z2`, `Z3`, … (defaults to Power if not specified)
  - HR: `Z2 HR`, `Z3 HR`, …
  - Pace: `Z2 Pace`, `Z3 Pace`, …

> Examples:
> - `- 60m Z2` (power Z2)
> - `- 30m Z2 HR`
> - `- 10m Z3 Pace`

---

## 4) Cadence (secondary target)

Cadence is optional and **secondary** — it must accompany a primary target.
- Single value: `90rpm`
- Range: `85-95 rpm`

Examples:
- `- 8m 90% 90-100rpm`
- `- 3m Z2 100-110rpm`

---

## 5) Ranges & ramps

**Range:** Provide lower–upper bounds for the chosen domain.
- `- 10m 80-90%`
- `- 6m 100-140w`
- `- 20m 70-80% HR`
- `- 12m 75-85% Pace`

**Ramp:** Use the keyword `ramp` followed by start–end target; combine with duration.
- `- 5m ramp 60-80%`
- `- 2m ramp 180-260w`
- Ramps can be used for warmups, cool-downs, or progressive efforts.

> Note: Some head units/apps approximate ramps as small steps; very short ramps may appear “steppy”.

---

## 6) Step options & modifiers

**Press lap (end by lap button):**
- Add `Press lap` anywhere in the step text to allow manual early termination on supported devices.
- Example: `- Press lap 20m 50%`
- Behaviour: Step ends at duration/distance **or** manual lap, whichever occurs first.

**Target smoothing on devices (Garmin):**
- Choose how the **on-device target** is evaluated:
  - Power: `power=lap` (default), `power=3s`, `power=10s`, `power=30s` (availability may vary)
  - Heart rate: `hr=lap` (default), `hr=1s` (instant HR)
- Examples:
  - `- 4m 105% power=3s`
  - `- 8m 90% LTHR hr=1s`

**Free text prompts:**
- Any words **before** the first time/distance/target become the step’s on-device prompt.
  - `- Recovery 30s 50%` → prompt is *Recovery*

---

## 7) Repeats (loops) & grouping

**Single-level repeats:**
- Place `Nx` on a line **above** the step block you want to repeat.
- **IMPORTANT:** Separate blocks with blank lines. You need a blank line **before** the `Nx` marker (unless it's at the start of the workout).
- Example (correct):
```
Warmup
- 5m 70%

Main set 6x
- 4m 100% 40-50rpm
- 5m 40%
```
- Example (incorrect - will not render properly):
```
Warmup
- 5m 70%
Main set 6x
- 4m 100% 40-50rpm
- 5m 40%
```
- The UI auto-appends counters like `1/6`, `2/6` to prompts.
- A **blank line ends the repeat grouping** — use blank lines intentionally to control what gets repeated.

**Nesting limitations:**
- Multiple **separate** repeat blocks are supported (one after another, separated by blank lines).
- **Nested loops (repeats within repeats) are NOT supported** as of December 2025.
- When you need nested structure (e.g., 4 sets of 8 reps), you must **manually duplicate** the inner block 4 times.
- Example workaround for "4 sets of 8x (30s on / 30s off)":
```
Set 1 - 8x
- 30s 120%
- 30s 50%

Set 2 - 8x
- 30s 120%
- 30s 50%

Set 3 - 8x
- 30s 120%
- 30s 50%

Set 4 - 8x
- 30s 120%
- 30s 50%
```

---

## 8) Special step types

**Freeride (non‑ERG for Zwift exports):**
- Keyword: `freeride`
- Examples: `- 20m freeride`, `- 10m freeride 60-70%` (range helps estimate load)

**Max effort (self‑paced high effort):**
- Keyword: `maxeffort`
- Example: `- 30s maxeffort`
- Intended for all‑out efforts without ERG control. You can still add cadence if desired.

---

## 9) Pace & running specifics

- Use **% of threshold pace** or **pace zones** (`Zx Pace`) for targets (absolute `mm:ss/km` isn’t parsed as a target number in steps).
- Distance-based repeats are supported (e.g., `400mtr`, `1km`).
- For track reps using **Press lap**, consider slight over-distance (e.g., `- 2.05km press lap …`) to avoid GPS ending a lap early.

---

## 10) Swim specifics

- Set pool length once per workout: `pool length: 25m` (or yards).
- Distance units can be meters (`mtr`, `meters`) or yards (`yrd`, `yards`, `y`).
- Targets can use **% Pace** or `Zx Pace`. (On-device support varies by watch; Intervals.icu exports swim pace using appropriate fields.)

**Rest intervals:**
- Use `0` as the target to create a rest interval (wall rest between efforts).
- Combine time duration with `0`: `- 20s 0` creates a 20-second rest.
- This is especially useful for structured swim sets with specific rest periods.

Example swim set with rest intervals:
```
Warmup
- 400mtr Z1 Pace

Main set 10x
- 200mtr 1:48-1:52/100m Pace
- 20s 0

Cooldown
- 200mtr Z2 Pace

pool length: 25m
```

---

## 11) Exports, sync, and device notes (essentials)

- **Export formats:** ZWO (Zwift), MRC, ERG, FIT (download). You can also sync to **Garmin Connect** (push to devices). Suunto and some others supported for distance/press‑lap; behaviour can vary by model.
- **Ramps:** Supported by Zwift and most apps; very short ramps may render as stepped power.
- **Freeride:** Generates `<FreeRide>` for Zwift. Other apps vary; include a range for load estimation.
- **Garmin targets:** You can set `power=…` or `hr=…` smoothing (see §6). Pace target granularity is set by Garmin (typically lap pace).

---

## 12) Validation tips & common pitfalls

- **Always include a primary target** (Power/HR/Pace). Cadence alone is not valid.
- **Use `m` not `min`.** `1m30` is valid; `1min30` is not.
- **One domain per step.** Don’t try to target *both* power and HR in the **same** step.
- **Ranges & ramps** must match the step’s primary domain units.
- **Repeats end** at a blank line; place empty lines to control grouping.
- **Distance vs minutes:** `m` means *minutes* (not metres). Use `mtr`, `meters`, or specify `km`/`mile`.

---

## 13) Copy‑paste cookbook (ready‑to‑use examples)

### 13.1 Classic 30/30s (power)
```
Warmup
- 10m 60% 90-95rpm

Main set 10x
- 30s 120% power=3s
- 30s 50%

Cooldown
- 10m 55%
```

### 13.2 Over/Unders (power + cadence focus)
```
Warmup
- 12m ramp 55-75% 85-95rpm

Main set 4x
- 6m 88-92% 85-90rpm
- 3m 60% 90-100rpm

Cooldown
- 8m 55%
```

### 13.3 Hill reps (run, pace zones, distance based)
```
Warmup
- Press lap 15m Z1 Pace

Main set 8x
- 400mtr Z4 Pace
- 200mtr Z1 Pace

Cooldown
- 10m Z1 Pace
```

### 13.4 Swim intervals with rest
```
Warmup
- 300mtr Z1 Pace

Main set 6x
- 100mtr Z3 Pace
- 15s 0

Cooldown
- 200mtr Z2 Pace

pool length: 25m
```

### 13.5 Free-ride tempo with manual warm‑up
```
Warmup
- Press lap 20m Z1

Main set
- 30m freeride 75-85% 85-95rpm

Cooldown
- 10m 55-60%
```

---

## 14) Quick cheat‑sheet

- **Step:** `- [prompt] <time|distance> <target or Zx [HR|Pace]> [cadence] [options]`
- **Targets:** `200w` | `85%` | `70% HR` | `95% LTHR` | `Z3` | `Z2 HR` | `Z3 Pace` | `0` (rest)
- **Absolute pace:** `7:15-7:00 Pace` | `6:30/km Pace` (added Nov 2025)
- **Cadence:** `90rpm` | `85-95rpm`
- **Range:** `<low-high><units>` → `80-90%`, `200-240w`, `75-85% Pace`
- **Ramp:** `<time> ramp <start-end>` → `5m ramp 60-80%`
- **Repeat:** `Nx` on a line above a block (blank line ends the repeat group)
- **Nested repeats:** NOT supported — manually duplicate blocks instead
- **Press lap:** Add `Press lap` to the step text
- **Device smoothing:** `power=3s|10s|30s|lap` • `hr=1s|lap`
- **Distances:** `1km` • `0.5mi` • `400mtr` • `200yds` • `pool length: 25m`

---

## 15) Troubleshooting

- **Steps not appearing:** Check you used `-` at the start; ensure units are correct (`m` vs `min`).
- **Repeats not working:** Ensure there's a **blank line before** the `Nx` marker. Blank lines separate blocks and are required for proper rendering.
- **Cadence‑only error:** Add a primary target (Power/HR/Pace).
- **Nested repeats don't work:** Nested loops are NOT supported — manually duplicate the entire inner block for each set.
- **Press lap didn't end the step:** Confirm device/app support. On Garmin, ensure the workout synced after edits.
- **Unexpected pace/HR behaviour on watch:** Try `power=3s` or `hr=1s` where applicable (Garmin); pace granularity is device‑controlled.

---

### Appendix: Tiny reference examples

- `- 20m 60% 90-100rpm`
- `- Recovery 30s 50%`
- `- 5m ramp 60-80%`
- `- 1km Z3 Pace`
- `- 2m 85-95 rpm 50%` (cadence second, power is primary)
- `- 30s maxeffort`
- `- 10m freeride`
- `- 20s 0` (rest interval)
- `pool length: 25m`

---

*That’s it. Paste any of the examples into the Intervals.icu workout description box to see the graph update in real time.*

