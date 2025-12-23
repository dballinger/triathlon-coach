# Triathlon Coach

An AI-powered triathlon coaching assistant built with Claude. Connects to your [intervals.icu](https://intervals.icu) account to view training data, analyse workouts, and create structured training plans.

## What's Included

- **MCP Server** - Connects Claude to your intervals.icu account for reading training data and managing workouts
- **Workout Skill** - Creates syntactically correct workouts in intervals.icu format
- **Coaching Context** - Project instructions that configure Claude as an expert endurance coach

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- [Claude Desktop](https://claude.ai/download)
- An [intervals.icu](https://intervals.icu) account with API access

## Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/triathlon-coach.git
cd triathlon-coach

# Run the installer
./install.sh
```

The installer will:
1. Prompt for your intervals.icu API credentials
2. Build the MCP server
3. Build the workout skill
4. Configure Claude Desktop automatically

After installation:
1. Restart Claude Desktop
2. Add the workout skill (Settings > Skills > Add Skill, select `packages/skill/dist/intervals-workout-skill.zip`)
3. Create a new project and paste the contents of `project-instructions.txt` into the custom instructions

This project becomes your coach - every conversation within it is a conversation with your personal triathlon coach.

## Manual Installation

If you prefer to install manually or the automated installer doesn't work for your setup:

### 1. Build the MCP Server

```bash
cd packages/mcp-server
npm install
npm run build
```

### 2. Configure Claude Desktop

Credentials are configured in Claude Desktop's config. This ensures they're available when Claude spawns the MCP server process.

Add the MCP server to your Claude Desktop configuration:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

**Linux:** `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "intervals-icu": {
      "command": "node",
      "args": ["/absolute/path/to/triathlon-coach/packages/mcp-server/build/index.js"],
      "env": {
        "INTERVALS_API_KEY": "your_api_key",
        "INTERVALS_ATHLETE_ID": "i12345"
      }
    }
  }
}
```

### 3. Install the Workout Skill

```bash
cd packages/skill
./build.sh
```

Then add the skill via Claude Desktop:
1. Open Claude Desktop > Settings > Skills
2. Click "Add Skill"
3. Select `packages/skill/dist/intervals-workout-skill.zip`

### 4. Create Your Coach

Create a new Claude project - this becomes your personal triathlon coach. Every conversation within this project is a conversation with your coach, with full access to your training data and the ability to create workouts.

Copy the contents of `project-instructions.txt` into the project's custom instructions to configure the coaching style and preferences.

## Getting Your intervals.icu Credentials

1. **API Key**: Go to https://intervals.icu/settings and scroll down to the "API key" section
2. **Athlete ID**: Found in the URL when logged in (e.g., `i12345` from `intervals.icu/athletes/i12345`)

## Usage

Start a new conversation in your coaching project to talk with your coach:

### View Training Data

- "Show me my current zones and FTP"
- "What workouts do I have planned for this week?"
- "Review my training from the last 7 days"

### Create Workouts

Use the `/intervals-workout` skill command:

- "Create a 90 minute long run"
- "Build a VO2max cycling workout with 6x5min intervals"
- "Design a swim workout with 10x100m repeats"

### Schedule Workouts

The MCP server can create, update, and delete workouts directly on your intervals.icu calendar:

- "Schedule a threshold run for tomorrow"
- "Move my Wednesday bike workout to Friday"
- "Delete the swim session on Monday"

## Available MCP Tools

| Tool | Description |
|------|-------------|
| `get_athlete_settings` | Retrieve FTP, threshold HR, threshold pace, and zones |
| `get_planned_workouts` | List scheduled workouts within a date range |
| `get_completed_activities` | List completed activities with metrics |
| `create_workout` | Schedule a new workout |
| `update_workout` | Modify an existing workout |
| `delete_workout` | Remove a workout from the calendar |

## Project Structure

```
triathlon-coach/
├── README.md                      # This file
├── install.sh                     # Automated setup script
├── .env.example                   # Credential template
├── project-instructions.txt       # Claude project instructions
├── packages/
│   ├── mcp-server/               # intervals.icu MCP server
│   │   ├── src/index.ts          # Server implementation
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   └── skill/                    # Workout builder skill
│       ├── skill-template.md     # Skill prompt
│       ├── intervals-workout-syntax.md  # Syntax reference
│       ├── workout-preferences.md       # Default preferences
│       ├── build.sh              # Skill compiler
│       └── README.md
└── claude-config/
    └── mcp-servers.json.template # Claude Desktop config template
```

## Customisation

### Coaching Style

Edit `project-instructions.txt` to adjust:
- Threshold terminology (LT/CP vs VT1/VT2)
- Metric preferences per sport
- Analysis preferences

### Workout Defaults

Edit `packages/skill/workout-preferences.md` to change:
- Default target types (HR, power, pace) per workout type
- Warmup structures (e.g., openers for high-intensity sessions)

After editing, rebuild the skill and re-add it via Claude Desktop:
```bash
cd packages/skill
./build.sh
```
Then remove the old skill in Claude Desktop (Settings > Skills) and add the new zip file.

## Contributing

Contributions welcome! Please feel free to submit issues or pull requests.

## License

MIT
