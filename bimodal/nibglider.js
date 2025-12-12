// Initialize Paper.js
// Ensure Paper.js is properly initialized
paper.install(window);

var canvas = document.getElementById('nibgliderCanvas');
paper.setup(canvas);

mousePt = new paper.Point(paper.view.size.width / 2, paper.view.size.height / 2);



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
var globalStrokeWidth = 4.0;
var maxStrokeWidth = 40.0;
var isDrawingPath = false;  // renamed from isDrawing
var mousePt;
var lastMousePt = null;
var path;

var isDrawingShape = false;
var shapeType = null;  // 'circle_radius' or 'circle_diameter'
var shapeStartPoint = null;
var previewShape = null;
var previewLine = null;
var previewPath = null;
var previewRect = null;
var shapePt2 = null;

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
  let lines = ['Stroke Width: ' + globalStrokeWidth + 'pt'];
  var selectedCount = selectedItems.length;
  if (selectedCount) {
    lines.push('Selected Objects: ' + selectedCount);
  }
  if (_isInDragLock) {
    lines.push('Drag-Lock On');
  }
  let instruction = '';
  if (isDrawingPath) {
    lines.push('Drawing Polyline');
    instruction = 'Repeat F to add polyline points. End with A';
  }
  if (isDrawingShape) {
    let shapeInfo = '';
    if (shapeType === 'circle_radius' || shapeType === 'circle_diameter') {
      let mode = shapeType === 'circle_radius' ? 'radius' : 'diameter';
      shapeInfo = 'Drawing Circle (' + mode + ')';
    } else if (shapeType === 'rectangle_diagonal') {
      shapeInfo = 'Rectangle Diagonal';
    } else if (shapeType === 'rectangle_two_edges') {
      shapeInfo = 'Rectangle Two Edges';
      if (shapePt2 !== null) {
      //  lines.push(' (width)');
      }
    }
    lines.push(shapeInfo);
    let finishKey;
    if (shapeType.startsWith('circle_')) {
      finishKey = shapeType === 'circle_diameter' ? 'N' : 'M';
      instruction = `Press ${finishKey} to finish or W to stamp.`;
    } else if (shapeType === 'rectangle_diagonal') {
      instruction = 'Press I to finish or W to stamp.';
    } else if (shapeType === 'rectangle_two_edges') {
      if (shapePt2 === null) {
        instruction = 'Press U again to finish the first edge';
      } else {
        instruction = 'Moving the line adjusts the second edge. Press U to finish or W to stamp.';
      }
    }
    instruction += ' Q: cancel';
  }
  if (instruction) {
    lines.push(instruction);
  }
  textItem1.content = lines.join('\n');
}


paper.view.onMouseDown = onMouseDown;

function onMouseDown(event) {
  if (isDrawingPath || isDrawingShape) {
    return;
  }
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
  if (isDrawingPath || isDrawingShape) {
    return;
  }

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
    updateTextContent();
}

paper.view.onMouseMove = onMouseMove;

// Note that "function onMouseMove(event)" becomes:
function onMouseMove(event) {
  mousePt = event.point;

  handleDragLock(event);



  if (isDrawingPath) {


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

  if (isDrawingShape) {
    updateShapePreview();
  }
}

function updateShapePreview() {
  if (!isDrawingShape || !shapeStartPoint) return;

  if (shapeType === 'rectangle_two_edges') {
    if (shapePt2 === null) {
      // Phase 1: live first edge
      previewLine.firstSegment.point = shapeStartPoint;
      previewLine.lastSegment.point = mousePt;
      if (previewPath.segments.length > 1) {
        previewPath.removeSegment(1);
      }
      previewPath.add(mousePt);
    } else {
      // Phase 2: live second drag, preview rect
      previewLine.firstSegment.point = shapePt2;
      previewLine.lastSegment.point = mousePt;
      var pt1 = shapeStartPoint;
      var pt2 = shapePt2;
      var pt3 = mousePt;
      var V1 = pt2.subtract(pt1);
      var dir1 = V1.normalize();
      var V2 = pt3.subtract(pt2);
      var proj_scalar = V2.dot(dir1);
      var proj_vec = dir1.multiply(proj_scalar);
      var perp_vec = V2.subtract(proj_vec);
      var ptC = pt2.add(perp_vec);
      var ptD = pt1.add(perp_vec);
      previewRect.segments[0].point = pt1;
      previewRect.segments[1].point = pt2;
      previewRect.segments[2].point = ptC;
      previewRect.segments[3].point = ptD;
    }
    return;
  }

  var endPt = mousePt;
  var center, radius;
  if (shapeType === 'circle_radius') {
    center = shapeStartPoint;
    radius = shapeStartPoint.getDistance(endPt);
    previewShape.position = center;
    previewShape.radius = radius;
  } else if (shapeType === 'circle_diameter') {
    center = shapeStartPoint.add(endPt).divide(2);
    radius = shapeStartPoint.getDistance(endPt) / 2;
    previewShape.position = center;
    previewShape.radius = radius;
  } else if (shapeType === 'rectangle_diagonal') {
    var dx = endPt.x - shapeStartPoint.x;
    var dy = endPt.y - shapeStartPoint.y;
    var width = Math.abs(dx);
    var height = Math.abs(dy);
    center = shapeStartPoint.add(endPt).divide(2);
    previewShape.position = center;
    previewShape.size = new paper.Size(width, height);
  }

  if (previewLine) {
    previewLine.firstSegment.point = shapeStartPoint;
    previewLine.lastSegment.point = endPt;
  }
}

// Similarly, for onKeyDown
document.addEventListener('keydown', function (event) {
  var keyLower = event.key.toLowerCase();


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

    // close and end shape
    if (keyLower == 'w') {
      if (isDrawingShape) {
        stampCurrentShape();
      } else {
        stampItems(selectedItems);
      }
    }

    if (keyLower == 'i') {
      rectDiagonalKC();
    }

    if (keyLower == 'u') {
      rectTwoEdgesKC();
    }


  var keyLower = event.key.toLowerCase();
  if (keyLower == 'f') {
    polyLineKC();
  }
  if (keyLower == 'n') {
    circleKC('diameter');
  }
  if (keyLower == 'm') {
    circleKC('radius');
  }
  if (keyLower == 'j') {
    changeStrokeWidth(1);
  }
  if (keyLower == 'k') {
    changeStrokeWidth(2);
  }
  if (keyLower == 'l') {
    changeStrokeWidth(3);
  }
  if (keyLower == 'c') {
    thinStrokeWidth();
  }
  if (keyLower == 'v') {
    thickenStrokeWidth();
  }


  if (isDrawingPath || isDrawingShape) {
    if (keyLower == 'r') {
      if (isDrawingPath) {
        closeShapeAndEnd();
      } else {
        endShapeAsStroke();
      }
    }
    if (event.key === 'e') {
      if (isDrawingPath) {
        closeShapeAndEndWithFillOnly();
      } else {
        endShapeFillOnly();
      }
    }
    if (keyLower == 's') {
      if (isDrawingPath) {
        closeShapeAndEndWithFillStroke();
      } else {
        endShapeFillStroke();
      }
    }
    if (keyLower == 'a') {
      if (isDrawingPath) {
        endPathAsStroke();
      } else {
        endShapeAsStroke();
      }
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


