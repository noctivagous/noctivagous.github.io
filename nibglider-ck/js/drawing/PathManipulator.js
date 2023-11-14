

// ------------------------------
// PATH MANIPULATOR
// ------------------------------

import { Drawable } from "./Drawable.js";

export class PathManipulator {
  constructor(app) {
    this.app = app;
    this.pathDrawable = new Drawable();
    this.paintManager = app.paintManager;
    this.layerManager = app.layerManager;
    this.livePathIndicatorPaint = new window.CanvasKit.Paint();
    this.livePathIndicatorPaint.setStyle(CanvasKit.PaintStyle.Stroke);
    this.livePathIndicatorPaint.setColor(CanvasKit.Color4f(0, 0, 0, 1.0));
    this.livePathIndicatorPaint.setStrokeWidth(2);
    this.livePathIndicatorPaint.setAntiAlias(true);

    this.liveSegment = [0, 0, 0, 0]; //x1, y1, x2, y2
  }

  currentLivePoint() {

  }

  getSecondToLastPointOfLivePath(path) {
    const totalPoints = path.countPoints();

    // Ensure there are at least two points in the path
    if (totalPoints >= 2) {
      // Get the second to last point
      // Indices are zero-based, so subtract 2 from the total points count
      const secondToLastPoint = path.getPoint(totalPoints - 2);

      // Convert the point to an [x, y] format if necessary
      // Depending on the API, `secondToLastPoint` might already be in [x, y] format
      // If it's not, you might need to do something like:
      // return [secondToLastPoint.x, secondToLastPoint.y];

      return secondToLastPoint;
    } else {
      // Handle the case where there aren't enough points
      return null; // Or any other appropriate response
    }
  }



  currentPointDidUpdate(newPoint) {

    // will be sent to current drawing entity
    // instead of here.

    if (this.pathDrawable.path) {
      var cmds = this.pathDrawable.path.toCmds();

      //this.changeLastPointOfLivePath(newPoint,this.pathDrawable.path);


      if (cmds.length > 0) {
        // Get the last command
        const lastCmd = cmds[cmds.length - 1];

        // Check if the last command is a drawing command (like lineTo, moveTo, etc.)
        if (lastCmd.length > 1) {
          // Change the last point to the new point
          lastCmd[lastCmd.length - 2] = newPoint[0];
          lastCmd[lastCmd.length - 1] = newPoint[1];
        }

        // Clear the current path
        this.pathDrawable.path.reset();


        this.pathDrawable.path = CanvasKit.Path.MakeFromCmds(cmds);

        /*
        // Rebuild the path with modified commands
        for (let cmd of cmds) {
          this.pathDrawable.path[cmd[0]](...cmd.slice(1));
        }
*/

      }

    }
  }


  addLivePathToCurrentLayer() {
    this.finishPrepByDrawingEntity();
    this.pathDrawable.paintStyle = this.paintManager.nibGliderPaintStyle;
    this.pathDrawable.skPaint = this.paintManager.nibGliderPaint.copy();
    this.layerManager.addDrawableToCurrentLayer(this.pathDrawable);

  }

  finishPrepByDrawingEntity()
  {


  }

  resetPath() {
    if (this.pathDrawable) {

      //console.log(this.pathDrawable);
      //this.pathDrawable.delete();
    }

    this.pathDrawable = new Drawable();

  }




  drawLivePathDrawable() {
    if (this.livePathIndicatorPaint) {

      this.pathDrawable.skPaint.delete();
      this.pathDrawable.skPaint = this.paintManager.nibGliderPaint.copy();
      this.pathDrawable.draw(this.app.skCanvas);
      this.pathDrawable.skPaint.delete();


      this.pathDrawable.skPaint = this.livePathIndicatorPaint;
      this.pathDrawable.draw(this.app.skCanvas);

      this.pathDrawable.skPaint = this.paintManager.nibGliderPaint.copy();
    }
  }



  addPolylinePoint(x, y) {

    if (this.pathDrawable.path.isEmpty()) {
      this.pathDrawable.path.moveTo(x, y);
      this.pathDrawable.path.lineTo(x, y);
      // two points at the same point
      // because the last one will be changed
      // according to the mouse.
    } else {
      this.pathDrawable.path.lineTo(x, y);
    }
  }




