import NGUtils from "./NGUtils.js";
import CursorManager from './CursorManager.js';
import KeyboardMappingManager from './KeyboardMappingManager.js';
import EventManager from './EventManager.js';

import DrawingEntityManager from './drawing/DrawingEntityManager.js';
import { Drawable } from './drawing/Drawable.js';

import  PaintManager   from './drawing/PaintManager.js';
import  {PathManipulator, NGPath}  from './drawing/PathManipulator.js';
import GridManager from './drawing/GridManager.js';
import SnappingManager from './drawing/SnappingManager.js';


import { Layer, LayerManager } from './LayerManager.js';



export var CanvasKit = null;
export default CanvasKit;

class NibGliderApp {
  constructor(htmlCanvasId) {
    this.htmlCanvasId = htmlCanvasId;
    this.htmlCanvas = null;
    this.skSurface = null;
    this.skCanvas = null;
    this.context = null;
    this.dirtyRects = [];

    this.layerManager = null;
    this.cursorManager = null;
    this.keyboardMappingManager = null;

    this.gridManager = null;
    this.snappingManager = null;

    this.pathManipulator = null;

    this.surface = null;
    this.CanvasKit = null;

    this.offset = 0;
    this.mouseX = -1000;
    this.mouseY = -1000;


    this.appBackgroundColor = null;
    this.appBackgroundColorPaint = null;
    this.appStateManager = null;

    // User's environment
    this.screenWidth = 0;
    this.screenHeight = 0;
    this.operatingSystem = '';
    this.devicePixelRatio = 0; // for detecting high resolution (e.g. 2 pixels per pixel displays).

  }

detectUserEnvironment(logResults = false) {
    // Detect screen width and height
    this.screenWidth = screen.width;
    this.screenHeight = screen.height;

    // Detect device pixel ratio
    this.devicePixelRatio = window.devicePixelRatio;

    // Detect Operating System
    this.operatingSystem = this.getOperatingSystem();

    if(logResults)
    {
      console.log("Screen Width:", myApp.screenWidth);
      console.log("Screen Height:", myApp.screenHeight);
      console.log("Operating System:", myApp.operatingSystem);
      console.log("Device Pixel Ratio:", myApp.devicePixelRatio);
    }

}

getOperatingSystem() {
    if (navigator.userAgentData && navigator.userAgentData.platform) {
        // New User-Agent Client Hints API
        let platform = navigator.userAgentData.platform.toLowerCase();

        if (platform.includes('mac')) {
            return 'MacOS';
        } else {
            return 'PC/Linux';
        }
    } else {
        // Fallback to the older userAgent string
        let userAgent = navigator.userAgent.toLowerCase();

        if (userAgent.includes('mac os')) {
            return 'MacOS';
        } else {
            return 'PC/Linux';
        }
    }
}


  setupAppBackgroundColor() {
    this.setAppBackgroundColor(CanvasKit.Color(0, 255, 255, 1.0));
  }

  setAppBackgroundColor(bgColor) {
    if (this.appBackgroundColorPaint) {
      this.appBackgroundColorPaint.delete();
    }

    this.appBackgroundColor = bgColor;
    this.appBackgroundColorPaint = new CanvasKit.Paint();
    this.appBackgroundColorPaint.setColor(this.appBackgroundColor); // RGBA for blue
    this.appBackgroundColorPaint.setStyle(CanvasKit.PaintStyle.Fill);
  }

  async setupManagers() {

    this.layerManager = new LayerManager(this);

    this.drawingEntityManager = new DrawingEntityManager(this);
    
    this.cursorManager = new CursorManager(this);

    
    this.paintManager = new PaintManager(this);
    this.pathManipulator = new PathManipulator(this);

    this.keyboardMappingManager = new KeyboardMappingManager(this, this.drawingEntityManager);
    this.eventManager = new EventManager(this, this.keyboardMappingManager, this.drawingEntityManager);

    this.snappingManager = new SnappingManager(this);

    this.gridManager = new GridManager(this);

   

  }


  setupAppStateManager() {
    this.appStateManager = new AppStateManager(this);
  }

