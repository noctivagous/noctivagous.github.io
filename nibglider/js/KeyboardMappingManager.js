
function isCapsLockOn(event) {
    if (event.key.length === 1 && event.key >= 'A' && event.key <= 'Z') {
        return !event.shiftKey;
    } else if (event.key.length === 1 && event.key >= 'a' && event.key <= 'z') {
        return event.shiftKey;
    }
    return false;
  }
  
  function keyEventFlags(event){
  
     var capsLockOn = isCapsLockOn(event);
  
      var flags = '';
  
      // Cocoa-like shorthand flags
      if (event.shiftKey || capsLockOn) flags += '$'; // Shift
      if (event.ctrlKey)  flags += '^'; // Control
      if (event.altKey)   flags += '~'; // Alt/Option
      if (event.metaKey)  flags += '@'; // Command (Meta on PCs)
  
      return flags;
    
  }

var keyConfig = {
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

var functionRegistry = {
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
  
  


// KeyboardInputManager

// - Loads key names and definitions.
// - Reflects keypress states on the virtual keyboard within the canvas.
// - Dispatches events or commands to appropriate managers/entities based on keypress.
//
class KeyboardInputManager {
    constructor() {
      // Initialize
    }
    registerKeyPress(key) {
      // Logic for key press
      // Dispatch to appropriate manager/entity
    }
    // Additional methods
  }
  


  class PaintManager {
    constructor() {
      // Initialize SKPaint
    }
    setStrokeWidth(width) {
      // Logic to set stroke width
    }
    // Additional methods
  }
  
  class PathManipulator {
    constructor() {
      // Initialize
    }
    addPoint(point) {
      // Add point to path
    }
    // Additional methods
  }
  
  class DrawingEntity {
    // Common properties and methods
  }
  
  class RectangleDrawingEntity extends DrawingEntity {
    // Rectangle-specific logic
  }
  
  class CustomSpline {
    constructor() {
      // Initialize points
    }
    // Additional methods for spline logic
  }
  
