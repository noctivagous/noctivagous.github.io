
// import xstate
//import { createMachine, createActor } from 'xstate';

// Initialize Paper.js
// Ensure Paper.js is properly initialized
paper.install(window);

var canvas = document.getElementById('nibgliderCanvas');
paper.setup(canvas);


// APP

const drawingEntityManager = new DrawingEntityManager();
const keyboardMappingManager = new KeyboardMappingManager(drawingEntityManager);
const inputManager = new InputManager(keyboardMappingManager, drawingEntityManager);




canvas.addEventListener('dragover', (e) => {
  e.preventDefault();
});

canvas.addEventListener('drop', (e) => {
  e.preventDefault();
  handleImageDrop(e);
});


function handleImageDrop(event) {
  const dataTransfer = event.dataTransfer;
  const { files } = dataTransfer;

  if (files.length > 0) {
    const file = files[0];
    const imageType = /image.*/;
    const svgType = /image\/svg\+xml/;

    if (file.type.match(svgType)) {
      const reader = new FileReader();
      reader.onload = function (e) {
        paper.project.importSVG(e.target.result, function (item) {
          // SVG has been imported, you can manipulate it here
          item.position = new paper.Point(event.layerX, event.layerY);
        });
      };
      reader.readAsText(file);
    } else if (file.type.match(imageType)) {
      const reader = new FileReader();
      reader.onload = function (e) {
        const image = new Image();
        image.onload = function () {
          // Create a Paper.js Raster item from the image
          const raster = new paper.Raster(image);
          raster.position = new paper.Point(event.layerX, event.layerY);
        };
        image.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }
}



// canvas vars
var paperFillColor = new paper.Color(1, 0, 0); // RGB range between 0 and 1
var paperStrokeColor = new paper.Color(1, 0, 0); // RGB range between 0 and 1


var globalStrokeWidth = 4.0;
var maxStrokeWidth = 800.0;
var minStrokeWidth = 1.0;
var scaleOperationIncludesStrokeWidth = true;
var isDrawing = false;
var mousePt = paper.view.center;
var lastMousePt = null;
var path;




// Variables to track selected items and drag-lock status
var selectedItems = [];

var _isInDragLock = false;

function setIsInDragLock(status) {
  _isInDragLock = status;
  updateTextContent();
}



// Create a vector object, like a circle, that will follow the cursor
var cursorFollower = new paper.Path.Circle({
  center: new paper.Point(-20, -20),
  radius: globalStrokeWidth / 2,
  fillColor: new paper.Color(0, 0, 0, 0.5), // Last value is alpha (transparency)
  strokeWidth: globalStrokeWidth
});


  // Create a new circle with the updated radius
var cursorFollowerRing = new paper.Path.Circle({
      center: new paper.Point(-20, -20),
      radius: 20, // Set the radius to be equal to globalStrokeWidth
      strokeColor: 'black',
      strokeWidth: 1,
      /*
       // Set the shadow color of the circle to RGB black:
    shadowColor: new Color(1, 1, 1),
    // Set the shadow blur radius to 12:
    shadowBlur: 0,
    // Offset the shadow by { x: 5, y: 5 }
    shadowOffset: new Point(1, 1)*/

  });




var textItem1 = new paper.PointText({
  content: 'Stroke Width: ' + globalStrokeWidth + 'pt',
  point: new paper.Point(600, 40),
  fillColor: "#fff",
  fontSize: '18pt',
  fontWeight: 'normal',
  fontFamily: 'Monospace',
});



function updateTextContent() {
  var selectedCount = selectedItems.length;
  textItem1.content = 'Stroke Width: ' + globalStrokeWidth + 'pt';
  textItem1.content += selectedCount ? '\nSelected Objects: ' + selectedCount : '';
  textItem1.content += _isInDragLock ? '\nDrag-Lock On' : '';


}


paper.view.onMouseDown = onMouseDown;

function onMouseDown(event) {
  hitTestUnderCursor();
}


function removeAllSelectedItemsAndReset() {
  for (var i = selectedItems.length - 1; i >= 0; i--) { // Loop in reverse to avoid array index issues
    var item = selectedItems[i];
    removeItemFromSelection(item); // Assuming you have a function to remove the glow and other selection properties
    item.remove(); // This removes the item from the Paper.js project
  }
  selectedItems = []; // Clear the selection array
  setIsInDragLock(false);
}


function hitTestUnderCursor() {

  // if(isDrawing == false)
  // otherwise it will select 
  // the line or shape being drawn.
  if (isDrawing == false) {

       // Temporarily hide the cursorFollower
       cursorFollower.visible = false;
       // Temporarily hide the cursorFollowerRing
       cursorFollowerRing.visible = false;


    // Hit test to find object under cursor
    let hitResult = project.hitTest(mousePt, {
      segments: true,
      stroke: true,
      fill: true,
      tolerance: 5 // Tolerance in points
    });

    if (hitResult && hitResult.item) {

      // Check if this item is already selected
      var alreadySelected = selectedItems.indexOf(hitResult.item) !== -1;

      if (alreadySelected) {
        hitResult.item.selected = false;
        selectedItems.splice(selectedItems.indexOf(hitResult.item), 1);
      } else {
        hitResult.item.selected = true;
        selectedItems.push(hitResult.item);
      }
    } else {

      // If nothing is underneath the cursor, clear the selection
      clearOutSelection();
    }

      // Make the cursorFollower visible again
      cursorFollower.visible = true;
      // Make the cursorFollowerRing visible again
      cursorFollowerRing.visible = true;

  }
}

// Function to update the radius of cursorFollower based on globalStrokeWidth
function updateCursorFollowerRadius() {
  var currentCenter = cursorFollower.position; // Save the current center position
  cursorFollower.remove(); // Remove the old circle
  
  // Create a new circle with the updated radius
  cursorFollower = new paper.Path.Circle({
      center: currentCenter,
      radius: globalStrokeWidth / 2, // Set the radius to be equal to globalStrokeWidth
      fillColor: new paper.Color(0, 0, 0, 0.5),
  });
}


function updateCursorFollowerPosition()
{
  
  // Update the position of the object to the cursor position
  cursorFollower.position = mousePt;
  cursorFollowerRing.position = mousePt;
  // Create a vector object, like a circle, that will follow the cursor

}

paper.view.onMouseMove = onMouseMove;

// Note that "function onMouseMove(event)" becomes:
function onMouseMove(event) {
  //var paperEvent = new paper.ToolEvent(event, paper.view);
  mousePt = event.point;
  updateCursorFollowerPosition();

  handleDragLock(event);



  if (isDrawing) {


    if (path) {


      if (path.segments.length == 1) {
        path.add(mousePt);


      }

      if (path.segments.length > 1) {

        path.removeSegment(path.segments.length - 1);
        path.add(mousePt);

      }

    }

  }





}






// Similarly, for onKeyDown
document.addEventListener('keydown', function (event) {

  
  var flags = keyboardMappingManager.keyEventFlags(event);
    console.log(flags);

  var eventKeyCodeWithFlag = event.code;
  
  if(flags != null)
  {
    eventKeyCodeWithFlag = flags + event.code;
  }
  var center = collectiveCenter(selectedItems);


console.log(eventKeyCodeWithFlag);

  if (eventKeyCodeWithFlag === 'BracketLeft') {
    var center = collectiveCenter(selectedItems);

    for (var i = 0; i < selectedItems.length; i++) {
      selectedItems[i].scale(0.9, center);
      if(scaleOperationIncludesStrokeWidth)
      {
      selectedItems[i].strokeWidth == 0 ? 0 : selectedItems[i].strokeWidth = Math.max((selectedItems[i].strokeWidth * 0.9), minStrokeWidth);
      }
    }
  }

  if (eventKeyCodeWithFlag === 'BracketRight') {
    var center = collectiveCenter(selectedItems);

    for (var i = 0; i < selectedItems.length; i++) {
      selectedItems[i].scale(1.1, center);

      if(scaleOperationIncludesStrokeWidth)
      {
        selectedItems[i].strokeWidth == 0 ? 0 : selectedItems[i].strokeWidth = Math.min((selectedItems[i].strokeWidth * 1.1), maxStrokeWidth);
      }

    }
  }

  if (eventKeyCodeWithFlag === 'Semicolon') {
    var center = collectiveCenter(selectedItems);

    for (var i = 0; i < selectedItems.length; i++) {
      selectedItems[i].rotate(-15, center);
    }
  }

  if (eventKeyCodeWithFlag === "Quote") {
    var center = collectiveCenter(selectedItems);

    for (var i = 0; i < selectedItems.length; i++) {
      selectedItems[i].rotate(15, center);
    }
  }



  // Spacebar for drag-lock
  if ((eventKeyCodeWithFlag === "Space") && (selectedItems.length > 0)) {
    setIsInDragLock(!_isInDragLock); // Toggle drag-lock status
  }

  if (event.key === 'Backspace') {
    removeAllSelectedItemsAndReset();
  }


  // Escape key for cancelling all
  if (event.key === 'Escape') {

    for (var i = 0; i < selectedItems.length; i++) {
      selectedItems[i].selected = false;
    }
    selectedItems = [];
    setIsInDragLock(false);
  }

    // close and end shape
    if (event.key == 'w') {

      stampItems(selectedItems);



    }


  if (event.key == 'f') {

    polyLineKC();

  }



  if (event.key == 'c') {
    thinStrokeWidth();
  }
  if (event.key == 'v') {
    thickenStrokeWidth();
  }

  if (eventKeyCodeWithFlag === '$KeyC') {
    thinStrokeWidthUpper();
  }
  if (eventKeyCodeWithFlag === '$KeyV') {
    thickenStrokeWidthUpper();
  }


  
  if (isDrawing) {
    // close and end shape
    if (event.key == 'r') {
      closeShapeAndEnd();
    }



  if (event.key === 'e')/* && _isInDragLock)*/ {
    
    closeShapeAndEndWithFillOnly();
  }

        // close and end shape
        if (event.key == 's') {
          closeShapeAndEndWithFillStroke();

    
    
        }

    // close path and end
    if (event.key == 'a') {
      endPathAsStroke();


    }

  }

  if (event.key === 'q') {
    cancelCurrentDrawingOperation();
  }

  // Tab key for selecting object under cursor
  if (event.key === 'Tab') {
    hitTestUnderCursor();
  }



  updateTextContent();

}, false);





function handleDragLock(event) {
  mousePt = event.point; // Update mousePt

  // Implement drag-lock functionality
  if (_isInDragLock) {

    // If lastMousePt is null, initialize it
    if (lastMousePt === null) {
      lastMousePt = mousePt;
    }

    // Calculate the delta
    var delta = mousePt.subtract(lastMousePt);

    // Apply the delta to the position of all selected items
    for (var i = 0; i < selectedItems.length; i++) {
      selectedItems[i].position = selectedItems[i].position.add(delta);
    }

    // Update lastMousePt for the next event
    lastMousePt = mousePt;

  } else {
    // Reset lastMousePt when drag lock is off
    lastMousePt = null;
  }
}


paper.view.onMouseDrag = function(event) {

  mousePt = event.point; // Update mousePt

    // If lastMousePt is null, initialize it
    if (lastMousePt === null) {
      lastMousePt = mousePt;
    }

    // Calculate the delta
    var delta = mousePt.subtract(lastMousePt);

    // Apply the delta to the position of all selected items
    for (var i = 0; i < selectedItems.length; i++) {
      selectedItems[i].position = selectedItems[i].position.add(delta);
    }

  // Update lastMousePt for the next onMouseDrag event
  lastMousePt = mousePt;
  
};


// When the mouse is released, we simplify the path:
function onMouseUp(event) {

}


