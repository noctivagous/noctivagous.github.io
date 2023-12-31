//import CanvasKit from "../NibGliderApp";

import NGUtils from "../NGUtils.js";

export class Drawable {
  constructor(skPaint, path, paintStyle) {

    this.fillStrokeSetting = 1; // 0 = stroke, 1 = fill, 2, fillstroke;

    this.skPaint = skPaint || this.defaultSkPaint();
    this.skPaint.setAntiAlias(true);
    this.path = path || new window.CanvasKit.Path();
    this.matrix = null;
    this.isSelected = false;
    this.isInDragLock = false;
    this.isVisible = true;
    this.isLocked = false; // Initial state is unlocked
    this.pivot = null; // No pivot point by default
    this.frameCount = 0;

    this.drawingOrder = 0;

    if (paintStyle) {
      // Set the paint style if one is provided
      if (paintStyle && ((paintStyle === CanvasKit.PaintStyle.Fill) || (paintStyle === CanvasKit.PaintStyle.Stroke))) {

        this.paintStyle = paintStyle; // Keep track of the paint style internally

      }
    }

  }


  copy()
  {
    return new Drawable(this.skPaint.copy(),this.path.copy(), this.paintStyle);
  }


  setStyle(style) {
   
    this.paintStyle = style; // Keep track of the style within your Drawable object
    this.skPaint.setStyle(style);
  }

  getStyle() {
    return this.paintStyle; // Now you can retrieve the style that you've manually tracked
  }


  // Method to set the pivot point for the drawable
  setPivot(x, y) {
    this.pivot = { x, y };
  }

  // Method to clear the pivot point
  clearPivot() {
    this.pivot = null;
  }

  getPivot() {

  }

  setMatrix(matrix) {
    this.matrix = matrix;
  }

  draw(skCanvas) {
    if (this.matrix) {
      skCanvas.save();
      skCanvas.concat(this.matrix);
    }

    
    this.drawSelectionEffect(skCanvas);

    skCanvas.drawPath(this.path, this.skPaint);//this.skPaint);

    this.drawDragLockEffect(skCanvas);


    if(this.isSelected)
    {
    }

    if (this.matrix) {
      skCanvas.restore();
    }


  }



  // Draw a selection effect such as a shadow under the object
drawSelectionEffect(skCanvas) {
  if (this.isSelected) {

    //console.log(`Draw called at ${new Date().toISOString()}`);
    //console.log(`Draw called for object ${this.id} on frame: ${this.frameCount}`);

    // Create a shadow paint object or similar effect as per the graphics API
    const shadowPaint = this.skPaint.copy();//new CanvasKit.Paint();
    shadowPaint.setColor(CanvasKit.Color4f(0, 0, 0, 0.8)); // Example semi-transparent black color
    shadowPaint.setMaskFilter(CanvasKit.MaskFilter.MakeBlur(CanvasKit.BlurStyle.Normal, 7, true));

    // Draw the shadow slightly offset from the path
    const shadowOffsetMatrix = CanvasKit.Matrix.translated(3, 3); // Offset by 5 units in x and y direction
    skCanvas.save();
    skCanvas.concat(shadowOffsetMatrix);
    skCanvas.drawPath(this.path, shadowPaint);
    skCanvas.restore();

    // Additionally, you might want to draw a border or handles to indicate selection
    // Create a paint object for the selection border
    const selectionPaint = this.skPaint.copy();//new CanvasKit.Paint();
    selectionPaint.setStyle(CanvasKit.PaintStyle.Stroke);
    selectionPaint.setStrokeWidth(2);
    selectionPaint.setAntiAlias(true);
    selectionPaint.setColor(CanvasKit.Color4f(0, 1, 1, 1)); // Example color for selection outline
    skCanvas.drawPath(this.path, selectionPaint);

    selectionPaint.delete();
    shadowPaint.delete();

  }
}


// Draw a drag lock effect such as a rotated green square
drawDragLockEffect(skCanvas) {
  if (this.isInDragLock) {
    // Get the path bounds to find the center
    const bounds = this.getPathBounds();
    const centerX = (bounds[0] + bounds[2]) / 2;
    const centerY = (bounds[1] + bounds[3]) / 2;

    // Define the size of the square and create its path
    const squareSize = 30; // Adjust size as needed
    const squarePath = new window.CanvasKit.Path();
    squarePath.addRect(
      [centerX - squareSize / 2, 
      centerY - squareSize / 2, 
      centerX + squareSize / 2, 
      centerY + squareSize / 2]
    );

    // Create a green paint with 0.5 opacity
    const squarePaint = new CanvasKit.Paint();
    squarePaint.setColor(CanvasKit.Color4f(0, 1, 0, 0.3)); // RGBA green with 0.3 opacity
    squarePaint.setStyle(CanvasKit.PaintStyle.Fill);

    // Rotate the canvas by 45 degrees around the center of the square
    skCanvas.save();
    skCanvas.translate(centerX, centerY);
    skCanvas.rotate( 45,0,0); // 45 degrees in radians
    skCanvas.translate(-centerX, -centerY);

    // Draw the square
    skCanvas.drawPath(squarePath, squarePaint);


    squarePaint.setColor(CanvasKit.Color4f(0, 0, 1, 0.5)); // RGBA green with 0.5 opacity
    squarePaint.setStyle(CanvasKit.PaintStyle.Stroke);
    squarePaint.setStrokeWidth(2);
    skCanvas.drawPath(squarePath, squarePaint);


    // Restore the canvas to its original state
    skCanvas.restore();

    // Clean up
    squarePath.delete();
    squarePaint.delete();
  }
}






