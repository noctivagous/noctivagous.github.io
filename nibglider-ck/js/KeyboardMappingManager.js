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

    this.flags = null;

    this.keyToChar = window.keyToChar;
    this.functionRegistry = window.functionRegistry;
    this.keyMappings = window.keyMappings;

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


    var buttonLookup = document.getElementById(keyEvent.code);

    if (buttonLookup != null && buttonLookup.classList.contains('active')) {
      buttonLookup.classList.remove('active');

      // Clear the timer if it exists
      if (buttonLookup.dataset.timerId) {
        clearTimeout(buttonLookup.dataset.timerId);
        delete buttonLookup.dataset.timerId; // Clean up the dataset
      }
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


    if (!this.app.mouseHasMoved()) {
      console.log('mouse has not moved before first keypress');
      return;
    }

    var buttonLookup = document.getElementById(keyEvent.code)



    if (buttonLookup != null) {
      buttonLookup.classList.add('active');



      // Every .active keyboardbutton overlay is removed after .8 seconds.
      // Ensures that no key gets stuck.
      // Check if the key is MetaLeft or MetaRight
      //if (keyEvent.code === 'MetaLeft' || keyEvent.code === 'MetaRight') {
      // Set a timer to remove the 'active' class after 2 seconds
      const timerId = setTimeout(() => {
        buttonLookup.classList.remove('active');
      }, 800);

      // Store the timer ID in the element for reference in keyup
      buttonLookup.dataset.timerId = timerId;
      // }
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

  toggleNumberRowKeyboardPanel() {

    var numberRowKeyboardPanel = document.getElementById('numberRowGrid');
    if (numberRowKeyboardPanel.classList.contains('slide-down')) {
      numberRowKeyboardPanel.style.transform = 'translateY(0)'; // Slide down
      numberRowKeyboardPanel.classList.remove('slide-down');
    } else {
      numberRowKeyboardPanel.style.transform = 'translateY(-100%)'; // Slide up
      numberRowKeyboardPanel.classList.add('slide-down');
    }
  }

  toggleBottomRowOnKeyboardPanel() {
    var keyboardKeysGrid = document.getElementById('keyboardKeysGrid');
    if (keyboardKeysGrid) {
      keyboardKeysGrid.classList.toggle('bottomRowHidden');
    }

  }



  toggleKeyboardPanel() {
    var keyboardPanel = document.getElementById('keyboardKeysGrid');
    if (keyboardPanel.classList.contains('slide-up')) {
      keyboardPanel.style.transform = 'translateY(0)'; // Slide down
      keyboardPanel.classList.remove('slide-up');
    } else {
      keyboardPanel.style.transform = 'translateY(100%)'; // Slide up
      keyboardPanel.classList.add('slide-up');
    }
  }

  keyboardPanelIsHidden() {
    var keyboardPanel = document.getElementById('keyboardKeysGrid');
    return keyboardPanel.classList.contains('slide-up');
  }

  numberRowKeyboardPanelIsHidden() {
    var numberRowKeyboardPanel = document.getElementById('numberRowGrid');
    return numberRowKeyboardPanel.classList.contains('slide-down');
  }



  toggleBothKeyboardPanels() {
    var keyboardPanel = document.getElementById('keyboardKeysGrid');
    var numberRowKeyboardPanel = document.getElementById('numberRowGrid');

    var keyboardPanelHidden = keyboardPanel.classList.contains('slide-up');
    var numberRowPanelHidden = numberRowKeyboardPanel.classList.contains('slide-down');

    if (!keyboardPanelHidden || !numberRowPanelHidden) {
      // If at least one panel is visible, or both are visible, hide both
      keyboardPanel.style.transform = 'translateY(100%)'; // Slide up (hide)
      keyboardPanel.classList.add('slide-up');

      numberRowKeyboardPanel.style.transform = 'translateY(-100%)'; // Slide up (hide)
      numberRowKeyboardPanel.classList.add('slide-down');
    } else {
      // If both panels are hidden, show both
      keyboardPanel.style.transform = 'translateY(0)'; // Slide down (show)
      keyboardPanel.classList.remove('slide-up');

      numberRowKeyboardPanel.style.transform = 'translateY(0)'; // Slide down (show)
      numberRowKeyboardPanel.classList.remove('slide-down');
    }
  }


  help() {

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

    this.operatingSys = this.app.operatingSystem;

    const keyCodeWithFlag = this.eventKeyCodeWithFlag;
    const keyCodeWithFlagWithOS = this.operatingSys + this.eventKeyCodeWithFlag;
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

      

        // Extract the character from the keyToChar mapping
        let char = this.keyToChar[this.app.operatingSystem + button.id] || this.keyToChar[button.id] || ''; // Fallback to empty string if no match


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



      button.style.backgroundColor = `${keyMapping.defaultButtonBackgroundColor}`;
      button.style.color = `${keyMapping.defaultFontColor}`;
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






}





export default KeyboardMappingManager;