

function addStrokeWidthValueToSelectedItems(strokeAmount)
{
  if(selectionIsPresent)
  {
  for (var i = 0; i < selectedItems.length; i++) {
      // if stroke is 0 do not add a stroke
      if(selectedItems[i].strokeWidth > 0)
      {
        var curStrokeW = selectedItems[i].strokeWidth;
        var newStrokeAmt = (curStrokeW + strokeAmount);
        if(( newStrokeAmt <= maxStrokeWidth) && (newStrokeAmt >= minStrokeWidth) )
        {
          if(strokeAmount < 0)
          {
          selectedItems[i].strokeWidth = Math.max(newStrokeAmt,minStrokeWidth);
          }
          else
          {
            selectedItems[i].strokeWidth = Math.min(newStrokeAmt,maxStrokeWidth);
          }

        }
      }

  }

  }
}

function changeAppStrokeWidth(strokeVal) {

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

  if(cursorFollower)
  {
    updateCursorFollowerRadius()

  }

}

function thinStrokeWidth() {

  if(selectionIsPresent())
  {
    addStrokeWidthValueToSelectedItems(-1);

  }
  else
  {
      changeAppStrokeWidth(globalStrokeWidth - 1);
  }

}

function thickenStrokeWidth() {
  if(selectionIsPresent())
  {
    addStrokeWidthValueToSelectedItems(1);
  }
  else
  {
  changeAppStrokeWidth(globalStrokeWidth + 1);
  }
}

function thinStrokeWidthUpper() {
  if(selectionIsPresent())
  {
    addStrokeWidthValueToSelectedItems(-10);
  }
  else
  {
  changeAppStrokeWidth(globalStrokeWidth - 10);
  }
}

function thickenStrokeWidthUpper() {
  if(selectionIsPresent())
  {
    addStrokeWidthValueToSelectedItems(10);
  }
  else
  {
  changeAppStrokeWidth(globalStrokeWidth + 10);
  }
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

function endPathAsStroke() {
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


function selectionIsPresent()
{
  return (selectedItems.length > 0);
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
  
