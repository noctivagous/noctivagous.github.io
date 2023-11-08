class Drawable {
  constructor(skPaint, path) {

    this.skPaint = skPaint || this.defaultSkPaint();

    this.path = path;
    this.matrix = null;
    this.isSelected = false;
    this.isVisible = true;
    this.isLocked = false; // Initial state is unlocked
    this.pivot = null; // No pivot point by default
 
  }

  // Method to set the pivot point for the drawable
  setPivot(x, y) {
    this.pivot = { x, y };
  }

  // Method to clear the pivot point
  clearPivot() {
    this.pivot = null;
  }

  getPivot(){

  }

  setMatrix(matrix) {
    this.matrix = matrix;
  }

  draw(skCanvas) {
    if (this.matrix) {
      skCanvas.save();
      skCanvas.concat(this.matrix);
    }

    let p = this.defaultSkPaint();
  skCanvas.drawPath(this.path, p);//this.skPaint);
    p.delete();

    if (this.matrix) {
      skCanvas.restore();
    }

    this.drawSelectionEffect(skCanvas);
  
  }

    // Method to determine if a point is inside the path
    hitTest(x, y) {
      // This would use a method appropriate for CanvasKit to check if the point hits the path
      return this.path.contains(x, y);
    }

getBounds(){
  return this.getPathBounds();
}

  // Get the bounds of the path
  getPathBounds() {
    return this.path.getBounds();
  }


  // Get the bounds of the path with a 10pt padding
  getPaddedBounds() {
    const bounds = this.path.getBounds();
    // Assuming that bounds is an object with {left, top, right, bottom} properties
    return {
      left: bounds.left - 10,
      top: bounds.top - 10,
      right: bounds.right + 10,
      bottom: bounds.bottom + 10
    };
  }

  // Method to invalidate the area within the padded bounds
  // This function would typically be used to signal that a region of the canvas needs to be redrawn
  invalidatePaddedBounds() {
    const paddedBounds = this.getPaddedBounds();
    // InvalidateRect function would be implemented depending on how the rendering loop is set up
    // This is a placeholder for where you would tell the rendering system to redraw this region
    InvalidateRect(paddedBounds); 
  }

   // Draw a selection effect such as a shadow under the object
   drawSelectionEffect(canvas) {
    if (this.isSelected) {
      // Create a shadow paint object or similar effect as per the graphics API
      const shadowPaint = new this.skPaint();
      shadowPaint.setColor(0x66000000); // Example semi-transparent black color
      shadowPaint.setMaskFilter(Skia.MaskFilter.MakeBlur(Skia.BlurStyle.Normal, 10));

      // Draw the shadow slightly offset from the path
      const shadowOffsetMatrix = new DOMMatrix().translateSelf(5, 5);
      canvas.save();
      canvas.concat(shadowOffsetMatrix);
      canvas.drawPath(this.path, shadowPaint);
      canvas.restore();

      // Additionally, you might want to draw a border or handles to indicate selection
      // Create a paint object for the selection border
      const selectionPaint = new this.skPaint();
      selectionPaint.setStyle(Skia.PaintStyle.Stroke);
      selectionPaint.setStrokeWidth(2);
      selectionPaint.setColor(0xFF0000FF); // Example blue color for selection outline
      canvas.drawPath(this.path, selectionPaint);
    }
  }

  // BOUNDS RELATED
    // Method to set the origin of the drawable to its center
    boundsCenterOrigin() {
      const bounds = this.getPathBounds(); // getPathBounds should return a Float32Array
      const cx = (bounds[0] + bounds[2]) / 2;
      const cy = (bounds[1] + bounds[3]) / 2;
      this.setMatrix(this.matrix.translate(-cx, -cy));
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
  
  translate(dx, dy) {
    if (this.isLocked) {
      console.warn('Drawable is locked and cannot be moved.');
      return;
    }
    // Use CanvasKit's SkMatrix to create a translation matrix
    let translationMatrix = window.CanvasKit.SkMatrix.identity();
    translationMatrix = window.CanvasKit.SkMatrix.postTranslate(translationMatrix, dx, dy);
    
    // Apply the translation matrix to the current matrix
    this.matrix = window.CanvasKit.SkMatrix.multiply(this.matrix, translationMatrix);
    this.updatePath(); // Assuming you have a method to apply the matrix to the path
  }
  
  rotate(angle, cx = 0, cy = 0) {
    if (this.isLocked) {
      console.warn('Drawable is locked and cannot be rotated.');
      return;
    }
    // Convert the angle from degrees to radians for CanvasKit
    const radians = angle * Math.PI / 180;
  
    // Create a rotation matrix around a point (cx, cy)
    let rotationMatrix = window.CanvasKit.SkMatrix.identity();
    rotationMatrix = window.CanvasKit.SkMatrix.preRotate(rotationMatrix, radians, cx, cy);
  
    // Apply the rotation matrix to the current matrix
    this.matrix = window.CanvasKit.SkMatrix.multiply(this.matrix, rotationMatrix);
    this.updatePath(); // Assuming you have a method to apply the matrix to the path
  }
  
  scale(sx, sy = sx) {
    if (this.isLocked) {
      console.warn('Drawable is locked and cannot be scaled.');
      return;
    }
  
    // Use CanvasKit's SkMatrix to create a scaling matrix
    let scaleMatrix = window.CanvasKit.SkMatrix.identity();
    scaleMatrix = window.CanvasKit.SkMatrix.preScale(scaleMatrix, sx, sy);
  
    // Apply the scaling matrix to the current matrix
    this.matrix = window.CanvasKit.SkMatrix.multiply(this.matrix, scaleMatrix);
    this.updatePath(); // Assuming you have a method to apply the matrix to the path
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
    toggleSelection() {
      this.isSelected = !this.isSelected;
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
  window.CanvasKit;
  let paint = new CanvasKit.Paint();
  paint.setColor(CanvasKit.Color4f(0, 0, 1, 1)); // Default to blue
  paint.setStyle(CanvasKit.PaintStyle.Fill);
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

  return new Drawable(canvasKit, rectPath, paint);
}

// Factory method for creating a circle shape with default paint
static createCircle(canvasKit, cx, cy, radius) {
  const circlePath = new canvasKit.Path();
  circlePath.addOval(canvasKit.LTRBRect(cx - radius, cy - radius, cx + radius, cy + radius));

  const paint = new canvasKit.Paint();
  paint.setColor(canvasKit.Color4f(1, 0, 0, 1)); // Red color
  paint.setStyle(canvasKit.PaintStyle.Fill); // Fill style

  return new Drawable(canvasKit, circlePath, paint);
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

  return new Drawable(canvasKit, linePath, paint);
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