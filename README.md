# Triathlon Coach

An AI coach that plans your season, adapts to real life, and manages your training — all through conversation in Claude Desktop.

Built with Claude and connected to [intervals.icu](https://intervals.icu), this isn't a workout generator. It's an ongoing coaching relationship that understands periodisation, knows your data, and adjusts when life gets in the way.

## What This Actually Does

**Plans your season** — Build a periodised training plan working backwards from your A-races. Base, build, peak, taper — structured across months with appropriate load progression.

**Adapts week to week** — Work trip? Illness? Injury? The plan flexes. Not by throwing it away and starting again, but by making intelligent trade-offs that protect your key sessions.

**Creates real workouts** — Properly structured sessions that land directly in your intervals.icu calendar. Warm-ups, intervals, recoveries, cool-downs — all syntactically correct and ready to execute.

**Learns as you go** — Every conversation builds context. Your FTP, your injury history, your preferences, how sessions felt. You don't start from zero each time.

## How It Works

You chat with your coach in **Claude Desktop**. A dedicated Claude Project becomes your coaching space — every conversation within that project is a conversation with your coach, with full access to your training data and calendar.

The coach operates at multiple levels:

| Level | What happens |
|-------|--------------|
| **Season** | Periodised plan built around your race calendar — base/build/peak/taper phases with appropriate progression |
| **Block** | 4–6 week training blocks with specific focus (e.g., CP development, VO₂ work) and planned deload weeks |
| **Week** | Sessions distributed across the week, respecting your schedule, recovery needs, and session interactions |
| **Session** | Structured workouts with appropriate warm-ups, intervals, and recovery — created directly in intervals.icu |
| **Real-time** | Adjustments based on how you're feeling, what life throws at you, and how sessions actually went |

## Capabilities

**Read your training data:**
- Current zones, FTP, threshold HR, threshold pace
- Planned workouts on your calendar
- Completed activities with full metrics (power, HR, zones, training load)

**Manage your calendar:**
- Create new workouts with full structure
- Update existing sessions (intensity, duration, intervals)
- Move or delete workouts
- Swap sessions between days

**Coach intelligently:**
- Discuss session purpose and execution cues
- Validate training zones against physiological markers
- Make load trade-offs when adapting plans
- Flag concerns proactively (fatigue, injury risk, session conflicts)

## Example Conversations

Here's the kind of thing you can ask your coach:

**Season planning:**
- *"I've got a middle-distance triathlon on June 15th. Can you build me a 16-week plan working back from that?"*
- *"I can only train 8 hours a week until March, then I'll have more time. How should we structure this?"*
- *"My bike is weakest. Can we weight the plan towards cycling while maintaining run fitness?"*

**Weekly adjustments:**
- *"I'm travelling for work on Thursday — can we move that session?"*
- *"I'm still feeling rough from that cold. What should I do this week?"*
- *"Yesterday's threshold session felt easy. Should we adjust my FTP?"*

**Session management:**
- *"Add a 90-minute endurance ride to Saturday"*
- *"Make tomorrow's VO₂ session a bit shorter — I'm tired"*
- *"What's on my calendar for next week?"*

**Review and analysis:**
- *"How did last week's training go?"*
- *"Review my last training block — what worked and what should we change?"*
- *"Am I ready for a step-up week or do I need more recovery?"*

---

## Setup

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- [Claude Desktop](https://claude.ai/download) with a Pro subscription
- An [intervals.icu](https://intervals.icu) account with API access

### Quick Start

```bash
# Clone the repository
git clone https://github.com/dballinger/triathlon-coach.git
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
2. Add the workout skill (Settings → Skills → Add Skill, select `packages/skill/dist/intervals-workout-skill.zip`)
3. Create a new project and paste the contents of `project-instructions.txt` into the project's custom instructions

**That project is now your coach.** Every conversation within it is a conversation with your personal triathlon coach, with full access to your intervals.icu data.

### Getting Your intervals.icu Credentials

1. **API Key**: Go to https://intervals.icu/settings → scroll to "API key" section
2. **Athlete ID**: Found in the URL when logged in (e.g., `i12345` from `intervals.icu/athletes/i12345`)

### Manual Installation

If the automated installer doesn't work for your setup, see [Manual Installation](#manual-installation-details) below.

---

## Customisation

### Coaching Style

Edit `project-instructions.txt` to adjust:
- Threshold terminology (LT/CP vs LT1/LT2 vs VT1/VT2)
- Metric preferences per sport (power, HR, pace)
- Analysis preferences
- Communication style

### Workout Defaults

Edit `packages/skill/workout-preferences.md` to change:
- Default target types per workout type
- Warm-up structures (e.g., openers for high-intensity sessions)

After editing, rebuild the skill:
```bash
cd packages/skill
./build.sh
```

Then remove the old skill in Claude Desktop (Settings → Skills) and add the new zip file.

---

## Project Structure

```
triathlon-coach/
├── README.md
├── install.sh                     # Automated setup
├── project-instructions.txt       # Coaching persona & preferences
├── packages/
│   ├── mcp-server/               # intervals.icu integration
│   └── skill/                    # Workout syntax knowledge
└── claude-config/
    └── mcp-servers.json.template
```

---

## Manual Installation Details

### 1. Build the MCP Server

```bash
cd packages/mcp-server
npm install
npm run build
```

### 2. Configure Claude Desktop

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

Then: Claude Desktop → Settings → Skills → Add Skill → select the zip file.

### 4. Create Your Coach

Create a new Claude project in Claude Desktop. Copy `project-instructions.txt` into the project's custom instructions.

**This project is now your coach.** Start a conversation and begin planning your season.

---

## Contributing

Contributions welcome. Please feel free to submit issues or pull requests.

## License

MIT