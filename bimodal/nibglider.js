init();

function init(){

    // Initialize Paper.js
  // Ensure Paper.js is properly initialized
  paper.install(window);

  canvas = document.getElementById('nibgliderCanvas');
  paper.setup(canvas);

  mousePt = new paper.Point(paper.view.size.width / 2, paper.view.size.height / 2);

  registerEventListeners();

}

function registerEventListeners() {
  // Event listeners will be added here
}


// Add circle-specific globals after existing innerShape globals:
var circleInnerShapeType = 'polygon';
var circleInnerShapeParams = {
  sides: 6,
  m: 3,
  n1: 0.2,
  n2: 1.7,
  n3: 1.7
};

// Update global after definition:
circleInnerShapeParams.a1 = 1.0;
circleInnerShapeParams.a2 = 1.0;


circleInnerShapeSelect.addEventListener('change', function() {
  circleInnerShapeType = this.value;
  updateTextContent();
});

circlePolySidesSlider.addEventListener('input', function() {
  circleInnerShapeParams.sides = parseInt(this.value);
  circlePolySidesLabel.textContent = 'Sides: ' + this.value;
  updateTextContent();
});

// Init
circleInnerShapeSelect.value = circleInnerShapeType;
circlePolySidesSlider.value = circleInnerShapeParams.sides;
circlePolySidesLabel.textContent = 'Sides: ' + circleInnerShapeParams.sides;


// ...existing previews...
previewInner = null;
innerShapeType = 'polygon';  // 'none', 'circle', 'polygon', 'supershape'
innerShapeParams = {
  sides: 6,     // for polygon
  m: 3,         // for supershape
  n1: 0.2,
  n2: 1.7,
  n3: 1.7
};


// Add global:
shapeGuideAngle = 0;


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

// New variables for quadrilateral drawing
var isDrawingQuad = false;
var quadPath;
var quadPointCount = 0;

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


var shapeWidth = 90;
var maxShapeWidth = 200;
var lastCenterlineWidth = 80;

var splineTensionDefault = 0.4;
var splineTension = 0.4;

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
    instruction = 'F=sharp, G=spline(tension:' + splineTension.toFixed(1) + ') ';
    instruction += 'J/K= adjust tension, A=end';
  }
  if (isDrawingShape) {
    let shapeInfo = '';
    if (shapeType === 'circle_radius' || shapeType === 'circle_diameter') {
      let mode = shapeType === 'circle_radius' ? 'radius' : 'diameter';
      shapeInfo = 'Circle by (' + mode + ')';
    } else if (shapeType === 'rectangle_diagonal') {
      shapeInfo = 'Rectangle by Diagonal';
    } else if (shapeType === 'rectangle_two_edges') {
      shapeInfo = 'Rectangle by Two Edges';
      if (shapePt2 !== null) {
      //  lines.push(' (width)');
      }
    } else if (shapeType === 'rectangle_centerline') {
      shapeInfo = 'Rectangle by Centerline';
      lines.push('Width: ' + Math.round(shapeWidth) + 'pt');
    }
    lines.push(shapeInfo);
    if (shapeType.startsWith('circle_')) {
      let finishKey = shapeType === 'circle_diameter' ? 'N' : 'M';
      instruction = `Press ${finishKey} to finish or W to stamp.`;
    } else if (shapeType === 'rectangle_diagonal') {
      instruction = 'Press I to finish or W to stamp.';
    } else if (shapeType === 'rectangle_two_edges') {
      if (shapePt2 === null) {
        instruction = 'Press U again to finish the first edge';
      } else {
        instruction = 'Moving the line adjusts the second edge.\nPress U to finish or W to stamp.';
      }
    } else if (shapeType === 'rectangle_centerline') {
      instruction = '\'[\': thin width, \']\': thicken width, Y: finish, W: stamp, Q: cancel';
    }
  }
  if (isDrawingQuad) {
    lines.push('Drawing Quadrilateral (' + quadPointCount + '/4)');
    instruction = 'Press O to add next point. Q: cancel';
  }
  if (instruction) {
    lines.push(instruction);
  }

  textItem1.content = lines.join('\n');
}


paper.view.onMouseDown = onMouseDown;

