init();

function init(){

    // Initialize Paper.js
  // Ensure Paper.js is properly initialized
  paper.install(window);

  canvas = document.getElementById('nibgliderCanvas');
  paper.setup(canvas);

  mousePt = new paper.Point(paper.view.size.width / 2, paper.view.size.height / 2);

  registerEventListeners();

  // Removed: Initialize input manager (handles all event listeners)
  // if (window.InputManager) {
  //   window.InputManager.init();
  // }
}

function registerEventListeners() {
  // Event listeners will be added here

  // NEW: Stroke UI controls
  const strokeColorWell = document.getElementById('strokeColorWell');
  const strokeWidthSlider = document.getElementById('strokeWidthSlider');
  const strokeWidthDisplay = document.getElementById('strokeWidthDisplay');

  if (strokeWidthSlider) {
    strokeWidthSlider.addEventListener('input', function() {
      const newWidth = parseFloat(this.value);
      globalStrokeWidth = newWidth;
      strokeWidthDisplay.textContent = newWidth.toFixed(1) + ' pt';
      // Update previews/paths via existing func
      changeStrokeWidth(newWidth);
      updateTextContent();
    });
  }

  if (strokeColorWell) {
    strokeColorWell.addEventListener('input', function() {
      changeStrokeColor(this.value);
    });
    // NEW: Sync global to UI on load
    strokeColorWell.value = window.globalStrokeColor;
    console.log('Stroke color well initialized to:', window.globalStrokeColor);
  }

  // NEW: Fill UI control
  const fillColorWell = document.getElementById('fillColorWell');
  if (fillColorWell) {
    fillColorWell.addEventListener('input', function() {
      changeFillColor(this.value);
    });
    // INIT: Sync UI to global on load
    fillColorWell.value = window.globalFillColor;
    console.log('Fill color well initialized to:', window.globalFillColor);
  }

  // NEW: Stroke/fill checkboxes
  const strokeCheckbox = document.getElementById('strokeEnabledCheckbox');
  const fillCheckbox = document.getElementById('fillEnabledCheckbox');
  if (strokeCheckbox) {
    strokeCheckbox.checked = strokeEnabled;
    strokeCheckbox.addEventListener('change', function() {
      strokeEnabled = this.checked;
      if (!strokeEnabled && !fillEnabled) {
        fillEnabled = true;
        if (fillCheckbox) fillCheckbox.checked = true;
      }
      updateCurrentDrawingStyles();
    });
  }
  if (fillCheckbox) {
    fillCheckbox.checked = fillEnabled;
    fillCheckbox.addEventListener('change', function() {
      fillEnabled = this.checked;
      if (!fillEnabled && !strokeEnabled) {
        strokeEnabled = true;
        if (strokeCheckbox) strokeCheckbox.checked = true;
      }
      updateCurrentDrawingStyles();
    });
  }

  // NEW: Circle shape controls (moved from inputmanager.js)
  const circleInnerShapeSelect = document.getElementById('circleInnerShapeSelect');
  const circlePolySidesSlider = document.getElementById('circlePolySides');
  const circlePolySidesLabel = document.getElementById('circlePolySidesLabel');
  const supershapeSliders = document.querySelectorAll('#supershapeParametersForPanel input[type="range"]');
  const paramMaps = {
    'supershapeM1': 'm',
    'supershapeN1': 'n1',
    'supershapeN2': 'n2',
    'supershapeN3': 'n3',
    'supershapeA1': 'a1',
    'supershapeA2': 'a2'
  };

  if (circleInnerShapeSelect) {
    circleInnerShapeSelect.addEventListener('change', function(event) {
      const selectVal = event.target.value;
      circleInnerShapeType = selectVal;
      const polygonParams = document.getElementById('regularPolygonParametersForPanel');
      const supershapeParams = document.getElementById('supershapeParametersForPanel');
      if (polygonParams) polygonParams.style.display = 'none';
      if (supershapeParams) supershapeParams.style.display = 'none';
      if (selectVal === 'polygon' && polygonParams) {
        polygonParams.style.display = 'inline';
      } else if (selectVal === 'supershape' && supershapeParams) {
        supershapeParams.style.display = 'inline';
      }
      if (window.updatePreviewBox) window.updatePreviewBox();
      updateTextContent();
    });
  }

  if (circlePolySidesSlider) {
    circlePolySidesSlider.addEventListener('input', function(event) {
      if (circlePolySidesLabel) {
        circlePolySidesLabel.textContent = `Sides: ${event.target.value}`;
      }
      circleInnerShapeParams.sides = parseInt(event.target.value);
      if (window.updatePreviewBox) window.updatePreviewBox();
      updateTextContent();
    });
  }

  supershapeSliders.forEach(slider => {
    slider.addEventListener('input', function(event) {
      const sliderEl = event.target;
      const paramKey = sliderEl.id.replace('supershape', '').toLowerCase();
      const label = document.getElementById(sliderEl.id + 'Label');
      if (label && paramKey) {
        const value = parseFloat(sliderEl.value).toFixed(1);
        label.textContent = `${paramKey.toUpperCase()}: ${value}`;
      }
      const param = paramMaps[sliderEl.id];
      if (param) {
        circleInnerShapeParams[param] = parseFloat(sliderEl.value);
      }
      if (window.updatePreviewBox) window.updatePreviewBox();
      updateTextContent();
    });
  });

  // INIT: Sync UI to globals (expanded)
  if (strokeWidthSlider) strokeWidthSlider.value = globalStrokeWidth;
  if (strokeWidthDisplay) strokeWidthDisplay.textContent = globalStrokeWidth.toFixed(1) + ' pt';
  if (strokeColorWell) {
    strokeColorWell.value = window.globalStrokeColor;  // FIXED: now valid #107cff
    console.log('Stroke color well initialized to:', window.globalStrokeColor);
  }
  if (fillColorWell) {
    fillColorWell.value = window.globalFillColor;
    console.log('Init sync: Fill color well set to:', window.globalFillColor);
  }

  // NEW: Circle controls sync
  if (circleInnerShapeSelect) circleInnerShapeSelect.value = circleInnerShapeType;
  if (circlePolySidesSlider) {
    circlePolySidesSlider.value = circleInnerShapeParams.sides;
    if (circlePolySidesLabel) circlePolySidesLabel.textContent = 'Sides: ' + circleInnerShapeParams.sides;
  }
  supershapeSliders.forEach(slider => {
    const param = paramMaps[slider.id];
    if (param && circleInnerShapeParams[param] !== undefined) {
      slider.value = circleInnerShapeParams[param];
      const paramKey = slider.id.replace('supershape', '').toLowerCase();
      const label = document.getElementById(slider.id + 'Label');
      if (label) {
        label.textContent = `${paramKey.toUpperCase()}: ${circleInnerShapeParams[param].toFixed(1)}`;
      }
    }
  });

  // In registerEventListeners(), ensure updatePreviewBox() is called (already present in listeners)
  // ADD: Initial preview update after controls sync
  if (window.updatePreviewBox) {
    window.updatePreviewBox();
  }
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


// REMOVED: Duplicate circle handlers (moved to shapeGenerators.js)
// circleInnerShapeSelect.addEventListener('change', function() {
//   circleInnerShapeType = this.value;
//   updateTextContent();
// });

// circlePolySidesSlider.addEventListener('input', function() {
//   circleInnerShapeParams.sides = parseInt(this.value);
//   circlePolySidesLabel.textContent = 'Sides: ' + this.value;
//   updateTextContent();
// });

// Init
circleInnerShapeSelect.value = circleInnerShapeType;
circlePolySidesSlider.value = circleInnerShapeParams.sides;
circlePolySidesLabel.textContent = 'Sides: ' + circleInnerShapeParams.sides;



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





function setIsInDragLock(status) {
  _isInDragLock = status;
  updateTextContent();
}



var textItem1 = new paper.PointText({
  content: '',
  point: new paper.Point(600, 40),
  fillColor: "#fff",
  fontSize: '18pt',
  fontWeight: 'normal',
  fontFamily: 'Monospace',
});



function updateTextContent() {

  let lines = [];
  var selectedCount = selectedItems.length;
  if (selectedCount) {
    lines.push('Selected Objects: ' + selectedCount);
  if (_isInDragLock == false) {
    lines.push('Spacebar to begin Drag-Lock');
    lines.push('[ and ] to Scale, ; and \' to Rotate');
  }
  }
  if (_isInDragLock) {
    lines.push('Drag-Lock On ');
      lines.push('Move mouse to drag all selected.  Spacebar to release.');
        lines.push('W to Stamp, [ and ] to Scale, ; and \' to Rotate');
  }
  let instruction = '';
  if (isDrawingPath) {
    lines.push('Drawing Polyline');
    instruction = 'F = sharp point, G = spline(tension:' + splineTension.toFixed(1) + ') ';
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


// When adding an item to selectedItems
function addItemToSelection(item) {
    item.selected = true;
    selectedItems.push(item);
  
  }
  
  // When removing an item from selectedItems
  function removeItemFromSelection(item) {
    const index = selectedItems.indexOf(item);
    if (index !== -1) {
      item.selected = false;
      selectedItems.splice(index, 1);
    }
  }

 function collectiveBounds(selectedItems) {
    var bounds = null;
    for (var i = 0; i < selectedItems.length; i++) {
      if (bounds === null) {
        bounds = selectedItems[i].bounds.clone();
      } else {
        bounds = bounds.unite(selectedItems[i].bounds);
      }
    }
    return bounds;
  }
  
  function collectiveCenter(selectedItems) {
    var bounds = collectiveBounds(selectedItems);
    return bounds ? bounds.center : new paper.Point(0, 0);
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
      if (isDrawingPath || isDrawingShape || isDrawingQuad) {
        stampCurrentPreview();  // Stamp WITHOUT ending drawing
      } else {
        stampItems(selectedItems);
      }
    }

  // Drawing keys - delegate to drawingTools.js
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
    polyLineKC();
    return;
  }
  if (keyLower == 'g') {
    splinePointKC();
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

  // Spline tension controls
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
      splineTension = splineTensionDefault;
      updateTextContent();
      return;
    }
  }


  if (keyLower == 'c') {
    thinStrokeWidth();  // Always global/previews/UI
    if (selectedItems.length > 0) {
      for (let i = 0; i < selectedItems.length; i++) {
        if (selectedItems[i].strokeWidth !== undefined) {
          selectedItems[i].strokeWidth = Math.max(1, selectedItems[i].strokeWidth - 1);
        }
      }
    }
    return;
  }
  if (keyLower == 'v') {
    thickenStrokeWidth();  // Always global/previews/UI
    if (selectedItems.length > 0) {
      for (let i = 0; i < selectedItems.length; i++) {
        if (selectedItems[i].strokeWidth !== undefined) {
          selectedItems[i].strokeWidth = Math.min(maxStrokeWidth, selectedItems[i].strokeWidth + 1);
        }
      }
    }
    return;
  }


  if (isDrawingPath || isDrawingShape || isDrawingQuad) {
    // REMOVED: mode-specific if (keyLower == 'r') ... if(event.key === 'e') ... if(keyLower == 's') ... if(keyLower == 'a') ...
    // REPLACED BY:
    if (keyLower === 'r' || keyLower === 'e' || keyLower === 's' || keyLower === 'a') {
      endPathOrShape();
    }
  }

  // Toggle stroke/fill (only when not drawing)
  if (!isDrawingPath && !isDrawingShape && !isDrawingQuad) {
    if (keyLower === 'r') {
      strokeEnabled = !strokeEnabled;  // Toggle first
      if (!strokeEnabled && !fillEnabled) {
        fillEnabled = true;  // Enforce at least one
      }
      const strokeCheckbox = document.getElementById('strokeEnabledCheckbox');
      if (strokeCheckbox) strokeCheckbox.checked = strokeEnabled;
      updateCurrentDrawingStyles();
      updateTextContent();
      return;
    }
    if (keyLower === 't') {
      fillEnabled = !fillEnabled;  // Toggle first
      if (!fillEnabled && !strokeEnabled) {
        strokeEnabled = true;  // Enforce at least one
      }
      const fillCheckbox = document.getElementById('fillEnabledCheckbox');
      if (fillCheckbox) fillCheckbox.checked = fillEnabled;
      updateCurrentDrawingStyles();
      updateTextContent();
      return;
    }
  }

  if (event.key === 'q') {
    cancelCurrentDrawingOperation();
  }

   if (event.key === 'Escape') {
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


// Expose functions globally for InputManager access
window.onKeyDown = function(event) {
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
      if (isDrawingPath || isDrawingShape || isDrawingQuad) {
        stampCurrentPreview();  // Stamp WITHOUT ending drawing
      } else {
        stampItems(selectedItems);
      }
    }

  // Drawing keys - delegate to drawingTools.js
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
    polyLineKC();
    return;
  }
  if (keyLower == 'g') {
    splinePointKC();
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

  // Spline tension controls
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
      splineTension = splineTensionDefault;
      updateTextContent();
      return;
    }
  }

  // Stroke width controls
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
    thinStrokeWidth();  // Always global/previews/UI
    if (selectedItems.length > 0) {
      for (let i = 0; i < selectedItems.length; i++) {
        if (selectedItems[i].strokeWidth !== undefined) {
          selectedItems[i].strokeWidth = Math.max(1, selectedItems[i].strokeWidth - 1);
        }
      }
    }
    return;
  }
  if (keyLower == 'v') {
    thickenStrokeWidth();  // Always global/previews/UI
    if (selectedItems.length > 0) {
      for (let i = 0; i < selectedItems.length; i++) {
        if (selectedItems[i].strokeWidth !== undefined) {
          selectedItems[i].strokeWidth = Math.min(maxStrokeWidth, selectedItems[i].strokeWidth + 1);
        }
      }
    }
    return;
  }


  if (isDrawingPath || isDrawingShape || isDrawingQuad) {
    // REMOVED: mode-specific if (keyLower == 'r') ... if(event.key === 'e') ... if(keyLower == 's') ... if(keyLower == 'a') ...
    // REPLACED BY:
    if (keyLower === 'r' || keyLower === 'e' || keyLower === 's' || keyLower === 'a') {
      endPathOrShape();
    }
  }

  // Toggle stroke/fill (only when not drawing)
  if (!isDrawingPath && !isDrawingShape && !isDrawingQuad) {
    if (keyLower === 'r') {
      strokeEnabled = !strokeEnabled;  // Toggle first
      if (!strokeEnabled && !fillEnabled) {
        fillEnabled = true;  // Enforce at least one
      }
      const strokeCheckbox = document.getElementById('strokeEnabledCheckbox');
      if (strokeCheckbox) strokeCheckbox.checked = strokeEnabled;
      updateCurrentDrawingStyles();
      updateTextContent();
      return;
    }
    if (keyLower === 't') {
      fillEnabled = !fillEnabled;  // Toggle first
      if (!fillEnabled && !strokeEnabled) {
        strokeEnabled = true;  // Enforce at least one
      }
      const fillCheckbox = document.getElementById('fillEnabledCheckbox');
      if (fillCheckbox) fillCheckbox.checked = fillEnabled;
      updateCurrentDrawingStyles();
      updateTextContent();
      return;
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

};

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

// NEW: Apply current styles to previews/paths respecting flags
function updateCurrentDrawingStyles() {
  const strokeWidth = strokeEnabled ? globalStrokeWidth : 0;
  const strokeColor = strokeEnabled ? window.globalStrokeColor : null;
  const fillColor = fillEnabled ? window.globalFillColor : null;

  // Apply to ALL live previews consistently
  [path, previewShape, quadPath, previewPath, previewRect].forEach(item => {
    if (item) {
      item.strokeWidth = strokeWidth;
      item.strokeColor = strokeColor;
      item.fillColor = fillColor;
    }
  });
}