  changeLastPointOfLivePath(newPoint, passedPath) {


    if (!this.app.drawingEntityManager.isInDrawing) {
      return;
    }


    /*
The toCmds method returns an array of commands where 
each command is an array. The first element 
of each command array is the command name 
(like 'moveTo', 'lineTo', etc.), and the 
subsequent elements are the arguments for that command.
This implementation assumes that the last command 
in the path is related to drawing a point (like lineTo or moveTo). 
If the last command is not a point-drawing command (like close), 
you may need to adjust the logic accordingly.
You should test this function with your specific use case to ensure it handles all scenarios correctly, especially with complex paths.
*/


  }


  addHardCorner(x, y) {
    // adds lineTo and moveTo before it if no lineTo.
    this.addPolylinePoint(x, y);

  }

  addBezierCurve(controlPoint1, controlPoint2, endPoint) {
    this.pathDrawable.path.cubicTo(controlPoint1.x, controlPoint1.y, controlPoint2.x, controlPoint2.y, endPoint.x, endPoint.y);
  }

  addQuadraticCurve(controlPoint, endPoint) {
    this.pathDrawable.path.quadTo(controlPoint.x, controlPoint.y, endPoint.x, endPoint.y);
  }

  addArc(rect, startAngle, endAngle, useCenter = false) {
    this.pathDrawable.path.arcTo(rect, startAngle, endAngle, useCenter);
  }

  closePath() {
    this.pathDrawable.path.close();
  }


  resetPath() {
    if (this.pathDrawable) {
      //console.log(this.pathDrawable);
      //this.pathDrawable.delete();
    }
    this.pathDrawable = new Drawable();
  }



}



// Custom composite spline
export class NGPath {
  constructor() {
    // Initialize points
  }

  // Additional methods for spline logic
}

export const FMStrokePointType = {
  bSpline: 'bSpline',
  roundedCorner: 'roundedCorner',
  hardCorner: 'hardCorner',
  hardCornerBowedLine: 'hardCornerBowedLine',
  roundedCornerBowedLine: 'roundedCornerBowedLine',
  arcByThreeP1: 'arcByThreeP1',
  arcByThreeP2: 'arcByThreeP2',
  bezierFitCurve: 'bezierFitCurve'
};


class FMStrokePoint {

  constructor(x, y, fmStrokePointType, azimuth, altitude, brushSize, bowedInfo, roundedCornerSegmentLength = 25.0, cornerRoundingType = 'bSpline') {
    this.x = x;
    this.y = y;
    this.fmStrokePointType = fmStrokePointType;
    this.azimuth = this.adjustAzimuth(azimuth);
    this.altitude = altitude;
    this.brushSize = brushSize; // Assuming brushSize is an object with width and height
    this.bowedInfo = bowedInfo; // Assuming BowedInfo is another class
    this.roundedCornerSegmentLength = roundedCornerSegmentLength;
    this.cornerRoundingType = cornerRoundingType;
    // More properties and methods can be added as needed
  }

  adjustAzimuth(azimuth) {
    const twoPi = Math.PI * 2;
    if (azimuth > twoPi) {
      return twoPi - azimuth;
    } else if (azimuth < 0) {
      return twoPi + azimuth;
    }
    return azimuth;
  }

  // Other methods like init(xmlElement, parentFMStroke) can be added here
  // You'll need to translate Swift XML parsing to a JavaScript equivalent
}

class BowedInfo {
  constructor(isFacingA,
    normalHeight,
    normalHeightIsPercentageOfLineLength,
    lineInterpolationLocation,
    lineInterpolationLocationMultiplier,
    isArc, makeCornered,
    corneredAsHard,
    lineInterpolationDualDistance) {
    this.isFacingA = isFacingA;
    this.normalHeight = normalHeight;
    this.normalHeightIsPercentageOfLineLength = normalHeightIsPercentageOfLineLength;
    this.lineInterpolationLocation = this.clamp(lineInterpolationLocation, 0, 1.0);
    this.lineInterpolationLocationMultiplier = this.clamp(lineInterpolationLocationMultiplier, 1.0, Number.MAX_VALUE); // Assuming maxLineInterpolationLocationMultiplier is a large number
    this.isArc = isArc;
    this.makeCornered = makeCornered;
    this.corneredAsHard = corneredAsHard;
    this.lineInterpolationDualDistance = this.clamp(lineInterpolationDualDistance, 0, 1.0);
  }

  // Additional method to clamp values
  clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  // Methods to initialize from XML and to create XML can be implemented based on your XML handling library in JavaScript
  // Example:
  // initFromXmlElement(xmlElement) { ... }
  // toXmlElement() { ... }
}
