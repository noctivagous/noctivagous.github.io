// Drawing mode flags
var isDrawingPath = false;
var isDrawingShape = false;
var isDrawingQuad = false;

// Shape drawing state
var shapeType = null;  // 'circle_radius' or 'circle_diameter'
var shapeStartPoint = null;
var shapePt2 = null;
var shapeWidth = 90;
var maxShapeWidth = 200;
var quadPath;
var quadPointCount = 0;

// Add global:
shapeGuideAngle = 0;
var lastCenterlineWidth = 80;


// Shape preview and drawing state
var previewInner = null;
var previewShape = null;
var previewLine = null;
var previewPath = null;
var previewRect = null;


innerShapeType = 'polygon';  // 'none', 'circle', 'polygon', 'supershape'
innerShapeParams = {
  sides: 6,     // for polygon
  m: 3,         // for supershape
  n1: 0.2,
  n2: 1.7,
  n3: 1.7
};

var polygonRadiusMode = 'inradius';  // 'circumradius' or 'inradius' (default: circumradius)






// Path objects
var path;


// Mouse and drawing state
var mousePt;
var lastMousePt = null;






// Rectangle frame state
var rectangleInnerShapeType = 'rectangle';  // 'rectangle', 'rightTriangle', 'regularTriangle'





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
    if (previewPath) {
      previewPath.remove();
      previewPath = null;
    }
    if (previewRect) {
      previewRect.remove();
      previewRect = null;
    }
    if (previewInner) {
      previewInner.remove();
      previewInner = null;
    }
    previewShape = null;
    previewLine = null;
    isDrawingShape = false;
    shapeType = null;
    shapeStartPoint = null;
    shapePt2 = null;
  }
  if (isDrawingQuad && quadPath) {
    quadPath.remove();
    quadPath = null;
    isDrawingQuad = false;
    quadPointCount = 0;
  }
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
    case 'polygon':
      path = createRegularPolygon(center, radius, currentInnerParams.sides || 6, rotationAngle, polygonRadiusMode);
       // Add 180° rotation for circle_diameter mode
       // for the benefit of the circle tool when it makes
       // regular polygons
      if (shapeType === 'circle_diameter') {
        path.rotate(180, center);
      }
      break;
    case 'supershape':
      path = createSupershape(center, radius, currentInnerParams, rotationAngle);
      break;
  }
  
  if (path) {
    if (isPreview) {
      // Preview: thin black dashed (matches global stroke style, not gray)
      path.strokeColor = window.globalStrokeColor;
      path.strokeWidth = window.globalStrokeWidth;
      path.strokeDasharray = [3, 3];
      path.opacity = 0.7;
      path.fillColor = null;
    } else {
      // Final: use global stroke width/color
      path.strokeColor = hasStroke ? window.globalStrokeColor : null;
      path.strokeWidth = hasStroke ? globalStrokeWidth * 0.7 : 0;
      path.fillColor = hasFill ? window.globalFillColor : null;
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

// NEW: Missing rectangle centerline key command
function rectCenterlineKC() {
  if (shapeType === 'rectangle_centerline') {
    endShapeAsStroke();
    updateTextContent();
    return;
  }
  if (isDrawingShape) cancelCurrentDrawingOperation();
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
    segments: [shapeStartPoint, shapeStartPoint, shapeStartPoint, shapeStartPoint],
    closed: true,
    strokeColor: window.globalStrokeColor,  // Uses corrected #107cff
    strokeWidth: globalStrokeWidth
  });
  project.activeLayer.addChild(previewRect);
  previewRect.strokeCap = 'round';
  previewRect.strokeJoin = 'round';
  updateTextContent();
}

// NEW: Missing rectangle two edges key command  
function rectTwoEdgesKC() {
  if (shapeType === 'rectangle_two_edges') {
    if (shapePt2 === null) {
      shapePt2 = mousePt.clone();
      if (previewPath) previewPath.add(shapePt2);
      previewLine.firstSegment.point = shapePt2;
      previewLine.lastSegment.point = shapePt2;
      // Create preview rect
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
      previewRect = new paper.Path({
        segments: [pt1, pt2, ptC, ptD],
        closed: true,
        strokeColor: window.globalStrokeColor,  // Uses corrected #107cff
        strokeWidth: globalStrokeWidth
      });
      project.activeLayer.addChild(previewRect);
      updateTextContent();  // Update instruction to show "Moving the line adjusts the second edge"
    } else {
      endShapeAsStroke();
    }
    return;
  }
  if (isDrawingShape || !mousePt) return;
  shapeStartPoint = mousePt.clone();
  shapeType = 'rectangle_two_edges';
  shapePt2 = null;
  isDrawingShape = true;
  previewPath = new paper.Path({
    segments: [shapeStartPoint],
    strokeColor: window.globalStrokeColor,  // Uses corrected #107cff
    strokeWidth: globalStrokeWidth
  });
  project.activeLayer.addChild(previewPath);
  previewLine = new paper.Path({
    segments: [shapeStartPoint, shapeStartPoint],
    strokeColor: new paper.Color(0.5),
    strokeWidth: 1,
    strokeDasharray: [4, 4]
  });
  project.activeLayer.addChild(previewLine);
  updateTextContent();
}