  // Method to determine if a point is inside the path
  hitTest(x, y) {
    // If a matrix is applied, we transform the point to the local coordinates of the path
    let localX = x;
    let localY = y;
    if (this.matrix) {
      const inverseMatrix = this.matrix.invert();
      if (!inverseMatrix) {
        return false; // If the matrix is non-invertible, the hit test cannot be performed
      }
      const point = inverseMatrix.mapXY(x, y);
      localX = point.fX;
      localY = point.fY;
    }

    // Check if the point is inside the padded path bounds first as a quick rejection test.
    const bounds = this.getPaddedBounds();
    if (localX < bounds[0] || localX > bounds[2] || localY > bounds[3] || localY < bounds[1]) {
      return false;
    }


    if (this.paintStyle === CanvasKit.PaintStyle.Fill) {
      // This would use a method appropriate for CanvasKit to check if the point hits the path
      return this.path.contains(x, y);

    }
    else {
      // console.log(this.paintStyle);
      return this.hitTestStroke(this.path, this.skPaint, x, y);
    }


  }

  hitTestStroke(path, paint, x, y) {

    // Make a copy of the path to avoid modifying the original.
    const pathCopy = path.copy();

    // Define your stroke options
    let strokeOptions = {
      width: paint.getStrokeWidth() + 7,
      miter_limit: 10,
      precision: 0.5,
      join: CanvasKit.StrokeJoin.Miter,
      cap: CanvasKit.StrokeCap.Round
    };

    // Apply the stroke to the copy of the path
    const strokedPath = pathCopy.stroke(strokeOptions);//path.stroke(strokeOptions);




    // Use the contains method to check if the point is within the stroked path
    const hit = strokedPath.contains(x, y);

    

    // Clean up the copied path to prevent memory leaks
    pathCopy.delete();

    return hit;
  }





  // LTRBRect(): Creates a rectangle using Left, Top, Right, and Bottom coordinates
  // Rect.LTRBRect(left, top, right, bottom);
  //    ( also viewed as (x1,y1,x2,y2) )

  getRBushBounds() {
    const bounds = this.getBounds(); // Your method to get drawable bounds
    return {
      minX: NGUtils.minX(bounds),
      minY: NGUtils.minY(bounds),
      maxX: NGUtils.maxX(bounds),
      maxY: NGUtils.maxY(bounds),
      drawable: this // Store reference to the drawable for later retrieval
    };
  }

  // Get the bounds of the path
  getPathBounds() {
    var bounds = this.path.getBounds();

    if (!bounds) {
      return [0, 0, 0, 0];
    }

    return bounds;
  }

