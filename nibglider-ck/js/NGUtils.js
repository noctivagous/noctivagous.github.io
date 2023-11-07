

export function createCenteredRect(CanvasKit, centerX, centerY, width, height) {
    const halfWidth = width / 2;
    const halfHeight = height / 2;
   // alert(CanvasKit);
    return CanvasKit.XYWHRect(centerX - halfWidth, centerY - halfHeight, width, height);
  }


  export function fillRect(CanvasKit, skCanvas, fillColor, skRectFloat32Array) {
    
    // Create a new paint object with color blue
    const paint = new CanvasKit.Paint();
    paint.setColor(fillColor); // RGBA for blue
    paint.setStyle(CanvasKit.PaintStyle.Fill);
  
  
    // Draw the rectangle on the canvas with the paint
    skCanvas.drawRect(skRectFloat32Array, paint);
  
    // Dispose of the paint object to avoid memory leaks
    paint.delete();
  }
  // */

  // You can add more utility functions here if needed
  