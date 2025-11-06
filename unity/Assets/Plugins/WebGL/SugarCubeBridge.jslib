// SugarCubeBridge.jslib
// This file allows C# to call directly into the SugarCube JavaScript API.
// It assumes the SugarCube story is running in the same browser window.

mergeInto(LibraryManager.library, {

  /**
   * Tells the SugarCube engine to navigate to a specific passage.
   * This is the primary way for Unity (the View) to send a
   * command to the SugarCube (the Controller).
   *
   * C# Call: GoToSugarCubePassage("PlayerClickedNPC");
   */
  GoToSugarCubePassage: function(passageNamePtr) {
    var passageName = UTF8ToString(passageNamePtr);

    if (window.SugarCube && window.SugarCube.Engine) {
      try {
        // This is the "Controller" action
        window.SugarCube.Engine.play(passageName);
        console.log("Unity -> SugarCube: play(" + passageName + ")");
      } catch (e) {
        console.error("Unity -> SugarCube Error: " + e);
      }
    } else {
      console.warn("Unity -> SugarCube: SugarCube.Engine API not found.");
    }
  }
});
