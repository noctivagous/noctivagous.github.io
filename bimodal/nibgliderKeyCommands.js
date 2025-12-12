function changeStrokeWidth(strokeVal) {
  var localStrokeVal = strokeVal;

  if (localStrokeVal < 1) {
    localStrokeVal = 1;
  }
  if (localStrokeVal > maxStrokeWidth) {
    localStrokeVal = maxStrokeWidth;
  }

  globalStrokeWidth = localStrokeVal;

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
  if (isDrawingPath && path) {
    path.remove();
    path = null;
    isDrawingPath = false;
  }
  if (isDrawingShape && previewShape) {
    previewShape.remove();
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



function polyLineKC() {
  if (!mousePt) return;
  if (!path) {
    // Create a new path and set its stroke color to black:
    path = new paper.Path({
      segments: [mousePt],
      strokeColor: 'black',
      strokeWidth: globalStrokeWidth,
      // Select the path, so we can see its segment points:
      fullySelected: true
    });

  } else {
    path.add(mousePt);
  }
  if (isDrawingPath == false) {
    isDrawingPath = true;
  }
  updateTextContent(); // ADD: Show drawing instructions
}

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
  previewShape.strokeColor = 'black';
  previewShape.strokeWidth = globalStrokeWidth;
  project.activeLayer.addChild(previewShape);
  previewLine = new paper.Path({
    segments: [shapeStartPoint, shapeStartPoint],
    strokeColor: new paper.Color(0.5),
    strokeWidth: 1,
    strokeDashArray: [4, 4]
  });
  project.activeLayer.addChild(previewLine);
  updateTextContent(); // ADD: Show drawing instructions
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
  previewShape.strokeColor = 'black';
  previewShape.strokeWidth = globalStrokeWidth;
  project.activeLayer.addChild(previewShape);
  previewLine = new paper.Path({
    segments: [shapeStartPoint, shapeStartPoint],
    strokeColor: new paper.Color(0.5),
    strokeWidth: 1,
    strokeDashArray: [4, 4]
  });
  project.activeLayer.addChild(previewLine);
  updateTextContent(); // ADD: Show drawing instructions
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

function endShapeAsStroke() {
  if (!isDrawingShape || shapeType === null) return;
  var finalPath;
  if (shapeType.startsWith('circle_')) {
    finalPath = new paper.Path.Circle({
      center: previewShape.position,
      radius: previewShape.radius,
      strokeColor: 'black',
      strokeWidth: globalStrokeWidth,
      strokeCap: 'round',
      strokeJoin: 'round'
    });
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
  if (shapeType === 'rectangle_centerline') {
    lastCenterlineWidth = shapeWidth;
  }
  if (finalPath) {
    finalPath.selected = false;
    project.activeLayer.addChild(finalPath);
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
    finalPath = new paper.Path.Circle({
      center: previewShape.position,
      radius: previewShape.radius,
      strokeColor: 'black',
      strokeWidth: globalStrokeWidth,
      strokeCap: 'round',
      strokeJoin: 'round'
    });
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
  if (finalPath) {
    finalPath.selected = false;
    project.activeLayer.addChild(finalPath);
  }
  // preview state continues
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

