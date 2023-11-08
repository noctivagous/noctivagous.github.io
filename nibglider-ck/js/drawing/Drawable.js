class Drawable {
  constructor(skPaint, path) {
    this.skPaint = skPaint;
    this.path = path;
    this.matrix = null;
    this.isSelected = false;
  }

  setMatrix(matrix) {
    this.matrix = matrix;
  }

  draw(canvas) {
    if (this.matrix) {
      canvas.save();
      canvas.concat(this.matrix);
    }

    canvas.drawPath(this.path, this.skPaint);

    if (this.matrix) {
      canvas.restore();
    }

    this.drawSelectionEffect(canvas);
  
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

    
}
