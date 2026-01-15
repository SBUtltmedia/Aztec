using UnityEditor;
using UnityEngine;
using System.Collections.Generic;
using System;

public class BuildCommand
{
    public static void PerformBuild()
    {
        // Get command line arguments
        string[] args = Environment.GetCommandLineArgs();
        string buildPath = "Builds/WebGL"; // Default path
        bool isDevelopment = false;

        for (int i = 0; i < args.Length; i++)
        {
            if (args[i] == "-buildOutput" && i + 1 < args.Length)
            {
                buildPath = args[i + 1];
            }
            if (args[i] == "-development")
            {
                isDevelopment = true;
            }
        }

        Console.WriteLine("Building WebGL to: " + buildPath);

        // Force minimal settings for fast builds
        Console.WriteLine("Applying minimal build settings for fast WebGL build...");

        // Disable compression for faster builds
        PlayerSettings.WebGL.compressionFormat = WebGLCompressionFormat.Disabled;

        // Use default template (don't set custom template that may not exist)
        // PlayerSettings.WebGL.template = "APPLICATION:Default";

        // Strip engine code
        PlayerSettings.stripEngineCode = true;

        // Managed stripping level
        PlayerSettings.SetManagedStrippingLevel(BuildTargetGroup.WebGL, ManagedStrippingLevel.High);

        Console.WriteLine("Minimal settings applied.");

        // Get enabled scenes
        List<string> scenes = new List<string>();
        foreach (EditorBuildSettingsScene scene in EditorBuildSettings.scenes)
        {
            if (scene.enabled)
            {
                scenes.Add(scene.path);
            }
        }

        // Build options
        BuildPlayerOptions buildPlayerOptions = new BuildPlayerOptions();
        buildPlayerOptions.scenes = scenes.ToArray();
        buildPlayerOptions.locationPathName = buildPath;
        buildPlayerOptions.target = BuildTarget.WebGL;
        buildPlayerOptions.options = isDevelopment ? BuildOptions.Development : BuildOptions.None;

        // Perform build
        UnityEditor.Build.Reporting.BuildReport report = BuildPipeline.BuildPlayer(buildPlayerOptions);
        UnityEditor.Build.Reporting.BuildSummary summary = report.summary;

        if (summary.result == UnityEditor.Build.Reporting.BuildResult.Succeeded)
        {
            Console.WriteLine("Build succeeded: " + summary.totalSize + " bytes");
            EditorApplication.Exit(0);
        }
        else if (summary.result == UnityEditor.Build.Reporting.BuildResult.Failed)
        {
            Console.WriteLine("Build failed");
            EditorApplication.Exit(1);
        }
    }
}
