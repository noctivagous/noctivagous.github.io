// Selection and interaction
// Variables to track selected items and drag-lock status

var selectedItems = [];
var _isInDragLock = false;
var shapeGuideAngle = 0;




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
  // function collectiveCenter(selectedItems) { ... }
// function cancelCurrentDrawingOperation() { ... }

function clearOutSelection() {
    // If nothing is underneath the cursor, clear the selection
    for (var i = 0; i < selectedItems.length; i++) {
      selectedItems[i].selected = false;
    }
    selectedItems = [];
  
  
  }


