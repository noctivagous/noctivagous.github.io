function changeStrokeWidth(strokeVal) {
  var localStrokeVal = strokeVal;

  if (localStrokeVal < 1) {
    localStrokeVal = 1;
  }
  if (localStrokeVal > maxStrokeWidth) {
    localStrokeVal = maxStrokeWidth;
  }

  globalStrokeWidth = localStrokeVal;
  updateTextContent();  // Always update display

  if (path) {
    path.strokeWidth = localStrokeVal;
  }
  if (previewShape) {
    previewShape.strokeWidth = localStrokeVal;
  }
  if (quadPath) {
    quadPath.strokeWidth = localStrokeVal;
  }
}

function thinStrokeWidth() {
  changeStrokeWidth(globalStrokeWidth - 1);



}

function thickenStrokeWidth() {
  changeStrokeWidth(globalStrokeWidth + 1);
}


function stampItems(itemsToStamp) {

  if (itemsToStamp === null) {
    return;
  }

  for (var i = 0; i < itemsToStamp.length; i++) {
    var clone = itemsToStamp[i].clone();
    clone.selected = false; // Optionally deselect the clone
    project.activeLayer.addChild(clone);
  }
}

function cancelCurrentDrawingOperation()
{
  // In cancelCurrentDrawingOperation(), add:
if (previewInner) {
  previewInner.remove();
  previewInner = null;
}

  if (isDrawingPath && path) {
    path.remove();
    path = null;
    isDrawingPath = false;
  }
  if (isDrawingShape) {
    if (previewShape) {
      previewShape.remove();
    }
    if (previewLine) {
      previewLine.remove();
    }
    previewShape = null;
    previewLine = null;
    isDrawingShape = false;
    shapeType = null;
    shapeStartPoint = null;
  }
  if (previewPath) {
    previewPath.remove();
    previewPath = null;
  }
  if (previewRect) {
    previewRect.remove();
    previewRect = null;
  }
  if (isDrawingQuad && quadPath) {
    quadPath.remove();
    quadPath = null;
    isDrawingQuad = false;
    quadPointCount = 0;
  }
  shapePt2 = null;
}

function endPathAsStroke() {
  if (path) {
    path.selected = false;
    project.activeLayer.addChild(path);
    isDrawingPath = false;  // renamed
    path = null;
  }
}

function closeShapeAndEnd() {

  if (path) {
    path.closed = true;
    path.selected = false;
    project.activeLayer.addChild(path);
    isDrawingPath = false;  // renamed
    path = null;
  }

}

function closeShapeAndEndWithFillOnly() {

  if (path) {
    path.closed = true;
    path.selected = false;
    path.strokeWidth = 0;
    path.fillColor = new paper.Color(0, 0, 0);
    project.activeLayer.addChild(path);
    isDrawingPath = false;  // renamed
    path = null;
  }


}

function closeShapeAndEndWithFillStroke() {

  if (path) {
    path.closed = true;
    path.selected = false;
    path.fillColor = new paper.Color(0, 0, 0);
    project.activeLayer.addChild(path);
    isDrawingPath = false;  // renamed
    path = null;
  }


}



// GLOBAL SPLINE TENSION (affects new segments only)
var splineTension = 0.5; // 0.0=straight, 1.0=very curved

function polyLineKC() {
  if (!mousePt) return;
  if (!path) {
    path = new paper.Path({
      segments: [mousePt],
      strokeColor: 'black',
      strokeWidth: globalStrokeWidth,
      fullySelected: true
    });
  } else {
    // Add sharp corner (no smoothing)
    var newSegment = path.add(mousePt);
    if (newSegment) {
      newSegment.handleIn = new paper.Point(0, 0);
      newSegment.handleOut = new paper.Point(0, 0);
    }
  }
  if (isDrawingPath == false) {
    isDrawingPath = true;
  }
  updateTextContent();
}

