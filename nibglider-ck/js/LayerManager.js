import NGUtils from "./NGUtils.js";
import { Drawable } from "./drawing/Drawable.js";

class LayerManager {
  constructor(app) {
    this.layer1 = new Layer(window.CanvasKit);
    this.allLayers = [this.layer1];
    this.currentLayer = this.layer1;
    this.backgroundColor = null;
    this.app = app;

    this.offscreenSurface = null;

// Variables to track selected items and drag-lock status
var selectedItems = [];

var _isInDragLock = false;



    this.layer1.generateRandomShapes(30, window.innerWidth, window.innerHeight);
    this.allLayers.forEach(layer =>
      layer.createBackingStore(window.innerWidth, window.innerHeight)
    );

    this.updateAllLayersBackingStores();

    this.layerManagerDidFinishInit();

  }

  layerManagerDidFinishInit() {
    this.app.onResize();
    // Create the offscreen canvases for each layer
  }

  updateAllLayersBackingStores() {

    this.allLayers.forEach(function(layer) {
      layer.updateTheBackingStoreForResizeEvent = true;
      layer.updateBackingStoreImage();
    });
    
  }

  setIsInDragLock(status) {
    _isInDragLock = status;
   // updateTextContent();
  }
  
  
  appDidLoad() {
    this.backgroundColor = CanvasKit.Color(255, 0, 0, 1.0);
    this.setLayerManagerBackgroundColor(this.backgroundColor);
  }

  setLayerManagerBackgroundColor(bgColor) {
    this.backgroundColor = bgColor;
    // Create a new paint object with color blue
    this.backgroundColorPaint = new CanvasKit.Paint();
    paint.setColor(bgColor); // RGBA 
    paint.setStyle(CanvasKit.PaintStyle.Fill);
  }

  detectHitOnCurrentLayer(x, y) {

    // this.currentLayer.detectHit(x,y)
    // returns the following:
    // [didHit,hitDrawable,boundsForRedraw];
    var hitDrawableArray = this.currentLayer.detectHit(x, y);

    if (hitDrawableArray[0] === true) {

      let hitDrawable = hitDrawableArray[1];
      hitDrawable.toggleIsSelected();
      //this.app.invalidateRect(hitDrawableArray[2])
      this.currentLayer.updateBackingStoreImage();
      this.app.invalidateEntireCanvas();
      // Initiate dragging logic here
    }
    else {
      // alert('no hit');
    }



  }

  drawRectOnAllLayers(skCanvas, skRectFloat32Array) {

    //skCanvas.drawPaint();  
    if (this.backgroundColorPaint) {
      //skCanvas.drawRect(skRectFloat32Array, this.backgroundColorPaint);
    }
    else {
    }
    //    alert('drawAlllayers');

    for (let i = 0; i < this.allLayers.length; i++) {
      const layer = this.allLayers[i];
      // skRectFloat32Array is placeholder
      // for future optimization (dirtyRect on top of with backing store).
      // It is partially ready now, with clipRect clipping to the passed dirtyRects,
      // but the query is not coming from the rBush (r-tree) yet for each layer.

      layer.drawLayer(skCanvas, skRectFloat32Array);
    }



  }

}


class Layer {
  constructor(canvasKit) {
    this.canvasKit = canvasKit; // Store the CanvasKit instance

    this.rBush = new rbush(); // Initialize the rbush tree
    this.drawableObjects = []; // Keep a reference list of drawable objects

    this.backgroundColor = null;
    this.backgroundColorPaint = null;

    this.offscreenCanvas = null;
    this.offscreenContext = null;

    this.backingStoreImage = null; // Property to hold the captured image
    this.updateTheBackingStoreForResizeEvent = false;
  }


  createBackingStore(width, height) {

    // Create an off-screen SkSurface with the same dimensions
    this.offscreenSurface = window.CanvasKit.MakeSurface(width, height);
  }


