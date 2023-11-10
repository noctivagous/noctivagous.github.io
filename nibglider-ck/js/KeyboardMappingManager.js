// ------------------------------
// KEYBOARD MAPPING MANAGER
// ------------------------------
// - Loads key names and definitions.
// - Reflects keypress states on the virtual keyboard within the canvas.
// - Dispatches events or commands to appropriate managers/entities based on keypress.
//
//
// isCapsLockOn()
// keyEventFlags()
// var keyConfig = {}
// var functionRegistry = {}

class KeyboardMappingManager {
  constructor(app, drawingEntityManager) {
    this.app = app;
    this.drawingEntityManager = drawingEntityManager;
 //   this.eventManager = eventManager;
  
  /*
  document.addEventListener('keydown', function(event) {
    var keyCode = event.code;
    var keyData = keyConfig[keyCode];
    if (keyData) {
      // Display key information
      var keyElement = document.getElementById('keyDisplayPanel');
      keyElement.textContent = keyData.name;
      keyElement.style.backgroundColor = 'rgb(' + keyData.buttonBackgroundColor + ')';
      keyElement.style.backgroundImage = 'url(' + keyData.buttonBackgroundImage + ')';
      keyElement.style.color = 'rgb(' + keyData.buttonFontColor + ')';
      
      // Execute the function
      var functionToExecute = functionRegistry[keyData.functionString];
      if (functionToExecute) {
        functionToExecute();
      }
    }
  });
  
  */



  }

  // sent from InputManager
  handleKeyPress(key) {
    const event = this.mapKeyToEvent(key);
  
    //this.drawingEntityManager.currentEntity.stateMachine.send(event);
    // The event is sent to the active drawing entity's state machine.
  

    // using the keyMap dictionary,
    // this will be mapped to the Tab key
    // but is a placeholder for now:
    this.app.layerManager.selectionHitTestOnCurrentLayer(this.app.mouseX, this.app.mouseY);


  }

  mapKeyToEvent(key) {
    // Logic to convert a key press to a state machine event.
  }

  // Additional methods

 isCapsLockOn(event) {
    if (event.key.length === 1 && event.key >= 'A' && event.key <= 'Z') {
        return !event.shiftKey;
    } else if (event.key.length === 1 && event.key >= 'a' && event.key <= 'z') {
        return event.shiftKey;
    }
    return false;
  }
  
   keyEventFlags(event){
  
     var capsLockOn = this.isCapsLockOn(event);
  
      var flags = '';
  
      // Cocoa-like shorthand flags
      if (event.shiftKey || capsLockOn) flags += '$'; // Shift
      if (event.ctrlKey)  flags += '^'; // Control
      if (event.altKey)   flags += '~'; // Alt/Option
      if (event.metaKey)  flags += '@'; // Command (Meta on PCs)
  
      return flags;
    
  }

keyConfig = {
  "48": {
    "name": "End",
    "buttonName": "End",
    "functionString": "endKeyPress",
    "description": "Deposits any drawing that is taking place onto the drawing page.",
    "buttonBackgroundColor": "148,17,0",
    "buttonBackgroundImage": "endKbImg",
    "buttonFontColor": "255,64,255"
  }
  // ... Other key configurations
};

 functionRegistry = {
    endKeyPress: function() {
      console.log("End key pressed.");
      // Implement the function's logic here
    },
    pushPaletteToSelectedKeyPress: function() {
      console.log("Palette settings pushed to selected objects.");
      // Implement the function's logic here
    }
    // ... Other functions can be added here in a similar manner
  };


    // Define key mappings
    keyMappings = {
      'F': () => { /* ... */ },
      'A': () => { /* ... */ },
      // Define other key mappings...
    };
  

    

}

export default KeyboardMappingManager;