function splinePointKC() {
  if (!mousePt) return;
  if (!path) {
    path = new paper.Path({
      segments: [mousePt],
      strokeColor: 'black',
      strokeWidth: globalStrokeWidth,
      fullySelected: true
    });
  } else {
    // Add new point
    var newSegment = path.add(mousePt);
    
    // Only smooth THIS segment using local Catmull-Rom calculation
    if (newSegment && path.segments.length >= 3) {
      var prev = path.segments[path.segments.length - 3];
      var curr = path.segments[path.segments.length - 2];
      var next = newSegment;
      
      // Local Catmull-Rom handles (tension-controlled)
      var tension = splineTension;
      
      // Calculate handle positions based on neighbors
      var p0 = prev.point;
      var p1 = curr.point;
      var p2 = next.point;
      
      // Incoming handle
      var d01 = p1.subtract(p0);
      var d12 = p2.subtract(p1);
      next.handleIn = d12.multiply(tension * 0.5);
      
      // Outgoing handle  
      curr.handleOut = d01.multiply(tension * 0.5);
      
      // Smooth previous segment too for continuity
      if (curr.handleIn) {
        curr.handleIn = curr.handleOut.multiply(-1);
      }
    }
  }
  if (isDrawingPath == false) {
    isDrawingPath = true;
  }
  updateTextContent();
}

// NEW: Spline tension control during drawing
function decreaseSplineTension() {
  if (isDrawingPath) {
    splineTension = Math.max(0.1, splineTension - 0.1);
    updateTextContent();
  }
}

function increaseSplineTension() {
  if (isDrawingPath) {
    splineTension = Math.min(1.0, splineTension + 0.1);
    updateTextContent();
  }
}

function setSplineTension(val) {
  splineTension = Math.max(0.1, Math.min(1.0, val));
}

// FIX: circleKC - handle existing circle drawing properly and set initial preview
function circleKC(mode) {
  if (shapeType && shapeType.startsWith('circle_')) {
    endShapeAsStroke();  // This now works with proper previewShape.radius
    updateTextContent();
    return;
  }
  
  if (isDrawingShape || !mousePt) return;
  
  shapeStartPoint = mousePt.clone();
  shapeType = 'circle_' + mode;
  isDrawingShape = true;
  
  // FIX: Create proper preview with initial radius 0
  previewShape = new paper.Shape.Circle(shapeStartPoint, 0);
  previewShape.strokeColor = new paper.Color(0.5);
  previewShape.strokeWidth = 1;
  previewShape.strokeDasharray = [4, 4];
  project.activeLayer.addChild(previewShape);
  
  previewLine = new paper.Path({
    segments: [shapeStartPoint, shapeStartPoint],
    strokeColor: new paper.Color(0.5),
    strokeWidth : 1,
    strokeDashArray: [4, 4]
  });
  project.activeLayer.addChild(previewLine);
  updateTextContent();
}

function rectDiagonalKC() {
  if (shapeType === 'rectangle_diagonal') {
    endShapeAsStroke();
    updateTextContent();
    return;
  }
  if (isDrawingShape || !mousePt) return;
  
  shapeStartPoint = mousePt.clone();
  shapeType = 'rectangle_diagonal';
  isDrawingShape = true;
  
  // FIX: Proper initial preview
  previewShape = new paper.Shape.Rectangle(shapeStartPoint, new paper.Size(0, 0));
  previewShape.strokeColor = new paper.Color(0.0);
  previewShape.strokeWidth = globalStrokeWidth;  // ← CHANGE: reflect live stroke
  previewShape.strokeDasharray = [4, 4];
  project.activeLayer.addChild(previewShape);
  
  previewLine = new paper.Path({
    segments: [shapeStartPoint, shapeStartPoint],
    strokeColor: new paper.Color(0.5),
    strokeWidth : 1,
    strokeDashArray: [4, 4]
  });
  project.activeLayer.addChild(previewLine);
  updateTextContent();
}