// NEW: Missing quad point key command
function quadPointKC() {
  if (!mousePt) return;
  if (!quadPath) {
    quadPath = new paper.Path({
      segments: [mousePt],
      strokeColor: window.globalStrokeColor,  // Uses corrected #107cff
      strokeWidth: globalStrokeWidth,
      fullySelected: true
    });
    quadPointCount = 1;
    isDrawingQuad = true;
  } else {
    quadPath.add(mousePt);
    quadPointCount++;
    if (quadPointCount === 4) {
      applyCurrentStyles(quadPath);
      quadPath.closed = true;
      quadPath.selected = false;
      project.activeLayer.addChild(quadPath);
      quadPath = null;
      isDrawingQuad = false;
      quadPointCount = 0;
      updateTextContent();
      return;
    }
  }
  updateTextContent();
}

// NEW: Stamp current preview WITHOUT ending drawing mode
function stampCurrentPreview() {
  if (isDrawingPath && path) {
    // Stamp path preview
    const stamped = path.clone();
    applyCurrentStyles(stamped);
    if (fillEnabled) stamped.closed = true;
    stamped.selected = false;
    stamped.strokeDasharray = null;
    stamped.opacity = 1;
    project.activeLayer.addChild(stamped);
  } else if (isDrawingShape) {
    if (shapeType && shapeType.startsWith('circle_') && previewShape && previewShape.radius > 0) {
      // Circle: stamp inner only (matches endShapeAsStroke)
      const center = previewShape.position;
      const radius = previewShape.radius;
      const strokeW = strokeEnabled ? globalStrokeWidth : 0;
      const iradius = Math.max(0, radius - strokeW / 2);
      if (iradius > 0) {
        const stampedInner = createInnerShape(center, iradius, 'stroke', shapeGuideAngle);
        if (stampedInner) {
          applyCurrentStyles(stampedInner);
          stampedInner.selected = false;
          project.activeLayer.addChild(stampedInner);
        }
      }
    } else {
      // Other shapes: stamp frame
      const framePreview = previewShape || previewRect || previewPath;
      if (framePreview) {
        const stampedFrame = framePreview.clone();
        applyCurrentStyles(stampedFrame);
        stampedFrame.strokeDasharray = null;
        stampedFrame.opacity = 1;
        stampedFrame.selected = false;
        project.activeLayer.addChild(stampedFrame);
      }
      // Stamp inner preview if present
      if (previewInner) {
        const stampedInner = previewInner.clone();
        stampedInner.strokeDasharray = null;
        stampedInner.opacity = 1;
        stampedInner.strokeColor = strokeEnabled ? window.globalStrokeColor : null;
        stampedInner.strokeWidth = strokeEnabled ? globalStrokeWidth * 0.7 : 0;
        stampedInner.fillColor = fillEnabled ? window.globalFillColor : null;
        stampedInner.strokeCap = 'round';
        stampedInner.strokeJoin = 'round';
        stampedInner.selected = false;
        project.activeLayer.addChild(stampedInner);
      }
    }
  } else if (isDrawingQuad && quadPath) {
    const stamped = quadPath.clone();
    applyCurrentStyles(stamped);
    stamped.closed = true;
    stamped.selected = false;
    stamped.strokeDasharray = null;
    stamped.opacity = 1;
    project.activeLayer.addChild(stamped);
  }
  updateTextContent();
}

function endPathOrShape() {
  if (isDrawingPath && path) {
    applyCurrentStyles(path);
    if (fillEnabled) {
      path.closed = true;
    }
    path.selected = false;
    project.activeLayer.addChild(path);
    path = null;
    isDrawingPath = false;
  } else if (isDrawingShape) {
    endShapeAsStroke();
    if (previewInner) {
      previewInner.remove();
      previewInner = null;
    }
  } else if (isDrawingQuad && quadPath) {
    applyCurrentStyles(quadPath);
    quadPath.closed = true;
    quadPath.selected = false;
    project.activeLayer.addChild(quadPath);
    quadPath = null;
    isDrawingQuad = false;
    quadPointCount = 0;
  }
  updateTextContent();
}