  getBounds() {
    return this.getPathBounds();
  }


  // Get the bounds of the path with a 10pt padding
  getPaddedBounds() {
    const padding = 10;
    const bounds = this.path.getBounds(); // bounds is a Float32Array [left, top, right, bottom]

    // Create a new Float32Array with padded bounds
    const paddedBounds = new Float32Array([
      bounds[0] - padding, // left
      bounds[1] - padding, // top
      bounds[2] + padding, // right
      bounds[3] + padding, // bottom
    ]);

    return paddedBounds;
  }


  // Method to invalidate the area within the padded bounds
  // This function would typically be used to signal that a region of the canvas needs to be redrawn
  invalidatePaddedBounds() {
    const paddedBounds = this.getPaddedBounds();
    // InvalidateRect function would be implemented depending on how the rendering loop is set up
    // This is a placeholder for where you would tell the rendering system to redraw this region
    //InvalidateRect(paddedBounds);
  }


  // BOUNDS RELATED
  // Method to set the origin of the drawable to its center
  boundsCenterOrigin() {
    const bounds = this.getPathBounds(); // getPathBounds should return a Float32Array
    const cx = (bounds[0] + bounds[2]) / 2;
    const cy = (bounds[1] + bounds[3]) / 2;
    return [cx,cy];
   // this.setMatrix(this.matrix.translate(-cx, -cy));
  }

  // Convenience function to calculate the bounds' width
  boundsWidth() {
    const bounds = this.getPathBounds(); // getPathBounds should return a Float32Array
    return bounds[2] - bounds[0]; // right - left
  }

  // Convenience function to calculate the bounds' height
  boundsHeight() {
    const bounds = this.getPathBounds(); // getPathBounds should return a Float32Array
    return bounds[3] - bounds[1]; // bottom - top
  }


  setPosition(x, y) {
    if (this.isLocked) {
      console.warn('Drawable is locked and cannot be moved.');
      return;
    }

    const currentPosition = this.getCurrentPosition();

    const dx = x - currentPosition.x;
    const dy = y - currentPosition.y;

    this.translate(dx, dy);
  }


  // TRANSFORMATION--
  // TRANSFORMATION OPERATIONS WILL RETURN AN UPDATE
  // RECT THAT IS THE UNION OF THE OLD PADDED BOUNDS
  // WITH THE TRANSFORMED BOUNDS.
  translate(dx, dy) {
    if (this.isLocked) {
      console.warn('Drawable is locked and cannot be moved.');
      return;
    }
    
    let translationMatrix = CanvasKit.Matrix.translated(dx, dy);
    this.path.transform(translationMatrix);

    // Use CanvasKit's SkMatrix to create a translation matrix
    //let translationMatrix = window.CanvasKit.SkMatrix.identity();
    //translationMatrix = window.CanvasKit.SkMatrix.postTranslate(translationMatrix, dx, dy);

    // Apply the translation matrix to the current matrix
//    this.matrix = window.CanvasKit.SkMatrix.multiply(this.matrix, translationMatrix);
  //  this.updatePath(); // Assuming you have a method to apply the matrix to the path
  }



  rotate(angle, cx = 0, cy = 0) {
    if (this.isLocked) {
      console.warn('Drawable is locked and cannot be scaled.');
      return;
    }

    // Convert the angle from degrees to radians for CanvasKit
   const radians = angle * Math.PI / 180;


//    let bPoint = this.boundsCenterOrigin();
  
    let rotationPoint = [cx,cy];

    // Create a translation matrix to move to origin
    let translateToOriginMatrix = window.CanvasKit.Matrix.translated(-1 * rotationPoint[0], -1 * rotationPoint[1]);
 
    this.path.transform(translateToOriginMatrix);
 
    // Create a scaling matrix
    let rotationMatrix = window.CanvasKit.Matrix.rotated(radians,0,0);

    this.path.transform(rotationMatrix);
  
    // Create a translation matrix to move back
    let translateBackMatrix = window.CanvasKit.Matrix.translated(rotationPoint[0], rotationPoint[1]);
  
    this.path.transform(translateBackMatrix);

    
    
  }