// ADD: Ensure endShapeAsStroke handles circle radius properly
function endShapeAsStroke() {
  if (!isDrawingShape || shapeType === null) return;
  
  var finalPath;  // DECLARE FIRST
  
  if (shapeType.startsWith('circle_')) {
    // Circle handling (unchanged)
    if (!previewShape || previewShape.radius === 0) return;
    
    const center = previewShape.position;
    const radius = previewShape.radius;
    const strokeW = globalStrokeWidth;
    const iradius = Math.max(0, radius - strokeW / 2);
    
    if (iradius > 0) {
      const innerPath = createInnerShape(center, iradius, 'stroke', shapeGuideAngle);
      if (innerPath) {
        innerPath.selected = false;
        project.activeLayer.addChild(innerPath);
      }
    }
  } else if (shapeType === 'rectangle_diagonal') {
    finalPath = new paper.Path.Rectangle({
      center: previewShape.position,
      size: previewShape.size,
      strokeColor: 'black',
      strokeWidth: globalStrokeWidth,
      strokeCap: 'round',
      strokeJoin: 'round'
    });
  } else if (shapeType === 'rectangle_two_edges') {
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
    finalPath = new paper.Path({
      segments: [pt1, pt2, ptC, ptD],
      closed: true,
      strokeColor: 'black',
      strokeWidth: globalStrokeWidth,
      strokeCap: 'round',
      strokeJoin: 'round'
    });
  } else if (shapeType === 'rectangle_centerline') {
    var pt1 = shapeStartPoint;
    var pt2 = mousePt;
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
    finalPath = new paper.Path({
      segments: [ptA, ptB, ptD, ptC],
      closed: true,
      strokeColor: 'black',
      strokeWidth: globalStrokeWidth,
      strokeCap: 'round',
      strokeJoin: 'round'
    });
  }
  
  // Handle centerline width tracking (moved up)
  if (shapeType === 'rectangle_centerline') {
    lastCenterlineWidth = shapeWidth;
  }
  
  // Add finalPath if it exists
  if (finalPath) {
    finalPath.selected = false;
    project.activeLayer.addChild(finalPath);
    if (previewInner) {
      previewInner.remove();
      previewInner = null;
    }
    drawInnerShape(finalPath, 'stroke');
  }
  
  // Cleanup (unchanged)
  if (previewShape) previewShape.remove();
  if (previewLine) previewLine.remove();
  if (previewPath) {
    previewPath.remove();
    previewPath = null;
  }
  if (previewRect) {
    previewRect.remove();
    previewRect = null;
  }
  isDrawingShape = false;
  shapeType = null;
  shapeStartPoint = null;
  shapePt2 = null;
  previewShape = null;
  previewLine = null;
}

function endShapeFillOnly() {
  if (!isDrawingShape || shapeType === null) return;
  var finalPath;
  if (shapeType.startsWith('circle_')) {
    finalPath = new paper.Path.Circle({
      center: previewShape.position,
      radius: previewShape.radius,
      strokeWidth: 0,
      fillColor: new paper.Color(0, 0, 0)
    });
  } else if (shapeType === 'rectangle_diagonal') {
    finalPath = new paper.Path.Rectangle({
      center: previewShape.position,
      size: previewShape.size,
      strokeWidth: 0,
      fillColor: new paper.Color(0, 0, 0)
    });
  } else if (shapeType === 'rectangle_two_edges') {
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
    finalPath = new paper.Path({
      segments: [pt1, pt2, ptC, ptD],
      closed: true,
      strokeWidth: 0,
      fillColor: new paper.Color(0, 0, 0)
    });
  } else if (shapeType === 'rectangle_centerline') {
    // Same computation as above
    var pt1 = shapeStartPoint;
    var pt2 = mousePt;
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
    finalPath = new paper.Path({
      segments: [ptA, ptB, ptD, ptC],
      closed: true,
      strokeWidth: 0,
      fillColor: new paper.Color(0, 0, 0)
    });
  }
  if (shapeType === 'rectangle_centerline') {
    lastCenterlineWidth = shapeWidth;
  }
  if (finalPath) {
    finalPath.selected = false;
    project.activeLayer.addChild(finalPath);
    // CHANGE: Pass finalPath item instead of bounds
    drawInnerShape(finalPath, 'fill');
  }
  if (previewShape) previewShape.remove();
  if (previewLine) previewLine.remove();
  if (previewPath) {
    previewPath.remove();
    previewPath = null;
  }
  if (previewRect) {
    previewRect.remove();
    previewRect = null;
  }
  isDrawingShape = false;
  shapeType = null;
  shapeStartPoint = null;
  shapePt2 = null;
  previewShape = null;
  previewLine = null;
}