// GLOBAL SPLINE TENSION (affects new segments only)
var splineTension = 0.5; // 0.0=straight, 1.0=very curved

function polyLineKC() {
  if (!mousePt) return;
  if (!path) {
    path = new paper.Path({
      segments: [mousePt],
      strokeColor: window.globalStrokeColor,  // Uses corrected #107cff
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
      strokeColor: window.globalStrokeColor,  // Uses corrected #107cff
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
  previewShape.strokeColor = new paper.Color(0.5);  // Guide: unchanged (gray)
  previewShape.strokeWidth = 1;
  previewShape.strokeDasharray = [4, 4];
  project.activeLayer.addChild(previewShape);
  
  previewLine = new paper.Path({
    segments: [shapeStartPoint, shapeStartPoint],
    strokeColor: new paper.Color(0.5),  // Guide line: unchanged (gray)
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
  previewShape.strokeColor = window.globalStrokeColor;  // Uses corrected #107cff
  previewShape.strokeWidth = globalStrokeWidth;
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
    // Circle handling
    if (!previewShape || previewShape.radius === 0) return;
    
    const center = previewShape.position;
    const radius = previewShape.radius;
    const strokeW = strokeEnabled ? globalStrokeWidth : 0;  // DYNAMIC: respect toggle
    const iradius = Math.max(0, radius - strokeW / 2);
    
    if (iradius > 0) {
      const innerPath = createInnerShape(center, iradius, 'stroke', shapeGuideAngle);
      if (innerPath) {
        applyCurrentStyles(innerPath);  // OVERRIDE: use control panel toggles
        innerPath.selected = false;
        project.activeLayer.addChild(innerPath);
      }
    }
  } else if (shapeType === 'rectangle_diagonal') {
    finalPath = new paper.Path.Rectangle({
      center: previewShape.position,
      size: previewShape.size
      // REMOVED: strokeColor, strokeWidth, strokeCap, strokeJoin
    });
    applyCurrentStyles(finalPath);
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
      closed: true
      // REMOVED: strokeColor, strokeWidth, strokeCap, strokeJoin
    });
    applyCurrentStyles(finalPath);
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
      closed: true
      // REMOVED: strokeColor, strokeWidth, strokeCap, strokeJoin
    });
    applyCurrentStyles(finalPath);
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
  updateTextContent();  // Update UI after finishing shape
}

// Replace the existing createRegularPolygon function:

//radiusMode: 'circumradius' or 'inradius'
// circumradius (vertex-to-center) vs. apothem (center-to-side)
// circumradius (vertex-to-center) vs. inradius (center-to-side)

// circumradius belongs to circumcircle, inradius belongs to incircle

// circumcircle is the smallest circle that can enclose the polygon
// --- circumradius belongs to circumcircle
// circumradius is the radius of the circumcircle

// incircle is the largest circle that can fit inside the polygon
// --- apothem / inradius belongs to incircle
// inradius is the radius of the incircle

function createRegularPolygon(center, radius, sides, rotationAngle = 0, radiusMode = 'circumradius') {
  const angleStep = (Math.PI * 2) / sides;
  const startAngle = rotationAngle * Math.PI / 180;
  
  let actualRadius;
  if (radiusMode === 'circumradius') {
    actualRadius = radius;  // Use radius directly as circumradius (vertex-to-center)
  } else  if (radiusMode === 'inradius') {  // 'inradius'
    // Convert to inradius: R = r / cos(π/n)
    let inradius = radius / Math.cos(Math.PI / sides);
    actualRadius = inradius; 
  
  }
  
  const path = new paper.Path();
  for (let i = 0; i < sides; i++) {
    const angle = startAngle + i * angleStep;
    const point = center.add(
      new paper.Point(
        Math.cos(angle) * actualRadius,
        Math.sin(angle) * actualRadius
      )
    );
    path.add(point);
  }

   if (radiusMode === 'inradius') {
   path.rotate(360 / sides / 2, center);
   }

  path.closed = true;
  return path;
}


function togglePolygonRadiusMode() {
  polygonRadiusMode = polygonRadiusMode === 'circumradius' ? 'inradius' : 'circumradius';
  updateTextContent();  // Shows "Poly: circumradius" or "Poly: inradius"
}

function setPolygonRadiusMode(mode) {
  polygonRadiusMode = mode === 'inradius' ? 'inradius' : 'circumradius';
}