function onMouseDown(event) {
  if (isDrawingPath || isDrawingShape || isDrawingQuad) {
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
  if (isDrawingPath || isDrawingShape || isDrawingQuad) {
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
  if (isDrawingQuad) {
    if (quadPath) {
      if (quadPath.segments.length == 1) {
        quadPath.add(mousePt);
      }
      if (quadPath.segments.length > 1) {
        quadPath.removeSegment(quadPath.segments.length - 1);
        quadPath.add(mousePt);
      }
    }
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
  } else if (shapeType === 'rectangle_centerline') {
    var pt1 = shapeStartPoint;
    var pt2 = mousePt;
    previewLine.firstSegment.point = pt1;
    previewLine.lastSegment.point = pt2;
    var center = pt1.add(pt2).divide(2);
    var dir = pt2.subtract(pt1);
    var length = dir.length;
    var halfLen = length / 2;
    var unitDir = dir.normalize();
    var perp = new paper.Point(-unitDir.y, unitDir.x);
    var halfW = shapeWidth / 2;
    var ptA = center.add(unitDir.multiply(halfLen)).add(perp.multiply(halfW));
    var ptB = center.add(unitDir.multiply(halfLen)).subtract(perp.multiply(halfW));
    var ptC = center.subtract(unitDir.multiply(halfLen)).add(perp.multiply(halfW));
    var ptD = center.subtract(unitDir.multiply(halfLen)).subtract(perp.multiply(halfW));
    previewRect.segments[0].point = ptA;
    previewRect.segments[1].point = ptB;
    previewRect.segments[2].point = ptD;
    previewRect.segments[3].point = ptC;
    return;
  }

  var endPt = mousePt;
  var center, radius;
  if (shapeType === 'circle_radius') {
    center = shapeStartPoint;
    radius = shapeStartPoint.getDistance(endPt);
    previewShape.position = center;
    previewShape.radius = radius;
shapeGuideAngle = mousePt.subtract(previewShape.position).angle;
  } else if (shapeType === 'circle_diameter') {
    center = shapeStartPoint.add(endPt).divide(2);
    radius = shapeStartPoint.getDistance(endPt) / 2;
    previewShape.position = center;
    previewShape.radius = radius;
shapeGuideAngle = mousePt.subtract(previewShape.position).angle;
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

  if (shapeType === 'rectangle_diagonal') return;  // ← ADD: skip inner preview

  // At end of updateShapePreview():
  if (previewInner) {
    previewInner.remove();
    previewInner = null;
  }
  if (isDrawingShape && innerShapeType !== 'none') {
    let framePreview = null;
    if (shapeType.startsWith('circle_') && previewShape && previewShape.radius > 0) {
      const pradius = previewShape.radius - previewShape.strokeWidth / 2;
      if (pradius > 0) {
        previewInner = createInnerShape(previewShape.position, pradius, 'preview', shapeGuideAngle);
        if (previewInner) project.activeLayer.addChild(previewInner);
      }
    } else if (shapeType === 'rectangle_centerline' || (shapeType === 'rectangle_two_edges' && shapePt2 !== null)) {
      framePreview = previewRect;
    } else if (previewShape) {
      framePreview = previewShape;
    }
    if (framePreview && framePreview.bounds && framePreview.bounds.width > 0 && framePreview.bounds.height > 0) {
      const inset = globalStrokeWidth * 1.5;
      const bx = framePreview.bounds.x + inset;
      const by = framePreview.bounds.y + inset;
      const bw = framePreview.bounds.width - 2 * inset;
      const bh = framePreview.bounds.height - 2 * inset;
      let pBounds = new paper.Rectangle(bx, by, bw, bh);
      if (pBounds.width > 0 && pBounds.height > 0) {
        const center = pBounds.center;
        const radius = Math.min(pBounds.width, pBounds.height) / 2 * 0.9;
        previewInner = createInnerShape(center, radius, 'preview');
        if (previewInner) project.activeLayer.addChild(previewInner);
      }
    }
  }
}

// Similarly, for onKeyDown
document.addEventListener('keydown', function (event) {
  var keyLower = event.key.toLowerCase();


  // Bracket keys - centerline width OR selection scale
  if (event.key === '[' || event.key === ']') {
    if (isDrawingShape && shapeType === 'rectangle_centerline') {
      if (event.key === '[') {
        shapeWidth = Math.max(1, (shapeWidth || globalStrokeWidth * 2) - 2);
      } else {
        shapeWidth = Math.min(maxShapeWidth, (shapeWidth || globalStrokeWidth * 2) + 2);
      }
      updateTextContent();
      updateShapePreview();
      return;
    } else if (selectedItems.length > 0) {
      var center = collectiveCenter(selectedItems);
      for (var i = 0; i < selectedItems.length; i++) {
        if (event.key === '[') {
          selectedItems[i].scale(0.9, center);
        } else {
          selectedItems[i].scale(1.1, center);
        }
      }
      return;
    }
  }

  // Rotate keys - selection rotate
  if (event.key === ';' || event.key === "'") {
    if (selectedItems.length > 0) {
      var center = collectiveCenter(selectedItems);
      var angle = event.key === ';' ? -10 : 10;
      for (var i = 0; i < selectedItems.length; i++) {
        selectedItems[i].rotate(angle, center);
      }
      return;
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

  // Drawing keys - ADD G KEY FOR SPLINE
  if (keyLower == 'y') {
    rectCenterlineKC();
    return;
  }
  if (keyLower == 'i') {
    rectDiagonalKC();
    return;
  }
  if (keyLower == 'u') {
    rectTwoEdgesKC();
    return;
  }
  if (keyLower == 'f') {
    polyLineKC(); // Hard corner point
    return;
  }
  if (keyLower == 'g') {
    splinePointKC(); // Smooth spline point
    return;
  }
  if (keyLower == 'n') {
    circleKC('diameter');
    return;
  }
  if (keyLower == 'm') {
    circleKC('radius');
    return;
  }
  if (keyLower == 'o') {
    quadPointKC();
    return;
  }

  // NEW: Spline tension controls (MUST come BEFORE stroke width)
  if (isDrawingPath) {
    if (keyLower == 'j') {
      splineTension = Math.max(0.1, splineTension - 0.1);
      updateTextContent();
      return;
    }
    if (keyLower == 'k') {
      splineTension = Math.min(1.0, splineTension + 0.1);
      updateTextContent();
      return;
    }
    if (keyLower == 'l') {
      splineTension = splineTensionDefault; // reset to default
      updateTextContent();
      return;
    }
  }

  // OLD stroke width mappings - now only work when NOT drawing path
  if (keyLower == 'j' && !isDrawingPath) {
    changeStrokeWidth(1);
  }
  if (keyLower == 'k' && !isDrawingPath) {
    changeStrokeWidth(2);
  }
  if (keyLower == 'l' && !isDrawingPath) {
    changeStrokeWidth(3);
  }

  if (keyLower == 'c') {
    if (isDrawingPath || isDrawingShape || isDrawingQuad) 
      {
      thinStrokeWidth();
    } else if (selectedItems.length > 0) {
      for (var i = 0; i < selectedItems.length; i++) {
        if (selectedItems[i].strokeWidth) {
          selectedItems[i].strokeWidth = Math.max(1, selectedItems[i].strokeWidth - 1);
        }
      }
    }
else{

  thinStrokeWidth();
}

    return;
  }
  if (keyLower == 'v') {
    if (isDrawingPath || isDrawingShape || isDrawingQuad) {
      thickenStrokeWidth();
    } else if (selectedItems.length > 0) {
      for (var i = 0; i < selectedItems.length; i++) {
        if (selectedItems[i].strokeWidth) {
          selectedItems[i].strokeWidth = Math.min(maxStrokeWidth, selectedItems[i].strokeWidth + 1);
        }
      }
    }
    else{
      thickenStrokeWidth();
    }
    return;
  }


  if (isDrawingPath || isDrawingShape || isDrawingQuad) {
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

// Circle shape controls
const circleSelect = document.getElementById('circleInnerShapeSelect');
const polygonParams = document.getElementById('regularPolygonParametersForPanel');
const supershapeParams = document.getElementById('supershapeParametersForPanel');

// Hide supershape params initially
supershapeParams.style.display = 'none';

// Toggle parameter panels based on selection
circleSelect.addEventListener('change', function() {
  const selectedShape = this.value;
  
  // Hide both parameter spans first
  polygonParams.style.display = 'none';
  supershapeParams.style.display = 'none';
  
  if (selectedShape === 'polygon') {
    polygonParams.style.display = 'inline';
  } else if (selectedShape === 'supershape') {
    supershapeParams.style.display = 'inline';
  }
  // For 'circle', show nothing extra
});

// Supershape parameter label updates and value storage
const supershapeParamsObj = {
  n1: { slider: document.getElementById('supershapeN1'), label: document.getElementById('supershapeN1Label') },
  n2: { slider: document.getElementById('supershapeN2'), label: document.getElementById('supershapeN2Label') },
  n3: { slider: document.getElementById('supershapeN3'), label: document.getElementById('supershapeN3Label') },
  m: { slider: document.getElementById('supershapeM1'), label: document.getElementById('supershapeM1Label') },
  a1: { slider: document.getElementById('supershapeA1'), label: document.getElementById('supershapeA1Label') },
  a2: { slider: document.getElementById('supershapeA2'), label: document.getElementById('supershapeA2Label') }
};

// Initialize supershape parameters
const supershapeValues = {
  n1: 1.0, n2: 1.0, n3: 1.0, m: 4.0, a1: 1.0, a2: 1.0
};

// In supershape init section, sync initial values before slider loop:
supershapeValues.n1 = circleInnerShapeParams.n1;
supershapeValues.n2 = circleInnerShapeParams.n2;
supershapeValues.n3 = circleInnerShapeParams.n3;
supershapeValues.m = circleInnerShapeParams.m;
supershapeValues.a1 = circleInnerShapeParams.a1;
supershapeValues.a2 = circleInnerShapeParams.a2;

// Update labels when sliders change
Object.keys(supershapeParamsObj).forEach(param => {
  const { slider, label } = supershapeParamsObj[param];
  slider.value = supershapeValues[param];
  
  const updateLabel = () => {
    const value = parseFloat(slider.value).toFixed(1);
    label.textContent = `${param.toUpperCase()}: ${value}`;
    supershapeValues[param] = parseFloat(value);
    circleInnerShapeParams[param] = parseFloat(value);  // Sync to shape params
    // Trigger supershape redraw if needed (call your supershape rendering function)
    updateCurrentSupershape();
  };
  
  slider.addEventListener('input', updateLabel);
  updateLabel(); // Initial update
});

// Function to get current supershape parameters
window.getSupershapeParams = function() {
  return supershapeValues;
};

// Placeholder for supershape update function - replace with your actual rendering logic
function updateCurrentSupershape() {
  // This should regenerate the current supershape preview/shape using supershapeValues
  // Example: if you have a currentCircleShape variable:
  // if (currentCircleShape && circleSelect.value === 'supershape') {
  //   regenerateSupershape(currentCircleShape, supershapeValues);
  // }
  
  // For now, just log the values
  console.log('Supershape params updated:', supershapeValues);
}

// Also handle polygon sides label update (if not already implemented)
const polySidesSlider = document.getElementById('circlePolySides');
const polySidesLabel = document.getElementById('circlePolySidesLabel');
if (polySidesSlider && polySidesLabel) {
  polySidesSlider.addEventListener('input', function() {
    polySidesLabel.textContent = `Sides: ${this.value}`;
  });
}



function generateCirclePath(segments = 72) {
  let d = '';
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    const x = Math.cos(theta);
    const y = Math.sin(theta);
    if (i === 0) {
      d += `M${x.toFixed(4)},${y.toFixed(4)}`;
    } else {
      d += ` L${x.toFixed(4)},${y.toFixed(4)}`;
    }
  }
  return d;
}

function generateRegularPolygonPath(sides) {
  let d = '';
  for (let i = 0; i <= sides; i++) {
    const theta = (i / sides) * Math.PI * 2;
    const x = Math.cos(theta);
    const y = Math.sin(theta);
    if (i === 0) {
      d += `M${x.toFixed(4)},${y.toFixed(4)}`;
    } else {
      d += ` L${x.toFixed(4)},${y.toFixed(4)}`;
    }
  }
  return d;
}

function generateSupershapePath(n1, n2, n3, m, a1, a2, segments = 180) {
  let d = '';
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    const phi = m * theta / 4;
    const cos_phi = Math.cos(phi);
    const sin_phi = Math.sin(phi);
    const term1 = Math.pow(Math.abs(cos_phi / a1), n2);
    const term2 = Math.pow(Math.abs(sin_phi / a2), n3);
    const r = Math.pow(term1 + term2, -1 / n1);
    const x = r * Math.cos(theta);
    const y = r * Math.sin(theta);
    if (i === 0) {
      d += `M${x.toFixed(4)},${y.toFixed(4)}`;
    } else {
      d += ` L${x.toFixed(4)},${y.toFixed(4)}`;
    }
  }
  d += ' Z';
  return d;
}



function updatePreviewBox() {
  const selectVal = document.getElementById('circleInnerShapeSelect').value;
  let pathD;
  if (selectVal === 'circle') {
    pathD = generateCirclePath();
  } else if (selectVal === 'polygon') {
    const sides = parseInt(document.getElementById('circlePolySides').value);
    pathD = generateRegularPolygonPath(sides);
    document.getElementById('circlePolySidesLabel').textContent = `Sides: ${sides}`;
  } else if (selectVal === 'supershape') {
    const n1 = parseFloat(document.getElementById('supershapeN1').value);
    const n2 = parseFloat(document.getElementById('supershapeN2').value);
    const n3 = parseFloat(document.getElementById('supershapeN3').value);
    const m = parseFloat(document.getElementById('supershapeM1').value);
    const a1 = parseFloat(document.getElementById('supershapeA1').value);
    const a2 = parseFloat(document.getElementById('supershapeA2').value);
    pathD = generateSupershapePath(n1, n2, n3, m, a1, a2);
    // Update supershape labels
    document.getElementById('supershapeN1Label').textContent = `N1: ${n1.toFixed(1)}`;
    document.getElementById('supershapeN2Label').textContent = `N2: ${n2.toFixed(1)}`;
    document.getElementById('supershapeN3Label').textContent = `N3: ${n3.toFixed(1)}`;
    document.getElementById('supershapeM1Label').textContent = `M: ${m.toFixed(1)}`;
    document.getElementById('supershapeA1Label').textContent = `A1: ${a1.toFixed(1)}`;
    document.getElementById('supershapeA2Label').textContent = `A2: ${a2.toFixed(1)}`;
  }
  document.getElementById('shapePreviewPath').setAttribute('d', pathD);
}



// Replace the DOMContentLoaded block at the end:
document.addEventListener('DOMContentLoaded', function() {
  // Circle shape controls
  const circleSelect = document.getElementById('circleInnerShapeSelect');
  const polygonParams = document.getElementById('regularPolygonParametersForPanel');
  const supershapeParams = document.getElementById('supershapeParametersForPanel');
  
  if (!circleSelect) {
    console.warn('circleInnerShapeSelect not found');
    return;
  }
  
  // Initially hide both parameter panels
  if (polygonParams) polygonParams.style.display = 'none';
  if (supershapeParams) supershapeParams.style.display = 'none';

  // CRITICAL: Generate initial preview FIRST
  updatePreviewBox();

  // Toggle parameter panels based on selection
  circleSelect.addEventListener('change', function() {
    const value = this.value;
    
    // Hide all parameter panels first
    if (polygonParams) polygonParams.style.display = 'none';
    if (supershapeParams) supershapeParams.style.display = 'none';
    
    // Show the correct panel
    if (value === 'polygon' && polygonParams) {
      polygonParams.style.display = 'inline';
    } else if (value === 'supershape' && supershapeParams) {
      supershapeParams.style.display = 'inline';
    }
    
    updatePreviewBox();
  });

  // Add input listeners for live updates
  const circlePolySides = document.getElementById('circlePolySides');
  if (circlePolySides) {
    circlePolySides.addEventListener('input', function() {
      document.getElementById('circlePolySidesLabel').textContent = `Sides: ${this.value}`;
      updatePreviewBox();
    });
  }
  
  const supershapeSliders = document.querySelectorAll('#supershapeParametersForPanel input[type="range"]');
  supershapeSliders.forEach(slider => {
    slider.addEventListener('input', updatePreviewBox);
  });

  // Show initial panel based on selection and trigger change for consistency
  const initialValue = circleSelect.value;
  if (initialValue === 'polygon' && polygonParams) {
    polygonParams.style.display = 'inline';
  } else if (initialValue === 'supershape' && supershapeParams) {
    supershapeParams.style.display = 'inline';
  }
  
  circleSelect.dispatchEvent(new Event('change'));
});