function endShapeFillStroke() {
  if (!isDrawingShape || shapeType === null) return;
  var finalPath;
  if (shapeType.startsWith('circle_')) {
    finalPath = new paper.Path.Circle({
      center: previewShape.position,
      radius: previewShape.radius,
      strokeColor: 'black',
      strokeWidth: globalStrokeWidth,
      fillColor: new paper.Color(0, 0, 0),
      strokeCap: 'round',
      strokeJoin: 'round'
    });
  } else if (shapeType === 'rectangle_diagonal') {
    finalPath = new paper.Path.Rectangle({
      center: previewShape.position,
      size: previewShape.size,
      strokeColor: 'black',
      strokeWidth: globalStrokeWidth,
      fillColor: new paper.Color(0, 0, 0),
      strokeCap: 'round',
      strokeJoin: 'round'
    });
  } else if (shapeType === 'rectangle_two_edges') {
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
    finalPath = new paper.Path({
      segments: [pt1, pt2, ptC, ptD],
      closed: true,
      strokeColor: 'black',
      strokeWidth: globalStrokeWidth,
      fillColor: new paper.Color(0, 0, 0),
      strokeCap: 'round',
      strokeJoin: 'round'
    });
  } else if (shapeType === 'rectangle_centerline') {
    // Same computation
    var pt1 = shapeStartPoint;
    var pt2 = mousePt;
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
    finalPath = new paper.Path({
      segments: [ptA, ptB, ptD, ptC],
      closed: true,
      strokeColor: 'black',
      strokeWidth: globalStrokeWidth,
      fillColor: new paper.Color(0, 0, 0),
      strokeCap: 'round',
      strokeJoin: 'round'
    });
  }
  if (shapeType === 'rectangle_centerline') {
    lastCenterlineWidth = shapeWidth;
  }
  if (finalPath) {
    finalPath.selected = false;
    project.activeLayer.addChild(finalPath);
    // CHANGE: Pass finalPath item instead of bounds
    drawInnerShape(finalPath, 'fillstroke');
  }
  if (previewShape) previewShape.remove();
  if (previewLine) previewLine.remove();
  if (previewPath) {
    previewPath.remove();
    previewPath = null;
  }
  if (previewRect) {
    previewRect.remove();
    previewRect = null;
  }
  isDrawingShape = false;
  shapeType = null;
  shapeStartPoint = null;
  shapePt2 = null;
  previewShape = null;
  previewLine = null;
}

function stampCurrentShape() {
  if (!isDrawingShape || shapeType === null) return;
  var finalPath;
  if (shapeType.startsWith('circle_')) {
    // FIX: Match endShapeAsStroke() exactly - only stamp inner shape if iradius > 0
    const center = previewShape.position;
    const radius = previewShape.radius;
    const strokeW = globalStrokeWidth;
    const iradius = Math.max(0, radius - strokeW / 2);
    
    if (iradius > 0) {
      const innerPath = createInnerShape(center, iradius, 'stroke', shapeGuideAngle);
      if (innerPath) {
        innerPath.selected = false;
        project.activeLayer.addChild(innerPath);
      }
    }
    // NO finalPath for circle - preview continues
    return; // Early return after circle stamping
  } else if (shapeType === 'rectangle_diagonal') {
    finalPath = new paper.Path.Rectangle({
      center: previewShape.position,
      size: previewShape.size,
      strokeColor: 'black',
      strokeWidth: globalStrokeWidth,
      strokeCap: 'round',
      strokeJoin: 'round'
    });
  } else if (shapeType === 'rectangle_two_edges') {
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
    finalPath = new paper.Path({
      segments: [pt1, pt2, ptC, ptD],
      closed: true,
      strokeColor: 'black',
      strokeWidth: globalStrokeWidth,
      strokeCap: 'round',
      strokeJoin: 'round'
    });
  } else if (shapeType === 'rectangle_centerline') {
    // Same computation as endShapeAsStroke
    var pt1 = shapeStartPoint;
    var pt2 = mousePt;
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
    finalPath = new paper.Path({
      segments: [ptA, ptB, ptD, ptC],
      closed: true,
      strokeColor: 'black',
      strokeWidth: globalStrokeWidth,
      strokeCap: 'round',
      strokeJoin: 'round'
    });
  }
  // ADD: Handle supershape and regular polygon stamping
  else if (previewInner && (rectangleInnerShapeType === 'supershape' || rectangleInnerShapeType === 'regularPolygon' || rectangleInnerShapeType === 'polygon')) {
    // Clone the preview inner shape directly
    const stampedInner = previewInner.clone();
    stampedInner.selected = false;
    stampedInner.strokeColor = 'black';
    stampedInner.strokeWidth = globalStrokeWidth * 0.7;
    stampedInner.strokeCap = 'round';
    stampedInner.strokeJoin = 'round';
    stampedInner.fillColor = null; // stroke only for consistency
    project.activeLayer.addChild(stampedInner);
  }
  if (finalPath) {
    finalPath.selected = false;
    project.activeLayer.addChild(finalPath);
    // ADD: Draw inner shape for stamped items
    drawInnerShape(finalPath, 'stroke');
  }
  // preview state continues
}

