class Drawable {
  constructor(skPaint, path) {
    this.skPaint = skPaint;
    this.path = path;
    this.matrix = null;
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
}
