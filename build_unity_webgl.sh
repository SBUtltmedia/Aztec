#!/bin/bash

UNITY_PATH="/Applications/Unity/Hub/Editor/6000.0.23f1/Unity.app/Contents/MacOS/Unity"
PROJECT_PATH="Unity"
BUILD_OUTPUT="../UnityWebGL"
LOG_FILE="unity_build.log"

echo "Starting Unity WebGL build..."
echo "Log file: $LOG_FILE (run 'tail -f $LOG_FILE' to see progress)"

"$UNITY_PATH" \
  -batchmode \
  -nographics \
  -quit \
  -projectPath "$PROJECT_PATH" \
  -executeMethod BuildCommand.PerformBuild \
  -buildOutput "$BUILD_OUTPUT" \
  -logFile "$LOG_FILE"

if [ $? -eq 0 ]; then
  echo "Build Succeeded!"
else
  echo "Build Failed. Check $LOG_FILE for details."
  exit 1
fi
