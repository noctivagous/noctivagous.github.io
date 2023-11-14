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

    this.keyboardMappingManager = this;
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
    this.tempKeyProcessor2(keyEvent);

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

  stamp() {
    this.layerManager.stamp();
  }

  escape() {
    if (this.layerManager.currentLayerHasSelection()) {
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


  getOperatingSystem() {
    if (navigator.userAgentData && navigator.userAgentData.platform) {
      // New User-Agent Client Hints API
      let platform = navigator.userAgentData.platform.toLowerCase();

      if (platform.includes('mac')) {
        return 'Mac';
      } else {
        return 'Windows';
      }
    } else {
      // Fallback to the older userAgent string
      let userAgent = navigator.userAgent.toLowerCase();

      if (userAgent.includes('mac os')) {
        return 'Mac';
      } else {
        return 'Windows';
      }
    }
  }













  /*

  /*
  // Define key mappings
  keyMappings = {
    'Windows$KeyF': () => {  },
    'Mac$KeyA': () => { },
    // Define other key mappings...
  };
  */

  


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

    if ((this.eventKeyCodeWithFlag === "^LiveXOrYScaling")) {
      this.drawingEntityManager.liveXOrYScaling();
    }


    if ((this.eventKeyCodeWithFlag === "^BracketLeft")) {
      this.drawingEntityManager.liveShearing();
    }

    if ((this.eventKeyCodeWithFlag === "^BracketRight")) {
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

      //alert('a');
      this.stamp();

    }

    if (keyEvent.key === 'Backspace') {
      this.layerManager.removeAllSelectedItemsAndReset();
    }


    // Escape key for cancelling all
    if (keyEvent.key === 'Escape') {

      //alert(this.layerManager.currentLayerHasSelection());

      this.drawingEntityManager.cancelOperations();
      this.layerManager.cancel();


    }

    if ((this.eventKeyCodeWithFlag === "Digit1")) {
      this.drawingEntityManager.makePaintStyleFill();
    }

    if ((this.eventKeyCodeWithFlag === "Digit1")) {
      this.drawingEntityManager.makePaintStyleStroke();
    }

    /*
    if ((this.eventKeyCodeWithFlag === "Digit1")) {
      this.drawingEntityManager.makePaintFillStroke();
    }
*/





  }

  tempKeyProcessor2(keyEvent) {
    const keyCodeWithFlag = this.eventKeyCodeWithFlag;
    const keyMapEntry = this.keyMappings[keyCodeWithFlag];
  

    if (keyMapEntry) {
      // Update the onscreen key panel (you can implement this part)
      this.updateOnscreenKeyPanel(keyMapEntry);
  
      // Get the corresponding function string from the key map entry
      const functionString = keyMapEntry.defaultFunctionString;
  
      // Execute the function from functionRegistry if it exists
      if (this.functionRegistry[functionString]) {
        this.functionRegistry[functionString]();
      }
    }
  }
  
  updateOnscreenKeyPanel(keyMapEntry) {
    // Implement the logic to update the onscreen key panel here
    // You can use keyMapEntry to access information about the key and its function
  }
  

  keyMappings = {
    'Tab': {
      "defaultText": "Select",
      "defaultFunctionString": "select",
      "defaultDescription": "Select an item",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",

      "selectionStateText": "Tab Selection",

    },
    'KeyA': {
      "defaultText": "End",
      "defaultFunctionString": "end",
      "description": "End current drawing or selection",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",

      "selectionStateText": "Tab Selection",

    },
    'KeyF': {
      "defaultText": "Hard Corner",
      "defaultFunctionString": "hardCorner",
      "defaultDescription": "Perform hard corner action",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Hard Corner Selection",
    },
    'KeyR': {
      "defaultText": "Close Path End",
      "defaultFunctionString": "closePathEnd",
      "defaultDescription": "close live path",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "close live path",
    },

    


    'BracketRight': {

      "defaultText": "Scale Up",
      "defaultFunctionString": "scaleUp",
      "defaultDescription": "Scale up an object",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Scale up selection",

    },
    'BracketLeft': {

      "defaultText": "Scale Down",
      "defaultFunctionString": "scaleDown",
      "defaultDescription": "Scale down an object",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Scale down selection",

    },
    '$BracketLeft': {
      "defaultText": "Scale Down Upper1",
      "defaultFunctionString": "scaleDownUpper1",
      "defaultDescription": "Scale down an object with Shift",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Shift + Bracket Left Selection",

    },
    '~BracketLeft': {
      "defaultText": "Scale Down Lower1",
      "defaultFunctionString": "scaleDownLower1",
      "defaultDescription": "Scale down an object by a smaller amount.",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Tilde + Bracket Left Selection",
    },
    '~BracketRight': {
      "defaultText": "Scale Up Lower1",
      "defaultFunctionString": "scaleUpLower1",
      "defaultDescription": "Scale up an object with Tilde",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Tilde + Bracket Right Selection",

    },
    '^BracketRight': {
      "defaultText": "Live X Or Y Scaling",
      "defaultFunctionString": "liveXOrYScaling",
      "defaultDescription": "Perform live X or Y scaling",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Live X/Y Scaling Selection",
    },
    '^BracketLeft': {
      "defaultText": "Live Shearing",
      "defaultFunctionString": "liveShearing",
      "defaultDescription": "Perform live shearing action",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Live Shearing Selection",
    },
    'Semicolon': {
      "defaultText": "Rotate Counterclockwise",
      "defaultFunctionString": "rotateCounterclockwise",
      "defaultDescription": "Rotate counterclockwise",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Semicolon Selection",
    },
    'Quote': {
      "defaultText": "Rotate Clockwise",
      "defaultFunctionString": "rotateClockwise",
      "defaultDescription": "Rotate clockwise",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Quote Selection",
    },
    '$Semicolon': {
      "defaultText": "Rotate Counterclockwise Upper1",
      "defaultFunctionString": "rotateCounterclockwiseUpper1",
      "defaultDescription": "Rotate counterclockwise with Shift",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Shift + Semicolon Selection",
    },
    '$Quote': {
      "defaultText": "Rotate Clockwise Upper1",
      "defaultFunctionString": "rotateClockwiseUpper1",
      "defaultDescription": "Rotate clockwise with Shift",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Shift + Quote Selection",
    },
    '~Semicolon': {
      "defaultText": "Rotate Counterclockwise Lower1",
      "defaultFunctionString": "rotateCounterclockwiseLower1",
      "defaultDescription": "Rotate counterclockwise by a smaller amount.",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Tilde + Semicolon Selection",
    },
    '~Quote': {
      "defaultText": "Rotate Clockwise Lower1",
      "defaultFunctionString": "rotateClockwiseLower1",
      "defaultDescription": "Rotate clockwise by a smaller amount.",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Tilde + Quote Selection",
    },
    '^~Semicolon': {
      "defaultText": "Rotate Counterclockwise Lower2",
      "defaultFunctionString": "rotateCounterclockwiseLower2",
      "defaultDescription": "Rotate counterclockwise by a smaller amount with Ctrl+Shift",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Ctrl+Shift + Semicolon Selection",
    },
    '^~Quote': {
      "defaultText": "Rotate Clockwise Lower2",
      "defaultFunctionString": "rotateClockwiseLower2",
      "defaultDescription": "Rotate clockwise by a smaller amount with Ctrl+Shift",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Ctrl+Shift + Quote Selection",
    },
    'Space': {
      "defaultText": "Cart",
      "defaultFunctionString": "cart",
      "description": "Perform cart action",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Space Selection"
    },
    'KeyW': {
      "defaultText": "Stamp",
      "defaultFunctionString": "stamp",
      "defaultDescription": "Perform stamp action",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "KeyW Selection"
    },
    'Backspace': {
      "defaultText": "Remove All Selected",
      "defaultFunctionString": "removeAllSelectedItemsAndReset",
      "defaultDescription": "Remove all selected items and reset",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Backspace Selection"
    },
    'Escape': {
      "defaultText": "Cancel",
      "defaultFunctionString": "cancelOperations",
      "description": "Cancel operations",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Escape Selection"
    },
    'Digit1': {
      "defaultText": "Make Paint Style Fill",
      "defaultFunctionString": "makePaintStyleFill",
      "description": "Make paint style fill",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Digit1 Selection"
    },

  };


  functionRegistry = {
    select: () => {
      this.select();
    },
    hardCorner: () => {
      this.drawingEntityManager.hardCorner();
    },
    scaleDown: () => {
      this.drawingEntityManager.scaleDown();
    },
    scaleUp: () => {
      this.drawingEntityManager.scaleUp();
    },
    scaleDownUpper1: () => {
      this.drawingEntityManager.scaleDownUpper1();
    },
    scaleUpUpper1: () => {
      this.drawingEntityManager.scaleUpUpper1();
    },
    scaleDownLower1: () => {
      this.drawingEntityManager.scaleDownLower1();
    },
    scaleUpLower1: () => {
      this.drawingEntityManager.scaleUpLower1();
    },
    scaleDownLower2: () => {
      this.drawingEntityManager.scaleDownLower2();
    },
    liveXOrYScaling: () => {
      this.drawingEntityManager.liveXOrYScaling();
    },
    liveShearing: () => {
      this.drawingEntityManager.liveShearing();
    },
    rotateCounterclockwise: () => {
      this.drawingEntityManager.rotateCounterclockwise();
    },
    rotateClockwise: () => {
      this.drawingEntityManager.rotateClockwise();
    },
    rotateCounterclockwiseUpper1: () => {
      this.drawingEntityManager.rotateCounterclockwiseUpper1();
    },
    rotateClockwiseUpper1: () => {
      this.drawingEntityManager.rotateClockwiseUpper1();
    },
    rotateCounterclockwiseLower1: () => {
      this.drawingEntityManager.rotateCounterclockwiseLower1();
    },
    rotateClockwiseLower1: () => {
      this.drawingEntityManager.rotateClockwiseLower1();
    },
    rotateCounterclockwiseLower2: () => {
      this.drawingEntityManager.rotateCounterclockwiseLower2();
    },
    cart: () => {
      this.cart();
    },
    stamp: () => {
      this.stamp();
    },
    removeAllSelectedItemsAndReset: () => {
      this.layerManager.removeAllSelectedItemsAndReset();
    },
    cancelOperations: () => {
      this.drawingEntityManager.cancelOperations();
      this.layerManager.cancel();
    },
    makePaintStyleFill: () => {
      this.drawingEntityManager.makePaintStyleFill();
    },
    makePaintStyleStroke: () => {
      this.drawingEntityManager.makePaintStyleStroke();
    },
    end: () => {
      this.drawingEntityManager.end();
    },
    closePathEnd: () => {
      this.drawingEntityManager.closePathAndEnd();
    },



    closePathAndEnd: () => {
      this.drawingEntityManager.closePathAndEnd();
    }
    // ... Other functions can be added here in a similar manner
  };
  


}





export default KeyboardMappingManager;