  async init() {

    this.detectUserEnvironment();

    await this.initializeCanvasKit();

    

    this.setupAppStateManager();


    // SETUP PAINT
    this.setupPaint();

    this.setupCanvasSurface();

   await this.setupManagers();



    //this.setupEventListeners();

    this.setupAppBackgroundColor();

    this.setupResizeHandling();

    //this.invalidateEntireCanvas();

    this.skCanvas = this.skSurface.getCanvas();




    this.skSurface.requestAnimationFrame(this.draw);

    // resize the canvas
    this.onResize();

    this.skSurface.requestAnimationFrame(this.draw);

    var resizeTimer = null;


    this.startDrawingIfNeeded();

    

  }

  async initializeCanvasKit() {

    CanvasKit = await CanvasKitInit({
      locateFile: (file) => 'https://unpkg.com/canvaskit-wasm@0.19.0/bin/' + file,

      //LOCAL CANVASKIT:
      //locateFile: (file) => 'js/canvaskit' + file,

    });

    // Assigning to global window object for global access
    window.CanvasKit = CanvasKit;

    // Also keeping a reference in the class if needed for class methods
    this.CanvasKit = CanvasKit;




    this.htmlCanvas = document.getElementById(this.htmlCanvasId);
    if (!this.htmlCanvas) {
      alert('Canvas element not found');
      console.error('Canvas element not found');
      return;
    }

  }

  fillWithBackgroundColor() {
    NGUtils.fillRect(this.CanvasKit, this.skCanvas, this.appBackgroundColor, this.entireCanvasRect());
  }

  draw = () => {

    // in the future, use this to render the backingstore image
    //this.fillWithBackgroundColor();

    NGUtils.fillRect(this.CanvasKit, this.skCanvas, this.appBackgroundColor, this.entireCanvasRect());

    if (this.layerManager) {

      this.layerManager.drawRectOnAllLayers(this.skCanvas, this.entireCanvasRect());

    }
   
    // this.skCanvas.drawPaint(this.appBackgroundColorPaint);

    // dirtyRect setup works but needs to be adapted to CanvasKit
    // in whatever way is possible in the lib.
    this.dirtyRects.forEach((rect) => {


//      fillRect(this.CanvasKit, this.skCanvas, this.appBackgroundColor, rect);
     
     // this.skCanvas.save();
      //const rectToClip = rect;

      // for optimiziation when backingstore is made:
      // this.skCanvas.clipRect(rectToClip, this.CanvasKit.ClipOp.Intersect, true);


      this.drawingEntityManager.draw(this.skCanvas);
      
      this.cursorManager.drawCursor(this.skCanvas, this.appStateManager);
      
      

      //   this.skCanvas.restore();


    });


    /* 
    if (this.dirtyRects.some(rect => rect.width === this.htmlCanvas.width && rect.height === this.htmlCanvas.height)) {
       // Additional drawing logic for when the entire canvas is dirty
       this.layerManager.drawRectOnAllLayers(this.skCanvas, skRectFloat32Array);
 
     }
     */

    // After drawing all dirty rects, reset the list
    this.dirtyRects = [];
    this.drawingInProgress = false;


  };



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

    this.htmlCanvas.width = width;
    this.htmlCanvas.height = height;

    if (!this.setupCanvasSurface()) {
      return;

    }

    this.invalidateEntireCanvas();


  }


  setupCanvasSurface() {
    this.skSurface = this.CanvasKit.MakeCanvasSurface(this.htmlCanvasId) || this.CanvasKit.MakeWebGLCanvasSurface(this.htmlCanvasId);
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


  invalidateRect(skRectFloat32Array) {

    
    this.dirtyRects.push(skRectFloat32Array);
    this.startDrawingIfNeeded();
  }




  invalidateEntireCanvas() {
    
    
  if(this.layerManager)
  {
   // this.layerManager.updateAllLayersBackingStores();
  }
  else
  {
    
   // console.log('this.layerManager null in invalidateEntireCanvas');
    return;
   
  }
    this.invalidateRect(this.CanvasKit.XYWHRect(0, 0, this.htmlCanvas.width, this.htmlCanvas.height));
  }

  entireCanvasRect() {
    return this.CanvasKit.XYWHRect(0, 0, this.htmlCanvas.width, this.htmlCanvas.height)
  }





}

const nibGliderApp = new NibGliderApp('canvas');
nibGliderApp.init();



// App State Manager
class AppStateManager {
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

