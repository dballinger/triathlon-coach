# intervals.icu MCP Server

A Model Context Protocol (MCP) server for intervals.icu API integration.

## Features

Tools available:

- **get_athlete_settings** - Retrieve athlete profile including FTP, threshold HR, threshold pace, and zones for all configured sports
- **get_planned_workouts** - List scheduled workouts/events from the calendar with parsed workout structures
- **get_completed_activities** - List completed activities with summary metrics and zone distribution
- **get_activity_intervals** - Drill into a single activity and return its per-interval breakdown (avg power/HR/pace/speed/cadence per detected interval)
- **get_wellness** - Retrieve daily wellness and recovery data (resting HR, HRV, sleep, weight, subjective scores, CTL/ATL)
- **create_workout** / **update_workout** / **delete_workout** - Manage scheduled workouts on the calendar

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Build the Project

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `build/` directory.

## Usage with Claude Desktop

### Getting Your Credentials

- **API Key**: Visit https://intervals.icu/settings and scroll down to the "API key" section
- **Athlete ID**: Found in the URL when logged in: `https://intervals.icu/athletes/{ATHLETE_ID}`

### Configure Claude Desktop

Add this server to your Claude Desktop configuration file (credentials go in the `env` section):

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "intervals-icu": {
      "command": "node",
      "args": ["/absolute/path/to/intervals-mcp/build/index.js"],
      "env": {
        "INTERVALS_API_KEY": "API_KEY_XXXXXX",
        "INTERVALS_ATHLETE_ID": "i12345"
      }
    }
  }
}
```

Replace `/absolute/path/to/intervals-mcp` with the actual path to this directory.

Restart Claude Desktop to load the server.

## MCP Tools

### get_athlete_settings

Retrieves sport settings for all configured sports.

**Parameters**: None

**Returns**: Array of sport settings including:
- FTP (Functional Threshold Power)
- Threshold HR and pace
- Power, HR, and pace zones

**Example**:
```typescript
{
  sport: "Ride",
  ftp: 250,
  threshold_hr: 165,
  power_zones: { zone1: 0.55, zone2: 0.75, ... },
  hr_zones: { zone1: 0.60, zone2: 0.75, ... }
}
```

### get_planned_workouts

Lists scheduled workouts within a date range.

**Parameters**:
- `start_date` (string, required): ISO-8601 format (e.g., "2025-12-06")
- `end_date` (string, required): ISO-8601 format (e.g., "2025-12-13")

**Returns**: Array of planned workouts with:
- Workout name and description
- Start date
- Parsed workout structure with steps and targets (absolute values in watts, bpm, etc.)

**Example**:
```typescript
{
  id: 12345,
  name: "4x8min Sweet Spot",
  start_date: "2025-12-08T10:00:00",
  workout_doc: {
    duration: 3600,
    target: "POWER",
    ftp: 250,
    steps: [...]
  }
}
```

### get_completed_activities

Lists completed activities within a date range.

**Parameters**:
- `start_date` (string, required): ISO-8601 format (e.g., "2025-11-01")
- `end_date` (string, required): ISO-8601 format (e.g., "2025-12-06")

**Returns**: Array of activities (newest first) with:
- Activity type, name, description
- Time and distance metrics
- Power and HR metrics
- Training load (TSS, TRIMP)
- Zone distribution

**Example**:
```typescript
{
  id: 67890,
  name: "Morning Ride",
  type: "Ride",
  moving_time: 3600,
  distance: 30000,
  average_watts: 210,
  weighted_average_watts: 225,
  training_load: 95,
  power_zone_times: [300, 600, 1200, ...]
}
```

### get_activity_intervals

Drills into a single completed activity and returns its per-interval breakdown.

**Parameters**:
- `activity_id` (string, required): The intervals.icu activity ID, e.g. "i136658903" (the `id` field returned by `get_completed_activities`)

**Returns**: The activity's detected intervals (and laps, when they differ) with per-interval averages:
- Duration and distance
- Average/max power, HR, cadence
- Speed and pace
- Aerobic decoupling and training load per interval

### get_wellness

Retrieves daily wellness and recovery records within a date range.

**Parameters**:
- `start_date` (string, required): ISO-8601 format (e.g., "2026-07-16")
- `end_date` (string, required): ISO-8601 format (e.g., "2026-07-30")

**Returns**: One record per day (fields included only when recorded):
- Resting heart rate (bpm)
- HRV (rMSSD, and SDNN when available, in ms)
- Sleep duration (hours), score, and quality
- Weight (kg)
- Subjective scores: fatigue, soreness, stress, mood, motivation (1 = best, 4 = worst)
- Training load: fitness (CTL), fatigue (ATL), form (CTL − ATL)
- SpO₂, respiration rate, blood pressure when recorded

**Example**:
```typescript
{
  date: "2026-07-29",
  resting_heart_rate: { value: 47, units: "bpm" },
  hrv: { rmssd_ms: 68.4 },
  sleep: { duration_hours: 7.5, score: 82 },
  training_load: { fitness_ctl: 72.1, fatigue_atl: 85.3, form: -13.2 }
}
```

## Development

### Project Structure

```
intervals-mcp/
├── src/
│   └── index.ts          # Main MCP server implementation
├── build/                # Compiled JavaScript output
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

### Building

```bash
npm run build
```

### Testing

Run the compiled server directly:

```bash
node build/index.js
```

The server communicates via stdio and will wait for MCP protocol messages.

## API Reference

This server uses the intervals.icu API v1:

- Base URL: https://intervals.icu/api/v1
- Authentication: Basic Auth with API key
- Documentation: https://intervals.icu/api/v1/docs/swagger-ui/index.html
- Forum: https://forum.intervals.icu/t/intervals-icu-api-integration-cookbook/80090

## License

MIT