  scaleUniform(s, cx,cy)
  {
    this.scale(s,s,cx,cy);
  }

  scale(sx, sy = sx, cx,cy) {
    if (this.isLocked) {
      console.warn('Drawable is locked and cannot be scaled.');
      return;
    }
  
    
    //let bPoint = this.boundsCenterOrigin();
    let scalePoint = [cx,cy];

    

    // Create a translation matrix to move to origin
    let translateToOriginMatrix = window.CanvasKit.Matrix.translated(-1 * scalePoint[0], -1 * scalePoint[1]);
 
    this.path.transform(translateToOriginMatrix);
 
    // Create a scaling matrix
    let scaleMatrix = window.CanvasKit.Matrix.scaled(sx, sy);

    this.path.transform(scaleMatrix);
  
    // Create a translation matrix to move back
    let translateBackMatrix = window.CanvasKit.Matrix.translated(scalePoint[0], scalePoint[1]);
  
    this.path.transform(translateBackMatrix);
    
    
  }
  
  

  // Helper function to get the current position of the Drawable
  getCurrentPosition() {
    // First, get the untransformed bounds of the path
    const bounds = this.getPathBounds();

    // Now, create a point that represents the top-left corner of the bounds
    let topLeft = { x: bounds.fLeft, y: bounds.fTop };

    // If a transformation has been applied, you need to transform this point
    if (this.matrix) {
      let pointArray = new Float32Array([topLeft.x, topLeft.y]);
      // Apply the transformation matrix to the point
      pointArray = window.CanvasKit.SkMatrix.mapPoints(this.matrix, pointArray);
      topLeft = { x: pointArray[0], y: pointArray[1] };
    }

    return topLeft;
  }


  // Method to apply the current matrix to the path
  updatePath() {
    // This is a placeholder; the actual implementation will depend on how
    // you're using paths and matrices within your CanvasKit context.
    this.path.transform(this.matrix);
  }



  // Method to retrieve corner points of the path bounds
  getCornerPoints() {
    const bounds = this.getPathBounds(); // getPathBounds should return a Float32Array
    return {
      topLeft: { x: bounds[0], y: bounds[1] },
      topRight: { x: bounds[2], y: bounds[1] },
      bottomLeft: { x: bounds[0], y: bounds[3] },
      bottomRight: { x: bounds[2], y: bounds[3] }
    };
  }

  // Toggle the isSelected state
  toggleIsSelected() {
    this.isSelected = !this.isSelected;

    this.skPaint.setColor(CanvasKit.Color4f(0, 0, 1, 1));
  }

  setIsSelected(bool) {
    this.isSelected = bool;

    /*
    if (this.isSelected) {
      this.skPaint.setColor(CanvasKit.Color4f(0, 0, 1, 1));
    }
    else
    {
      this.skPaint.setColor(CanvasKit.Color4f(0, 0, 0, 1));

    }*/
  }


  // Toggle visibility
  toggleVisibility() {
    this.visible = !this.visible;
  }


  // Set opacity
  setOpacity(opacity) {
    if (opacity < 0 || opacity > 1) {
      throw new Error('Opacity must be between 0 and 1.');
    }
    this.opacity = opacity;
  }




  // FACTORY METHODS

  // Default paint setup
  defaultSkPaint() {
    //let CanvasKit = window.CanvasKit;
    
    let paint = new window.CanvasKit.Paint();
    paint.setColor(window.CanvasKit.Color4f(0, 0, 1, 1)); // Default to blue
    paint.setStyle(window.CanvasKit.PaintStyle.Fill);
    //this.setStyle(window.CanvasKit.PaintStyle.Fill);
    paint.setAntiAlias(true);
    return paint;
  }

