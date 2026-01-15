mergeInto(LibraryManager.library, {

  InitMessageListener: function () {
    var eventListener = function(event) {
      // Check for security if needed (event.origin)
      if (event.data && event.data.type === "STATE_UPDATE") {
        var jsonState = JSON.stringify(event.data.payload);

        // "Bridge" is the name of the GameObject in the scene
        // "ReceiveState" is the name of the method to call
        // jsonState is the string argument
        try {
            SendMessage('Bridge', 'ReceiveState', jsonState);
        } catch (e) {
            console.warn("Unity Bridge: Failed to send STATE_UPDATE to Unity instance. Is the object 'Bridge' in the scene?", e);
        }
      }

      // Handle scene change messages
      if (event.data && event.data.type === "SCENE_CHANGE") {
        var sceneName = event.data.payload;

        try {
            SendMessage('Bridge', 'ReceiveSceneChange', sceneName);
            console.log("Unity Bridge: Sent scene change to Unity: " + sceneName);
        } catch (e) {
            console.warn("Unity Bridge: Failed to send SCENE_CHANGE to Unity instance. Is the object 'Bridge' in the scene?", e);
        }
      }
    };

    window.addEventListener("message", eventListener);
  }

});
