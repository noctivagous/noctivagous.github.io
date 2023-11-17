import NGUtils from "./NGUtils.js";

var CanvasKit = null;

class CursorManager {
  constructor(app) {
    
    // CanvasKit:
    // export type Point = number[];

    this.mouseX = 500;
    this.mouseY = 500;
    this.currentDrawingPoint = [0.0,0.0]; //CanvasKit: export type Point = number[];
    this.app = app;
    this.appStateManager = app.appStateManager;
    CanvasKit = app.CanvasKit;
    this.drawingEntityManager = app.drawingEntityManager

    this.cursorBoxPaint = new app.CanvasKit.Paint();
    this.cursorBoxPaint.setColor(app.CanvasKit.Color4f(0.9, 0, 0, 1.0));
    this.cursorBoxPaint.setStrokeWidth(10);
    this.cursorBoxPaint.setStyle(app.CanvasKit.PaintStyle.Stroke);
    this.cursorBoxPaint.setAntiAlias(true);

    this.cursorCircleBoxWidth = 30;
    this.cursorCircleBoxHeight = 30;
    this.cursorInnerDotDiameter = 3;

    
    this.setCursorTypeToNone();

    this.lastCursorUpdateTime = 0;
  }


  setCursorTypeToNone()
  {
    
    document.body.style.cursor = 'none';
    this.app.htmlCanvas.style.cursor = 'none';
  }

  // Updates the mouse coordinates
  updateCursorPosition(x, y) {

    
    this.mouseX = x;
    this.mouseY = y;
    

    // Depending on the app state or other conditions, compute snapping
    this.updateCurrentDrawingPoint(x, y);

   // console.log(this.app.CanvasKit);
    
    // old:
    // this.app.invalidateRect(NGUtils.createCenteredRect(this.app.CanvasKit, this.mouseX, this.mouseY, 320, 370));
    //console.log(NGUtils.rectW(this.cursorSkRect()));
    
    // dirty rect ver:
    //this.app.invalidateRect( this.cursorSkRect() );
    
    
     this.app.invalidateEntireCanvas();
   

    
    const now = Date.now();
    this.lastCursorUpdateTime = now;
    
    //const timeSinceLastCursorUpdateTime = now - this.lastCursorUpdateTime;

    // Check if a certain amount of time has passed
    //if (timeSinceLastDraw > desiredInterval) {
      
      //  return true;
    //}


    // ensures that the cursor is always invisible
    // after coming back from another app or window.
    document.body.style.cursor = 'none';
  }

  // Computes the current drawing point, considering snapping to paths or segments
  updateCurrentDrawingPoint(x, y) {
    // Placeholder for snapping logic. Check if the (x, y) is near any significant points like path nodes or segment midpoints
    // If so, adjust this.currentDrawingPoint to that snap point
    // Otherwise, set it to the mouse coordinates
    // This would involve querying the drawing paths and other geometric elements
    // to determine if the cursor is near a point that should act as a snap point
    this.currentDrawingPoint = [x,y];

    this.drawingEntityManager.currentPointDidUpdate(this.currentDrawingPoint);

    // If snapping occurred:
    // this.currentDrawingPoint = { x: snapX, y: snapY };
    // If not:
    // this.currentDrawingPoint = { x: this.mouseX, y: this.mouseY };
  }

  // Returns a Float32Array representing the four corners of the cursor rectangle
  cursorSkRect() {
    // Assuming a 10x10 cursor for simplicity; adjust size as needed
    const halfSize = this.cursorCircleBoxWidth / 2;
    const left = this.mouseX - halfSize;
    const top = this.mouseY - halfSize;
    const right = this.mouseX + halfSize;
    const bottom = this.mouseY + halfSize;
    return new Float32Array([left, top, right, bottom]);
  }

  // Draws the cursor on the canvas
  drawCursor(skCanvas,appStateManager) {
    // Use currentDrawingPoint as the position for the cursor
    if (appStateManager.cursorVisible) {
      // Cursor drawing logic goes here
      // For example, drawing a simple circle at the currentDrawingPoint:
      const paint = new CanvasKit.Paint();
      paint.setColor(CanvasKit.BLACK); // Black color for the cursor
      //console.log(paint);
      paint.setStrokeWidth(2.0);
      paint.setStyle(CanvasKit.PaintStyle.Stroke);
      paint.setBlendMode
      paint.setAntiAlias(true);

      // console.log(this.mouseX);
      skCanvas.drawCircle(this.mouseX, this.mouseY, this.cursorCircleBoxWidth, paint);

      paint.setStyle(CanvasKit.PaintStyle.Fill);

      skCanvas.drawCircle(this.mouseX, this.mouseY, this.cursorInnerDotDiameter, paint);

      // this.debugDraw(skCanvas);
      
      // Optionally, you can also draw the snapping effect or change the cursor appearance based on the state
      // For example, if it's a snapping state, you might want to draw the cursor differently
      if (appStateManager.isSnapping) {
        paint.setColor(0xFF00FF00); // Change color to green to indicate snapping
        skCanvas.drawCircle(this.currentDrawingPoint.x, this.currentDrawingPoint.y, 17, paint);
      }
    
      paint.delete();
    }

    

   }

   debugDraw(skCanvas) {
    // -----
    // DEBUG

    //this.skCanvas.clear(this.CanvasKit.BLUE);

    //CanvasKit.XYWHRect(centerX - halfWidth, centerY - halfHeight, width, height)

    if (CanvasKit != null) {
     
        const cursorBox = NGUtils.createCenteredRect(CanvasKit, this.app.mouseX, this.app.mouseY, 300, 300);

        const rr = CanvasKit.RRectXY(        //this.CanvasKit.XYWHRect(this.mouseX - 150, this.mouseY - 150, 300, 300),
        cursorBox,
        //this.CanvasKit.LTRBRect(this.mouseX, this.mouseY, this.mouseX + 280, this.mouseY + 260),
        15,
        15
      );

    //  console.log(cursorBox);

//      const sur = this.app.skSurface.getCanvas();
      skCanvas.drawRRect(rr, this.cursorBoxPaint);

    }

  }



  

}

// For default export
export default CursorManager;