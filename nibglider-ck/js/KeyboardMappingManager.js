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
    this.layerManager = this.app.layerManager;
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

  // sent from EventManager
  handleKeyPress(keyEvent) {
    const event = this.mapKeyToEvent(keyEvent);

    //this.drawingEntityManager.currentEntity.stateMachine.send(event);
    // The event is sent to the active drawing entity's state machine.

    var flags = this.keyEventFlags(keyEvent);

    this.eventKeyCodeWithFlag = keyEvent.code;

    if (flags != null) {
      this.eventKeyCodeWithFlag = flags + keyEvent.code;
    }

    // using the keyMap dictionary,
    // this will be mapped to the Tab key
    // but is a placeholder for now:
    this.tempKeyProcessor(keyEvent);

    /*

    ------
    NOTES 
    
    The ` key (~) can act as the broader selection hit key, above Tab.  
    It can hit with a tolerance of 15px, for hitting lines.

    The '1' key can act as a panning drag-lock (via the two-point vector line).
    The vector line for panning will be visible.
    ------

*/

  }


  select() {
    this.layerManager.select();


    //The ` key (~) can act as the broader selection hit key, sitting above the Tab key.  
    //It hits with a tolerance of 15px, for hitting lines.
    // It can use a Rectangle of 10px x 10px instead of a point.

  }


  cart() {
    this.layerManager.cart();
  }

  stamp(){
    this.layerManager.stamp();
  }

  escape() {
    if(this.layerManager.currentLayerHasSelection())
    {
      this.layerManager.cancel();
    }


  }

  // KEY MAPPING

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

  keyEventFlags(event) {

    var capsLockOn = this.isCapsLockOn(event);

    var flags = '';

    // Cocoa-like shorthand flags
    if (event.shiftKey || capsLockOn) flags += '$'; // Shift
    if (event.ctrlKey) flags += '^'; // Control
    if (event.altKey) flags += '~'; // Alt/Option
    if (event.metaKey) flags += '@'; // Command (Meta on PCs)

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
    endKeyPress: function () {
      console.log("End key pressed.");
      // Implement the function's logic here
    },
    pushPaletteToSelectedKeyPress: function () {
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


  tempKeyProcessor(keyEvent) {


    if ((this.eventKeyCodeWithFlag === "Tab")) {
      this.select();
    }


    if ((this.eventKeyCodeWithFlag === "KeyF")) {
      this.drawingEntityManager.hardCorner();
    }

    if ((this.eventKeyCodeWithFlag === "BracketLeft")) {
      this.drawingEntityManager.scaleDown();
    }

    if ((this.eventKeyCodeWithFlag === "BracketRight")) {
      this.drawingEntityManager.scaleUp();
    }


    if ((this.eventKeyCodeWithFlag === "$BracketLeft")) {
      this.drawingEntityManager.scaleDownUpper1();
    }

    if ((this.eventKeyCodeWithFlag === "$BracketRight")) {
      this.drawingEntityManager.scaleUpUpper1();
    }


    if ((this.eventKeyCodeWithFlag === "~BracketLeft")) {
      this.drawingEntityManager.scaleDownLower1();
    }

    if ((this.eventKeyCodeWithFlag === "~BracketRight")) {
      this.drawingEntityManager.scaleUpLower1();
    }


    
    if ((this.eventKeyCodeWithFlag === "^~BracketLeft")) {
      this.drawingEntityManager.scaleDownLower2();
    }

    if ((this.eventKeyCodeWithFlag === "^~BracketRight")) {
      this.drawingEntityManager.scaleUpLower2();
    }




    if ((this.eventKeyCodeWithFlag === "Semicolon")) {
      this.drawingEntityManager.rotateCounterclockwise();
    }

    if ((this.eventKeyCodeWithFlag === "Quote")) {
      this.drawingEntityManager.rotateClockwise();
    }

    

    if ((this.eventKeyCodeWithFlag === "$Semicolon")) {
      this.drawingEntityManager.rotateCounterclockwiseUpper1();
    }

    if ((this.eventKeyCodeWithFlag === "$Quote")) {
      this.drawingEntityManager.rotateClockwiseUpper1();
    }

    if ((this.eventKeyCodeWithFlag === "~Semicolon")) {
      this.drawingEntityManager.rotateCounterclockwiseLower1();
    }

    if ((this.eventKeyCodeWithFlag === "~Quote")) {
      this.drawingEntityManager.rotateClockwiseLower1();
    }


    if ((this.eventKeyCodeWithFlag === "^~Semicolon")) {
      this.drawingEntityManager.rotateCounterclockwiseLower2();
    }

    if ((this.eventKeyCodeWithFlag === "^~Quote")) {
      this.drawingEntityManager.rotateClockwiseLower2();
    }


    if ((this.eventKeyCodeWithFlag === "KeyA")) {
      this.drawingEntityManager.end();
    }


    if ((this.eventKeyCodeWithFlag === "KeyR")) {
      this.drawingEntityManager.closePathAndEnd();
    }

    // Spacebar for drag-lock
    if ((this.eventKeyCodeWithFlag === "Space")) {
      this.cart();

    }

    
        // Spacebar for drag-lock
        if ((this.eventKeyCodeWithFlag === "KeyW")) {
    
          
          this.stamp();
    
        }

    if (keyEvent.key === 'Backspace') {
      removeAllSelectedItemsAndReset();
    }


    // Escape key for cancelling all
    if (keyEvent.key === 'Escape') {

      //alert(this.layerManager.currentLayerHasSelection());
      
      this.drawingEntityManager.cancelOperations();      
      this.layerManager.cancel();
      

    }




  }




}




export default KeyboardMappingManager;