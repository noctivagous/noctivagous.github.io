export default class NGUtils {
  static makeColoredFillPaint(CanvasKit, color) {
    const paint = new CanvasKit.Paint();
    paint.setColor(color);
    paint.setStyle(CanvasKit.PaintStyle.Fill);
    paint.setAntiAlias(true);
    return paint;
  }

  static createCenteredRect(CanvasKit, centerX, centerY, width, height) {
    if (!CanvasKit) {
      alert('CanvasKit is null');
      return;
    }
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    return CanvasKit.XYWHRect(centerX - halfWidth, centerY - halfHeight, width, height);
  }

  static fillRect(CanvasKit, skCanvas, fillColor, skRectFloat32Array) {
    const paint = NGUtils.makeColoredFillPaint(CanvasKit, fillColor);
    skCanvas.drawRect(skRectFloat32Array, paint);
    paint.delete();
  }

  static doRectsIntersect(rectA, rectB) {
    const [leftA, topA, rightA, bottomA] = rectA;
    const [leftB, topB, rightB, bottomB] = rectB;
    return !(rightA < leftB || leftA > rightB || topA > bottomB || bottomA < topB);
  }

  static intersectionOfRects(rectA, rectB) {
    if (!NGUtils.doRectsIntersect(rectA, rectB)) {
      return null;
    }
    const [leftA, topA, rightA, bottomA] = rectA;
    const [leftB, topB, rightB, bottomB] = rectB;
    const left = Math.max(leftA, leftB);
    const top = Math.max(topA, topB);
    const right = Math.min(rightA, rightB);
    const bottom = Math.min(bottomA, bottomB);
    return [left, top, right, bottom];
  }

  static rectW(rect) {
    return rect[2] - rect[0]; // right - left
  }

  static rectH(rect) {
    return rect[3] - rect[1]; // bottom - top
  }

}

// Export the class

  // */

  // You can add more utility functions here if needed
  


  // Draw an arc or a portion of a circle on the canvas.
// canvas.drawArc(x, y, radius, startAngle, sweepAngle, isCCW, paint);

// Draw multiple images (sprites) from an atlas onto the canvas.
// canvas.drawAtlas(atlas, transforms, rects, colors, blendMode, cullRect, paint);

// Draw a circle on the canvas with the specified parameters like center point and radius.
// canvas.drawCircle(centerX, centerY, radius, paint);

// Fill a shape or area with a specified color.
// canvas.drawColor(color, blendMode);

// Fill a shape or area with a color specified using color components (R, G, B, A).
// canvas.drawColorComponents(R, G, B, A, blendMode);

// Fill a shape or area with a color specified as an integer.
// canvas.drawColorInt(color, blendMode);

// Draw a rounded rectangle with two radii (one for each corner).
// canvas.drawDRRect(outerRect, innerRect, paint);

// Draw text or glyphs on the canvas.
// canvas.drawGlyphs(glyphs, positions, paint);

// Draw an image on the canvas at a specified position.
// canvas.drawImage(image, x, y, paint);

// Draw an image with cubic interpolation when scaling.
// canvas.drawImageCubic(image, sx, sy, sw, sh, dx, dy, dw, dh, cubicCoefficients, paint);

// Draw an image with 9-slice scaling.
// canvas.drawImageNine(image, srcRect, destRect, paint);

// Draw an image with additional options like filtering and compositing.
// canvas.drawImageOptions(image, x, y, options);

// Draw an image with a specified source rectangle within the image.
// canvas.drawImageRect(image, srcRect, destRect, paint);

// Draw an image with cubic interpolation and a specified source rectangle within the image.
// canvas.drawImageRectCubic(image, srcRect, destRect, cubicCoefficients, paint);

// Draw an image with a source rectangle and additional options.
// canvas.drawImageRectOptions(image, srcRect, destRect, options);

// Draw a straight line on the canvas.
// canvas.drawLine(x1, y1, x2, y2, paint);

// Draw an oval shape on the canvas.
// canvas.drawOval(rect, paint);

// Apply a paint object to the canvas, allowing for custom styles and effects.
// canvas.drawPaint(paint);

// Draw a text paragraph with complex layouts and formatting.
// canvas.drawParagraph(paragraph, offset, paint);

// Draw a patch (a set of cubic Bezier curves) on the canvas.
// canvas.drawPatch(patch, colors, paint);

// Draw a path (a sequence of lines and curves) on the canvas.
// canvas.drawPath(path, paint);

// Draw a recorded picture onto the canvas.
// canvas.drawPicture(picture);

// Draw a set of points on the canvas.
// canvas.drawPoints(PointMode.mode, points, paint);

// Draw a rounded rectangle.
// canvas.drawRRect(rrect, paint);

// Draw a rectangle using four floating-point coordinates for its corners.
// canvas.drawRect4f(left, top, right, bottom, paint);

// Draw a rectangle using two points, one for the top-left corner and the other for the bottom-right corner.
// canvas.drawRect(left, top, right, bottom, paint);

// Draw a shadow with specified parameters.
// canvas.drawShadow(geom, sigmaX, sigmaY, color, mode);

// Draw text on the canvas at the specified position.
// canvas.drawText(text, x, y, font, paint);

// Draw a text blob on the canvas at the specified position.
// canvas.drawTextBlob(textBlob, x, y, paint);

// Draw vertices on the canvas using the specified path and paint.
// canvas.drawVertices(vertices, mode, paint);

