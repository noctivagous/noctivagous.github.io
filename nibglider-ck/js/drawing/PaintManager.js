// ------------------------------
// PAINT MANAGER
// ------------------------------

class PaintManager {
  constructor(app) {
    this.app = app;
    

    this.nibGliderFillStrokeSetting = 1; // 0 = stroke, 1 = fill, 2, fillstroke;

    //this.selectedObjectsFillStrokeSetting = null; // 0 = stroke, 1 = fill, 2, fillstroke;

    this.selectedObjectsPaint = new Map(); // Stores the paint for each selected object.
    
    this.nibGliderStrokeWidth = 4;

    this.nibGliderPaint = new app.CanvasKit.Paint();
    this.nibGliderPaintStyle = window.CanvasKit.PaintStyle.Fill;
    

    this.initializeDefaultNibGliderPaint();
  }

  
  initializeDefaultNibGliderPaint() {
    
    this.nibGliderPaint.setStyle(this.nibGliderPaintStyle);
    this.nibGliderPaint.setStrokeWidth(this.nibGliderStrokeWidth);
    this.nibGliderPaint.setColor(this.app.CanvasKit.Color4f(1, 1, 1, 1)); //  white
    this.nibGliderPaint.setAntiAlias(true);
  }


  thickenStroke()
  {
    // set activePaint stroke to more
  }

  thinStroke()
  {
    // set activePaint stroke to less
  }

  makeColoredFillPaint(color) {
    let paint = new this.app.CanvasKit.Paint();
    paint.setStyle(new this.app.CanvasKit.PaintStyle.Fill);
    paint.setColor(color);
    paint.setAntiAlias(true);
    return paint;
  }

  makeColoredStrokePaint(color, strokeWidth = 1) {
    let paint = new this.app.CanvasKit.Paint();
    paint.setStyle(new this.app.CanvasKit.PaintStyle.Stroke);
    paint.setColor(color);
    paint.setStrokeWidth(strokeWidth);
    paint.setAntiAlias(true);
    return paint;
  }

  makeGradientFillPaint(colors, positions, x0, y0, x1, y1) {
    let shader = this.app.CanvasKit.Shader.MakeLinearGradient(
      [x0, y0],
      [x1, y1],
      colors,
      positions,
      this.app.CanvasKit.TileMode.Clamp
    );
    let paint = this.app.CanvasKit.Paint();
    paint.setShader(shader);
    return paint;
  }

  makePatternFillPaint(image, repetition) {
    let shader = this.app.CanvasKit.Shader.MakeImageShader(
      image,
      this.app.CanvasKit.TileMode.Repeat,
      this.app.CanvasKit.TileMode.Repeat,
      repetition
    );
    let paint = this.app.CanvasKit.Paint();
    paint.setShader(shader);
    return paint;
  }

  updateSelectedObjectsPaint(objectID, paint) {
    this.selectedObjectsPaint.set(objectID, paint);
  }

  getSelectedObjectPaint(objectID) {
    return this.selectedObjectsPaint.get(objectID);
  }

  setStrokeWidth(width) {
    this.nibGliderPaint.setStrokeWidth(width);
  }

  setPaintStyle(style) {
    this.nibGliderPaint.setStyle(style);
  }

  // Additional utility methods for managing paints, like updating color or opacity
  setColor(color) {
    this.nibGliderPaint.setColor(color);
  }

  setOpacity(opacity) {
    let color = this.nibGliderPaint.getColor();
    // Assuming Color4f is an array [r, g, b, a]
    color[3] = opacity;
    this.nibGliderPaint.setColor(color);
  }

  // Resets selected objects paint to null or a default state
  clearSelectedObjectsPaint() {
    this.selectedObjectsPaint.clear();
  }

