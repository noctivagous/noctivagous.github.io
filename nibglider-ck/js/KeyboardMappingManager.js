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
    this.eventManager = app.eventManager;
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

    var flags = this.keyEventFlags(keyEvent);

    this.eventKeyCodeWithFlag = keyEvent.code;

    if (flags != null) {
      this.eventKeyCodeWithFlag = flags + keyEvent.code;
    }

    // using the keyMap dictionary,
    this.keyProcessor(keyEvent);

    /*

    ------
    NOTES 
    
    Larger Area Selection Key
    The ` key (~) can act as the broader selection hit key, above Tab.  
    It can hit with a tolerance of 15px, for hitting lines.

    Panning Drag-Lock
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

 
  keyProcessor(keyEvent) {
    
    const operatingSys = this.app.operatingSystem;

    const keyCodeWithFlag = this.eventKeyCodeWithFlag;
    const keyCodeWithFlagWithOS = operatingSys + this.eventKeyCodeWithFlag;
    const keyMapEntry = this.keyMappings[keyCodeWithFlag] || this.keyMappings[keyCodeWithFlagWithOS];
  

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

    'KeyC': {
      "defaultText": "Thin Stroke",
      "defaultFunctionString": "thinStroke",
      "defaultDescription": "thin stroke",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "thin stroke",
    },

    'KeyV': {
      "defaultText": "Thicken Stroke",
      "defaultFunctionString": "thickenStroke",
      "defaultDescription": "thicken stroke",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "thicken stroke",
    },


    'Mac@KeyC': {
      "defaultText": "Copy Selected",
      "defaultFunctionString": "copy",
      "defaultDescription": "copy selected obj",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "copy selected obj",
    },
    
    'PC^KeyC': {
      "defaultText": "Copy Selected",
      "defaultFunctionString": "copy",
      "defaultDescription": "copy selected obj",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "copy selected obj",
    },

    '^KeyF': {
      "defaultText": "Bring Selection to Front",
      "defaultFunctionString": "bringSelectionToFront",
      "defaultDescription": "Bring selected objects to the front",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Bring selected objects to the front",
    },
    '^KeyB': {
      "defaultText": "Send Selection to Back",
      "defaultFunctionString": "sendSelectionToBack",
      "defaultDescription": "Send selected objects to the back",
      "defaultButtonBackgroundColor": "0,148,17",
      "defaultFontColor": "64,255,64",
      "selectionStateText": "Send selected objects to the back",
    },
    '^KeyUp': {
      "defaultText": "Bring Selection Forward",
      "defaultFunctionString": "bringSelectionForward",
      "defaultDescription": "Bring selected objects forward by one step",
      "defaultButtonBackgroundColor": "17,0,148",
      "defaultFontColor": "64,64,255",
      "selectionStateText": "Bring selected objects forward by one step",
    },
    '^KeyDown': {
      "defaultText": "Send Selection Backward",
      "defaultFunctionString": "sendSelectionBackward",
      "defaultDescription": "Send selected objects backward by one step",
      "defaultButtonBackgroundColor": "148,148,148",
      "defaultFontColor": "0,0,0",
      "selectionStateText": "Send selected objects backward by one step",
    },

    



    'Mac@KeyV': {
      "defaultText": "Paste",
      "defaultFunctionString": "paste",
      "defaultDescription": "paste",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "paste",
    },
    
    'PC^KeyV': {
      "defaultText": "Paste",
      "defaultFunctionString": "paste",
      "defaultDescription": "paste",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "paste",
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
    '$BracketRight': {
      "defaultText": "Scale Up Upper1",
      "defaultFunctionString": "scaleUpUpper1",
      "defaultDescription": "Scale up an object with Shift",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Shift + Bracket Right Selection",

    },
    '$^BracketLeft': {
      "defaultText": "Scale Down Upper2",
      "defaultFunctionString": "scaleDownUpper2",
      "defaultDescription": "Scale down an object with Shift",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Shift + Bracket Left Selection",

    },
    '$^BracketRight': {
      "defaultText": "Scale Up Upper2",
      "defaultFunctionString": "scaleUpUpper2",
      "defaultDescription": "Scale up an object with Shift",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Shift + Bracket Right Selection",

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
    '^~BracketLeft': {
      "defaultText": "Scale Down Lower2",
      "defaultFunctionString": "scaleDownLower2",
      "defaultDescription": "Scale down an object ",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Scale Down Lower2",
    },
    '^~BracketRight': {
      "defaultText": "Scale Up Lower2",
      "defaultFunctionString": "scaleUpLower2",
      "defaultDescription": "Scale up an object ",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Scale up Lower2",
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

    '$^Semicolon': {
      "defaultText": "Rotate Counterclockwise Upper2",
      "defaultFunctionString": "rotateCounterclockwiseUpper2",
      "defaultDescription": "Rotate counterclockwise with Shift",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Shift + Semicolon Selection",
    },
    '$^Quote': {
      "defaultText": "Rotate Clockwise Upper2",
      "defaultFunctionString": "rotateClockwiseUpper2",
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
      "defaultDescription": "Rotate counterclockwise by a smaller amount with Ctrl+Alt",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Ctrl+Shift + Semicolon Selection",
    },
    '^~Quote': {
      "defaultText": "Rotate Clockwise Lower2",
      "defaultFunctionString": "rotateClockwiseLower2",
      "defaultDescription": "Rotate clockwise by a smaller amount with Ctrl+Alt",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Ctrl+Shift + Quote Selection",
    },
    'ArrowUp': {
      "defaultText": "Arrow Up",
      "defaultFunctionString": "arrowUp",
      "defaultDescription": "Perform Arrow Up action",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Arrow Up Selection"
    },
    'ArrowDown': {
      "defaultText": "Arrow Down",
      "defaultFunctionString": "arrowDown",
      "defaultDescription": "Perform Arrow Down action",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Arrow Down Selection"
    },
    'ArrowLeft': {
      "defaultText": "Arrow Left",
      "defaultFunctionString": "arrowLeft",
      "defaultDescription": "Perform Arrow Left action",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Arrow Left Selection"
    },
    'ArrowRight': {
      "defaultText": "Arrow Right",
      "defaultFunctionString": "arrowRight",
      "defaultDescription": "Perform Arrow Right action",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Arrow Right Selection"
    },
  
    '$ArrowUp': {
      "defaultText": "Shift + Arrow Up",
      "defaultFunctionString": "arrowUpUpper1",
      "defaultDescription": "Perform Shift + Arrow Up action",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Shift + Arrow Up Selection"
    },
    '$ArrowDown': {
      "defaultText": "Shift + Arrow Down",
      "defaultFunctionString": "arrowDownUpper1",
      "defaultDescription": "Perform Shift + Arrow Down action",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Shift + Arrow Down Selection"
    },
    '$ArrowLeft': {
      "defaultText": "Shift + Arrow Left",
      "defaultFunctionString": "arrowLeftUpper1",
      "defaultDescription": "Perform Shift + Arrow Left action",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Shift + Arrow Left Selection"
    },
    '$ArrowRight': {
      "defaultText": "Shift + Arrow Right",
      "defaultFunctionString": "arrowRightUpper1",
      "defaultDescription": "Perform Shift + Arrow Right action",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Shift + Arrow Right Selection"
    },
  
    '$^ArrowUp': {
      "defaultText": "Shift + Arrow Up",
      "defaultFunctionString": "arrowUpUpper2",
      "defaultDescription": "Perform Shift + Arrow Up action",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Shift + Arrow Up Selection"
    },
    '$^ArrowDown': {
      "defaultText": "Shift + Arrow Down",
      "defaultFunctionString": "arrowDownUpper2",
      "defaultDescription": "Perform Shift + Arrow Down action",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Shift + Arrow Down Selection"
    },
    '$^ArrowLeft': {
      "defaultText": "Shift + Arrow Left",
      "defaultFunctionString": "arrowLeftUpper2",
      "defaultDescription": "Perform Shift + Arrow Left action",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Shift + Arrow Left Selection"
    },
    '$^ArrowRight': {
      "defaultText": "Shift + Arrow Right",
      "defaultFunctionString": "arrowRightUpper2",
      "defaultDescription": "Perform Shift + Arrow Right action",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Shift + Arrow Right Selection"
    },


    '~ArrowUp': {
      "defaultText": "Arrow Up Lower",
      "defaultFunctionString": "arrowUpLower1",
      "defaultDescription": "Perform Option + Arrow Up action",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Option + Arrow Up Selection"
    },
    '~ArrowDown': {
      "defaultText": "Option + Arrow Down",
      "defaultFunctionString": "arrowDownLower1",
      "defaultDescription": "Perform Option + Arrow Down action",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Option + Arrow Down Selection"
    },
    '~ArrowLeft': {
      "defaultText": "Option + Arrow Left",
      "defaultFunctionString": "arrowLeftLower1",
      "defaultDescription": "Perform Option + Arrow Left action",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Option + Arrow Left Selection"
    },
    '~ArrowRight': {
      "defaultText": "Option + Arrow Right",
      "defaultFunctionString": "arrowRightLower1",
      "defaultDescription": "Perform Option + Arrow Right action",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Option + Arrow Right Selection"
    },


    '^~ArrowUp': {
      "defaultText": "Arrow Up Lower",
      "defaultFunctionString": "arrowUpLower2",
      "defaultDescription": "Perform Option + Arrow Up action",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Option + Arrow Up Selection"
    },
    '^~ArrowDown': {
      "defaultText": "Option + Arrow Down",
      "defaultFunctionString": "arrowDownLower2",
      "defaultDescription": "Perform Option + Arrow Down action",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Option + Arrow Down Selection"
    },
    '^~ArrowLeft': {
      "defaultText": "Option + Arrow Left",
      "defaultFunctionString": "arrowLeftLower2",
      "defaultDescription": "Perform Option + Arrow Left action",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Option + Arrow Left Selection"
    },
    '^~ArrowRight': {
      "defaultText": "Option + Arrow Right",
      "defaultFunctionString": "arrowRightLower2",
      "defaultDescription": "Perform Option + Arrow Right action",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Option + Arrow Right Selection"
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


  // Note: functionRegistry
  // provides foundation for
  // scripting commands, e.g.
  // MOVE-RIGHT-72PT
  // ROTATE-ATCENTER-45DEG
  // ROTATE-ATBOTTOMLEFT-45DEG
  // passing vars into the current
  // context


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
    scaleDownUpper2: () => {
      this.drawingEntityManager.scaleDownUpper2();
    },
    scaleUpUpper2: () => {
      this.drawingEntityManager.scaleUpUpper2();
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
    scaleUpLower2: () => {
      this.drawingEntityManager.scaleUpLower2();
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
    rotateCounterclockwiseUpper2: () => {
      this.drawingEntityManager.rotateCounterclockwiseUpper2();
    },
    rotateClockwiseUpper2: () => {
      this.drawingEntityManager.rotateClockwiseUpper2();
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
    rotateClockwiseLower2: () => {
      this.drawingEntityManager.rotateClockwiseLower2();
    },

    thinStroke: () => {
      this.drawingEntityManager.thinStroke();
    },

    thickenStroke: () => {
      this.drawingEntityManager.thickenStroke();
    },
    
    copy: () => {
      this.eventManager.copy();
    },
    paste: () => {
      this.eventManager.paste();
     },

    bringSelectionToFront: () => {
      // Call the function to bring selected objects to the front
      this.drawingEntityManager.bringSelectionToFront();
    },
  
    sendSelectionToBack: () => {
      // Call the function to send selected objects to the back
      this.drawingEntityManager.sendSelectionToBack();
    },
  
    bringSelectionForward: () => {
      // Call the function to bring selected objects forward by one step
      this.drawingEntityManager.bringSelectionForward();
    },
  
    sendSelectionBackward: () => {
      // Call the function to send selected objects backward by one step
      this.drawingEntityManager.sendSelectionBackward();
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
    'arrowUp': () => {
      this.drawingEntityManager.arrowUp();
    },
    'arrowDown': () => {
      this.drawingEntityManager.arrowDown();
    },
    'arrowLeft': () => {
      this.drawingEntityManager.arrowLeft();
    },
    'arrowRight': () => {
      this.drawingEntityManager.arrowRight();
    },
    'arrowUpUpper1': () => {
      this.drawingEntityManager.arrowUpUpper1();
    },
    'arrowDownUpper1': () => {
      this.drawingEntityManager.arrowDownUpper1();
    },
    'arrowLeftUpper1': () => {
      this.drawingEntityManager.arrowLeftUpper1();
    },
    'arrowRightUpper1': () => {
      this.drawingEntityManager.arrowRightUpper1();
    },
    'arrowUpLower1': () => {
      this.drawingEntityManager.arrowUpLower1();
    },
    'arrowDownLower1': () => {
      this.drawingEntityManager.arrowDownLower1();
    },
    'arrowLeftLower1': () => {
      this.drawingEntityManager.arrowLeftLower1();
    },
    'arrowRightLower1': () => {
      this.drawingEntityManager.arrowRightLower1();
    },
    'arrowUpUpper2': () => {
      this.drawingEntityManager.arrowUpUpper2();
    },
    'arrowDownUpper2': () => {
      this.drawingEntityManager.arrowDownUpper2();
    },
    'arrowLeftUpper2': () => {
      this.drawingEntityManager.arrowLeftUpper2();
    },
    'arrowRightUpper2': () => {
      this.drawingEntityManager.arrowRightUpper2();
    },
    'arrowUpLower2': () => {
      this.drawingEntityManager.arrowUpLower2();
    },
    'arrowDownLower2': () => {
      this.drawingEntityManager.arrowDownLower2();
    },
    'arrowLeftLower2': () => {
      this.drawingEntityManager.arrowLeftLower2();
    },
    'arrowRightLower2': () => {
      this.drawingEntityManager.arrowRightLower2();
    },

    closePathAndEnd: () => {
      this.drawingEntityManager.closePathAndEnd();
    }
    // ... Other functions can be added here in a similar manner
  };
  


}





export default KeyboardMappingManager;