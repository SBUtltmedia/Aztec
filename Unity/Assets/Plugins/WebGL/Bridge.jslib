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
  },

  // =========================================================================
  // OUTBOUND: Unity -> Parent Window (for server sync)
  // These functions allow Unity to send state changes to the parent Twine app,
  // which then relays them to the Socket.IO server.
  // =========================================================================

  /**
   * Send a state update to the server (equivalent to <<th-set '$var' to value>>)
   * @param {string} variablePtr - The variable path (e.g., "$sharedCounter")
   * @param {string} valueJsonPtr - The value as JSON string
   */
  SendStateUpdate: function (variablePtr, valueJsonPtr) {
    var variable = UTF8ToString(variablePtr);
    var valueJson = UTF8ToString(valueJsonPtr);

    try {
      var value = JSON.parse(valueJson);

      window.parent.postMessage({
        type: "UNITY_STATE_UPDATE",
        payload: {
          variable: variable,
          value: value
        }
      }, "*");

      console.log("Unity Bridge: Sent state update ->", variable, value);
    } catch (e) {
      console.error("Unity Bridge: Failed to send state update", e);
    }
  },

  /**
   * Send an atomic update to the server (equivalent to <<th-set '$var' += value>>)
   * Atomic updates prevent race conditions for compound operators.
   * @param {string} variablePtr - The variable path (e.g., "$sharedCounter")
   * @param {string} operationPtr - The operation: "add", "subtract", "multiply", "divide", "modulus"
   * @param {string} valueJsonPtr - The operand value as JSON string
   */
  SendAtomicUpdate: function (variablePtr, operationPtr, valueJsonPtr) {
    var variable = UTF8ToString(variablePtr);
    var operation = UTF8ToString(operationPtr);
    var valueJson = UTF8ToString(valueJsonPtr);

    try {
      var value = JSON.parse(valueJson);

      window.parent.postMessage({
        type: "UNITY_ATOMIC_UPDATE",
        payload: {
          variable: variable,
          operation: operation,
          value: value
        }
      }, "*");

      console.log("Unity Bridge: Sent atomic update ->", variable, operation, value);
    } catch (e) {
      console.error("Unity Bridge: Failed to send atomic update", e);
    }
  }

});
