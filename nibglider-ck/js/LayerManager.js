import NGUtils from "./NGUtils.js";
import { Drawable } from "./drawing/Drawable.js";

class LayerManager {
  constructor(app) {
    this.layer1 = new Layer(window.CanvasKit, this);
    this.allLayers = [this.layer1];
    this.currentLayer = this.layer1;
    this.backgroundColor = null;
    this.app = app;

    this.offscreenSurface = null;


    this.layer1.generateRandomShapes(30, window.innerWidth, window.innerHeight);
    this.allLayers.forEach(layer =>
      layer.createBackingStore(window.innerWidth, window.innerHeight)
    );

    //  this.updateAllLayersBackingStores();

    this.layerManagerDidFinishInit();

  }

  layerManagerDidFinishInit() {
    this.app.onResize();
    // Create the offscreen canvases for each layer
  }

  addDrawableToCurrentLayer(drawable) {
    this.currentLayer.addObject(drawable);
  }

  updateAllLayersBackingStores() {

    this.allLayers.forEach(function (layer) {
      layer.updateTheBackingStoreForResizeEvent = true;
      layer.updateBackingStoreImage();
    });

  }

  removeAllSelectedItemsAndReset() {
    this.currentLayer.removeAllSelectedItemsAndReset();
  }

  select() {
    this.selectionHitTestOnCurrentLayer(this.app.mouseX, this.app.mouseY);
  }

  cart() {
    this.currentLayer.cart();
  }

  cancel() {
    this.clearOutSelection();
  }

  stamp() {
    this.currentLayer.stampSelectedItems();
  }




  bringSelectionToFront() {
    this.currentLayer.bringSelectionToFront();
  }

  sendSelectionToBack() {
    this.currentLayer.sendSelectionToBack();
  }

  bringSelectionForward() {
    this.currentLayer.bringSelectionForward();
  }

  sendSelectionBackward() {
    this.currentLayer.sendSelectionBackward();
  }




  scaleCurrentSelection(scaleFactor, scalePoint) {
    var pointForScale = this.currentLayer.collectiveCenterOfSelectedItems();

    if (this.currentLayerHasSelection()) {
      this.currentLayer.startScalingAnimation(scaleFactor, pointForScale);
    }
  }

  moveCurrentSelection(angleDegrees, distance) {
    if (this.currentLayerHasSelection()) {
      this.currentLayer.startTranslateAnimation(angleDegrees, distance);

    }
  }

  rotateCurrentSelection(angleDegrees, rotationPoint) {

    var pointForRotation = this.currentLayer.collectiveCenterOfSelectedItems();

    if (this.currentLayerHasSelection()) {
      let finalAngleDegrees = angleDegrees;
      this.currentLayer.startRotationAnimation(finalAngleDegrees, pointForRotation);//rotateCurrentSelection(angleDegrees,pointForRotation);


    }


  }



  currentLayerHasSelection() {

    return this.currentLayer.hasSelectedItems();
  }

  currentLayerIsInDragLock() {

    return this.currentLayer.isInDragLock;
  }

  handleMouseMove(event) {
    this.currentLayer.handleMouseMove(event);

  }

  // SELECTING OBJECTS FROM CURRENT LAYER
  getSelectedItems() {
    return this.currentLayer.selectedItems;
  }

  clearOutSelection() {
    this.currentLayer.clearOutSelection();
  }


  selectionHitTestOnCurrentLayer(x, y) {

    this.currentLayer.selectionHitTestUnderCursor(x, y);



    /*
        // this.currentLayer.detectHit(x,y)
        // returns the following:
        // [didHit,hitDrawable,boundsForRedraw];
        var hitDrawableArray = this.currentLayer.detectHit(x, y);
    
    
        var didHitDrawable = (hitDrawableArray[0] === true);
        
        if (didHitDrawable) {
    
          let hitDrawable = hitDrawableArray[1];
          hitDrawable.toggleIsSelected();
          //this.app.invalidateRect(hitDrawableArray[2])
          this.currentLayer.updateBackingStoreImage();
          this.app.invalidateEntireCanvas();
          // Initiate dragging logic here
        }
        else {
          this.currentLayer.clearOutSelection();
          // alert('no hit');
        }
    */
  }