   // Applies a shadow effect to the current nibGliderPaint
   applyShadow(color, offset, blur) {
    let shadowPaint = this.app.CanvasKit.Paint();
    shadowPaint.setColor(color);
    shadowPaint.setMaskFilter(this.app.CanvasKit.MaskFilter.MakeBlur(blur, true));
    shadowPaint.setImageFilter(this.app.CanvasKit.ImageFilter.MakeDropShadowOnly(
      offset.dx, offset.dy, blur, blur, color
    ));
    this.nibGliderPaint = shadowPaint;
  }

  // Creates and sets a new paint object with a texture pattern.
  applyTexturePattern(texture) {
    let patternPaint = this.makePatternFillPaint(texture, this.app.CanvasKit.TileMode.Repeat);
    this.nibGliderPaint = patternPaint;
  }

  // Toggles the anti-aliasing of the nibGliderPaint on or off
  toggleAntiAlias() {
    let currentAAState = this.nibGliderPaint.isAntiAlias();
    this.nibGliderPaint.setAntiAlias(!currentAAState);
  }

  // Set the blend mode of the nibGliderPaint
  setBlendMode(blendMode) {
    this.nibGliderPaint.setBlendMode(this.app.CanvasKit.BlendMode[blendMode]);
  }


  thickenStroke()
  {

  }

  thickenStroke()
  {

  }



  // Accessor Functions
  // ------------------

  // Returns the current stroke width of the nibGliderPaint
  getStrokeWidth() {
    return this.nibGliderPaint.getStrokeWidth();
  }

  // Returns the current color of the nibGliderPaint
  getColor() {
    return this.nibGliderPaint.getColor();
  }

  // Returns the current opacity of the nibGliderPaint
  getOpacity() {
    let color = this.nibGliderPaint.getColor();
    // Assuming Color4f is an array [r, g, b, a]
    return color[3];
  }

  // Returns the paint object for the nibGlider
  getNibGliderPaint() {
    return this.nibGliderPaint;
  }

  // Returns the paint object for a selected object by ID
  getPaintForSelectedObject(objectID) {
    return this.selectedObjectsPaint.get(objectID) || null;
  }


  // ----------------
  // ACTIVE PAINT
  // ----------------
  // active paint is contingent on
  // whether there are selectedObjects (selectedObjectsPaint)
  // or there are no selectedObjects (then nibGliderPaint)
  getActivePaint()
  {
    if(this.app.layerManager.currentLayerHasSelection())
    {

    }
    else
    {

    }
  }

  makePaintStyleFill()
  {
    this.makeActivePaintStyleFill();
  }
  
  makePaintStyleStroke()
  {
    this.makeActivePaintStyleStroke();
  }
  
  
  switchSettingToFill()
  {

  }

  switchSettingToStroke()
  {

  }

  makeActivePaintStyleFill()
  {
    if(this.app.layerManager.currentLayerHasSelection())
    {
        this.app.layerManager.switchSelectedItemsPaintStyleToFill();


    }
    else
    {

    }
  }

  makeActivePaintStyleStroke()
  {
    if(this.app.layerManager.currentLayerHasSelection())
    {
      this.app.layerManager.switchSelectedItemsPaintStyleToStroke();

    }
    else
    {

    }
  }



  // Utility Functions
  // -----------------

  // Resets the nibGliderPaint to its default state
  resetNibGliderPaint() {
    this.initializeDefaultNibGliderPaint();
  }

  // Deletes a selected object's paint from the manager
  deleteSelectedObjectPaint(objectID) {
    if (this.selectedObjectsPaint.has(objectID)) {
      this.selectedObjectsPaint.delete(objectID);
    }
  }
  
  // Updates the paint for the selected object with specific properties
  updateSelectedObjectPaintProperties(objectID, properties) {
    let paint = this.selectedObjectsPaint.get(objectID);
    if (!paint) {
      console.warn(`No paint found for object ID ${objectID}`);
      return;
    }
    Object.entries(properties).forEach(([key, value]) => {
      switch (key) {
        case 'color':
          paint.setColor(value);
          break;
        case 'strokeWidth':
          paint.setStrokeWidth(value);
          break;
        // Add cases for other properties as needed
      }
    });
  }

}

export default PaintManager;