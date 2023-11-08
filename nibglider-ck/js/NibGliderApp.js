import { createCenteredRect, fillRect } from "./NGUtils.js";
import CursorManager from './CursorManager.js';
import KeyboardMappingManager from './KeyboardMappingManager.js';
import EventManager from './EventManager.js';
import DrawingEntityManager from './DrawingEntityManager.js';
// Inside NibGliderApp.js
//import { DrawingEntityManager } from './drawing/DrawingEntityManager.js';


export var CanvasKit = null;
export default CanvasKit;

class NibGliderApp {
  constructor(canvasId) {
    this.canvasId = canvasId;
    this.canvas = null;
    this.skSurface = null;
    this.skCanvas = null;
    this.context = null;
    this.dirtyRects = [];

    this.layerManager = null;
    this.cursorManager = null;
    this.keyboardMappingManager = null;
    
    this.surface = null;
    this.CanvasKit = null;

    this.offset = 0;
    this.mouseX = -1000;
    this.mouseY = -1000;

  
    this.appBackgroundColor = null; 
    this.appBackgroundColorPaint = null;
    this.appState = null;
  }

setupAppBackgroundColor()
{
  this.setAppBackgroundColor(CanvasKit.Color(0, 255, 255, 1.0));
}

  setAppBackgroundColor(bgColor)
  {
    if(this.appBackgroundColorPaint)
    {
      this.appBackgroundColorPaint.delete();
    }

    this.appBackgroundColor = bgColor;
    this.appBackgroundColorPaint = new CanvasKit.Paint();
        this.appBackgroundColorPaint.setColor(this.appBackgroundColor); // RGBA for blue
        this.appBackgroundColorPaint.setStyle(CanvasKit.PaintStyle.Fill);
  }

  setupManagers()
  {
  this.layerManager = new LayerManager(this);
  this.cursorManager = new CursorManager(this);

  this.drawingEntityManager = new DrawingEntityManager(this);
  this.pathManipulator = new PathManipulator(this);
  this.paintManager = new PaintManager(this);
  this.keyboardMappingManager = new KeyboardMappingManager(this,this.drawingEntityManager);
  this.eventManager = new EventManager(this,this.keyboardMappingManager, this.drawingEntityManager);

  }


  setupAppState()
  {
  this.appState = new AppState(this);
  }

  async init() {
    
    await this.initializeCanvasKit();

    this.setupAppState();

    this.setupManagers(); 

    // SETUP PAINT
    this.setupPaint();
    this.setupEventListeners();

    this.setupCanvasSurface();

    this.setupAppBackgroundColor();

    this.setupResizeHandling();

    //this.invalidateEntireCanvas();

    this.skCanvas = this.skSurface.getCanvas();


    

    this.skSurface.requestAnimationFrame(this.draw);

    // resize the canvas
    this.onResize();

    var resizeTimer = null;


    this.startDrawingIfNeeded();

  }

  async initializeCanvasKit()
  {

    CanvasKit = await CanvasKitInit({
      locateFile: (file) => 'https://unpkg.com/canvaskit-wasm@0.19.0/bin/' + file,
      
      //LOCAL CANVASKIT:
      //locateFile: (file) => 'js/canvaskit' + file,
      
    });

// Assigning to global window object for global access
window.CanvasKit = CanvasKit;

// Also keeping a reference in the class if needed for class methods
this.CanvasKit = CanvasKit;


    

    this.canvas = document.getElementById(this.canvasId);
    if (!this.canvas) {
      alert('Canvas element not found');
      console.error('Canvas element not found');
      return;
    }

  }

  fillWithBackgroundColor()
  {
    fillRect(this.CanvasKit, this.skCanvas, this.appBackgroundColor, this.entireCanvasRect());
  }

  draw = () => {
    //this.fillWithBackgroundColor();
    this.skCanvas.drawPaint(this.appBackgroundColorPaint);

    this.dirtyRects.forEach((rect) => {


      //this.debugDraw();

      //console.log(rect);
      this.skCanvas.save();
      const rectToClip = rect;
      this.skCanvas.clipRect(rectToClip, this.CanvasKit.ClipOp.Intersect, true);
      

      
      this.cursorManager.drawCursor(this.skCanvas,this.appState);

      this.skCanvas.restore();
    });

   
   /* 
   if (this.dirtyRects.some(rect => rect.width === this.canvas.width && rect.height === this.canvas.height)) {
      // Additional drawing logic for when the entire canvas is dirty
      this.layerManager.drawRectOnAllLayers(this.skCanvas, skRectFloat32Array);

    }
    */

    // After drawing all dirty rects, reset the list
    this.dirtyRects = [];
    this.drawingInProgress = false;
  
  
  };


  setupEventListeners() {
    // update on mouseMove
    this.canvas.addEventListener('pointermove', (e) => {
      /* if (!e.pressure) {
         return;
       }*/
      this.mouseX = e.offsetX;
      this.mouseY = e.offsetY;

      this.mouseDidMove();

    });

  }

  mouseDidMove()
  {
    this.cursorManager.updateMousePosition(this.mouseX,this.mouseY);
  }

  setupPaint() {
   
  }

  setupResizeHandling() {
    let resizeTimer = null;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(this.onResize.bind(this), 300);
    });
  }


  onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.canvas.width = width;
    this.canvas.height = height;

    if (!this.setupCanvasSurface()) {
      return;
  
    }

    this.invalidateEntireCanvas();


  }


  setupCanvasSurface() {
    this.skSurface = this.CanvasKit.MakeCanvasSurface(this.canvasId) || this.CanvasKit.MakeWebGLCanvasSurface(this.canvasId);
    if (!this.skSurface) {
      alert('Could not make CanvasKit canvas surface');
      console.error('Could not make CanvasKit canvas surface');
      return false;
    }
    this.skCanvas = this.skSurface.getCanvas();
    return true;
  }




  startDrawingIfNeeded() {
    if (this.dirtyRects.length > 0 && !this.drawingInProgress) {
      this.drawingInProgress = true;
  //    this.skSurface.drawOnce(this.draw);
//      this.skSurface.drawOnce(this.draw);
      this.skSurface.requestAnimationFrame(this.draw);
    }
  }


  invalidateRect(rect) {
    
    this.dirtyRects.push(rect);
    this.startDrawingIfNeeded();
  }

  invalidateEntireCanvas() {
    this.invalidateRect(this.CanvasKit.XYWHRect(0, 0, this.canvas.width, this.canvas.height));
  }

  entireCanvasRect(){
    return this.CanvasKit.XYWHRect(0, 0, this.canvas.width, this.canvas.height) 
  }

  



}

const nibGliderApp = new NibGliderApp('canvas');
nibGliderApp.init();



// App State Manager
class AppState {
  constructor(app) {
    this.app = app;
    this.cursorVisible = true;
    this.isInDrawing = false; // Whether the app is in drawing mode
    this.liveSelectionOccurring = false; // Whether a selection is currently being made
    this.dragging = false; // Whether an item is being dragged
    // Other states
    this.isSnapping = false;
    this.activeDrawingEntity = null; // The currently active DrawingEntity
    this.keyboardPanelState = {}; // Reflects the current state of the keyboard panel
    this.keyboardMap = {}; // Stores keyboard configurations
    this.functionRegistry = {}; // Stores functions for key events
  }
}