  // For just testing whether an object was hit
  // by a click or something else,
  // like a roaming cursor.
  noSelectionBasedHitTestOnCurrentLayer(x, y) {

    // this.currentLayer.detectHit(x,y)
    // returns the following:
    // [didHit,hitDrawable,boundsForRedraw];
    var hitDrawableArray = this.currentLayer.detectHit(x, y);

    return hitDrawableArray;

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
  constructor(canvasKit, layerManager) {
    this.canvasKit = canvasKit; // Store the CanvasKit instance
    this.layerManager = layerManager;

    this.rBush = new rbush(); // Initialize the rbush tree
    this.drawableObjects = []; // Keep a reference list of drawable objects

    this.backgroundColor = null;
    this.backgroundColorPaint = null;

    this.offscreenCanvas = null;
    this.offscreenContext = null;

    this.backingStoreImage = null; // Property to hold the captured image
    this.updateTheBackingStoreForResizeEvent = false;


    // Variables to track selected items and drag-lock status
    this.selectedItems = [];
    this.isInDragLock = false;
    this.lastMousePt = null;


    // Animation properties
    this.startRotation = 0;
    this.endRotation = 90;
    this.rotationDuration = 100;
    this.rotationStartTime = null;

    this.startScale = 1; // Starting scale factor
    this.endScale = 2; // Ending scale factor
    this.scaleDuration = 100; // Duration in milliseconds
    this.scaleStartTime = null;

    this.animateScaleCurrentSelection = this.animateScaleCurrentSelection.bind(this);

  }




  hasSelectedItems() {
    return (this.selectedItems.length > 0)
  }


  // These function names are like 
  // general command names that indicate
  // a certain button was pressed but
  // are not specific
  cart() {
    if (this.hasSelectedItems()) {
      this.setIsInDragLock(!this.isInDragLock);
    }

  }

  startScalingAnimation(finalScaleFactor, scalePoint) {
    this.finalScaleFactor = finalScaleFactor;
    this.scaleDuration = 60; // Duration of the animation in milliseconds
    this.fps = 60;
    this.totalFrames = this.scaleDuration / (1000 / this.fps); // Number of frames for 60 FPS
    this.currentFrame = 0; // Current frame counter
    this.constantScaleFactor = Math.pow(finalScaleFactor, 1 / this.totalFrames); // Constant scale factor per frame
    this.scaleStartTime = null;
    this.layerManager.app.skSurface.requestAnimationFrame((timestamp) =>
      this.animateScaleCurrentSelection(Date.now(), scalePoint));
  }

  animateScaleCurrentSelection(timestamp, scalePoint) {
    if (!this.scaleStartTime) this.scaleStartTime = timestamp;
    this.currentFrame++;

    // Apply constant cumulative scaling to the path at scalePoint
    this.scaleCurrentSelection(this.constantScaleFactor, scalePoint);

    if (this.currentFrame < this.totalFrames) {
      this.layerManager.app.skSurface.requestAnimationFrame((newTimestamp) =>
        this.animateScaleCurrentSelection(newTimestamp, scalePoint));
    } else {
      this.scaleStartTime = null; // Reset for the next animation
      this.currentFrame = 0; // Reset the frame counter
      this.updateSelectedRBushItems();
    }
  }



  scaleCurrentSelection(scaleFactor, scalePoint) {

    for (var i = 0; i < this.selectedItems.length; i++) {
      this.selectedItems[i].scaleUniform(scaleFactor, scalePoint[0], scalePoint[1]);
    }

    this.layerManager.app.invalidateEntireCanvas();

  }


  rotateCurrentSelection(angleDegrees, rotationPoint) {

    for (var i = 0; i < this.selectedItems.length; i++) {
      this.selectedItems[i].rotate(angleDegrees, rotationPoint[0], rotationPoint[1]);
    }
    this.layerManager.app.invalidateEntireCanvas();

  }

  startRotationAnimation(finalAngleDegrees, rotationPoint) {
    this.finalAngleDegrees = finalAngleDegrees;
    this.rotationDuration = 60; // Duration of the animation in milliseconds
    this.totalFrames = Math.ceil(this.rotationDuration / (1000 / 60)); // Round up to ensure enough frames
    this.currentFrame = 0; // Current frame counter
    this.constantRotationIncrement = finalAngleDegrees / this.totalFrames; // Rotation increment per frame
    this.currentRotation = 0; // Current cumulative rotation
    this.rotationStartTime = null;
    this.layerManager.app.skSurface.requestAnimationFrame((timestamp) =>
      this.animateRotationCurrentSelection(Date.now(), rotationPoint));
  }



  animateRotationCurrentSelection(timestamp, rotationPoint) {
    if (!this.rotationStartTime) this.rotationStartTime = timestamp;

    // Calculate new rotation
    let newRotation = this.currentRotation + this.constantRotationIncrement;

    // Check if the final angle is passed in the rotation direction
    let isFinalRotationReached = this.finalAngleDegrees >= 0 ?
      newRotation >= this.finalAngleDegrees :
      newRotation <= this.finalAngleDegrees;

    if (isFinalRotationReached) {
      newRotation = this.finalAngleDegrees; // Align to final rotation angle
    }

    // Apply rotation increment
    this.rotateCurrentSelection(newRotation - this.currentRotation, rotationPoint);
    this.currentRotation = newRotation;

    this.currentFrame++;
    if (this.currentFrame < this.totalFrames && !isFinalRotationReached) {
      this.layerManager.app.skSurface.requestAnimationFrame((newTimestamp) =>
        this.animateRotationCurrentSelection(newTimestamp, rotationPoint));
    } else {
      this.rotationStartTime = null; // Reset for the next animation
      this.currentFrame = 0; // Reset the frame counter
      this.updateSelectedRBushItems();
    }
  }



  startTranslateAnimation(angleDegrees, distanceToMove) {
    console.log(angleDegrees);
    this.angleDegrees = angleDegrees;
    this.distanceToMove = distanceToMove;
    this.translationDuration = 60; // Duration of the animation in milliseconds
    this.totalFrames = this.translationDuration / (1000 / 60); // Number of frames for 60 FPS
    this.currentFrame = 0; // Current frame counter

    // Convert angle to radians and calculate deltas per frame
    let angleRadians = angleDegrees * Math.PI / 180;
    this.deltaXPerFrame = (distanceToMove * Math.cos(angleRadians)) / this.totalFrames;
    this.deltaYPerFrame = (distanceToMove * Math.sin(angleRadians)) / this.totalFrames;

    this.translationStartTime = null;
    this.layerManager.app.skSurface.requestAnimationFrame((timestamp) =>
      this.animateTranslationCurrentSelection(timestamp));
  }


  animateTranslationCurrentSelection(timestamp) {
    if (!this.translationStartTime) this.translationStartTime = timestamp;

    // Apply delta translation to the current selection
    this.translateCurrentSelectionBy(this.deltaXPerFrame, this.deltaYPerFrame);

    this.currentFrame++;
    if (this.currentFrame < this.totalFrames) {
      this.layerManager.app.skSurface.requestAnimationFrame((newTimestamp) =>
        this.animateTranslationCurrentSelection(newTimestamp));
    } else {
      this.translationStartTime = null; // Reset for the next animation
      this.currentFrame = 0; // Reset the frame counter

      this.updateSelectedRBushItems();
    }
  }


  translateCurrentSelectionBy(deltaX, deltaY) {

    for (var i = 0; i < this.selectedItems.length; i++) {
      this.selectedItems[i].translate(deltaX, deltaY);
    }
    this.layerManager.app.invalidateEntireCanvas();

  }


  setIsInDragLock(status) {
    this.isInDragLock = status;

    if (this.isInDragLock == false) {
      this.lastMousePt = null;
    }

    if (this.hasSelectedItems()) {
      // Apply the delta to the position of all selected items
      for (var i = 0; i < this.selectedItems.length; i++) {
        this.selectedItems[i].isInDragLock = this.isInDragLock;
      }

    }

    this.layerManager.app.invalidateEntireCanvas();

  }


  stampSelectedItems() {
    // Assuming this.selectedItems is your original array

    // Create a shallow copy of the array
    let shallowCopy = [...this.selectedItems];

    // Sort the shallow copy
    shallowCopy.sort((a, b) => a.drawingOrder - b.drawingOrder);

    // Iterate over the sorted shallow copy
    for (var i = 0; i < shallowCopy.length; i++) {
      const copyForStamp = shallowCopy[i].copy(); // Copying the object from the sorted array
      this.addObject(copyForStamp); // Adding the copied object
    }

    // Invalidate the canvas to reflect changes
    this.layerManager.app.invalidateEntireCanvas();
  }



  handleMouseMove(event) {
    if (this.isInDragLock) {

      this.handleDragLock(event);

    }

  }



  handleDragLock(event) {
    const mousePt = { x: event.offsetX, y: event.offsetY }; // Update mousePt with plain object

    // Implement drag-lock functionality
    if (this.isInDragLock) {

      // If lastMousePt is null, initialize it
      if (this.lastMousePt === null) {
        this.lastMousePt = mousePt;
      }

      // Calculate the delta
      var delta = {
        x: mousePt.x - this.lastMousePt.x,
        y: mousePt.y - this.lastMousePt.y
      };

      // Apply the delta to the position of all selected items
      for (var i = 0; i < this.selectedItems.length; i++) {
        this.selectedItems[i].translate(delta.x, delta.y);
      }

      //this.updateBackingStoreImage();

      this.selectedItemsDidChange("carting");


      // Update this.lastMousePt for the next event
      this.lastMousePt = mousePt;

    } else {
      // Reset this.lastMousePt when drag lock is off
      this.lastMousePt = null;
    }
  }



  createBackingStore(width, height) {

    // Create an off-screen SkSurface with the same dimensions
    this.offscreenSurface = window.CanvasKit.MakeSurface(width, height);
  }


  async updateBackingStoreImage() {
    // Ensure the offscreen canvas is created
    if (!this.offscreenSurface || this.updateTheBackingStoreForResizeEvent) {

      // Delete existing surface if needed
      if (this.updateTheBackingStoreForResizeEvent && this.offscreenSurface) {
        this.offscreenSurface.delete();
        this.offscreenSurface = null;
      }


      try {
        if (this.offscreenSurface) {
          this.offscreenSurface.delete();
        }
        // Create the surface
        this.offscreenSurface = window.CanvasKit.MakeSurface(window.innerWidth, window.innerHeight);
        if (!this.offscreenSurface) {
          throw new Error('Offscreen surface not created.');
        }
        this.updateTheBackingStoreForResizeEvent = false;

        // Get the offscreen canvas and perform drawing operations
        const offscreenCanvas = this.offscreenSurface.getCanvas();
        this.drawAllObjectsOnLayer(offscreenCanvas);


        if (this.backingStoreImage) {
          this.backingStoreImage.delete();
        }
        // Capture the drawing as an image
        this.backingStoreImage = this.offscreenSurface.makeImageSnapshot();

      } catch (error) {
        console.error('Error creating surface:', error);
      }
    }
  }

  // Method to generate random shapes
  generateRandomShapes(numberOfShapes = 10, widthRange, heightRange) {
    const shapeTypes = 4; // Rectangle, Circle, Line, and Polygon
  
    for (let i = 0; i < numberOfShapes; i++) {
      const shapeType = Math.floor(Math.random() * shapeTypes);
  
      // Color generation
      let r = (Math.sin(0.3 * i) + 1) / 2;
      let g = (Math.cos(0.3 * i) + 1) / 2;
      let b = ((Math.sin(0.3 * i) + Math.cos(0.3 * i)) / 2);
      let color = this.canvasKit.Color4f(r, g, b, 1);
  
      // Randomize fill or stroke style
      const isFill = Math.random() > 0.5;
      const style = isFill ? this.canvasKit.PaintStyle.Fill : this.canvasKit.PaintStyle.Stroke;
  
      // Randomize stroke width (1 to 20)
      const strokeWidth = isFill ? 0 : Math.floor(Math.random() * 20) + 1;
  
      let drawable;
      switch (shapeType) {
        case 0: // Rectangle
          drawable = Drawable.createRectangle(
            this.canvasKit,
            Math.random() * widthRange,
            Math.random() * heightRange,
            Math.random() * 200 + 20,
            Math.random() * 400 + 20
          );
          break;
        case 1: // Circle
          drawable = Drawable.createCircle(
            this.canvasKit,
            Math.random() * widthRange,
            Math.random() * heightRange,
            Math.random() * 50 + 10
          );
          break;
        case 2: // Line
          drawable = Drawable.createLine(
            this.canvasKit,
            Math.random() * widthRange,
            Math.random() * heightRange,
            Math.random() * widthRange,
            Math.random() * heightRange
          );
          break;
        case 3: // Regular Polygon
          const numberOfSides = Math.floor(Math.random() * 5) + 3;
          const radius = Math.random() * 50 + 10;
          drawable = Drawable.createPolygon(
            this.canvasKit,
            Math.random() * widthRange,
            Math.random() * heightRange,
            radius,
            numberOfSides
          );
          break;
      }
  
      drawable.skPaint.setColor(color);
      drawable.skPaint.setStyle(style);
      drawable.setStyle(style);
      drawable.skPaint.setStrokeWidth(strokeWidth);
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

    /*
    // If there's a backing store image, draw it first
    if (this.backingStoreImage) {
     skCanvas.drawImage(this.backingStoreImage, 0, 0, null);
    } else {
      // If the backing store is not created or updated, call updateBackingStoreImage
      this.updateBackingStoreImage();
    }
    */

    // skRectFloat32Array is placeholder
    // for future optimization (dirtyRect on top of with backingstore).
    //  It is partially ready now, with clipRect in the
    //  app draw function clipping only to the passed dirtyRects,
    // but the layer's query for intersections is not implemented.
    //  it is is not coming from the rBush (r-tree) yet for each layer.

    this.drawAllObjectsOnLayerThatIntersectRect(skRectFloat32Array, skCanvas);

    //this.drawObjectsInSearchedArea(skRectFloat32Array, skCanvas)

  }

  drawAllObjectsOnLayerThatIntersectRect(skRectFloat32Array, skCanvas) {

    //  skCanvas.save();
    // const rectToClip = skRectFloat32Array;

    // for optimiziation when backingstore is made:
    //  skCanvas.clipRect(rectToClip, window.CanvasKit.ClipOp.Intersect, true);

    for (let i = 0; i < this.drawableObjects.length; i++) {
      const drawable = this.drawableObjects[i];
      if (NGUtils.doRectsIntersect(drawable.getPaddedBounds(), skRectFloat32Array)) {
        drawable.draw(skCanvas); // Draw only if there's an intersection
      }
    }

    // skCanvas.restore();

  }



  drawObjectsInSearchedArea(searchBoundsSkRect, skCanvas) {


    // Get all drawable objects in the search area
    const drawableObjectsInArea = this.searchArea(searchBoundsSkRect);


    // Perform drawing with CanvasKit on the skCanvas
    drawableObjectsInArea.forEach(drawable => {
      // console.log('drobj');
      drawable.draw(skCanvas);
    });

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


  // This is a general hit test that does not
  // alter the selection array by itself.
  // detect hit is reversed because we start
  // from the topmost element.
  detectHit(x, y) {
    //console.log('Layer:detectHit');
    for (let i = this.drawableObjects.length - 1; i >= 0; i--) {
      const drawable = this.drawableObjects[i];
      const didHit = drawable.hitTest(x, y);

      if (didHit === true) {
        return [true, drawable, drawable.getPaddedBounds()]; // Don't forget to call the function getPaddedBounds with ()
      }
    }
    return [false, null, null];
  }

  // this is a hit test
  // that alters the section array
  selectionHitTestUnderCursor(x, y) {

    var objectWasHit = false;
    var hitResultDrawable = null;

    for (let i = this.drawableObjects.length - 1; i >= 0; i--) {
      const drawable = this.drawableObjects[i];
      const didHit = drawable.hitTest(x, y);

      if (didHit === true) {
        objectWasHit = true;
        hitResultDrawable = drawable;
        break;
        //return [true, drawable, drawable.getPaddedBounds()]; // Don't forget to call the function getPaddedBounds with ()
      }
    }

    if (objectWasHit === true) {


      // Check if this item is already selected
      var alreadySelected = this.selectedItems.indexOf(hitResultDrawable) !== -1;

      if (alreadySelected) {

        this.removeItemFromSelection(hitResultDrawable);
      } else {
        hitResultDrawable.setIsSelected(true);

        this.addItemToSelection(hitResultDrawable);

      }
    } else {

      // If nothing is underneath the cursor, clear the selection
      this.clearOutSelection();
    }

  }


  // -------------------
  // SELECTION
  // -------------------
  selectionIsPresent() {
    return (this.selectedItems.length > 0);
  }

  // When adding an item to selectedItems
  addItemToSelection(item) {
    item.setIsSelected(true);
    if(this.isInDragLock)
    {
      item.isInDragLock = true;
    }
    this.selectedItems.push(item);
    this.selectedItemsDidChange("addItemToSelection " + this.selectedItems.length);
  }

  // When removing an item from selectedItems
  removeItemFromSelection(item) {
    const index = this.selectedItems.indexOf(item);
    if (index !== -1) {
      item.setIsSelected(false);
      this.setIsInDragLock(false);
      this.selectedItems.splice(index, 1);
    }
    
  
    this.selectedItemsDidChange("removeItemFromSelection " + this.selectedItems.length);

    if(!this.hasSelectedItems())
    {
      this.clearOutSelection();
    }


  }

  rotateSelectedItems(degrees) {
    // Apply the delta to the position of all selected items
    for (var i = 0; i < this.selectedItems.length; i++) {
      this.selectedItems[i].rotate(degrees);
    }
  }

  clearOutSelection() {
    // If nothing is underneath the cursor, clear the selection
    for (var i = 0; i < this.selectedItems.length; i++) {
      this.selectedItems[i].setIsSelected(false);
      this.selectedItems[i].isInDragLock = false;
    }
    this.selectedItems = [];

    this.setIsInDragLock(false);

    this.selectedItemsDidChange("clearOutSelection " + this.selectedItems.length);

    this.layerManager.app.invalidateEntireCanvas();

  }

  selectedItemsDidChange(string) {

    // invalidate canvas when the 
    // selectedItems begins to exist or ends because
    // it usually is invalidated on mouse move.
    // if it is invalidated again during
    // carting in this func, it will double draw the shadows.
    if (string != 'carting') {

      this.invalidateCanvasAndUpdateBackingStoreImage();

      //console.log(string);
    }
    
  }

  collectiveBounds(selectedItems) {
    let left, top, right, bottom;
    selectedItems.forEach(item => {
      const rect = item.getBounds();
      if (!left || rect[0] < left) left = rect[0];
      if (!top || rect[1] < top) top = rect[1];
      if (!right || rect[2] > right) right = rect[2];
      if (!bottom || rect[3] > bottom) bottom = rect[3];
    });
    return left !== undefined ? CanvasKit.LTRBRect(left, top, right, bottom) : null;
  }


  collectiveCenterOfSelectedItems() {
    return this.collectiveCenter(this.selectedItems);
  }

  collectiveCenter(selectedItems) {
    const bounds = this.collectiveBounds(selectedItems);

    if (bounds) {
      const centerX = (bounds[0] + bounds[2]) / 2;
      const centerY = (bounds[1] + bounds[3]) / 2;
      return [centerX, centerY];
    }
    return [0, 0];
  }



 

  invalidateCanvasAndUpdateBackingStoreImage() {
    // this.updateBackingStoreImage();
    this.layerManager.app.invalidateEntireCanvas();
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





  reorderDrawableObjectsIndices() {
    for (let i = 0; i < this.drawableObjects.length; i++) {
      this.drawableObjects[i].drawingOrder = i;
    }
  }

  // Function to add objects to the rbush tree
  addObject(drawable, indexForInsertion = -1) {


    if (indexForInsertion > -1) {
      // Using splice to insert the object
      // splice(index, number_of_elements_to_remove, item_to_insert)
      this.drawableObjects.splice(indexForInsertion, 0, drawable);
    }
    else {
      this.drawableObjects.push(drawable);
    }

    this.reorderDrawableObjectsIndices();
    // Calculate the item's bounding box (assuming drawable has a getBounds method)
    let item = drawable.getRBushBounds();

    // add the drawingOrder index to the rBush item.
    // item.drawingOrder = drawable.drawingOrder;
    // Add the item to the rbush tree
    this.rBush.insert(item);
    // Keep a reference to the drawable object

  }


  // Function to remove objects from the rbush tree
  removeObject(drawable) {
    // Find the item in the rbush tree
    const item = drawable.getRBushBounds();
    // Remove the item from the rbush tree
    this.rBush.remove(item);
    // Remove the drawable object from the reference list
    this.drawableObjects = this.drawableObjects.filter(obj => obj !== drawable);

    this.reorderDrawableObjectsIndices();
  }

  // Function to remove objects from the rbush tree
  removeArrayOfObjects(drawableArray) {

    for (let i = 0; i < drawableArray.length; i++) {
      this.removeObject(drawableArray[i], false);
      // Find the item in the rbush tree
      const item = drawableArray[i].getRBushBounds();
      // Remove the item from the rbush tree
      this.rBush.remove(item);
      // Remove the drawable object from the reference list
      this.drawableObjects = this.drawableObjects.filter(obj => obj !== drawableArray[i]);

    }


    this.reorderDrawableObjectsIndices();
  }


  removeAllSelectedItemsAndReset() {
    this.removeArrayOfObjects(this.selectedItems);

    this.clearOutSelection();

    this.layerManager.app.invalidateEntireCanvas();



  }


  // Function to update the position of objects in the rbush tree
  updateRBushObject(drawable) {

    // Find the item in the rbush tree
    const item = drawable.getRBushBounds();
    // Remove the item from the rbush tree
    this.rBush.remove(item);

    // Re-add the updated drawable to the rbush tree
    this.rBush.insert(item);

  }

  updateSelectedRBushItems() {
    for (var i = 0; i < this.selectedItems.length; i++) {
      this.updateRBushObject(this.selectedItems[i]);
    }
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
    let searchResults = this.rBush.search(searchBounds).map(item => item.drawable);

    // Reorder searchResults according to the drawingOrder value
    searchResults.sort((a, b) => {
      return a.drawingOrder - b.drawingOrder;
    });


    return searchResults;
  }


  bringSelectionToFront() {
    // Sort selected items by drawingOrder in descending order
    this.selectedItems.sort((a, b) => b.drawingOrder - a.drawingOrder);

    // Find the highest drawingOrder in the entire list
    const highestDrawingOrder = this.drawableObjects.reduce(
      (maxOrder, obj) => Math.max(maxOrder, obj.drawingOrder),
      -1
    );

    // Update the drawingOrder for selected items and move them to the top
    for (const item of this.selectedItems) {
      highestDrawingOrder++;
      item.drawingOrder = highestDrawingOrder;
    }

    // Reorder drawableObjects and update RBush tree
    this.reorderDrawableObjectsIndices();

    this.layerManager.app.invalidateEntireCanvas();

  }

  sendSelectionToBack() {
    // Sort selected items by drawingOrder in ascending order
    this.selectedItems.sort((a, b) => a.drawingOrder - b.drawingOrder);

    // Find the lowest drawingOrder in the entire list
    const lowestDrawingOrder = this.drawableObjects.reduce(
      (minOrder, obj) => Math.min(minOrder, obj.drawingOrder),
      Number.MAX_SAFE_INTEGER
    );

    // Update the drawingOrder for selected items and move them to the bottom
    for (const item of this.selectedItems) {
      lowestDrawingOrder--;
      item.drawingOrder = lowestDrawingOrder;
    }

    // Reorder drawableObjects and update RBush tree
    this.reorderDrawableObjectsIndices();

    this.layerManager.app.invalidateEntireCanvas();

  }

  bringSelectionForward() {
    // Sort selected items by drawingOrder in ascending order
    this.selectedItems.sort((a, b) => a.drawingOrder - b.drawingOrder);

    // Find the index of the first selected item in drawableObjects
    const firstSelectedIndex = this.drawableObjects.indexOf(this.selectedItems[0]);

    // Check if the first selected item is not at the top already
    if (firstSelectedIndex > 0) {
      // Swap the drawingOrder values of the selected item and the one above it
      const selectedAbove = this.drawableObjects[firstSelectedIndex - 1];
      for (const item of this.selectedItems) {
        const temp = item.drawingOrder;
        item.drawingOrder = selectedAbove.drawingOrder;
        selectedAbove.drawingOrder = temp;
      }

      // Reorder drawableObjects and update RBush tree
      this.reorderDrawableObjectsIndices();
    }

    this.layerManager.app.invalidateEntireCanvas();

  }

  sendSelectionBackward() {
    // Sort selected items by drawingOrder in descending order
    this.selectedItems.sort((a, b) => b.drawingOrder - a.drawingOrder);

    // Find the index of the last selected item in drawableObjects
    const lastSelectedIndex = this.drawableObjects.indexOf(
      this.selectedItems[this.selectedItems.length - 1]
    );

    // Check if the last selected item is not at the bottom already
    if (lastSelectedIndex < this.drawableObjects.length - 1) {
      // Swap the drawingOrder values of the selected item and the one below it
      const selectedBelow = this.drawableObjects[lastSelectedIndex + 1];
      for (const item of this.selectedItems) {
        const temp = item.drawingOrder;
        item.drawingOrder = selectedBelow.drawingOrder;
        selectedBelow.drawingOrder = temp;
      }

      // Reorder drawableObjects and update RBush tree
      this.reorderDrawableObjectsIndices();
    }

    this.layerManager.app.invalidateEntireCanvas();

  }



}

export { Layer, LayerManager };
