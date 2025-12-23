#!/bin/bash
# Build script for intervals-workout skill
# Compiles the skill with embedded documentation and creates a distributable zip

set -e

echo "Building intervals-workout skill..."

# Define paths
SKILL_DIR=".claude/skills/intervals-workout"
SKILL_TEMPLATE="skill-template.md"
SKILL_OUTPUT="${SKILL_DIR}/skill.md"
SYNTAX_DOC="intervals-workout-syntax.md"
PREFS_DOC="workout-preferences.md"
DIST_DIR="dist"
ZIP_NAME="intervals-workout-skill.zip"

# Ensure skill directory exists
mkdir -p "${SKILL_DIR}"

# Check required files exist
if [ ! -f "${SYNTAX_DOC}" ]; then
    echo "Error: ${SYNTAX_DOC} not found"
    exit 1
fi

if [ ! -f "${PREFS_DOC}" ]; then
    echo "Error: ${PREFS_DOC} not found"
    exit 1
fi

if [ ! -f "${SKILL_TEMPLATE}" ]; then
    echo "Error: ${SKILL_TEMPLATE} not found"
    exit 1
fi

# Build the skill by embedding the documentation
echo "Compiling skill with embedded documentation..."

# Start with the template
cat "${SKILL_TEMPLATE}" > "${SKILL_OUTPUT}"

# Append syntax documentation
echo "" >> "${SKILL_OUTPUT}"
echo "---" >> "${SKILL_OUTPUT}"
echo "" >> "${SKILL_OUTPUT}"
echo "# EMBEDDED DOCUMENTATION" >> "${SKILL_OUTPUT}"
echo "" >> "${SKILL_OUTPUT}"
echo "## Intervals.icu Workout Syntax Reference" >> "${SKILL_OUTPUT}"
echo "" >> "${SKILL_OUTPUT}"
cat "${SYNTAX_DOC}" >> "${SKILL_OUTPUT}"

# Append preferences
echo "" >> "${SKILL_OUTPUT}"
echo "---" >> "${SKILL_OUTPUT}"
echo "" >> "${SKILL_OUTPUT}"
echo "## Workout Preferences" >> "${SKILL_OUTPUT}"
echo "" >> "${SKILL_OUTPUT}"
cat "${PREFS_DOC}" >> "${SKILL_OUTPUT}"

echo "✓ Skill compiled successfully to ${SKILL_OUTPUT}"
echo "✓ Syntax documentation embedded ($(wc -l < ${SYNTAX_DOC}) lines)"
echo "✓ Preferences embedded ($(wc -l < ${PREFS_DOC}) lines)"

# Create distribution package
echo ""
echo "Creating distribution package..."

# Create dist directory
mkdir -p "${DIST_DIR}"

# Remove old zip if exists
rm -f "${DIST_DIR}/${ZIP_NAME}"

# Create zip with the skill directory structure
# The zip should contain: intervals-workout/skill.md
cd "${SKILL_DIR}/.." && zip -r "../../${DIST_DIR}/${ZIP_NAME}" "intervals-workout/skill.md"
cd - > /dev/null

echo "✓ Distribution package created: ${DIST_DIR}/${ZIP_NAME}"
echo ""
echo "Skill is ready!"
echo "  - Local use: /intervals-workout"
echo "  - Deploy: Upload ${DIST_DIR}/${ZIP_NAME} to Claude"
