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

    this.flags = null
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
  handleKeyUp(keyEvent) {


    var elementLookup = document.getElementById(keyEvent.code)
    if (elementLookup != null) {
      elementLookup.classList.remove('active');
    }

    var flags = this.keyEventFlags(keyEvent);

    this.loadKeyboardKeysAccordingToFlags(keyEvent, flags);

  }

  // sent from EventManager
  handleKeyPress(keyEvent) {

    var flags = this.keyEventFlags(keyEvent);

    this.flags = this.keyEventFlags(keyEvent);

    this.eventKeyCodeWithFlag = keyEvent.code;

    if (flags != null) {
      this.eventKeyCodeWithFlag = flags + keyEvent.code;
    }

    // update the keyboardpanel
    this.loadKeyboardKeysAccordingToFlags(keyEvent, flags);


    var buttonLookup = document.getElementById(keyEvent.code)

    // highlight the key with active state
    // if it is non-alphanumeric.
    if ((buttonLookup != null) && (keyEvent.metaKey == false)) {

      // adds the overlay that is provided
      // by the data attribute.
      buttonLookup.classList.add('active');
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

  toggleKeyboardPanel() {

    const keyboardPanel = document.getElementById('keyboardPanel');

    if (keyboardPanel) {
      if (keyboardPanel.classList.contains('slide-down')) {
        // Faster transition for sliding up
        keyboardPanel.style.transition = 'bottom 0.2s'; // Quicker transition
        keyboardPanel.classList.remove('slide-down');
        keyboardPanel.classList.add('slide-up');
      } else {
        // Slower transition for sliding down
        keyboardPanel.style.transition = 'bottom 0.3s'; // Slower transition
        keyboardPanel.classList.remove('slide-up');
        keyboardPanel.classList.add('slide-down');
      }
    }

    /*
    if (keyboardPanel) {
      
      if (keyboardPanel.classList.contains('slide-down')) {
        keyboardPanel.classList.remove('slide-down');
        keyboardPanel.classList.add('slide-up');
      } else {
        console.log('1');
        keyboardPanel.classList.remove('slide-up');
        keyboardPanel.classList.add('slide-down');
      }
    }
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

    this.flags = this.keyEventFlags(keyEvent);

    const operatingSys = this.app.operatingSystem;

    const keyCodeWithFlag = this.eventKeyCodeWithFlag;
    const keyCodeWithFlagWithOS = operatingSys + this.eventKeyCodeWithFlag;
    const keyMapEntry = this.keyMappings[keyCodeWithFlag] || this.keyMappings[keyCodeWithFlagWithOS];


    if (keyMapEntry) {
      // Update the onscreen key panel (you can implement this part)
      // this.updateOnscreenKeyPanel(keyMapEntry);




      // Get the corresponding function string from the key map entry
      const functionString = keyMapEntry.defaultFunctionString;

      // Execute the function from functionRegistry if it exists
      if (this.functionRegistry[functionString]) {
        this.functionRegistry[functionString]();
      }
    }


  }




  loadKeyboardKeysAccordingToFlags(keyEvent, flags) {
    // Query all key buttons
    const keyButtons = document.querySelectorAll('.keyboardkey');



    keyButtons.forEach(button => {
      // Derive key code from the button id or another attribute
      let keyCode = button.id; // Adjust this based on your actual button id format

      // Append current flags to the key code
      const keyIdentifier = flags + keyCode;
      const os = this.operatingSys;

      // Get the keyMapping for this identifier or fall back to default if not present
      const keyMapping = this.keyMappings[os + keyIdentifier] || this.keyMappings[keyIdentifier] || this.keyMappings[keyCode];



      if (keyMapping) {
        // Update the button's style and text
        this.updateButtonStyle(button, keyMapping);

      }
    });
  
    this.insertMiniLetterSquaresIntoKeys(keyButtons);


  }

  

  insertMiniLetterSquaresIntoKeys(keyButtons) {
    keyButtons.forEach(button => {

        // Check if the button already has a mini key letter square
      
        if (!button.querySelector('.minikeylettersquare')) {
            // Create a square div
            let square = document.createElement('div');
            square.classList.add('minikeylettersquare'); // Add class to the square

            // Get the dimensions of the button
            let buttonWidth = button.offsetWidth;
            let buttonHeight = button.offsetHeight;

            // Set the size and style of the square
            square.style.width = `${buttonWidth / 4.2}px`;
            square.style.height = `${buttonHeight / 4.2}px`;
            square.style.position = 'absolute';
            square.style.bottom = '0';   // Align to bottom
            square.style.right = '0';    // Align to right
            square.style.backgroundColor = 'rgba(200, 200, 200, 0.0)'; // Semi-transparent grey
            square.style.display = 'flex';
            square.style.textTransform = 'uppercase';
            square.style.alignItems = 'center';
            square.style.color = 'rgba(255, 255, 255, 0.8)';
            square.style.justifyContent = 'center';
            square.style.zIndex = '100';
            square.style.fontSize = '90%';
            square.style.textShadow = '0 0 3px #ccc';  // White text shadow
            square.style.fontWeight = 'bold';
            square.style.fontStyle = 'italic';
            square.style.fontFamily = 'DraughtsmanARegular';
            square.style.marginRight = '1pt';

            // Extract the character from the keyToChar mapping
            let char = this.keyToChar[button.id] || ''; // Fallback to empty string if no match

            // Set the text inside the square
            square.textContent = char;

            // Append the square to the button
            button.style.position = 'relative'; // Ensure the button can act as a container
            button.appendChild(square);
        }
    });
}



  updateButtonStyle(button, keyMapping) {
    if (button) {



      button.style.backgroundColor = `rgb(${keyMapping.defaultButtonBackgroundColor})`;
      button.style.color = `rgb(${keyMapping.defaultFontColor})`;
      button.innerHTML = keyMapping.defaultText;

    }
  }

  /*
   activateFunction(functionName) {
    // Assuming you have functions defined elsewhere that match the function names in keyMappings
    if (typeof window[functionName] === 'function') {
      window[functionName](); // Call the function
    }
  }
  */



  updateOnscreenKeyPanel(keyMapEntry) {
    // Implement the logic to update the onscreen key panel here
    // You can use keyMapEntry to access information about the key and its function
  }


  keyMappings = {
    'Tab': {
      "defaultText": "Select Objects",
      "defaultFunctionString": "select",
      "defaultDescription": "Select an item",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",

      "selectionStateText": "Tab Selection",

    },
    'Backslash': {
      "defaultText": "Hide/Show Keyboard",
      "defaultFunctionString": "toggleKeyboardPanel",
      "defaultDescription": "Slides the keyboard off and on screen",
      "defaultButtonBackgroundColor": "0,0,0",
      "defaultFontColor": "155,155,155",

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
    'KeyL': {
      "defaultText": "Lasso",
      "defaultFunctionString": "hardCorner",
      "defaultDescription": "Perform hard corner action",
      "defaultButtonBackgroundColor": "100,100,100",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Hard Corner Selection",
    },

    'CapsLock': {
      "defaultText": "Colorpicker Keyboard Mode",
      "defaultFunctionString": "hardCorner",
      "defaultDescription": "Perform hard corner action",
      "defaultButtonBackgroundColor": "100,100,100",
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
      "defaultText": "Stroke Width -1",
      "defaultFunctionString": "thinStroke",
      "defaultDescription": "thin stroke",
      "defaultButtonBackgroundColor": "0,0,0",
      "defaultFontColor": "120,120,120",
      "selectionStateText": "thin stroke",
    },
    '~KeyC': {
      "defaultText": "Stroke Width -0.5",
      "defaultFunctionString": "thinStroke",
      "defaultDescription": "thin stroke",
      "defaultButtonBackgroundColor": "0,0,0",
      "defaultFontColor": "120,120,120",
      "selectionStateText": "thin stroke",
    },


    '$KeyC': {
      "defaultText": "Stroke Width -5",
      "defaultFunctionString": "thinStrokeUpper1",
      "defaultDescription": "thin stroke",
      "defaultButtonBackgroundColor": "0,0,0",
      "defaultFontColor": "120,120,120",
      "selectionStateText": "thin stroke",
    },
    '$^KeyC': {
      "defaultText": "Stroke Width -10",
      "defaultFunctionString": "thinStrokeUpper2",
      "defaultDescription": "thin stroke",
      "defaultButtonBackgroundColor": "0,0,0",
      "defaultFontColor": "120,120,120",
      "selectionStateText": "thin stroke",
    },

    'KeyV': {
      "defaultText": "Stroke Width +1",
      "defaultFunctionString": "thickenStroke",
      "defaultDescription": "thicken stroke",
      "defaultButtonBackgroundColor": "10,10,10",
      "defaultFontColor": "120,120,120",
      "selectionStateText": "thicken stroke",
    },
    '~KeyV': {
      "defaultText": "Stroke Width +0.5",
      "defaultFunctionString": "thickenStroke",
      "defaultDescription": "thicken stroke",
      "defaultButtonBackgroundColor": "0,0,0",
      "defaultFontColor": "120,120,120",
      "selectionStateText": "thin stroke",
    },
    '$KeyV': {
      "defaultText": "Stroke Width +5",
      "defaultFunctionString": "thinStrokeUpper1",
      "defaultDescription": "thicken stroke",
      "defaultButtonBackgroundColor": "0,0,0",
      "defaultFontColor": "120,120,120",
      "selectionStateText": "thin stroke",
    },
    '$^KeyV': {
      "defaultText": "Stroke Width +10",
      "defaultFunctionString": "thickenStrokeUpper",
      "defaultDescription": "thicken stroke",
      "defaultButtonBackgroundColor": "0,0,0",
      "defaultFontColor": "120,120,120",
      "selectionStateText": "thin stroke",
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
    'KeyZ': {
      "defaultText": "Arc By Three Points",
      "defaultFunctionString": "arcByThreePoints",
      "defaultDescription": "Make an arc from three points",
      "defaultButtonBackgroundColor": "0,148,17",
      "defaultFontColor": "64,255,64",

    },
    'KeyD': {
      "defaultText": "Round Corner",
      "defaultFunctionString": "roundCorner",
      "defaultDescription": "Make roundCorner point",
      "defaultButtonBackgroundColor": "0,148,17",
      "defaultFontColor": "64,255,64",
      "selectionStateText": "",
    },
    'KeyE': {
      "defaultText": "BSpline",
      "defaultFunctionString": "bspline",
      "defaultDescription": "Make bspline point",
      "defaultButtonBackgroundColor": "0,148,17",
      "defaultFontColor": "64,255,64",

    },
    'KeyN': {
      "defaultText": "Nozzle Subtract",
      "defaultFunctionString": "nozzleSubtract",
      "defaultDescription": "Subtract",
      "defaultButtonBackgroundColor": "0,148,17",
      "defaultFontColor": "64,255,64",

    },
    'KeyM': {
      "defaultText": "Nozzle Add",
      "defaultFunctionString": "nozzleAdd",
      "defaultDescription": "Activate nozzle and add (e.g. particles)",
      "defaultButtonBackgroundColor": "0,148,17",
      "defaultFontColor": "64,255,64",

    },
    '^KeyB': {
      "defaultText": "Send Selection to Back",
      "defaultFunctionString": "sendSelectionToBack",
      "defaultDescription": "Send selected objects to the back",
      "defaultButtonBackgroundColor": "0,148,17",
      "defaultFontColor": "64,255,64",
      "selectionStateText": "Send selected objects to the back",
    },
    '^ArrowUp': {
      "defaultText": "Bring Selection Forward",
      "defaultFunctionString": "bringSelectionForward",
      "defaultDescription": "Bring selected objects forward by one step",
      "defaultButtonBackgroundColor": "17,0,148",
      "defaultFontColor": "64,64,255",
      "selectionStateText": "Bring selected objects forward by one step",
    },
    '^ArrowDown': {
      "defaultText": "Send Selection Backward",
      "defaultFunctionString": "sendSelectionBackward",
      "defaultDescription": "Send selected objects backward by one step",
      "defaultButtonBackgroundColor": "148,148,148",
      "defaultFontColor": "0,0,0",
      "selectionStateText": "Send selected objects backward by one step",
    },


    'KeyB': {
      "defaultText": "Bowed Line <br/> &#10226;",
      "defaultFunctionString": "bowedLineCClockwise",
      "defaultDescription": "bowed line c",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",

    },

    'KeyG': {
      "defaultText": "Bowed Line <br/>&#10227;",
      "defaultFunctionString": "bowedLineCClockwise",
      "defaultDescription": "bowed line c",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",

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

      "defaultText": "Scale Up <br/>10%",
      "defaultFunctionString": "scaleUp",
      "defaultDescription": "Scale up an object",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Scale up selection",

    },
    'BracketLeft': {

      "defaultText": "Scale Down <br/>10%",
      "defaultFunctionString": "scaleDown",
      "defaultDescription": "Scale down an object",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Scale down selection",

    },
    '$BracketLeft': {
      "defaultText": "Scale Down 30%",
      "defaultFunctionString": "scaleDownUpper1",
      "defaultDescription": "Scale down an object with Shift",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Shift + Bracket Left Selection",

    },
    '$BracketRight': {
      "defaultText": "Scale Up 30%",
      "defaultFunctionString": "scaleUpUpper1",
      "defaultDescription": "Scale up an object with Shift",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Shift + Bracket Right Selection",

    },
    '$^BracketLeft': {
      "defaultText": "Scale Down 40%",
      "defaultFunctionString": "scaleDownUpper2",
      "defaultDescription": "Scale down an object with Shift",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Shift + Bracket Left Selection",

    },
    '$^BracketRight': {
      "defaultText": "Scale Up 40%",
      "defaultFunctionString": "scaleUpUpper2",
      "defaultDescription": "Scale up an object with Shift",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Shift + Bracket Right Selection",

    },
    '~BracketLeft': {
      "defaultText": "Scale Down <br/>5%",
      "defaultFunctionString": "scaleDownLower1",
      "defaultDescription": "Scale down an object by a smaller amount.",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Tilde + Bracket Left Selection",
    },
    '~BracketRight': {
      "defaultText": "Scale Up <br/>5%",
      "defaultFunctionString": "scaleUpLower1",
      "defaultDescription": "Scale up an object with Tilde",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Tilde + Bracket Right Selection",

    },
    '^BracketRight': {
      "defaultText": "Live Scaling",
      "defaultFunctionString": "liveScaling",
      "defaultDescription": "Perform live X or Y scaling",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Live X/Y Scaling Selection",
    },
    '$~BracketRight': {
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
      "defaultText": "Scale Down <br/>1.5%",
      "defaultFunctionString": "scaleDownLower2",
      "defaultDescription": "Scale down an object ",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Scale Down Lower2",
    },
    '^~BracketRight': {
      "defaultText": "Scale Up <br/>1.5%",
      "defaultFunctionString": "scaleUpLower2",
      "defaultDescription": "Scale up an object ",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Scale up Lower2",
    },
    'Semicolon': {
      "defaultText": "Rotate -15°",
      "defaultFunctionString": "rotateCounterclockwise",
      "defaultDescription": "Rotate counterclockwise",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Semicolon Selection",
    },
    'Quote': {
      "defaultText": "Rotate  <br/>15°",
      "defaultFunctionString": "rotateClockwise",
      "defaultDescription": "Rotate clockwise",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Quote Selection",
    },
    '$Semicolon': {
      "defaultText": "Rotate <br/>-45°",
      "defaultFunctionString": "rotateCounterclockwiseUpper1",
      "defaultDescription": "Rotate counterclockwise with Shift",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Shift + Semicolon Selection",
    },
    '$Quote': {
      "defaultText": "Rotate 45°",
      "defaultFunctionString": "rotateClockwiseUpper1",
      "defaultDescription": "Rotate clockwise with Shift",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Shift + Quote Selection",
    },

    '$^Semicolon': {
      "defaultText": "Rotate -90°",
      "defaultFunctionString": "rotateCounterclockwiseUpper2",
      "defaultDescription": "Rotate counterclockwise with Shift",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Shift + Semicolon Selection",
    },
    '$^Quote': {
      "defaultText": "Rotate 90°",
      "defaultFunctionString": "rotateClockwiseUpper2",
      "defaultDescription": "Rotate clockwise with Shift",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Shift + Quote Selection",
    },

    '~Semicolon': {
      "defaultText": "Rotate -5°",
      "defaultFunctionString": "rotateCounterclockwiseLower1",
      "defaultDescription": "Rotate counterclockwise by a smaller amount.",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Tilde + Semicolon Selection",
    },
    '~Quote': {
      "defaultText": "Rotate 5°",
      "defaultFunctionString": "rotateClockwiseLower1",
      "defaultDescription": "Rotate clockwise by a smaller amount.",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Tilde + Quote Selection",
    },
    '^~Semicolon': {
      "defaultText": "Rotate -1°",
      "defaultFunctionString": "rotateCounterclockwiseLower2",
      "defaultDescription": "Rotate counterclockwise by a smaller amount with Ctrl+Alt",
      "defaultButtonBackgroundColor": "148,17,0",
      "defaultFontColor": "255,64,255",
      "selectionStateText": "Ctrl+Shift + Semicolon Selection",
    },
    '^~Quote': {
      "defaultText": "Rotate 1°",
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
      "defaultText": "Drag Lock",
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
    toggleKeyboardPanel: () => {
      this.toggleKeyboardPanel();
    },
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
    liveScaling: () => {
      this.drawingEntityManager.liveScaling();
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
      this.drawingEntityManager.thinStroke(2);
    },

    thickenStroke: () => {
      this.drawingEntityManager.thickenStroke(2);
    },

    thinStrokeUpper1: () => {
      this.drawingEntityManager.thinStroke(5);
    },

    thickenStrokeUpper1: () => {
      this.drawingEntityManager.thickenStroke(5);
    },

    thinStrokeUpper2: () => {
      this.drawingEntityManager.thinStroke(15);
    },

    thickenStrokeUpper2: () => {
      this.drawingEntityManager.thickenStroke(15);
    },

    thinStrokeLower1: () => {
      this.drawingEntityManager.thinStroke(2);
    },

    thickenStrokeLower1: () => {
      this.drawingEntityManager.thickenStroke(2);
    },

    thinStrokeLower2: () => {
      this.drawingEntityManager.thinStroke(1);
    },

    thickenStrokeLower2: () => {
      this.drawingEntityManager.thickenStroke(1);
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


   keyToChar = {
    KeyA: 'a',
    KeyB: 'b',
    KeyC: 'c',
    KeyD: 'd',
    KeyE: 'e',
    KeyF: 'f',
    KeyG: 'g',
    KeyH: 'h',
    KeyI: 'i',
    KeyJ: 'j',
    KeyK: 'k',
    KeyL: 'l',
    KeyM: 'm',
    KeyN: 'n',
    KeyO: 'o',
    KeyP: 'p',
    KeyQ: 'q',
    KeyR: 'r',
    KeyS: 's',
    KeyT: 't',
    KeyU: 'u',
    KeyV: 'v',
    KeyW: 'w',
    KeyX: 'x',
    KeyY: 'y',
    KeyZ: 'z',
    Digit0: '0',
    Digit1: '1',
    Digit2: '2',
    Digit3: '3',
    Digit4: '4',
    Digit5: '5',
    Digit6: '6',
    Digit7: '7',
    Digit8: '8',
    Digit9: '9',
    F1: 'F1',
    F2: 'F2',
    F3: 'F3',
    F4: 'F4',
    F5: 'F5',
    F6: 'F6',
    F7: 'F7',
    F8: 'F8',
    F9: 'F9',
    F10: 'F10',
    F11: 'F11',
    F12: 'F12',
    Enter: 'Return',
    Space: 'Spacebar',
    BracketLeft: '[',
    BracketRight: ']',
    Semicolon: ';',
    Backslash: '\\',
    Comma: ',',
    Period: '.',
    Slash: '/',
    Tab: 'Tab',
    ShiftLeft: 'Shift',
    ShiftRight: 'Shift',
    CapsLock: 'CapsLock',

    Quote: "'",
    // Add more keys and their values as needed
  };
  
  


}





export default KeyboardMappingManager;