  updateBackingStoreImage() {
    // Ensure the offscreen canvas is created
    if (!this.offscreenSurface || this.updateTheBackingStoreForResizeEvent) {

      if (this.updateTheBackingStoreForResizeEvent) {
        this.offscreenSurface.delete();
      }  
      

      this.offscreenSurface = window.CanvasKit.MakeSurface(window.innerWidth, window.innerHeight);

      if (!this.offscreenSurface) {
        console.error('Offscreen surface not created.');
        return;
      }

      this.updateTheBackingStoreForResizeEvent = false;

    }

   
   

    // Get the offscreen canvas
    const offscreenCanvas = this.offscreenSurface.getCanvas();

    // Draw all drawable objects onto the offscreen canvas
    this.drawAllObjectsOnLayer(offscreenCanvas);

    // Capture the drawing as an image
    this.backingStoreImage = this.offscreenSurface.makeImageSnapshot();
  }

  // Method to generate random shapes
  generateRandomShapes(numberOfShapes = 10, widthRange, heightRange) {

    // starts at black
    let colorIncrement = 255 / numberOfShapes; // Determine the increment for color.  8.5 for 30.


    for (let i = 0; i < numberOfShapes; i++) {

      const shapeType = Math.floor(Math.random() * 3); // Randomly choose a shape type
      let colorValue = Math.floor(colorIncrement * i); // Calculate the color for this step
      let color = this.canvasKit.Color4f(colorValue / 255, colorValue / 255, colorValue / 255, 1); // Create the color
      let drawable;

      switch (shapeType) {
        case 0: // Rectangle
          drawable = Drawable.createRectangle(
            this.canvasKit,
            Math.random() * widthRange, // Random x
            Math.random() * heightRange, // Random y
            Math.random() * 200 + 20, // Random width
            Math.random() * 400 + 20 // Random height
          );
          break;
        case 1: // Circle
          drawable = Drawable.createCircle(
            this.canvasKit,
            Math.random() * 500, // Random x for center
            Math.random() * 500, // Random y for center
            Math.random() * 50 + 10 // Random radius
          );
          break;
        case 2: // Line
          drawable = Drawable.createLine(
            this.canvasKit,
            Math.random() * 500, // Random x1
            Math.random() * 500, // Random y1
            Math.random() * 500, // Random x2
            Math.random() * 500 // Random y2
          );
          break;
        // Add more shapes if needed
      }
      drawable.skPaint.setColor(color);
      this.addObject(drawable);
    }
  }


  setLayerManagerBackgroundColor(bgColor) {
    this.backgroundColor = bgColor;
    // Create a new paint object with color blue
    this.backgroundColorPaint = new CanvasKit.Paint();
    paint.setColor(bgColor); // RGBA 
    paint.setStyle(CanvasKit.PaintStyle.Fill);

  }

  // Method to draw all objects in the layer
  // that intersect with the skRectFloat32Array 


  drawLayer(skCanvas, skRectFloat32Array) {
    // If there's a backing store image, draw it first
    if (this.backingStoreImage) {
      skCanvas.drawImage(this.backingStoreImage, 0, 0, null);
    } else {
      // If the backing store is not created or updated, call updateBackingStoreImage
      this.updateBackingStoreImage();
    }


    // skRectFloat32Array is placeholder
    // for future optimization (dirtyRect on top of with backingstore).
    //  It is partially ready now, with clipRect in the
    //  app draw function clipping only to the passed dirtyRects,
    // but the layer's query for intersections is not implemented.
    //  it is is not coming from the rBush (r-tree) yet for each layer.
    //   this.drawAllObjectsOnLayerThatIntersectRect(skRectFloat32Array, skCanvas);

    this.drawObjectsInSearchedArea(skRectFloat32Array, skCanvas)

  }

  drawAllObjectsOnLayerThatIntersectRect(skRectFloat32Array, skCanvas) {
    for (let i = 0; i < this.drawableObjects.length; i++) {
      const drawable = this.drawableObjects[i];
      if (NGUtils.doRectsIntersect(drawable.getPaddedBounds(), skRectFloat32Array)) {
        drawable.draw(skCanvas); // Draw only if there's an intersection
      }
    }
  }



  drawObjectsInSearchedArea(searchBoundsSkRect, skCanvas) {
  /*  
  
    // Get all drawable objects in the search area
    const drawableObjectsInArea = this.searchArea(searchBoundsSkRect);


    // Perform drawing with CanvasKit on the skCanvas
    drawableObjectsInArea.forEach(drawable => {
      console.log('drobj');
      drawable.draw(skCanvas);
    });
*/
/*
    for (let i = drawableObjectsInArea.length - 1; i >= 0; i--) {
      const drawable = drawableObjectsInArea[i];
     // console.log('drobj');
      drawable.draw(skCanvas);
    }
    */



  }