  // Factory method for creating a rectangle shape with default paint
  static createRectangle(canvasKit, x, y, width, height) {
    const rectPath = new canvasKit.Path();
    rectPath.addRect(canvasKit.LTRBRect(x, y, x + width, y + height));

    const paint = new canvasKit.Paint();
    paint.setColor(canvasKit.Color4f(0, 0, 0, 1)); // Black color
    paint.setStyle(canvasKit.PaintStyle.Stroke); // Stroke style
    paint.setStrokeWidth(3); // Stroke width
    paint.setAntiAlias(true);
    return new Drawable(paint, rectPath, canvasKit.PaintStyle.Stroke);
  }

  // Factory method for creating a circle shape with default paint
  static createCircle(canvasKit, cx, cy, radius) {
    const circlePath = new canvasKit.Path();
    circlePath.addOval(canvasKit.LTRBRect(cx - radius, cy - radius, cx + radius, cy + radius));

    const paint = new canvasKit.Paint();
    paint.setColor(canvasKit.Color4f(1, 0, 0, 1)); // Red color
    paint.setStyle(canvasKit.PaintStyle.Fill); // Fill style
    paint.setAntiAlias(true);
    return new Drawable(paint, circlePath, canvasKit.PaintStyle.Fill);
  }

  // Factory method for creating a line with default paint
  static createLine(canvasKit, x1, y1, x2, y2) {
    const linePath = new canvasKit.Path();
    linePath.moveTo(x1, y1);
    linePath.lineTo(x2, y2);

    const paint = new canvasKit.Paint();
    paint.setColor(canvasKit.Color4f(0, 0, 1, 1)); // Blue color
    paint.setStyle(canvasKit.PaintStyle.Stroke); // Stroke style
    paint.setStrokeWidth(2); // Stroke width
    paint.setAntiAlias(true);
    return new Drawable(paint, linePath, canvasKit.PaintStyle.Stroke);
  }

  static createRegularPolygon(canvasKit, numberOfSides, xRange, yRange, sizeRange) {
    const centerX = Math.random() * xRange;
    const centerY = Math.random() * yRange;
    const radius = Math.random() * sizeRange + 20;
    const angleStep = (2 * Math.PI) / numberOfSides;
  
    let points = [];
    for (let i = 0; i < numberOfSides; i++) {
      const x = centerX + radius * Math.cos(i * angleStep);
      const y = centerY + radius * Math.sin(i * angleStep);
      points.push(x, y);
    }
  
    return Drawable.createPolygon(canvasKit, points);
  }

  // Factory method for creating a regular polygon shape with default paint
static createPolygon(canvasKit, centerX, centerY, radius, numberOfSides) {
  const polygonPath = new window.CanvasKit.Path();
  const angleStep = (2 * Math.PI) / numberOfSides;

  // Starting point for the polygon
  polygonPath.moveTo(
    centerX + radius * Math.cos(0),
    centerY + radius * Math.sin(0)
  );

  // Draw each side of the polygon
  for (let i = 1; i <= numberOfSides; i++) {
    polygonPath.lineTo(
      centerX + radius * Math.cos(i * angleStep),
      centerY + radius * Math.sin(i * angleStep)
    );
  }

  polygonPath.close();

  const paint = new canvasKit.Paint();
  paint.setColor(window.CanvasKit.Color4f(0, 1, 0, 1)); // Green color
  paint.setStyle(window.CanvasKit.PaintStyle.Stroke); // Stroke style
  paint.setStrokeWidth(3); // Stroke width
  paint.setAntiAlias(true);

  return new Drawable(paint, polygonPath, window.CanvasKit.PaintStyle.Stroke);
}

  
  

  // SERIALIZATIONS

  // Serialize the Drawable to a JSON object
  serialize() {
    // Convert path and paint to a serializable format
    // This is an example and would need to be tailored to the specifics of skPaint and SkPath
    return JSON.stringify({
      path: this.path.toCmds(),
      paint: this.skPaint.toJSON(),
      matrix: this.matrix ? this.matrix.toString() : null,
      visible: this.visible,
      opacity: this.opacity
    });
  }

  // Deserialize from JSON back to a Drawable object
  static deserialize(json) {
    const obj = JSON.parse(json);
    // Here you would convert back to SkPath, SkPaint, etc.
    // and then return a new Drawable instance
  }





}
