#!/bin/bash
# Triathlon Coach Setup Script
# Installs and configures the intervals.icu MCP server and workout skill for Claude

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================"
echo "  Triathlon Coach Setup"
echo "========================================"
echo ""

# 1. Check prerequisites
echo "Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed${NC}"
    echo "Please install npm (usually comes with Node.js)"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${YELLOW}Warning: Node.js version 18+ recommended (you have $(node -v))${NC}"
fi

echo -e "${GREEN}Prerequisites OK${NC}"
echo ""

# 2. Get intervals.icu credentials
echo "intervals.icu Credentials"
echo "-------------------------"
echo "You'll need:"
echo "  - API Key: https://intervals.icu/settings (scroll to 'API key' section)"
echo "  - Athlete ID: Found in URL when logged in (e.g., i12345 from intervals.icu/athletes/i12345)"
echo ""

read -p "Enter your intervals.icu API key: " API_KEY
if [ -z "$API_KEY" ]; then
    echo -e "${RED}Error: API key is required${NC}"
    exit 1
fi

read -p "Enter your intervals.icu Athlete ID (including 'i' prefix, e.g., i12345): " ATHLETE_ID
if [ -z "$ATHLETE_ID" ]; then
    echo -e "${RED}Error: Athlete ID is required${NC}"
    exit 1
fi

# Validate athlete ID format
if [[ ! "$ATHLETE_ID" =~ ^i[0-9]+$ ]]; then
    echo -e "${YELLOW}Warning: Athlete ID should start with 'i' followed by numbers (e.g., i12345)${NC}"
    read -p "Continue anyway? (y/n): " CONTINUE
    if [ "$CONTINUE" != "y" ]; then
        exit 1
    fi
fi

echo ""

# 3. Build MCP server
echo "Building MCP server..."
cd "${SCRIPT_DIR}/packages/mcp-server"
npm install
npm run build
echo -e "${GREEN}MCP server built successfully${NC}"

# 4. Build the skill
echo ""
echo "Building workout skill..."
cd "${SCRIPT_DIR}/packages/skill"
chmod +x build.sh
./build.sh
echo -e "${GREEN}Skill built successfully${NC}"

# 5. Configure Claude Desktop
echo ""
echo "Configuring Claude Desktop..."

# Detect Claude Desktop config location
if [[ "$OSTYPE" == "darwin"* ]]; then
    CLAUDE_CONFIG_DIR="$HOME/Library/Application Support/Claude"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    CLAUDE_CONFIG_DIR="$HOME/.config/Claude"
else
    echo -e "${YELLOW}Warning: Unsupported OS for auto-configuration${NC}"
    echo "Please manually configure Claude Desktop. See README.md for instructions."
    CLAUDE_CONFIG_DIR=""
fi

if [ -n "$CLAUDE_CONFIG_DIR" ]; then
    CLAUDE_CONFIG_FILE="${CLAUDE_CONFIG_DIR}/claude_desktop_config.json"
    MCP_SERVER_PATH="${SCRIPT_DIR}/packages/mcp-server/build/index.js"

    # Create config directory if it doesn't exist
    mkdir -p "$CLAUDE_CONFIG_DIR"

    # Check if config file exists
    if [ -f "$CLAUDE_CONFIG_FILE" ]; then
        # Backup existing config
        cp "$CLAUDE_CONFIG_FILE" "${CLAUDE_CONFIG_FILE}.backup"
        echo "Backed up existing config to ${CLAUDE_CONFIG_FILE}.backup"

        # Check if jq is available for JSON manipulation
        if command -v jq &> /dev/null; then
            # Use jq to add/update the MCP server entry
            TEMP_FILE=$(mktemp)
            jq --arg path "$MCP_SERVER_PATH" --arg api_key "$API_KEY" --arg athlete_id "$ATHLETE_ID" '
                .mcpServers["intervals-icu"] = {
                    "command": "node",
                    "args": [$path],
                    "env": {
                        "INTERVALS_API_KEY": $api_key,
                        "INTERVALS_ATHLETE_ID": $athlete_id
                    }
                }
            ' "$CLAUDE_CONFIG_FILE" > "$TEMP_FILE" && mv "$TEMP_FILE" "$CLAUDE_CONFIG_FILE"
            echo -e "${GREEN}Updated Claude Desktop configuration${NC}"
        else
            echo -e "${YELLOW}Warning: jq not installed - cannot auto-update config${NC}"
            echo "Please add the following to your Claude Desktop config manually:"
            echo ""
            echo "  \"mcpServers\": {"
            echo "    \"intervals-icu\": {"
            echo "      \"command\": \"node\","
            echo "      \"args\": [\"${MCP_SERVER_PATH}\"],"
            echo "      \"env\": {"
            echo "        \"INTERVALS_API_KEY\": \"${API_KEY}\","
            echo "        \"INTERVALS_ATHLETE_ID\": \"${ATHLETE_ID}\""
            echo "      }"
            echo "    }"
            echo "  }"
        fi
    else
        # Create new config file
        cat > "$CLAUDE_CONFIG_FILE" << EOF
{
  "mcpServers": {
    "intervals-icu": {
      "command": "node",
      "args": ["${MCP_SERVER_PATH}"],
      "env": {
        "INTERVALS_API_KEY": "${API_KEY}",
        "INTERVALS_ATHLETE_ID": "${ATHLETE_ID}"
      }
    }
  }
}
EOF
        echo -e "${GREEN}Created Claude Desktop configuration${NC}"
    fi
fi

# 6. Done!
echo ""
echo "========================================"
echo -e "${GREEN}  Setup Complete!${NC}"
echo "========================================"
SKILL_ZIP="${SCRIPT_DIR}/packages/skill/dist/intervals-workout-skill.zip"

echo ""
echo "Next steps:"
echo "  1. Restart Claude Desktop to load the MCP server"
echo "  2. Add the workout skill in Claude Desktop:"
echo "     - Open Claude Desktop > Settings > Skills"
echo "     - Click 'Add Skill' and select:"
echo "       ${SKILL_ZIP}"
echo "  3. Create a new project and add the coaching context:"
echo "     - Copy contents of project-instructions.txt to your project instructions"
echo "  4. Start chatting with your AI triathlon coach!"
echo ""
echo "Available commands:"
echo "  - /intervals-workout - Create workouts in intervals.icu format"
echo ""
echo "MCP tools available:"
echo "  - get_athlete_settings - View your FTP, zones, etc."
echo "  - get_planned_workouts - See upcoming workouts"
echo "  - get_completed_activities - Review training history"
echo "  - create_workout - Schedule a new workout"
echo "  - update_workout - Modify an existing workout"
echo "  - delete_workout - Remove a workout"
echo ""