// BlendMode
// const blendMode = CanvasKit.BlendMode.SrcOver;



  // DEMO AND REFENCE SECTION FOR SKIAKIT 
  // BY NOCTIVAGOUS
  //
  // Public API at https://github.com/google/skia/blob/main/modules/canvaskit/externs.js

  // DATA TYPES:
  //
// -----
// export type IRect = Int32Array;
/**
 * An Point is represented by 2 floats: (x, y).
 */
// export type Point = number[];
/**
 * An Rect is represented by 4 floats. In order, the floats correspond to left, top,
 * right, bottom. See Rect.h for more
 */
// export type Rect = Float32Array;

  // ---
  // RECTS (SKRECT)
  // 
  // 
  // ---- In Skia, they return a SkRect:
  // ------------- SkRect holds four float coordinates describing the upper and lower bounds of a rectangle.
  // ------------- SkRect may be created from outer bounds or from position, width, and height. 
  // ------------- SkRect describes an area; if its right is less than or equal to its left, or if its bottom is less than or equal to its top, it is considered empty.
  // ---- In CanvasKit, Google returns a Float32Array (but did return a SkRect JS obj previously)
  // ---- In CanvasKit this was changed to 
  // ---- return a Float32Array, so in JS code
  // ---- we sometimes use skRectFloat32Array as the name.

// LTRBRect(): Creates a rectangle using Left, Top, Right, and Bottom coordinates
// Rect.LTRBRect(left, top, right, bottom);
//    ( also viewed as (x1,y1,x2,y2) )

// XYWHRect(): Creates a rectangle using X and Y coordinates for the top-left corner and Width and Height for dimensions
// Rect.XYWHRect(x, y, width, height);

// LTRBiRect(): Creates an integer-based rectangle using Left, Top, Right, and Bottom coordinates
// Rect.LTRBiRect(left, top, right, bottom);

// XYWHiRect(): Creates an integer-based rectangle using X and Y coordinates for the top-left corner and Width and Height for dimensions
// Rect.XYWHiRect(x, y, width, height);

// RRectXY(): Creates a rounded rectangle with X and Y coordinates defining its position and possibly also specifying the width, height, and radius for the corners
// Rect.RRectXY(x, y, width, height, rx, ry);


/*
// Example usage:
const rect1 = [50, 50, 150, 150]; // [left, top, right, bottom]
const rect2 = [100, 100, 200, 200];

// Check if rectangles intersect
const intersects = doRectsIntersect(rect1, rect2); // true if they intersect

// Get the intersection of two rectangles
const intersection = intersectionOfRects(rect1, rect2); // [100, 100, 150, 150] if they intersect

// Create a union of two rectangles
const union = unionOfRects(rect1, rect2); // [50, 50, 200, 200]
*/


// ---
// COLOR
// getColorComponents: function() {},


// ---
// PATHEFFECT
//
// Create a PathEffect that adds corners to a path, rounding off sharp corners with circular arcs.
// PathEffect.MakeCorner(radius);

// Create a PathEffect that dashes the path, specifying intervals of "on" and "off" segments.
// PathEffect.MakeDash(intervals, phase);

// Create a PathEffect that discretizes a path, converting it into a series of short lines.
// PathEffect.MakeDiscrete(segLength, deviation, seedAssist);

// Create a PathEffect that maps a path along a 1D curve.
// PathEffect.MakePath1D(path, matrix);

// Create a PathEffect that transforms a path using a 2D matrix.
// PathEffect.MakeLine2D(matrix);

// Create a PathEffect that transforms a path using a 2D matrix and a source path.
// PathEffect.MakePath2D(matrix, path);


// ---
// SHADER FUNCTIONS
// 	MakeSkVertices: function() {},

//

// ----
// PATTERNS
//
// CanvasKit.TileMode
//
// function CanvasPattern(image, repetition) {
// from
// https://github.com/google/skia/blob/main/modules/canvaskit/htmlcanvas/pattern.js

/*
copy
: 
ƒ Paint$copy()
getBlendMode
: 
ƒ Paint$getBlendMode()
getColor
: 
ƒ ()
getFilterQuality
: 
ƒ Paint$getFilterQuality()
getStrokeCap
: 
ƒ Paint$getStrokeCap()
getStrokeJoin
: 
ƒ Paint$getStrokeJoin()
getStrokeMiter
: 
ƒ Paint$getStrokeMiter()
getStrokeWidth
: 
ƒ Paint$getStrokeWidth()
setAlphaf
: 
ƒ Paint$setAlphaf(arg0)
setAntiAlias
: 
ƒ Paint$setAntiAlias(arg0)
setBlendMode
: 
ƒ Paint$setBlendMode(arg0)
setColor
: 
ƒ (e,l)
setColorComponents
: 
ƒ (e,l,t,w,C)
setColorFilter
: 
ƒ Paint$setColorFilter(arg0)
setColorInt
: 
ƒ ()
setFilterQuality
: 
ƒ Paint$setFilterQuality(arg0)
setImageFilter
: 
ƒ Paint$setImageFilter(arg0)
setMaskFilter
: 
ƒ Paint$setMaskFilter(arg0)
setPathEffect
: 
ƒ Paint$setPathEffect(arg0)
setShader
: 
ƒ Paint$setShader(arg0)
setStrokeCap
: 
ƒ Paint$setStrokeCap(arg0)
setStrokeJoin
: 
ƒ Paint$setStrokeJoin(arg0)
setStrokeMiter
: 
ƒ Paint$setStrokeMiter(arg0)
setStrokeWidth
: 
ƒ Paint$setStrokeWidth(arg0)
setStyle
: 
ƒ Paint$setStyle(arg0)

*/