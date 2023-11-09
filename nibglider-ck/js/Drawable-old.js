class Drawable {
  constructor(skPaint, path) {
    this.skPaint = skPaint;
    this.path = path;
    this.matrix = null;

    this.isSelected = false;
    this.isVisible = true;
    this.isLocked = false; // Initial state is unlocked
    this.pivotPoint = null; // No pivot point by default

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
    // InvalidateRect(paddedBounds); 
  }

    // Method to set the pivot point for the drawable
    setPivotPoint(x, y) {
      this.pivotPoint = { x, y };
    }
  
    // Method to clear the pivot point
    clearPivotPoint() {
      this.pivotPoint = null;
    }
  
    getPivotPoint(){
  
    }

    toggleIsSelected() {
      // Implementation of toggling the selected state
      this.isSelected = !this.isSelected; 
    }


  hitTest(x, y) {

    
    // If a matrix is applied, we transform the point to the local coordinates of the path
    let localX = x;
    let localY = y;
    if (this.matrix) {
      const inverseMatrix = this.matrix.invert();
      if (!inverseMatrix) {
        return false; // If the matrix is non-invertible, the hit test cannot be performed
      }
      const point = inverseMatrix.mapPoints([x, y]);
      localX = point.fX;
      localY = point.fY;
    }
  
  /*
    // Check if the point is inside the path bounds first as a quick rejection test
    const bounds = this.getPathBounds();
    
    if (localX < bounds.fLeft || localX > bounds.fRight || localY < bounds.fTop || localY > bounds.fBottom) {
      return false;
    }
*/

    // Perform a more accurate hit test
    return this.path.contains(localX, localY);
  }

  
}
