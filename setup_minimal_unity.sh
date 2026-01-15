#!/bin/bash

# Automated Minimal Unity Setup and Build
# This script generates minimal Unity scenes and builds WebGL fast

UNITY_PATH="/Applications/Unity/Hub/Editor/6000.0.23f1/Unity.app/Contents/MacOS/Unity"
PROJECT_PATH="Unity"
BUILD_OUTPUT="../UnityWebGL"
LOG_FILE="unity_build.log"

echo "================================================"
echo "Minimal Unity WebGL Build - Fast Setup"
echo "================================================"

echo ""
echo "Step 1: Generating minimal Unity scenes..."
"$UNITY_PATH" \
  -batchmode \
  -nographics \
  -quit \
  -projectPath "$PROJECT_PATH" \
  -executeMethod SceneGenerator.GenerateAllScenes \
  -logFile "unity_scene_generation.log"

if [ $? -ne 0 ]; then
  echo "❌ Scene generation failed. Check unity_scene_generation.log"
  exit 1
fi

echo "✓ Scenes generated"
echo ""

echo "Step 2: Adding scenes to build settings..."
"$UNITY_PATH" \
  -batchmode \
  -nographics \
  -quit \
  -projectPath "$PROJECT_PATH" \
  -executeMethod SceneGenerator.AddScenesToBuildSettings \
  -logFile "unity_build_settings.log"

if [ $? -ne 0 ]; then
  echo "❌ Build settings update failed. Check unity_build_settings.log"
  exit 1
fi

echo "✓ Build settings updated"
echo ""

echo "Step 3: Removing SampleScene from build..."
"$UNITY_PATH" \
  -batchmode \
  -nographics \
  -quit \
  -projectPath "$PROJECT_PATH" \
  -executeMethod CleanupBuildSettings.RemoveSampleSceneBatch \
  -logFile "unity_cleanup.log"

if [ $? -ne 0 ]; then
  echo "❌ Cleanup failed. Check unity_cleanup.log"
  exit 1
fi

echo "✓ SampleScene removed"
echo ""

echo "Step 4: Building WebGL (this will take 2-5 minutes)..."
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
  echo ""
  echo "================================================"
  echo "✅ BUILD SUCCEEDED!"
  echo "================================================"
  echo ""
  echo "WebGL build output: $BUILD_OUTPUT"
  echo ""
  echo "To test:"
  echo "  1. npm start"
  echo "  2. Open http://localhost:53134/Twine/UnityDemo.html?id=alice"
  echo "  3. Navigate between passages and watch Unity scenes change"
  echo ""
else
  echo ""
  echo "================================================"
  echo "❌ BUILD FAILED"
  echo "================================================"
  echo ""
  echo "Check $LOG_FILE for details"
  exit 1
fi