function rectTwoEdgesKC() {
  if (shapeType === 'rectangle_two_edges') {
    if (shapePt2 === null) {
      // Second press: fix pt2, enter phase 2
      shapePt2 = mousePt.clone();
      previewPath.segments[1].point = shapePt2;
      previewLine.firstSegment.point = shapePt2;
      previewLine.lastSegment.point = shapePt2;
      previewRect = new paper.Path({
        segments: [
          shapeStartPoint,
          shapePt2,
          shapePt2,
          shapeStartPoint
        ],
        closed: true,
        strokeColor: 'black',
        strokeWidth: globalStrokeWidth,
        fullySelected: true
      });
      project.activeLayer.addChild(previewRect);
    } else {
      // Third press: end
      endShapeAsStroke();
      updateTextContent();
    }
    updateTextContent(); // ADD: Show drawing instructions
    return;
  }
  if (isDrawingShape || !mousePt) return;
  shapeStartPoint = mousePt.clone();
  shapeType = 'rectangle_two_edges';
  shapePt2 = null;
  isDrawingShape = true;
  previewShape = null;
  previewPath = new paper.Path({
    segments: [shapeStartPoint],
    strokeColor: 'black',
    strokeWidth: globalStrokeWidth,
    fullySelected: true
  });
  project.activeLayer.addChild(previewPath);
  previewLine = new paper.Path({
    segments: [shapeStartPoint, shapeStartPoint],
    strokeColor: new paper.Color(0.5),
    strokeWidth: 1,
    strokeDasharray: [4, 4]
  });
  project.activeLayer.addChild(previewLine);
  updateTextContent(); // ADD: Show drawing instructions
}

function rectCenterlineKC() {
  // FIX: Don't cancel if already drawing this shape
  if (shapeType === 'rectangle_centerline') {
    endShapeAsStroke();
    updateTextContent();
    return;
  }
  if (isDrawingShape) {
    cancelCurrentDrawingOperation();
  }
  if (!mousePt) return;
  shapeStartPoint = mousePt.clone();
  shapeType = 'rectangle_centerline';
  shapeWidth = lastCenterlineWidth;
  isDrawingShape = true;
  previewShape = null;
  previewPath = null;
  previewLine = new paper.Path({
    segments: [shapeStartPoint, shapeStartPoint],
    strokeColor: new paper.Color(0.5),
    strokeWidth: 1,
    strokeDasharray: [4, 4]
  });
  project.activeLayer.addChild(previewLine);
  previewRect = new paper.Path({
    segments: [
      shapeStartPoint,
      shapeStartPoint,
      shapeStartPoint,
      shapeStartPoint
    ],
    closed: true,
    strokeColor: 'black',
    strokeWidth: globalStrokeWidth,
    fullySelected: true
  });
  project.activeLayer.addChild(previewRect);
  previewRect.fullySelected = false;
  previewRect.strokeCap = 'round';
  previewRect.strokeJoin = 'round';
  updateTextContent(); // ADD: Show drawing instructions
}


