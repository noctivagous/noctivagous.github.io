

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
  if (isDrawing)
  {


  }

}

function endShape() {
  if (path) {
    path.selected = false;
    project.activeLayer.addChild(path);

    isDrawing = false;
    path = null;
  }

}

function closeShapeAndEnd() {

  if (path) {
    path.closed = true;
    path.selected = false;
    project.activeLayer.addChild(path);
    isDrawing = false;
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
    isDrawing = false;
    path = null;
  }


}

function closeShapeAndEndWithFillStroke() {

  if (path) {
    path.closed = true;
    path.selected = false;
    path.fillColor = new paper.Color(0, 0, 0);
    project.activeLayer.addChild(path);
    isDrawing = false;
    path = null;
  }


}



function polyLineKC() {

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
  if (isDrawing == false) {
    isDrawing = true;
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
  
  function clearOutSelection() {
    // If nothing is underneath the cursor, clear the selection
    for (var i = 0; i < selectedItems.length; i++) {
      selectedItems[i].selected = false;
    }
    selectedItems = [];
  
  
  }
  
