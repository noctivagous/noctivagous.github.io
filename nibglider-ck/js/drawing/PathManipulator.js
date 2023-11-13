

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

    this.liveSegment = [0,0,0,0]; //x1, y1, x2, y2
  }

currentLivePoint()
{

}

lastLivePoint()
{

}


  addLivePathToCurrentLayer()
{
  this.layerManager.addDrawableToCurrentLayer(this.pathDrawable);

}

resetPath() {
  if(this.pathDrawable)
  {
    
    //console.log(this.pathDrawable);
    //this.pathDrawable.delete();
  }

  this.pathDrawable = new Drawable();
  
}




  drawLivePathDrawable()
  {
if(this.livePathIndicatorPaint)
{

  this.pathDrawable.skPaint.delete();
    this.pathDrawable.skPaint = this.paintManager.nibGliderPaint.copy();
    this.pathDrawable.draw(this.app.skCanvas);
    this.pathDrawable.skPaint.delete();
    
    
    this.pathDrawable.skPaint = this.livePathIndicatorPaint;
    this.pathDrawable.draw(this.app.skCanvas);
    
    this.pathDrawable.skPaint = this.paintManager.nibGliderPaint.copy();
}   
  }

  addHardCorner(x,y)
  {
    
    this.addPolylinePoint(x,y);

  }

  addPolylinePoint(x,y) {

    if (this.pathDrawable.path.isEmpty()) {
      this.pathDrawable.path.moveTo(x, y);
    } else {
      this.pathDrawable.path.lineTo(x, y);
    }
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
    if(this.pathDrawable)
    {
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
    lineInterpolationDualDistance) 
    {
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
