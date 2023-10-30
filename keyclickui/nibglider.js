
// Initialize Paper.js
// Ensure Paper.js is properly initialized
paper.install(window);

var canvas = document.getElementById('nibgliderCanvas');
paper.setup(canvas);



// Attach a mousemove event to the canvas
canvas.addEventListener('mousemove', function () {
  // Set focus to the canvas
  // this.focus();
});

// Attach a mousemove event to the containing div if needed
canvas.addEventListener('mousemove', function () {
  // Set focus to the canvas within the div
//  document.getElementById('nibgliderCanvas').focus();
});



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



// Your existing variables and code with paper. as a prefix where needed
var globalStrokeWidth = 1.0;
var maxStrokeWidth = 40.0;
var isDrawing = false;
var mousePt;
var lastMousePt = null;
var path;



// Variables to track selected items and drag-lock status
var selectedItems = [];

var _isInDragLock = false;

function setIsInDragLock(status) {
  _isInDragLock = status;
  updateTextContent();
}



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

  }
}

paper.view.onMouseMove = onMouseMove;

// Note that "function onMouseMove(event)" becomes:
function onMouseMove(event) {
  //var paperEvent = new paper.ToolEvent(event, paper.view);
  mousePt = event.point;

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


  var center = collectiveCenter(selectedItems);

  if (event.key === '[') {
    var center = collectiveCenter(selectedItems);

    for (var i = 0; i < selectedItems.length; i++) {
      selectedItems[i].scale(0.9, center);
    }
  }

  if (event.key === ']') {
    var center = collectiveCenter(selectedItems);

    for (var i = 0; i < selectedItems.length; i++) {
      selectedItems[i].scale(1.1, center);
    }
  }

  if (event.key === ';') {
    var center = collectiveCenter(selectedItems);

    for (var i = 0; i < selectedItems.length; i++) {
      selectedItems[i].rotate(-15, center);
    }
  }

  if (event.key === "'") {
    var center = collectiveCenter(selectedItems);

    for (var i = 0; i < selectedItems.length; i++) {
      selectedItems[i].rotate(15, center);
    }
  }

  // Spacebar for drag-lock
  if (event.key === ' ' && (selectedItems.length > 0)) {
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


  if (event.key == 'f') {

    polyLineKC();

  }

  if (event.key == 'j') {
    changeStrokeWidth(1);
  }
  if (event.key == 'k') {
    changeStrokeWidth(2);
  }
  if (event.key == 'l') {
    changeStrokeWidth(3);
  }
  if (event.key == ';') {
    changeStrokeWidth(4);
  }

  if (event.key == 'c') {
    thinStrokeWidth();
  }
  if (event.key == 'v') {
    thickenStrokeWidth();
  }

  if (event.key === 'e')/* && _isInDragLock)*/ {
    stampItems(selectedItems);
  }


  if (isDrawing) {
    // close and end shape
    if (event.key == 'r') {

      closeShapeAndEnd();
    }

    // close and end shape
    if (event.key == 'd') {
      closeShapeAndEndWithFillStroke();


    }

        // close and end shape
        if (event.key == 's') {
          closeShapeAndEndWithFillOnly();
    
    
        }

    // close and end shape
    if (event.key == 'a') {
      endShape();


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



