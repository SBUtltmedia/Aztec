#!/bin/bash

# Launch Chrome Canary with remote debugging for MCP Chrome DevTools
# This allows external tools to connect to the browser's DevTools Protocol

CHROME_CANARY="/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary"
USER_DATA_DIR="$HOME/.cache/chrome-devtools-mcp/chrome-profile"
REMOTE_DEBUGGING_PORT=9222

# Kill any existing Chrome Canary instances using this profile
pkill -f "Google Chrome Canary.*chrome-devtools-mcp" 2>/dev/null

# Wait a moment for processes to fully terminate
sleep 2

# Create user data directory if it doesn't exist
mkdir -p "$USER_DATA_DIR"

echo "🚀 Launching Chrome Canary with remote debugging..."
echo "📍 Remote debugging port: $REMOTE_DEBUGGING_PORT"
echo "📁 User data directory: $USER_DATA_DIR"
echo ""
echo "You can now connect MCP Chrome DevTools to this instance."
echo "Press Ctrl+C to stop."
echo ""

# Launch Chrome Canary with remote debugging enabled
"$CHROME_CANARY" \
  --remote-debugging-port=$REMOTE_DEBUGGING_PORT \
  --user-data-dir="$USER_DATA_DIR" \
  --no-first-run \
  --no-default-browser-check \
  "http://localhost:53134/" \
  > /dev/null 2>&1 &

CHROME_PID=$!
echo "✅ Chrome Canary launched (PID: $CHROME_PID)"
echo ""
echo "To test the game, you can navigate to:"
echo "  http://localhost:53134/?nick=TestUser1&id=test001"
echo ""
echo "Press Enter to stop Chrome Canary..."
read

# Clean shutdown
kill $CHROME_PID 2>/dev/null
echo "👋 Chrome Canary stopped."
