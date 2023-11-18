import NGUtils from "./NGUtils.js";
import CursorManager from './CursorManager.js';
import KeyboardMappingManager from './KeyboardMappingManager.js';
import EventManager from './EventManager.js';

import DrawingEntityManager from './drawing/DrawingEntityManager.js';
import { Drawable } from './drawing/Drawable.js';
import DebugDrawing from './DebugDrawing.js';

import PaintManager from './drawing/PaintManager.js';
import { PathManipulator, NGPath } from './drawing/PathManipulator.js';
import GridManager from './drawing/GridManager.js';
import SnappingManager from './drawing/SnappingManager.js';


import { Layer, LayerManager } from './LayerManager.js';
import GUIManager from "./drawing/GUIManager.js";



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

    this.debugDrawing = null;

    this.offset = 0;
    this.mouseX = 500;
    this.mouseY = 500;


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
    try {
        // Detect screen width and height
        this.screenWidth = screen.width;
        this.screenHeight = screen.height;

        // Detect device pixel ratio
        this.devicePixelRatio = window.devicePixelRatio;

        // Detect Operating System
        this.operatingSystem = this.getOperatingSystem();  // Mac or PC

        // The keyboard layout and app functionality is often Mac by default.
        // Change what is needed, including a pc-specific stylesheet,
        // a pc-specific js file. 
        if (this.operatingSystem === "PC") {
            // Load the CSS for Windows and Linux
            var link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = '../css/pc.css'; // Path to your CSS file
            document.head.appendChild(link);

            // pc specific changes
            this.loadScript('../js/pc.js'); // Load PC specific script
  

            // So that the hover data of each key
            // is pc-specific, move the data from the pc-data-key attribute
            // into the utilized data-key attribute.

              // Select all elements with the class 'keyboardkey'
              var keyboardKeys = document.querySelectorAll('.keyboardkey');
          
              // Loop through each element and update attributes
              keyboardKeys.forEach(function(key) {
                  if (key.hasAttribute('pc-data-key')) {
                      // Set the value of 'data-key' attribute from the value of 'pc-data-key' attribute
                      var pcDataKeyValue = key.getAttribute('pc-data-key');
                      key.setAttribute('data-key', pcDataKeyValue);
                  }
              });
          


          }

        if (logResults) {
            console.log("Screen Width:", this.screenWidth);
            console.log("Screen Height:", this.screenHeight);
            console.log("Operating System:", this.operatingSystem);
            console.log("Device Pixel Ratio:", this.devicePixelRatio);
        }
    } catch (error) {
        console.error("Error in detectUserEnvironment:", error);
    }
}


loadScript(url) {
  try {
      var script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = url;
      document.head.appendChild(script);

      // Optionally, handle script load/error events
      //script.onload = () => console.log(url + ' loaded successfully.');
      script.onerror = () => console.error('Error loading script:', url);
  } catch (error) {
      console.error("Error in loadScript:", error);
  }
}


  mouseHasMoved() {
    return (this.mouseX != -1000);
  }

  getOperatingSystem() {
    if (navigator.userAgentData && navigator.userAgentData.platform) {
      // New User-Agent Client Hints API
      let platform = navigator.userAgentData.platform.toLowerCase();

      if (platform.includes('mac')) {
        return 'Mac';
      } else {
        return 'PC';
      }
    } else {
      // Fallback to the older userAgent string
      let userAgent = navigator.userAgent.toLowerCase();

      if (userAgent.includes('mac os')) {
        return 'Mac';
      } else {
        return 'PC';
      }
    }
  }


  setupAppBackgroundColor() {
    this.setAppBackgroundColor(CanvasKit.Color(200, 200, 200, 1.0));
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

    window.app = this;
    this.layerManager = new LayerManager(this);

    this.drawingEntityManager = new DrawingEntityManager(this);
    

    this.cursorManager = new CursorManager(this);
    this.drawingEntityManager.cursorManager = this.cursorManager;


    this.paintManager = new PaintManager(this);
    this.drawingEntityManager.paintManager = this.paintManager;
    
    this.pathManipulator = new PathManipulator(this);
    this.drawingEntityManager.pathManipulator = this.pathManipulator;
    

    this.keyboardMappingManager = new KeyboardMappingManager(this, this.drawingEntityManager);
    this.keyboardMappingManager.drawingEntityManager = this.drawingEntityManager;
    this.eventManager = new EventManager(this, this.keyboardMappingManager, this.drawingEntityManager);

    // load the loadKeyboardKeysAccordingToFlags
    this.keyboardMappingManager.loadKeyboardKeysAccordingToFlags(null, '');



    this.guiManager = new GUIManager(this);

    this.snappingManager = new SnappingManager(this);

    this.gridManager = new GridManager(this);

    this.drawingEntityManager.app = this;
    this.drawingEntityManager.initializeDrawingEntities();

    this.debugDrawing = new DebugDrawing(this);

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

   // this.debugDrawing.draw(this.skCanvas);

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


      this.guiManager.drawGUI(this.skCanvas);

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


    if (this.layerManager) {
      // this.layerManager.updateAllLayersBackingStores();
    }
    else {

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

