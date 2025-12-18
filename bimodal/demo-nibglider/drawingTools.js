// Drawing termination functions
function stampItems(itemsToStamp) {
  if (!itemsToStamp) return;
  for (var i = 0; i < itemsToStamp.length; i++) {
    var clone = itemsToStamp[i].clone();
    clone.selected = false;
    project.activeLayer.addChild(clone);
  }
}

function cancelCurrentDrawingOperation() {
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
    if (previewShape) previewShape.remove();
    if (previewLine) previewLine.remove();
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
    isDrawingPath = false;
    path = null;
  }
}

function closeShapeAndEnd() {
  if (path) {
    path.closed = true;
    path.selected = false;
    project.activeLayer.addChild(path);
    isDrawingPath = false;
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
    isDrawingPath = false;
    path = null;
  }
}

function closeShapeAndEndWithFillStroke() {
  if (path) {
    path.closed = true;
    path.selected = false;
    path.fillColor = new paper.Color(0, 0, 0);
    project.activeLayer.addChild(path);
    isDrawingPath = false;
    path = null;
  }
}

// Path drawing functions
function polyLineKC() {
  if (!mousePt) return;
  if (!path) {
    path = new paper.Path({
      segments: [mousePt],
      strokeColor: window.globalStrokeColor, // FIXED: use global stroke color
      strokeWidth: globalStrokeWidth,
      fullySelected: true
    });
  } else {
    var newSegment = path.add(mousePt);
    if (newSegment) {
      newSegment.handleIn = new paper.Point(0, 0);
      newSegment.handleOut = new paper.Point(0, 0);
    }
  }
  if (!isDrawingPath) isDrawingPath = true;
  updateTextContent();
}

function splinePointKC() {
  if (!mousePt) return;
  if (!path) {
    path = new paper.Path({
      segments: [mousePt],
      strokeColor: window.globalStrokeColor, // FIXED: use global stroke color
      strokeWidth: globalStrokeWidth,
      fullySelected: true
    });
  } else {
    var newSegment = path.add(mousePt);
    if (newSegment && path.segments.length >= 3) {
      var prev = path.segments[path.segments.length - 3];
      var curr = path.segments[path.segments.length - 2];
      var next = newSegment;
      var tension = splineTension;
      var p0 = prev.point;
      var p1 = curr.point;
      var p2 = next.point;
      var d01 = p1.subtract(p0);
      var d12 = p2.subtract(p1);
      next.handleIn = d12.multiply(tension * 0.5);
      curr.handleOut = d01.multiply(tension * 0.5);
      if (curr.handleIn) curr.handleIn = curr.handleOut.multiply(-1);
    }
  }
  if (!isDrawingPath) isDrawingPath = true;
  updateTextContent();
}

// Shape drawing functions
function circleKC(mode) {
  if (shapeType && shapeType.startsWith('circle_')) {
    endShapeAsStroke();
    updateTextContent();
    return;
  }
  if (isDrawingShape || !mousePt) return;
  shapeStartPoint = mousePt.clone();
  shapeType = 'circle_' + mode;
  isDrawingShape = true;
  previewShape = new paper.Shape.Circle(shapeStartPoint, 0);
  previewShape.strokeColor = window.globalStrokeColor; // FIXED: use global stroke color
  previewShape.strokeWidth = 1;
  previewShape.strokeDasharray = [4, 4];
  project.activeLayer.addChild(previewShape);
  previewLine = new paper.Path({
    segments: [shapeStartPoint, shapeStartPoint],
    strokeColor: new paper.Color(0.5),
    strokeWidth: 1,
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
  previewShape = new paper.Shape.Rectangle(shapeStartPoint, new paper.Size(0, 0));
  previewShape.strokeColor = window.globalStrokeColor; // FIXED: use global stroke color
  previewShape.strokeWidth = globalStrokeWidth;
  previewShape.strokeDasharray = [4, 4];
  project.activeLayer.addChild(previewShape);
  previewLine = new paper.Path({
    segments: [shapeStartPoint, shapeStartPoint],
    strokeColor: new paper.Color(0.5),
    strokeWidth: 1,
    strokeDashArray: [4, 4]
  });
  project.activeLayer.addChild(previewLine);
  updateTextContent();
}

function rectTwoEdgesKC() {
  if (shapeType === 'rectangle_two_edges') {
    if (shapePt2 === null) {
      shapePt2 = mousePt.clone();
      previewPath.segments[1].point = shapePt2;
      previewLine.firstSegment.point = shapePt2;
      previewLine.lastSegment.point = shapePt2;
      previewRect = new paper.Path({
        segments: [shapeStartPoint, shapePt2, shapePt2, shapeStartPoint],
        closed: true,
        strokeColor: window.globalStrokeColor, // FIXED: use global stroke color
        strokeWidth: globalStrokeWidth,
        fullySelected: true
      });
      project.activeLayer.addChild(previewRect);
    } else {
      endShapeAsStroke();
      updateTextContent();
    }
    updateTextContent();
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
    strokeColor: window.globalStrokeColor, // FIXED: use global stroke color
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
  updateTextContent();
}

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
    strokeColor: window.globalStrokeColor, // FIXED: use global stroke color
    strokeWidth: globalStrokeWidth,
    fullySelected: true
  });
  project.activeLayer.addChild(previewRect);
  previewRect.fullySelected = false;
  previewRect.strokeCap = 'round';
  previewRect.strokeJoin = 'round';
  updateTextContent();
}

function quadPointKC() {
  if (!mousePt) return;
  if (!quadPath) {
    quadPath = new paper.Path({
      segments: [mousePt],
      strokeColor: window.globalStrokeColor, // FIXED: use global stroke color
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

// Shape finalization functions (endShapeAsStroke, endShapeFillOnly, endShapeFillStroke, stampCurrentShape)
// ...existing code...

// Shape creation helper functions (createRegularPolygon, createSupershape, createInnerShape, drawInnerShape)
// ...existing code...