function quadPointKC() {
  if (!mousePt) return;
  if (!quadPath) {
    quadPath = new paper.Path({
      segments: [mousePt],
      strokeColor: 'black',
      strokeWidth: globalStrokeWidth,
      fullySelected: true
    });
    quadPointCount = 1;
    isDrawingQuad = true;
  } else {
    quadPath.add(mousePt);
    quadPointCount++;
    if (quadPointCount === 4) {
      quadPath.closed = true;
      quadPath.selected = false;
      project.activeLayer.addChild(quadPath);
      // CHANGE: Pass quadPath item instead of bounds
      drawInnerShape(quadPath, 'stroke');
      quadPath = null;
      isDrawingQuad = false;
      quadPointCount = 0;
      updateTextContent();
      return;
    }
  }
  updateTextContent();
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
  
  function clearOutSelection() {
    // If nothing is underneath the cursor, clear the selection
    for (var i = 0; i < selectedItems.length; i++) {
      selectedItems[i].selected = false;
    }
    selectedItems = [];
  
  
  }

// Update createRegularPolygon() to align vertex with mouse direction:
function createRegularPolygon(center, radius, sides, mouseAngle = 0) {
  const path = new paper.Path();
  const angleStep = (Math.PI * 2) / sides;
  // Start first vertex at mouse direction (convert degrees to radians)
  const startAngleRad = mouseAngle * Math.PI / 180;
  
  for (let i = 0; i < sides; i++) {
    let angle = startAngleRad + (angleStep * i);
    path.add(new paper.Point(
      center.x + radius * Math.cos(angle),
      center.y + radius * Math.sin(angle)
    ));
  }
  path.closed = true;
  path.strokeCap = 'round';
  path.strokeJoin = 'round';
  return path;
}

// ADD: Supershape radius calculation function (before createSupershape)
function supershapeRadius(phi, m, n1, n2, n3) {
  const abs = Math.abs;
  const cos = Math.cos;
  const sin = Math.sin;
  const pow = Math.pow;
  
  let r1 = abs(cos(m * phi / 4));
  let r2 = abs(sin(m * phi / 4));
  r1 = pow(r1, n2);
  r2 = pow(r2, n3);
  let r = pow(r1 + r2, -1 / n1);
  
  return r || 0;
}

// Update createSupershape():
function createSupershape(center, radius, params, rotationAngle = 0) {
 
  var rotationRad = rotationAngle * Math.PI / 180;
  const path = new paper.Path();
  const steps = 360;
  const { m = 5, n1 = 0.2, n2 = 1.7, n3 = 1.7 } = params;
  
  for (let i = 0; i <= steps; i++) {
    let phi = (i / steps) * Math.PI * 2;
    
    const r = supershapeRadius(phi, m, n1, n2, n3);
    // FIX: Proper scaling - multiply by radius parameter
    const scaledR = radius * (r || 0);
    path.add(new paper.Point(
      center.x + scaledR * Math.cos(phi + rotationRad),
      center.y + scaledR * Math.sin(phi + rotationRad)
    ));
  }
  path.closed = true;
  path.strokeCap = 'round';
  path.strokeJoin = 'round';
  return path;
}




// NEW: Rotate shape to mouse direction
function rotateShapeToMouseDirection(shape, center, mousePt) {
  if (!mousePt || !center) return;
  const delta = mousePt.subtract(center);
  const angleRad = Math.atan2(delta.y, delta.x);
  const angleDeg = angleRad * 180 / Math.PI;
  shape.rotate(angleDeg, center);
}

// ADD: Global variables for rectangle inner shapes (before other functions)
var rectangleInnerShapeType = 'rectangle';
var rectangleInnerShapeParams = {};

// Update createInnerShape(center, radius, styleOrPreview, rotationAngle = 0):
function createInnerShape(center, radius, styleOrPreview = 'stroke', rotationAngle = 0) {
  const isPreview = styleOrPreview === 'preview';
  const hasStroke = !isPreview && (styleOrPreview === 'stroke' || styleOrPreview === 'fillstroke');
  const hasFill = !isPreview && (styleOrPreview === 'fill' || styleOrPreview === 'fillstroke');
  let path;
  
  // FIX: Use correct variables in switch
  const useCircleInner = shapeType && shapeType.startsWith('circle_');
  const currentInnerType = useCircleInner ? circleInnerShapeType : (shapeType?.startsWith('rectangle_') ? rectangleInnerShapeType : innerShapeType);
  const currentInnerParams = useCircleInner ? circleInnerShapeParams : (shapeType?.startsWith('rectangle_') ? rectangleInnerShapeParams : innerShapeParams);
  
  switch (currentInnerType) {
    case 'circle':
      path = new paper.Path.Circle(center, radius);
      break;
    case 'rectangle':
      path = new paper.Path.Rectangle({
        center: center,
        size: new paper.Size(radius * 1.4, radius * 1.4)
      });
      break;
    case 'rightTriangle':
      // Right triangle A: corner-based, point at top
      path = new paper.Path({
        segments: [
          center.add(new paper.Point(-radius * 0.7, radius * 0.7)), 
          center.add(new paper.Point(radius * 0.7, radius * 0.7)), 
          center.add(new paper.Point(0, -radius * 0.7))
        ],
        closed: true
      });
      break;
    case 'rightTriangleB':
      // Right triangle B: base spans bottom edge
      path = new paper.Path({
        segments: [
          center.add(new paper.Point(-radius * 0.9, radius * 0.5)),  // left base
          center.add(new paper.Point(radius * 0.9, radius * 0.5)),  // right base  
          center.add(new paper.Point(0, -radius * 0.9))             // apex top
        ],
        closed: true
      });
      break;
    case 'regularTriangle':
      path = createRegularPolygon(center, radius, 3, rotationAngle);
      break;
    case 'regularPolygon':
      path = createRegularPolygon(center, radius, currentInnerParams.sides || 6, rotationAngle);
      break;
    case 'polygon':
      path = createRegularPolygon(center, radius, currentInnerParams.sides || 6, rotationAngle);
      break;
    case 'supershape':
      path = createSupershape(center, radius, currentInnerParams, rotationAngle);
      break;
  }
  
  if (path) {
    if (isPreview) {
      // Preview: thin black dashed (matches global stroke style, not gray)
      path.strokeColor = 'black';
      path.strokeWidth = 1;
      path.strokeDasharray = [3, 3];
      path.opacity = 0.7;
      path.fillColor = null;
    } else {
      // Final: use global stroke width/color
      path.strokeColor = hasStroke ? 'black' : null;
      path.strokeWidth = hasStroke ? globalStrokeWidth * 0.7 : 0;
      path.fillColor = hasFill ? new paper.Color(0, 0, 0) : null;
      path.strokeCap = 'round';
      path.strokeJoin = 'round';
    }
  }
  return path;
}

// Update drawInnerShape to use it:
function drawInnerShape(frameItem, style) {
 if ((shapeType && shapeType.startsWith('rectangle_') && rectangleInnerShapeType === 'rectangle') || 
     (!shapeType && innerShapeType === 'none') ||
     quadPath ||
     (shapeType && shapeType.startsWith('rectangle_diagonal')) ||  // ← CHANGE: startsWith instead of ===
     (shapeType === 'rectangle_diagonal')) return;  // Keep original for safety



  const strokeW = frameItem.strokeWidth || globalStrokeWidth;
  let center, iradius;
  
  if (typeof frameItem.radius !== 'undefined') {
    // Circle frame
    center = frameItem.position;
    iradius = Math.max(0, frameItem.radius - strokeW / 2);
    const innerPath = createInnerShape(center, iradius, style, shapeGuideAngle);
    if (innerPath) {
      innerPath.selected = false;
      project.activeLayer.addChild(innerPath);
    }
    return;
  }
  
  const bounds = frameItem.bounds;
  if (!bounds || bounds.width <= 0 || bounds.height <= 0) return;
  
  const inset = strokeW * 1.5;
  const bx = bounds.x + inset, by = bounds.y + inset;
  const bw = bounds.width - 2 * inset, bh = bounds.height - 2 * inset;
  const innerBounds = new paper.Rectangle(bx, by, bw, bh);
  
  if (innerBounds.width <= 0 || innerBounds.height <= 0) return;
  center = innerBounds.center;
  iradius = Math.min(innerBounds.width, innerBounds.height) / 2 * 0.9;
  
  const innerPath = createInnerShape(center, iradius, style, shapeGuideAngle);
  if (innerPath) {
    innerPath.selected = false;
    project.activeLayer.addChild(innerPath);
  }
}

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
      previewInner = createInnerShape(center, radius, 'preview', shapeGuideAngle);
      if (previewInner) project.activeLayer.addChild(previewInner);
    }
  }
}