  drawAllObjectsOnLayer(skCanvas) {
    for (let i = 0; i < this.drawableObjects.length; i++) {
      const drawable = this.drawableObjects[i];
      drawable.draw(skCanvas); // Draw all objects
    }
  }


  // detect hit is reversed because we start
  // from the topmost element.
  detectHit(x, y) {
    for (let i = this.drawableObjects.length - 1; i >= 0; i--) {
      const drawable = this.drawableObjects[i];
      const didHit = drawable.hitTest(x, y);

      if (didHit === true) {
        return [true, drawable, drawable.getPaddedBounds()]; // Don't forget to call the function getPaddedBounds with ()
      }
    }
    return [false, null, null];
  }

  hitTestUnderCursor()
  {
    var hitObject = false;
    var hitResultDrawable = null;

    for (let i = this.drawableObjects.length - 1; i >= 0; i--) {
      const drawable = this.drawableObjects[i];
      const didHit = drawable.hitTest(x, y);

      if (didHit === true) {
        hitObject = true;
        hitResultDrawable = drawable;
        break;
        //return [true, drawable, drawable.getPaddedBounds()]; // Don't forget to call the function getPaddedBounds with ()
      }
    }

    if (hitObject === true) {

      // Check if this item is already selected
      var alreadySelected = this.selectedItems.indexOf(hitResultDrawable) !== -1;

      if (alreadySelected) {
        hitResult.setIsSelected(false);
      
        selectedItems.splice(selectedItems.indexOf(hitResultDrawable), 1);
      } else {
        hitResult.setIsSelected(true);
        selectedItems.push(hitResultDrawable);
      }
    } else {

      // If nothing is underneath the cursor, clear the selection
      clearOutSelection();
    }

  }
  /*
  // to be converted to rbush searchArea
  hitTestUnderCursor() {

    
    // if(isDrawing == false)
    // otherwise it will select 
    // the line or shape being drawn.
    if (isDrawing == false) {
  
  
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
  
        // Make the cursorFollower visible again
        cursorFollower.visible = true;
        // Make the cursorFollowerRing visible again
        cursorFollowerRing.visible = true;
  
    }
  }

 */

  // Function to add objects to the rbush tree
  addObject(drawable) {
    // Calculate the item's bounding box (assuming drawable has a getBounds method)
    const item = drawable.getRBushBounds();
    // Add the item to the rbush tree
    this.rBush.insert(item);
    // Keep a reference to the drawable object
    this.drawableObjects.push(drawable);
  }

  // Function to remove objects from the rbush tree
  removeObject(drawable) {
    // Find the item in the rbush tree
    const item = drawable.getRBushBounds();
    // Remove the item from the rbush tree
    this.rBush.remove(item);
    // Remove the drawable object from the reference list
    this.drawableObjects = this.drawableObjects.filter(obj => obj !== drawable);
  }

  // Function to update the position of objects in the rbush tree
  moveObject(drawable, newPosition) {
    // First remove the old item
    this.removeObject(drawable);
    // Update the drawable's position
    drawable.position = newPosition;
    // Re-add the updated drawable to the rbush tree
    this.addObject(drawable);
  }

  
  


     // Method to draw all objects in the layer
          //In this code, searchBounds is expected to be an array 
          // of the format [minX, minY, maxX, maxY], representing 
          // the area to draw. If skRectFloat32 is in a different 
          // format, you'll need to adjust the searchArea call accordingly.
  // Function to search the rbush tree
  searchArea(skRectFloat32Array) {
    // Convert search area to rbush format
    const searchBounds = {
      minX: NGUtils.minX(skRectFloat32Array),
      minY: NGUtils.minY(skRectFloat32Array),
      maxX: NGUtils.maxX(skRectFloat32Array),
      maxY: NGUtils.maxY(skRectFloat32Array)
    };
    // Perform the search on the rbush tree
    return this.rBush.search(searchBounds).map(item => item.drawable);
  }

}

export { Layer, LayerManager };
